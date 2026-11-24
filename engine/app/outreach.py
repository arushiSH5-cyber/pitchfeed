"""Module 4b: 3-touch sequence from one cited signal, plus the Proof Receipt."""
from __future__ import annotations

import json
import random

from . import billing, store, verifier
from .llm import claude_json

VARIANTS = {
    "A": "signal-first opener (lead with what they just did)",
    "B": "question-first opener (lead with the pain as a question)",
}

PERSONA_RULES = {
    "Executive": "Max 80 words. Lead with outcome for the organization. CTA: a 15-minute call.",
    "Manager": "Max 110 words. Lead with saving them time on scheduling and no-shows. CTA: want a 2-minute demo video?",
}

SYSTEM = """You write short, honest B2B outreach. Use ONLY the facts given in `signal` and `product`. Never invent
numbers, mutual connections, or facts. Mention the warm connector only if `warm_path` is provided.
Return JSON: {"touches":[{"channel":"email","subject":str,"body":str},{"channel":"email","subject":str,"body":str},
{"channel":"linkedin","subject":null,"body":str}]}. Touch 2 is a short follow-up 3 days later. LinkedIn max 50 words.
End emails with a simple question. Sign off as the founder."""


def _template(lead: dict, sig: dict, product: dict, variant: str, warm: str | None) -> list[dict]:
    first = (lead.get("buyer") or {}).get("name", "there").split()[0]
    company, pname = lead["company"], product.get("name", "our app")
    intro = ""
    if warm:
        hops = warm.split(" → ")
        if len(hops) >= 4:  # You → org → connector → company → buyer
            intro = f"I'm also connected to your colleague {hops[-3]} through {hops[1]}. "
    quote = sig["quote"].rstrip(".")
    if variant == "A":
        opener = f"I came across this from {company}: “{quote}.”"
    else:
        opener = f"How is volunteer recruiting going at {company}? I read this in your recent update: “{quote}.”"
    email1 = (
        f"Hi {first},\n\n{opener} {intro}"
        f"I'm building {pname}: volunteers find shifts in a short video feed, sign up in one tap, "
        f"and get a reminder plus a quick role video before they arrive, so fewer no-shows for your coordinators.\n\n"
        f"Would a 2-minute demo video be useful for your team?\n\n— Founder, {pname}"
    )
    email2 = (
        f"Hi {first},\n\nQuick follow-up on my note about {company}. Happy to set {pname} up for one upcoming event "
        f"at no cost so your team can see if it helps.\n\nWorth a try on your next event?\n\n— Founder, {pname}"
    )
    linkedin = f"Hi {first}, saw {company}'s update and I'm building {pname} to make volunteer sign-ups easier. Open to a quick look?"
    return [
        {"channel": "email", "subject": f"{company} + easier volunteer sign-ups", "body": email1},
        {"channel": "email", "subject": f"Re: {company} + easier volunteer sign-ups", "body": email2},
        {"channel": "linkedin", "subject": None, "body": linkedin},
    ]


def draft_sequence(lead: dict, product: dict) -> dict:
    sig = max(lead["signals"], key=lambda s: (-s["days_ago"] if s["days_ago"] <= 21 else -999, s["type"] != "funding"))
    variant = random.Random(lead["id"]).choice(list(VARIANTS))
    warm = lead["warm_path"]["summary"] if lead["warm_path"]["found"] else None
    seniority = "Executive" if any(w in (lead.get("buyer") or {}).get("title", "") for w in ("Director", "President", "Executive")) else "Manager"
    store.think("Builder", f"Drafting 3 touches for {lead['company']} from signal: “{sig['text']}” (variant {variant}).")

    out = claude_json(SYSTEM, json.dumps({
        "product": product, "company": lead["company"], "buyer": lead.get("buyer"),
        "signal": {"text": sig["text"], "quote": sig["quote"]}, "warm_path": warm,
        "style": VARIANTS[variant], "persona_rules": PERSONA_RULES[seniority]}))
    touches = (out or {}).get("touches") or _template(lead, sig, product, variant, warm)

    allowed = [d for d in [product.get("url", "").split("//")[-1].split("/")[0]] if d]
    seq = []
    for i, t in enumerate(touches, 1):
        draft = {"step": i, "channel": t["channel"], "subject": t.get("subject"), "body": t["body"],
                 "send_after_days": {1: 0, 2: 3, 3: 5}.get(i, 0),
                 "claims": [{"text": sig["text"], "quote": sig["quote"], "url": sig["url"], "signal_id": sig["id"]}]}
        draft["checks"] = verifier.check(draft, lead, allowed)
        seq.append(draft)
    store.think("Reviewer", f"{lead['company']}: touch 1 passed {seq[0]['checks']['passed']}/{seq[0]['checks']['total']} checks.",
                kind="review")
    store.think("Security", f"{lead['company']}: links {seq[0]['checks']['security']}, no PII beyond business contact.", kind="security")
    return {"variant": variant, "variant_label": VARIANTS[variant], "persona": seniority, "signal_id": sig["id"], "touches": seq}


def receipt(lead: dict) -> dict:
    """The Proof Receipt shown under each card."""
    touch = lead["sequence"]["touches"][0]
    per_lead = (billing.PRICES["lead_enriched"] if lead.get("contact") else 0) + billing.PRICES["graph_query"]
    return {
        "lead_id": lead["id"],
        "claims": [{"text": c["text"], "quote": c["quote"], "url": c["url"],
                    "verified": next((s["verified"] for s in lead["signals"] if s["id"] == c["signal_id"]), False)}
                   for c in touch["claims"]],
        "checks": touch["checks"]["checks"],
        "reviewer": touch["checks"]["reviewer"],
        "security": touch["checks"]["security"],
        "contact": {"email": (lead.get("contact") or {}).get("email"),
                    "mx_valid": ((lead.get("contact") or {}).get("mx") or {}).get("valid")},
        "credits": {"spent_so_far": round(per_lead, 2), "send_will_cost": billing.PRICES["outreach_sent"]},
        "blocked": touch["checks"]["blocked"],
        "demo": lead.get("demo", False),
    }
