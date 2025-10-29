"""Narrative generation utilities backed by the OpenAI API."""

from __future__ import annotations

import json
import logging
from dataclasses import asdict
from typing import Sequence

from openai import AsyncOpenAI

from .markov import Repository
from .models import CommitInfo

LOGGER = logging.getLogger(__name__)


class StoryClient:
    """Generate dynamic micro-fiction for repository activity."""

    def __init__(self, api_key: str, *, model: str = "gpt-4o-mini") -> None:
        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model

    async def compose_story(self, repository: Repository, commits: Sequence[CommitInfo]) -> list[str]:
        """Build a surreal but legible story for the provided repository."""

        context = self._build_context(repository, commits)
        prompt = self._build_prompt(context)

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                temperature=0.7,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a poetic narrator that crafts surreal yet clear stories "
                            "about software projects. Always respond with JSON containing a "
                            "'segments' array of 3 concise entries."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
            )
        except Exception:  # pragma: no cover - network/credential errors logged
            LOGGER.exception("Failed to contact OpenAI for story generation")
            return self._fallback_segments(context)

        content = response.choices[0].message.content if response.choices else None
        if not content:
            LOGGER.warning("OpenAI response contained no content")
            return self._fallback_segments(context)

        try:
            data = json.loads(content)
            raw_segments = data.get("segments", [])
            segments = [str(segment).strip() for segment in raw_segments if str(segment).strip()]
        except Exception:  # pragma: no cover - protective parsing
            LOGGER.exception("Unable to parse OpenAI story response", extra={"content": content})
            return self._fallback_segments(context)

        if len(segments) < 3:
            LOGGER.warning(
                "OpenAI returned insufficient story segments",
                extra={"count": len(segments)},
            )
            return self._fallback_segments(context)

        return segments

    def _build_context(self, repository: Repository, commits: Sequence[CommitInfo]) -> dict:
        languages = [asdict(language) for language in repository.languages or []]
        commit_dicts = [
            {
                "sha": commit.sha,
                "message": commit.message,
                "author_name": commit.author_name,
                "author_login": commit.author_login,
                "committed_at": commit.committed_at,
                "additions": commit.additions,
                "deletions": commit.deletions,
                "total_changes": commit.total_changes,
                "files_changed": commit.files_changed,
            }
            for commit in commits
        ]

        totals = {
            "additions": sum((commit.additions or 0) for commit in commits) or 0,
            "deletions": sum((commit.deletions or 0) for commit in commits) or 0,
            "changes": sum((commit.total_changes or 0) for commit in commits) or 0,
            "files_changed": sum((commit.files_changed or 0) for commit in commits) or 0,
        }

        contributors = []
        seen = set()
        for commit in commits:
            author = commit.author_name or commit.author_login
            if author and author not in seen:
                contributors.append(author)
                seen.add(author)

        return {
            "repository": {
                "name": repository.name,
                "full_name": repository.full_name,
                "description": repository.description,
                "default_branch": repository.default_branch,
                "stars": repository.stargazers_count,
                "forks": repository.forks_count,
                "open_issues": repository.open_issues_count,
                "topics": repository.topics,
                "homepage": repository.homepage,
                "html_url": repository.html_url,
                "languages": languages,
            },
            "commits": commit_dicts,
            "totals": totals,
            "contributors": contributors,
        }

    def _build_prompt(self, context: dict) -> str:
        context_blob = json.dumps(context, ensure_ascii=False, indent=2)
        instructions = (
            "Use the repository context to produce a surreal but readable vignette. "
            "Each segment must reference concrete details such as commit authors, "
            "topics, or recent changes. Keep the tone imaginative yet grounded "
            "enough to understand the activity."
        )
        return f"{instructions}\n\nRepository context:\n```json\n{context_blob}\n```"

    def _fallback_segments(self, context: dict) -> list[str]:
        repo = context["repository"]
        totals = context["totals"]
        commits = context["commits"]
        contributors = context["contributors"]

        first_commit = commits[0] if commits else None
        primary_language = repo["languages"][0]["name"] if repo["languages"] else "code"
        contributor_line = ", ".join(contributors[:3]) if contributors else "unknown dreamers"

        segments = []
        segments.append(
            f"{repo['name']} drifts through {primary_language} constellations while {contributor_line} plot the next merge."
        )
        if first_commit:
            segments.append(
                f"Commit {first_commit['sha'][:7]} murmurs '{first_commit['message']}' as it ripples across {repo['default_branch']}."
            )
        else:
            segments.append(
                f"The branch {repo['default_branch']} hums quietly, waiting for new commits to bend its skyline."
            )
        change_summary = totals["changes"] or totals["additions"] or totals["deletions"]
        segments.append(
            f"This cycle reshaped {totals['files_changed']} files with {change_summary} lines in motion, leaving the street faintly aglow."
        )
        return segments
