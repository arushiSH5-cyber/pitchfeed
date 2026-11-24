"""Module 4a: contact enrichment (Hunter) + MX validation."""
from __future__ import annotations

import httpx

from . import config


def mx_check(domain: str) -> dict:
    if not domain or domain.endswith(".example"):
        return {"valid": None, "records": [], "note": "demo domain"}
    try:
        import dns.resolver

        answers = dns.resolver.resolve(domain, "MX", lifetime=5)
        return {"valid": True, "records": sorted(str(a.exchange).rstrip(".") for a in answers)}
    except Exception as exc:
        return {"valid": False, "records": [], "note": type(exc).__name__}


def _hunter(domain: str, name: str) -> dict | None:
    first, _, last = name.partition(" ")
    r = httpx.get("https://api.hunter.io/v2/email-finder", timeout=15, params={
        "domain": domain, "first_name": first, "last_name": last, "api_key": config.HUNTER_API_KEY})
    if r.status_code != 200:
        return None
    d = r.json().get("data") or {}
    if not d.get("email"):
        return None
    return {"email": d["email"], "confidence": (d.get("score") or 0) / 100,
            "linkedin": d.get("linkedin_url"), "position": d.get("position"),
            "status": (d.get("verification") or {}).get("status"), "source": "hunter"}


def enrich(lead: dict) -> dict:
    buyer = lead.get("buyer") or {}
    domain = lead.get("domain") or ""
    result = None
    if config.HUNTER_API_KEY and domain and not domain.endswith(".example"):
        try:
            result = _hunter(domain, buyer.get("name", ""))
        except Exception as exc:
            print(f"[enrich] hunter failed: {exc}")
    if not result:
        first = (buyer.get("name") or "contact").split()[0].lower()
        result = {"email": f"{first}@{domain}", "confidence": 0.6, "linkedin": None,
                  "status": "demo", "source": "demo"}
    result["mx"] = mx_check(domain)
    result["domain"] = domain
    result["verified"] = result["status"] in ("valid", "demo") and result["mx"]["valid"] is not False
    return result
