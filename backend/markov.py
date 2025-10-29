"""Utilities for deterministic repository transitions.

This module defines a ``MarkovSelector`` that mimics a Markov chain by
selecting the next repository based on deterministic rules.  The selector
observes the current repository and returns the next candidate by examining
alphabetical proximity and, when ambiguous, commit hash ordering.  The logic
is deterministic which makes it easy to reason about in tests while still
producing a pseudo-Markov traversal across the available repositories.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, List, Optional


@dataclass
class LanguageStat:
    """Simple language usage metric returned by the GitHub API."""

    name: str
    bytes: int


@dataclass
class Repository:
    """Simplified repository representation used by the selector."""

    name: str
    full_name: str
    default_branch: str
    latest_commit_sha: str
    stargazers_count: int = 0
    forks_count: int = 0
    open_issues_count: int = 0
    languages: List[LanguageStat] = field(default_factory=list)


class MarkovSelector:
    """Deterministic selector inspired by Markov-chain transitions.

    The selector orders repositories alphabetically.  Given the current
    repository it chooses the lexicographically closest neighbour.  If the
    repositories share the same prefix, the deterministic tie breaker uses
    the SHA of the most recent commit to ensure stable ordering between runs.
    """

    def __init__(self) -> None:
        self._repositories: List[Repository] = []

    def update_repositories(self, repositories: Iterable[Repository]) -> None:
        """Load the repositories and sort them for deterministic traversal."""

        self._repositories = sorted(
            repositories,
            key=lambda repo: (repo.name.lower(), repo.latest_commit_sha),
        )

    def choose_random_start(self) -> Optional[Repository]:
        """Return the first repository in the deterministic ordering.

        The repository manager performs the actual random sampling.  This
        helper provides a consistent starting point when the random selection
        fails (e.g. no repositories available).
        """

        return self._repositories[0] if self._repositories else None

    def next_repository(self, current: Optional[Repository]) -> Optional[Repository]:
        """Return the next repository in alphabetical proximity.

        When ``current`` is ``None`` the first repository in the sorted list is
        returned.  If ``current`` is not present in the maintained list we also
        fall back to the first entry, which keeps the traversal predictable.
        """

        if not self._repositories:
            return None

        if current is None:
            return self._repositories[0]

        try:
            idx = self._repositories.index(current)
        except ValueError:
            return self._repositories[0]

        next_idx = (idx + 1) % len(self._repositories)
        return self._repositories[next_idx]
