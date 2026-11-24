"""Rule-based checks that become the Proof Receipt. A draft with a failing hard check can't be approved."""
from __future__ import annotations

import re

BANNED = ["guarantee", "100%", "risk-free", "act now", "limited time", "no-brainer", "double your"]
URL_RE = re.compile(r"https?://[^\s)]+")


def check(draft: dict, lead: dict, allowed_domains: list[str]) -> dict:
    body = draft["body"]
    words = len(body.split())
    signal_ids = {s["id"] for s in lead["signals"]}
    links = URL_RE.findall(body)
    claims = draft.get("claims", [])

    checks = [
        {"id": "names_company", "label": f"Mentions {lead['company']}", "hard": True,
         "pass": lead["company"].split()[0].lower() in body.lower()},
        {"id": "cites_signal", "label": "Built on a verified signal", "hard": True,
         "pass": bool(claims) and all(c.get("signal_id") in signal_ids for c in claims)},
        {"id": "all_claims_sourced", "label": "Every claim has a source", "hard": True,
         "pass": all(c.get("url") for c in claims)},
        {"id": "no_hype", "label": "No guarantees or hype words", "hard": True,
         "pass": not any(b in body.lower() for b in BANNED)},
        {"id": "safe_links", "label": "Links only to our own site", "hard": True,
         "pass": all(any(d in l for d in allowed_domains) for l in links)},
        {"id": "length", "label": f"Short ({words} words, aim 40–120)", "hard": False,
         "pass": 40 <= words <= 120 if draft["channel"] == "email" else words <= 60},
        {"id": "question_cta", "label": "Ends with an easy question", "hard": False,
         "pass": body.strip().splitlines()[-3:] != [] and "?" in body[-200:]},
    ]
    hard_fail = [c["id"] for c in checks if c["hard"] and not c["pass"]]
    return {
        "checks": checks,
        "passed": sum(c["pass"] for c in checks),
        "total": len(checks),
        "blocked": bool(hard_fail),
        "blocked_by": hard_fail,
        "reviewer": "approve" if not hard_fail else "needs_changes",
        "security": "clear" if all(c["pass"] for c in checks if c["id"] == "safe_links") else "flag_links",
    }
