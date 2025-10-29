"""FastAPI application orchestrating the GitHub storytelling backend."""

from __future__ import annotations

import asyncio
import logging
import os
import random
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .markov import LanguageStat, MarkovSelector, Repository
from .scene import build_scene, surrealize_messages

LOGGER = logging.getLogger(__name__)


@dataclass
class CommitInfo:
    sha: str
    message: str


@dataclass
class RepositorySnapshot:
    repository: Repository
    commits: List[CommitInfo]
    surreal_statements: List[str]
    scene: Dict


class GitHubClient:
    """Async GitHub API wrapper with minimal endpoints."""

    def __init__(self, token: str) -> None:
        self._token = token
        self._headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
        }
        self._languages_cache: Dict[str, List[LanguageStat]] = {}

    async def _request(self, url: str, params: Optional[Dict] = None) -> Any:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=self._headers, params=params)
            response.raise_for_status()
            return response.json()

    async def fetch_repositories(self) -> List[Dict]:
        url = "https://api.github.com/user/repos"
        params = {"per_page": 100, "affiliation": "owner"}
        return await self._request(url, params)

    async def fetch_languages(self, repo_full_name: str) -> List[LanguageStat]:
        if repo_full_name in self._languages_cache:
            return self._languages_cache[repo_full_name]

        url = f"https://api.github.com/repos/{repo_full_name}/languages"
        data = await self._request(url)
        if isinstance(data, dict):
            sorted_languages = sorted(data.items(), key=lambda item: item[1], reverse=True)
            languages = [LanguageStat(name=name, bytes=value) for name, value in sorted_languages]
        else:
            languages = []
        self._languages_cache[repo_full_name] = languages
        return languages

    async def fetch_commits(self, repo: Repository, *, per_page: int = 5) -> List[CommitInfo]:
        url = f"https://api.github.com/repos/{repo.full_name}/commits"
        params = {"sha": repo.default_branch, "per_page": per_page}
        data = await self._request(url, params)
        commits: List[CommitInfo] = []
        for item in data:
            commits.append(
                CommitInfo(
                    sha=item.get("sha", ""),
                    message=item.get("commit", {}).get("message", ""),
                )
            )
        return commits


class RepositoryManager:
    """Keeps track of repositories and orchestrates scheduled refreshes."""

    def __init__(self, client: GitHubClient, selector: MarkovSelector) -> None:
        self._client = client
        self._selector = selector
        self._lock = asyncio.Lock()
        self._repositories: List[Repository] = []
        self._current: Optional[RepositorySnapshot] = None
        self._next: Optional[RepositorySnapshot] = None

    async def refresh(self) -> None:
        """Fetch latest repositories and recompute snapshots."""

        async with self._lock:
            LOGGER.info("Refreshing repository cache from GitHub")
            data = await self._client.fetch_repositories()
            repositories: List[Repository] = []
            filtered = [item for item in data if not item.get("fork")]
            language_results = await asyncio.gather(
                *(self._client.fetch_languages(item["full_name"]) for item in filtered)
            )

            for item, languages in zip(filtered, language_results):
                repositories.append(
                    Repository(
                        name=item["name"],
                        full_name=item["full_name"],
                        default_branch=item.get("default_branch", "main"),
                        latest_commit_sha=item.get("pushed_at", ""),
                        stargazers_count=item.get("stargazers_count", 0),
                        forks_count=item.get("forks_count", 0),
                        open_issues_count=item.get("open_issues_count", 0),
                        languages=languages[:5],
                    )
                )
            if not repositories:
                LOGGER.warning("No repositories found for the authenticated user")
                self._repositories = []
                self._current = None
                self._next = None
                return

            self._repositories = repositories
            self._selector.update_repositories(repositories)

            # Choose a random repository as the current base
            base_repo = random.choice(repositories)
            await self._update_snapshots(base_repo)

    async def _update_snapshots(self, base_repo: Repository) -> None:
        """Populate current and next snapshots using the Markov selector."""

        commits = await self._client.fetch_commits(base_repo)
        if commits:
            base_repo.latest_commit_sha = commits[0].sha
        surreal = surrealize_messages(base_repo, [commit.message for commit in commits])
        scene = build_scene(base_repo)
        self._current = RepositorySnapshot(base_repo, commits, surreal, scene)

        next_repo = self._selector.next_repository(base_repo)
        if next_repo is None:
            self._next = None
            return

        commits_next = await self._client.fetch_commits(next_repo)
        if commits_next:
            next_repo.latest_commit_sha = commits_next[0].sha
        surreal_next = surrealize_messages(next_repo, [commit.message for commit in commits_next])
        scene_next = build_scene(next_repo)
        self._next = RepositorySnapshot(next_repo, commits_next, surreal_next, scene_next)

    async def advance(self) -> None:
        """Advance to the next repository according to the selector."""

        async with self._lock:
            if not self._current:
                fallback = self._selector.choose_random_start()
                if fallback is None:
                    return
                await self._update_snapshots(fallback)
                return

            next_repo = self._selector.next_repository(self._current.repository)
            if next_repo is None:
                return
            await self._update_snapshots(next_repo)

    async def get_snapshot(self, kind: str) -> RepositorySnapshot:
        async with self._lock:
            snapshot = self._current if kind == "current" else self._next
            if snapshot is None:
                raise HTTPException(status_code=404, detail=f"{kind.title()} repository not available")
            return snapshot


def create_app() -> FastAPI:
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GITHUB_TOKEN environment variable is required")

    client = GitHubClient(token)
    selector = MarkovSelector()
    manager = RepositoryManager(client, selector)

    app = FastAPI(title="Tom Monster Story API")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    scheduler = AsyncIOScheduler()

    @app.on_event("startup")
    async def startup_event() -> None:
        await manager.refresh()
        scheduler.add_job(manager.refresh, IntervalTrigger(minutes=15))
        scheduler.add_job(manager.advance, IntervalTrigger(minutes=5))
        scheduler.start()

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        scheduler.shutdown(wait=False)

    def snapshot_to_payload(snapshot: RepositorySnapshot) -> Dict:
        return {
            "repository": {
                "name": snapshot.repository.name,
                "full_name": snapshot.repository.full_name,
                "default_branch": snapshot.repository.default_branch,
                "latest_commit_sha": snapshot.repository.latest_commit_sha,
                "stargazers_count": snapshot.repository.stargazers_count,
                "forks_count": snapshot.repository.forks_count,
                "open_issues_count": snapshot.repository.open_issues_count,
                "languages": [
                    {"name": lang.name, "bytes": lang.bytes}
                    for lang in snapshot.repository.languages or []
                ],
            },
            "commits": [
                {
                    "sha": commit.sha,
                    "message": commit.message,
                }
                for commit in snapshot.commits
            ],
            "surreal": snapshot.surreal_statements,
            "scene": snapshot.scene,
        }

    @app.get("/health")
    async def health() -> Dict[str, str]:
        return {"status": "ok"}

    @app.get("/current")
    async def get_current() -> Dict:
        snapshot = await manager.get_snapshot("current")
        return snapshot_to_payload(snapshot)

    @app.get("/next")
    async def get_next() -> Dict:
        snapshot = await manager.get_snapshot("next")
        return snapshot_to_payload(snapshot)

    return app


app = create_app()
