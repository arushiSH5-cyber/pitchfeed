"""Fit (0-60) + intent (0-40) = 0-100 score, tier A/B/C, and lead temperature."""
from __future__ import annotations

SIGNAL_WEIGHT = {"hiring": 14, "pain": 14, "event": 12, "funding": 10, "leadership": 10, "tech_change": 8}


def _recency(days: int) -> float:
    if days <= 7:
        return 1.0
    if days <= 21:
        return 0.7
    if days <= 45:
        return 0.4
    return 0.15


def temperature(signals: list[dict]) -> dict:
    """Freshest signal decides. 'stale_in_days' powers the countdown on the card."""
    if not signals:
        return {"label": "cold", "freshest_days": None, "stale_in_days": 0}
    d = min(s["days_ago"] for s in signals)
    label = "hot" if d <= 7 else "warm" if d <= 21 else "cooling" if d <= 45 else "cold"
    return {"label": label, "freshest_days": d, "stale_in_days": max(0, 21 - d)}


def score(cand: dict, icp: dict, has_warm_path: bool) -> dict:
    industries = [i["label"].lower() for i in icp.get("industries", [])]
    personas = " ".join(p["title"].lower() for p in icp.get("personas", []))
    title = ((cand.get("buyer") or {}).get("title") or "").lower()

    fit = 0
    fit += 22 if (cand.get("industry") or "").lower() in industries else 8
    fit += 14 if cand.get("size") else 6
    fit += 16 if title and any(w in personas for w in title.split() if len(w) > 3) else 6
    fit += 8 if has_warm_path else 0
    fit = min(fit, 60)

    intent = sum(SIGNAL_WEIGHT.get(s["type"], 6) * _recency(s["days_ago"]) for s in cand["signals"])
    if len(cand["signals"]) >= 2:
        intent += 6  # stacked signals roughly double replies
    intent = min(round(intent), 40)

    total = fit + intent
    tier = "A" if total >= 70 else "B" if total >= 50 else "C"
    return {"score": total, "fit": fit, "intent": intent, "tier": tier}
