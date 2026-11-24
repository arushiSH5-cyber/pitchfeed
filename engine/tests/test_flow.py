"""End-to-end: intake -> ICP -> discover -> feed -> approve (HITL) -> pipeline -> analytics, plus credit gate."""
import os

os.environ.setdefault("GRAPH_DB_PATH", "/tmp/pitchfeed-test/graph.kuzu")
for k in ("ANTHROPIC_API_KEY", "TAVILY_API_KEY", "HUNTER_API_KEY", "FLEXPRICE_API_KEY"):
    os.environ.pop(k, None)

from fastapi.testclient import TestClient  # noqa: E402

from app import billing, main  # noqa: E402

client = TestClient(main.app)


def boot():
    client.post("/reset")
    client.post("/intake/demo")
    client.post("/icp/approve", json={"actor": "human"})
    return client.post("/discover").json()


def test_health_demo_modes():
    r = client.get("/health").json()
    assert r["modes"]["llm"] == "demo" and r["modes"]["graph"] == "live"


def test_icp_has_confidence_and_expansions():
    client.post("/reset")
    icp = client.post("/intake/demo").json()
    assert all(0 <= i["confidence"] <= 1 for i in icp["industries"])
    assert len(icp["expansions"]) == 3
    r = client.post("/icp/expansions/exp_1", json={"action": "accept"}).json()
    assert r["status"] == "accepted"


def test_discover_requires_approved_icp():
    client.post("/reset")
    client.post("/intake/demo")
    assert client.post("/discover").status_code == 409


def test_discovery_filters_and_cites():
    res = boot()
    assert res["leads"] == 4 and res["dropped"] == 2  # hiring freeze + out of region
    reasons = {d["reason"] for d in client.get("/dropped").json()}
    assert reasons == {"negative_signal", "outside_region"}
    for card in client.get("/feed").json():
        assert card["why_now"] and all(w["url"] for w in card["why_now"])
        assert card["tier"] in "ABC" and 0 <= card["score"] <= 100
        assert card["receipt"]["claims"][0]["verified"]


def test_warm_path_found():
    boot()
    feed = client.get("/feed").json()
    mg = next(c for c in feed if c["company"].startswith("Maple"))
    assert mg["warm_path"].startswith("You → San José State University → Priya Shah")
    path = client.get(f"/graph/path/{mg['id']}").json()
    assert path["found"] and "SHORTEST" in path["cypher"]


def test_hitl_blocks_agents():
    boot()
    lid = client.get("/feed").json()[0]["id"]
    r = client.post(f"/cards/{lid}/approve", json={"actor": "Builder"})
    assert r.status_code == 403
    assert any(a["action"] == "blocked_non_human_action" for a in client.get("/audit").json())


def test_approve_sends_to_demo_inbox_and_meters():
    boot()
    before = client.get("/credits").json()["balance"]
    lid = client.get("/feed").json()[0]["id"]
    r = client.post(f"/cards/{lid}/approve", json={"actor": "human"}).json()
    assert r["sent"]["to"] == "demo-inbox@example.com"
    after = client.get("/credits").json()
    assert after["balance"] == before - 5 - 1  # enrich + send
    pipe = client.get("/pipeline").json()
    assert pipe["contacted"][0]["last_moved_by"] == "human"
    assert lid not in [c["id"] for c in client.get("/feed").json()]


def test_edit_that_adds_hype_is_blocked():
    boot()
    lid = client.get("/feed").json()[0]["id"]
    r = client.post(f"/cards/{lid}/approve", json={"actor": "human", "edited_body": "We guarantee results! Act now."})
    assert r.status_code == 422


def test_credit_gate_402():
    boot()
    billing.ledger["balance"] = 3  # less than one enrichment
    lid = client.get("/feed").json()[0]["id"]
    r = client.post(f"/leads/{lid}/enrich")
    assert r.status_code == 402 and r.json()["detail"]["error"] == "out_of_credits"


def test_analytics_and_wrapped():
    boot()
    for card in client.get("/feed").json()[:3]:
        client.post(f"/cards/{card['id']}/approve", json={"actor": "human"})
    client.post("/demo/simulate-replies")
    a = client.get("/analytics").json()
    assert a["funnel"][1]["count"] == 3
    assert a["includes_simulated"] is True
    assert {w["title"] for w in a["wrapped"]} >= {"Leads found", "Best opener"}
    assert a["actions_by"]["human"] >= 3
