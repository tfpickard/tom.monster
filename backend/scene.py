"""Procedural scene generation and surreal text utilities."""

from __future__ import annotations

import random
from datetime import datetime
from typing import Dict, Iterable, List

from .markov import Repository


BUILDING_COLORS = [
    "#ffb347",
    "#ff6961",
    "#77dd77",
    "#aec6cf",
    "#f49ac2",
]

LIGHTING_PRESETS = [
    {"ambient": 0.6, "directional": 0.8, "color": "#ffe0b2"},
    {"ambient": 0.3, "directional": 1.0, "color": "#d1c4e9"},
    {"ambient": 0.4, "directional": 0.6, "color": "#c8e6c9"},
]

SURREAL_TEMPLATES = [
    "While {repo} sleeps, the commit whispers: '{message}' and the street exhales time.",
    "{repo} loops around {branch}, chanting '{message}' as neon rain falls sideways.",
    "Every merge in {repo} is a door; '{message}' is the key we swallow.",
]


def build_scene(repository: Repository, *, seed: int | None = None) -> Dict:
    """Create structured scene data for the frontend.

    The scene is composed of buildings representing important repository
    metrics, a road showing star/fork relationships, and lighting information
    tied to the repository creation date.
    """

    rng = random.Random(seed)

    height = 10 + len(repository.name)
    width = 5 + len(repository.default_branch)
    building = {
        "name": repository.name,
        "height": height,
        "width": width,
        "color": rng.choice(BUILDING_COLORS),
    }

    road = {
        "segments": [
            {"length": max(4, len(repository.full_name) // 3), "curve": rng.random()},
            {"length": max(3, len(repository.latest_commit_sha) % 13), "curve": rng.random()},
        ],
        "texture": "digital-cobblestone",
    }

    created_seed = int(repository.latest_commit_sha[:6], 16) if repository.latest_commit_sha else 0
    lighting = rng.choice(LIGHTING_PRESETS).copy()
    lighting["time"] = datetime.utcnow().isoformat()
    lighting["seed"] = created_seed

    return {
        "buildings": [building],
        "roads": [road],
        "lighting": lighting,
    }


def surrealize_messages(repository: Repository, messages: Iterable[str], *, seed: int | None = None) -> List[str]:
    """Convert commit messages into surreal statements using templates."""

    rng = random.Random(seed)
    statements = []
    for message in messages:
        template = rng.choice(SURREAL_TEMPLATES)
        statements.append(template.format(repo=repository.name, branch=repository.default_branch, message=message))
    return statements
