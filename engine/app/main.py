"""Pitchfeed API. Run: uvicorn app.main:app --reload"""
from __future__ import annotations

import random
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import billing, config, discovery, enrich, graph, icp, outreach, scoring, seed, store

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(_app):
    graph.reset()  # graph is rebuilt from state each boot
    yield


app = FastAPI(title="Pitchfeed API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ---------- models ----------

class Founder(BaseModel):
    name: str = "You"
    schools: list[str] = []
    past_employers: list[str] = []
    programs: list[str] = []
    region: str = "San Francisco Bay Area"


class Intake(BaseModel):
    name: str
    description: str
    url: str = ""
    customers: str = ""
    pricing: str = ""
    founder: Founder = Founder()


class ExpansionAction(BaseModel):
    action: Literal["accept", "dismiss", "adjust"]
    note: str | None = None


class HumanAction(BaseModel):
    actor: str = Field(..., description="must be 'human'")
    edited_body: str | None = None
    reason: str | None = None


class StageMove(BaseModel):
    stage: Literal["matched", "contacted", "replied", "meeting_booked", "closed", "lost"]
    actor: Literal["human", "ai"]


# ---------- helpers ----------

def _lead(lead_id: str) -> dict:
    lead = store.state["leads"].get(lead_id)
    if not lead:
        raise HTTPException(404, "lead not found")
    return lead


def _require_human(actor: str) -> None:
    """HITL gate: agents/LLMs can never approve or send."""
    if actor != "human":
        store.audit("blocked_non_human_action", actor)
        store.think("Security", f"Blocked an approval attempt by '{actor}'. Only humans can approve.", kind="security")
        raise HTTPException(403, "Only a human can approve or reject outreach.")


def _move(lead: dict, stage: str, actor: str) -> None:
    prev = lead["stage"]
    lead["stage"] = stage
    lead["history"].append({"ts": store.now(), "from": prev, "to": stage, "actor": actor})
    store.audit("stage_change", actor, lead["id"], frm=prev, to=stage)


def _card(lead: dict) -> dict:
    t1 = lead["sequence"]["touches"][0]
    return {
        "id": lead["id"], "company": lead["company"], "industry": lead["industry"], "size": lead.get("size"),
        "buyer": lead["buyer"], "score": lead["score"], "tier": lead["tier"], "fit": lead["fit"], "intent": lead["intent"],
        "temperature": lead["temperature"],
        "why_now": [{"text": s["text"], "url": s["url"], "days_ago": s["days_ago"], "type": s["type"]} for s in lead["signals"]],
        "warm_path": lead["warm_path"]["summary"], "warm_hops": lead["warm_path"].get("hops"),
        "draft": {"subject": t1["subject"], "body": t1["body"], "channel": t1["channel"]},
        "variant": lead["sequence"]["variant"],
        "receipt": outreach.receipt(lead), "status": lead["review"], "demo": lead.get("demo", False),
    }


# ---------- routes ----------

@app.get("/health")
def health():
    return {"ok": True, "modes": config.modes(), "demo_inbox": config.DEMO_INBOX, "graph": graph.stats()}


@app.post("/reset")
def reset():
    store.reset()
    billing.reset()
    graph.reset()
    store.think("System", "Fresh start. Crew is ready 🐦")
    return {"ok": True}


@app.post("/intake")
def intake(body: Intake):
    product = body.model_dump(exclude={"founder"})
    founder = body.founder.model_dump()
    store.state.update(product=product, founder=founder)
    store.audit("intake", "human", product=product["name"])
    store.state["icp"] = icp.build_icp(product, founder)
    graph.write_founder(founder, product)
    return store.state["icp"]


@app.post("/intake/demo")
def intake_demo():
    """One-click Togather demo intake."""
    return intake(Intake(**seed.DEMO_PRODUCT, founder=Founder(**seed.DEMO_FOUNDER)))


@app.get("/icp")
def get_icp():
    if not store.state["icp"]:
        raise HTTPException(404, "no ICP yet; POST /intake first")
    return store.state["icp"]


@app.post("/icp/approve")
def approve_icp(body: HumanAction):
    _require_human(body.actor)
    store.state["icp"]["status"] = "approved"
    store.audit("icp_approved", "human")
    return store.state["icp"]


@app.post("/icp/expansions/{exp_id}")
def expansion(exp_id: str, body: ExpansionAction):
    try:
        exp = icp.act_on_expansion(get_icp(), exp_id, body.action, body.note)
    except KeyError:
        raise HTTPException(404, "expansion not found")
    store.audit(f"expansion_{body.action}", "human", exp_id)
    return exp


@app.post("/discover")
def discover():
    the_icp = get_icp()
    if the_icp["status"] != "approved":
        raise HTTPException(409, "Approve the ICP first (POST /icp/approve).")
    product = store.state["product"]
    comps = discovery.competitors(product)
    graph.write_competitors(comps)
    store.state["competitors"] = comps
    kept, dropped = discovery.discover(the_icp)
    store.state["dropped"] = dropped

    for cand in kept:
        lid = store.new_id("lead")
        for i, s in enumerate(cand["signals"]):
            s["id"] = f"{lid}_sig{i}"
        lead = {
            "id": lid, "company": cand["company"], "domain": cand.get("domain"), "industry": cand.get("industry"),
            "size": cand.get("size"), "region": cand.get("region"), "buyer": cand.get("buyer") or {},
            "connector": cand.get("connector"), "signals": cand["signals"], "demo": cand.get("demo", False),
            "company_id": f"co:{graph.slug(cand['company'])}",
            "buyer_id": f"person:{graph.slug((cand.get('buyer') or {}).get('name', lid))}",
            "stage": "matched", "owner": "ai", "history": [], "review": "pending", "contact": None,
            "score": 0,
        }
        graph.write_lead(lead)
        lead["warm_path"] = graph.warm_path(lead["buyer_id"])
        billing.meter("graph_query", lead_id=lid)
        lead.update(scoring.score(cand, the_icp, lead["warm_path"]["found"]))
        lead["temperature"] = scoring.temperature(lead["signals"])
        graph.write_lead(lead)  # update score on matched_to
        if lead["warm_path"]["found"]:
            store.think("Builder", f"Warm path to {lead['buyer'].get('name')}: {lead['warm_path']['summary']}", kind="graph",
                        cypher=lead["warm_path"]["cypher"])
        lead["sequence"] = outreach.draft_sequence(lead, product)
        lead["history"].append({"ts": store.now(), "from": None, "to": "matched", "actor": "ai"})
        store.state["leads"][lid] = lead
        store.audit("lead_matched", "ai", lid, company=lead["company"], score=lead["score"])
    store.think("Planner", f"{len(kept)} cards are in your feed. Swipe when ready 👀", kind="waiting_on_human")
    return {"leads": len(kept), "dropped": len(dropped), "competitors": comps}


@app.get("/dropped")
def dropped():
    return store.state["dropped"]


@app.get("/feed")
def feed():
    pending = [l for l in store.state["leads"].values() if l["review"] == "pending"]
    pending.sort(key=lambda l: (-l["score"], l["temperature"]["freshest_days"] or 99))
    return [_card(l) for l in pending]


@app.get("/leads")
def leads():
    return [{
        "id": l["id"], "company": l["company"], "industry": l["industry"], "buyer": l["buyer"].get("name"),
        "title": l["buyer"].get("title"), "score": l["score"], "tier": l["tier"], "temperature": l["temperature"]["label"],
        "top_signal": l["signals"][0]["text"] if l["signals"] else None, "signals_verified": sum(s["verified"] for s in l["signals"]),
        "email": (l.get("contact") or {}).get("email"), "email_verified": (l.get("contact") or {}).get("verified"),
        "warm_path": l["warm_path"]["found"], "stage": l["stage"], "owner": l["owner"], "review": l["review"],
        "demo": l.get("demo", False),
    } for l in store.state["leads"].values()]


@app.get("/leads/{lead_id}")
def lead_detail(lead_id: str):
    l = _lead(lead_id)
    return {**_card(l), "signals": l["signals"], "contact": l.get("contact"), "sequence": l["sequence"],
            "warm_path_graph": l["warm_path"], "history": l["history"], "stage": l["stage"]}


@app.post("/leads/{lead_id}/enrich")
def enrich_lead(lead_id: str):
    l = _lead(lead_id)
    if l.get("contact"):
        return l["contact"]
    billing.check("lead_enriched")
    l["contact"] = enrich.enrich(l)
    billing.meter("lead_enriched", lead_id=lead_id)
    store.audit("lead_enriched", "ai", lead_id, email=l["contact"]["email"])
    store.think("Builder", f"Enriched {l['buyer'].get('name')}: {l['contact']['email']} "
                f"(MX {'✓' if l['contact']['mx']['valid'] else '–'}).", kind="enrich")
    return l["contact"]


@app.post("/cards/{lead_id}/approve")
def approve(lead_id: str, body: HumanAction):
    _require_human(body.actor)
    l = _lead(lead_id)
    t1 = l["sequence"]["touches"][0]
    if body.edited_body:
        t1["body"], t1["edited_by_human"] = body.edited_body, True
        from . import verifier
        t1["checks"] = verifier.check(t1, l, [store.state["product"].get("url", "").split("//")[-1].split("/")[0]])
    if t1["checks"]["blocked"]:
        raise HTTPException(422, {"error": "blocked_by_checks", "failed": t1["checks"]["blocked_by"]})
    if not l.get("contact"):
        enrich_lead(lead_id)  # metered + gated
    billing.check("outreach_sent")
    billing.meter("outreach_sent", lead_id=lead_id)
    l["review"] = "approved"
    l["sent"] = {"ts": store.now(), "to": config.DEMO_INBOX, "intended_for": l["contact"]["email"],
                 "subject": t1["subject"], "channel": t1["channel"], "demo_send": True}
    graph.record_contact(l["buyer_id"], t1["channel"], l["sent"]["ts"])
    store.audit("outreach_approved_and_sent", "human", lead_id, edited=bool(body.edited_body), to=config.DEMO_INBOX)
    _move(l, "contacted", "human")
    store.think("Planner", f"Approved by you ✅ Sent to demo inbox for {l['company']}.", kind="approved")
    return {"ok": True, "sent": l["sent"], "credits": billing.summary()["balance"]}


@app.post("/cards/{lead_id}/reject")
def reject(lead_id: str, body: HumanAction):
    _require_human(body.actor)
    l = _lead(lead_id)
    l["review"], l["reject_reason"] = "rejected", body.reason
    store.audit("outreach_rejected", "human", lead_id, reason=body.reason)
    _move(l, "lost", "human")
    return {"ok": True}


@app.get("/pipeline")
def pipeline():
    cols = {s: [] for s in store.STAGES}
    for l in store.state["leads"].values():
        last = l["history"][-1] if l["history"] else {"actor": "ai"}
        cols[l["stage"]].append({"id": l["id"], "company": l["company"], "tier": l["tier"], "score": l["score"],
                                 "last_moved_by": last["actor"], "last_moved_at": last.get("ts"),
                                 "temperature": l["temperature"]["label"]})
    return cols


@app.post("/leads/{lead_id}/stage")
def move_stage(lead_id: str, body: StageMove):
    l = _lead(lead_id)
    _move(l, body.stage, body.actor)
    if body.stage == "replied":
        graph.record_reply(l["buyer_id"], store.now())
    return {"ok": True, "stage": l["stage"]}


@app.post("/demo/simulate-replies")
def simulate_replies():
    """DEMO ONLY: fake inbound replies so the dashboard has data. Marked simulated in audit."""
    rng = random.Random(7)
    moved = []
    for l in store.state["leads"].values():
        if l["stage"] == "contacted" and rng.random() < 0.6:
            _move(l, "replied", "ai")
            graph.record_reply(l["buyer_id"], store.now())
            store.audit("reply_simulated", "ai", l["id"], simulated=True)
            moved.append(l["id"])
            if rng.random() < 0.5:
                _move(l, "meeting_booked", "ai")
    return {"simulated": True, "replied": moved}


@app.get("/analytics")
def analytics():
    ls = list(store.state["leads"].values())
    order = ["matched", "contacted", "replied", "meeting_booked", "closed"]
    reached = lambda l, s: any(h["to"] == s for h in l["history"])
    funnel = [{"stage": s, "count": sum(reached(l, s) for l in ls)} for s in order]

    def seg(key):
        out = {}
        for l in ls:
            k = l[key]
            o = out.setdefault(k, {"leads": 0, "contacted": 0, "replied": 0})
            o["leads"] += 1
            o["contacted"] += reached(l, "contacted")
            o["replied"] += reached(l, "replied")
        for o in out.values():
            o["reply_rate"] = round(o["replied"] / o["contacted"], 2) if o["contacted"] else None
        return out

    variants = {}
    for l in ls:
        v = l["sequence"]["variant"]
        o = variants.setdefault(v, {"label": outreach.VARIANTS[v], "sent": 0, "replied": 0})
        o["sent"] += reached(l, "contacted")
        o["replied"] += reached(l, "replied")
    by_actor = {"ai": 0, "human": 0}
    for l in ls:
        for h in l["history"]:
            by_actor[h["actor"] if h["actor"] in by_actor else "ai"] += 1
    sent = funnel[1]["count"]
    best_variant = max(variants.items(), key=lambda kv: (kv[1]["replied"] / kv[1]["sent"]) if kv[1]["sent"] else -1, default=(None, None))[0]
    wrapped = [
        {"title": "Leads found", "value": len(ls), "caption": f"{len(store.state['dropped'])} dropped for unverified or bad-fit signals"},
        {"title": "Messages sent", "value": sent, "caption": "every one approved by you"},
        {"title": "Best opener", "value": best_variant, "caption": outreach.VARIANTS.get(best_variant, "") if best_variant else "send more to find out"},
        {"title": "Warm paths found", "value": sum(l["warm_path"]["found"] for l in ls), "caption": "people you already know who can introduce you"},
        {"title": "Time saved", "value": f"~{round(len(ls) * 25 / 60, 1)}h", "caption": "est. 25 min of research per lead"},
    ]
    return {"funnel": funnel, "by_industry": seg("industry"), "by_tier": seg("tier"), "variants": variants,
            "actions_by": by_actor, "credits": billing.summary(), "wrapped": wrapped,
            "includes_simulated": any(a["action"] == "reply_simulated" for a in store.state["audit"])}


@app.get("/graph/path/{lead_id}")
def graph_path(lead_id: str):
    billing.meter("graph_query", lead_id=lead_id)
    return graph.warm_path(_lead(lead_id)["buyer_id"])


@app.get("/credits")
def credits():
    return billing.summary()


@app.get("/audit")
def audit():
    return store.state["audit"]


@app.get("/thinking")
def thinking(since: int = 0):
    return store.state["thinking"][since:]


@app.get("/competitors")
def competitors():
    return store.state.get("competitors", [])
