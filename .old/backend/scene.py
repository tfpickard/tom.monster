"""Procedural scene generation utilities."""

from __future__ import annotations

import random
from datetime import datetime
from typing import Dict, List

from .markov import LanguageStat, Repository


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


def _ensure_languages(languages: List[LanguageStat] | None) -> List[LanguageStat]:
    if languages:
        return languages
    return [LanguageStat(name="Unknown", bytes=1)]


def build_scene(repository: Repository, *, seed: int | None = None) -> Dict:
    """Create structured scene data for the frontend.

    Buildings now mirror the repository's primary languages, scaling their
    footprints with forks and their heights with stars/issues.  Road segments
    reflect collaboration flow, and lighting intensity pulses with activity.
    """

    rng = random.Random(seed)

    languages = _ensure_languages(repository.languages)
    top_languages = languages[:5]
    total_bytes = sum(lang.bytes for lang in top_languages) or 1
    stars = max(repository.stargazers_count, 0)
    forks = max(repository.forks_count, 0)
    issues = max(repository.open_issues_count, 0)

    buildings: List[Dict] = []
    for index, language in enumerate(top_languages):
        prominence = language.bytes / total_bytes
        base_height = 14 + int(stars * 0.35)
        height = max(10, int(base_height + issues * 0.6 * prominence))
        width = max(6, int(6 + forks * 0.25 * max(prominence, 0.2)))
        depth = max(6, int(5 + forks * 0.2 + index))
        emissive_intensity = round(min(1.0, 0.25 + prominence * 0.9 + issues / 60), 2)

        buildings.append(
            {
                "id": f"{repository.full_name}:{language.name}",
                "name": repository.name,
                "language": language.name,
                "height": height,
                "width": width,
                "depth": depth,
                "color": rng.choice(BUILDING_COLORS),
                "emissive_color": "#ffd54f" if issues else "#263238",
                "emissive_intensity": emissive_intensity,
                "stars": stars,
                "issues": issues,
                "share": round(prominence, 3),
                "bytes": language.bytes,
                "tooltip": f"{language.name} • ⭐{stars} • 🐛{issues}",
            }
        )

    main_segments = []
    lane_count = max(1, min(4, forks // 5 + 1))
    base_length = max(12, stars // 2 + 8)
    for lane in range(lane_count):
        curvature = round(rng.uniform(-0.35, 0.35), 3)
        length = max(8, int(base_length * (1 - lane * 0.08) + rng.uniform(-3, 3)))
        elevation = round((issues * 0.05) - lane * 0.4, 2)
        main_segments.append({"length": length, "curve": curvature, "elevation": elevation})

    maintenance_segments = [
        {
            "length": max(6, issues + 6),
            "curve": round(rng.uniform(-0.25, 0.25), 3),
            "elevation": round(issues * 0.08, 2),
        }
    ]

    roads = [
        {
            "segments": main_segments,
            "texture": "digital-cobblestone",
            "lanes": lane_count,
            "glow": "#ffca28" if issues else "#64b5f6",
            "traffic": round(min(1.0, stars / 200), 2),
        },
        {
            "segments": maintenance_segments,
            "texture": "maintenance-grid",
            "lanes": max(1, min(2, issues // 10 + 1)),
            "glow": "#ef5350" if issues else "#90a4ae",
            "traffic": round(min(1.0, issues / 40), 2),
        },
    ]

    created_seed = int(repository.latest_commit_sha[:6], 16) if repository.latest_commit_sha else 0
    lighting = rng.choice(LIGHTING_PRESETS).copy()
    lighting["time"] = datetime.utcnow().isoformat()
    lighting["seed"] = created_seed
    lighting["haze"] = round(min(1.0, issues / 40), 2)
    lighting["pulse"] = round(min(1.0, stars / 250), 2)
    lighting["accent"] = roads[0]["glow"]

    return {
        "buildings": buildings,
        "roads": roads,
        "lighting": lighting,
    }


