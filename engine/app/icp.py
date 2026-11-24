"""Module 1: product intake -> structured ICP with per-field confidence."""
from __future__ import annotations

import copy
import json

from . import seed, store
from .llm import claude_json

SYSTEM = """You are a B2B go-to-market strategist. From a product description, infer an Ideal Customer Profile.
Return JSON with keys: summary, industries[{label,naics,confidence}], company_size{headcount,revenue,confidence},
personas[{title,seniority,confidence}], triggers[{label,why,confidence}], regions[], negative_signals[],
expansions[{id,label,why,confidence,status:"suggested"}]. Confidence is 0.00-1.00 and must reflect real uncertainty.
Expansions are adjacent or non-obvious segments with evidence-based reasoning."""


def build_icp(product: dict, founder: dict) -> dict:
    store.think("Planner", f"New intake for **{product.get('name', 'your product')}**. @Builder draft the ICP.")
    icp = claude_json(SYSTEM, json.dumps({"product": product, "founder_region": founder.get("region")}))
    if not icp:
        icp = copy.deepcopy(seed.DEMO_ICP)
        store.think("Builder", "No LLM key, so I loaded the demo ICP for Togather.", kind="fallback")
    else:
        icp["demo"] = False
        for i, exp in enumerate(icp.get("expansions", []), 1):
            exp.setdefault("id", f"exp_{i}")
            exp.setdefault("status", "suggested")
    icp["status"] = "draft"
    store.think("Builder", f"ICP ready: {len(icp['industries'])} industries, {len(icp['personas'])} personas, "
                f"{len(icp['triggers'])} triggers. @Reviewer can you check confidence scores?")
    store.think("Reviewer", "Looks reasonable. Waiting on the founder to approve 👀", kind="waiting_on_human")
    return icp


def act_on_expansion(icp: dict, exp_id: str, action: str, note: str | None = None) -> dict:
    for exp in icp["expansions"]:
        if exp["id"] == exp_id:
            exp["status"] = {"accept": "accepted", "dismiss": "dismissed", "adjust": "adjusted"}[action]
            if note:
                exp["note"] = note
            if action == "accept":
                icp["industries"].append({"label": exp["label"], "naics": None,
                                          "confidence": exp["confidence"], "from_expansion": True})
            return exp
    raise KeyError(exp_id)
