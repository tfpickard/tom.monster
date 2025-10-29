"""Shared data models for repository storytelling."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class CommitInfo:
    """Rich commit metadata used for storytelling and UI rendering."""

    sha: str
    message: str
    author_name: Optional[str] = None
    author_login: Optional[str] = None
    committed_at: Optional[str] = None
    additions: Optional[int] = None
    deletions: Optional[int] = None
    total_changes: Optional[int] = None
    files_changed: Optional[int] = None
    url: Optional[str] = None
