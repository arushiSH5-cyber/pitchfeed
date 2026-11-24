"""Module 2: find real accounts + buyers for the approved ICP, each claim cited and validated."""
from __future__ import annotations

import copy
import json
from datetime import date

import httpx

from . import config, seed, store
from .llm import claude_json
from .validator import verify_quote

NEGATIVE_TYPES = {"hiring_freeze", "layoffs", "shutdown"}

EXTRACT_SYSTEM = """You extract B2B prospects from web search results. Only use facts present in the given content.
Return a JSON list. Each item: {company, domain, industry, size, region, buyer:{name,title} or null,
signals:[{type: hiring|event|pain|funding|leadership|tech_change|hiring_freeze|layoffs, text, quote, url, published}]}.
`quote` MUST be copied verbatim (8-30 words) from that result's content. `url` must be that result's url.
`published` is YYYY-MM-DD if stated, else null. Skip anything you cannot support with a quote."""


def _queries(icp: dict) -> list[str]:
    region = (icp.get("regions") or [""])[0]
    persona = icp["personas"][0]["title"].split("/")[0].strip()
    out = []
    for trig in icp["triggers"][:3]:
        out.append(f"{trig['label']} {icp['industries'][0]['label']} {region}")
    out.append(f'"{persona}" job {region}')
    return out


def _tavily(query: str) -> list[dict]:
    resp = httpx.post("https://api.tavily.com/search", timeout=30, json={
        "api_key": config.TAVILY_API_KEY, "query": query, "max_results": 6,
        "include_raw_content": True, "search_depth": "advanced",
    })
    resp.raise_for_status()
    return resp.json().get("results", [])


def _days_ago(published: str | None) -> int:
    try:
        return max(0, (date.today() - date.fromisoformat(published[:10])).days)
    except Exception:
        return 30  # unknown date: treat as lukewarm


def _live_candidates(icp: dict) -> list[dict]:
    results, pages = [], {}
    for q in _queries(icp):
        store.think("Builder", f"Searching: “{q}”", kind="search")
        try:
            for r in _tavily(q):
                pages[r["url"]] = r.get("raw_content") or r.get("content") or ""
                results.append({"url": r["url"], "title": r.get("title"), "content": pages[r["url"]][:4000]})
        except Exception as exc:
            store.think("Builder", f"Search failed ({type(exc).__name__}), skipping.", kind="error")
    if not results:
        return []
    extracted = claude_json(EXTRACT_SYSTEM, json.dumps({"icp": icp["summary"], "results": results}), 4000) or []
    for cand in extracted:
        for sig in cand.get("signals", []):
            sig["days_ago"] = _days_ago(sig.get("published"))
            sig["_page"] = pages.get(sig.get("url"))
        cand.setdefault("connector", None)
    return extracted


def discover(icp: dict) -> tuple[list[dict], list[dict]]:
    """Returns (kept_candidates, dropped). Each kept signal is validated."""
    live = config.TAVILY_API_KEY and config.ANTHROPIC_API_KEY
    store.think("Planner", "ICP approved. @Builder find accounts with a reason to talk *now*.")
    candidates = _live_candidates(icp) if live else []
    if not candidates:
        candidates = copy.deepcopy(seed.DEMO_CANDIDATES)
        for c in candidates:
            c["demo"] = True
        store.think("Builder", f"Demo mode: loaded {len(candidates)} fictional candidates.", kind="fallback")

    kept, dropped = [], []
    regions = [r.lower() for r in icp.get("regions", [])]
    for cand in candidates:
        good = []
        for sig in cand.get("signals", []):
            check = verify_quote(sig.get("url", ""), sig.get("quote", ""), sig.pop("_page", None))
            sig["verified"], sig["verify_method"] = check["verified"], check["method"]
            if check["verified"]:
                good.append(sig)
            else:
                dropped.append({"company": cand["company"], "reason": "quote_not_found", "signal": sig})
        store.think("Reviewer", f"{cand['company']}: {len(good)}/{len(cand.get('signals', []))} claims verified against source.",
                    kind="validation")
        cand["signals"] = good
        neg = [s for s in good if s["type"] in NEGATIVE_TYPES]
        if neg:
            dropped.append({"company": cand["company"], "reason": "negative_signal", "signal": neg[0]})
            store.think("Reviewer", f"Dropping {cand['company']}: {neg[0]['text']}.", kind="filter")
            continue
        if regions and cand.get("region") and not any(r in cand["region"].lower() for r in regions):
            dropped.append({"company": cand["company"], "reason": "outside_region", "region": cand["region"]})
            store.think("Reviewer", f"Dropping {cand['company']}: outside target region ({cand['region']}).", kind="filter")
            continue
        if not good:
            dropped.append({"company": cand["company"], "reason": "no_verified_signals"})
            continue
        kept.append(cand)
    store.think("Builder", f"Kept {len(kept)} accounts, dropped {len(dropped)} (see /dropped).")
    return kept, dropped


def competitors(product: dict) -> list[dict]:
    """Competitive landscape. Live version: LLM + search, same citation rules. Demo: seed."""
    return copy.deepcopy(seed.DEMO_COMPETITORS)
