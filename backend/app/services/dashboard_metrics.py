"""Defensible dashboard summaries derived only from stored audit findings."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any


CANONICAL_PILLARS = (
    "Consent",
    "Notice",
    "Data Principal Rights",
    "Children's Data",
    "Data Fiduciary Obligations",
    "Grievance Redressal",
    "Cross Border Transfer",
    "Security Safeguards",
    "Data Breach Notification",
)

PILLAR_ALIASES = {
    "children's data protection": "Children's Data",
    "children data": "Children's Data",
    "fiduciary obligations": "Data Fiduciary Obligations",
    "data fiduciary obligation": "Data Fiduciary Obligations",
    "cross-border transfer": "Cross Border Transfer",
    "cross border transfers": "Cross Border Transfer",
    "grievance officer": "Grievance Redressal",
    "breach notification": "Data Breach Notification",
}

SEVERITY_ORDER = {
    "Critical": 0,
    "High": 1,
    "Medium": 2,
    "Low": 3,
    "Informational": 4,
}

DEMONSTRATION_BENCHMARK_INDUSTRIES = frozenset(
    {"FinTech", "E-commerce", "Healthcare", "EdTech", "SaaS"}
)


def canonicalize_pillar(value: str) -> str:
    """Map known legacy labels while preserving previously unseen stored labels."""
    cleaned = " ".join((value or "").split())
    if not cleaned:
        return "Unspecified"
    canonical_by_lower = {pillar.lower(): pillar for pillar in CANONICAL_PILLARS}
    return canonical_by_lower.get(
        cleaned.lower(),
        PILLAR_ALIASES.get(cleaned.lower(), cleaned),
    )


def build_pillar_metrics(findings: Iterable[Any]) -> list[dict[str, Any]]:
    """Group real findings without manufacturing pillar scores or pass states."""
    grouped: dict[str, dict[str, Any]] = {
        pillar: {
            "pillar": pillar,
            "finding_count": 0,
            "highest_severity": None,
            "severity_counts": {severity: 0 for severity in SEVERITY_ORDER},
        }
        for pillar in CANONICAL_PILLARS
    }

    for finding in findings:
        pillar = canonicalize_pillar(getattr(finding, "pillar", ""))
        metric = grouped.setdefault(
            pillar,
            {
                "pillar": pillar,
                "finding_count": 0,
                "highest_severity": None,
                "severity_counts": {severity: 0 for severity in SEVERITY_ORDER},
            },
        )
        metric["finding_count"] += 1
        severity = getattr(finding, "severity", None)
        if severity not in SEVERITY_ORDER:
            continue
        metric["severity_counts"][severity] += 1
        current = metric["highest_severity"]
        if current is None or SEVERITY_ORDER[severity] < SEVERITY_ORDER[current]:
            metric["highest_severity"] = severity

    canonical_metrics = [grouped[pillar] for pillar in CANONICAL_PILLARS]
    extra_metrics = sorted(
        (metric for pillar, metric in grouped.items() if pillar not in CANONICAL_PILLARS),
        key=lambda metric: metric["pillar"].lower(),
    )
    return canonical_metrics + extra_metrics


def select_pillars_by_recorded_severity(
    metrics: Iterable[dict[str, Any]], *, highest_risk: bool
) -> list[str]:
    """Return every tied pillar at the most/least severe recorded level."""
    assessed = [
        metric
        for metric in metrics
        if metric.get("finding_count", 0) > 0
        and metric.get("highest_severity") in SEVERITY_ORDER
    ]
    if not assessed:
        return []

    ranks = [SEVERITY_ORDER[metric["highest_severity"]] for metric in assessed]
    target_rank = min(ranks) if highest_risk else max(ranks)
    return [
        metric["pillar"]
        for metric in assessed
        if SEVERITY_ORDER[metric["highest_severity"]] == target_rank
    ]


def format_pillar_names(pillars: Iterable[str]) -> str:
    names = list(pillars)
    return ", ".join(names) if names else "None"
