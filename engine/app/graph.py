"""Module 3: knowledge graph in Kùzu (embedded, Cypher).

Rule: only this module's deterministic write functions mutate the graph (idempotent MERGE).
Agents and the LLM only read.
"""
from __future__ import annotations

import os
import shutil
import threading

import kuzu

from . import config

_lock = threading.Lock()
_db: kuzu.Database | None = None
_conn: kuzu.Connection | None = None

SCHEMA = [
    "CREATE NODE TABLE IF NOT EXISTS Founder(id STRING, name STRING, PRIMARY KEY(id))",
    "CREATE NODE TABLE IF NOT EXISTS Company(id STRING, name STRING, domain STRING, industry STRING, PRIMARY KEY(id))",
    "CREATE NODE TABLE IF NOT EXISTS Person(id STRING, name STRING, title STRING, PRIMARY KEY(id))",
    "CREATE NODE TABLE IF NOT EXISTS Product(id STRING, name STRING, PRIMARY KEY(id))",
    "CREATE NODE TABLE IF NOT EXISTS Competitor(id STRING, name STRING, category STRING, PRIMARY KEY(id))",
    "CREATE NODE TABLE IF NOT EXISTS Signal(id STRING, type STRING, text STRING, url STRING, days_ago INT64, PRIMARY KEY(id))",
    "CREATE NODE TABLE IF NOT EXISTS Org(id STRING, name STRING, kind STRING, PRIMARY KEY(id))",  # school / program
    "CREATE REL TABLE IF NOT EXISTS works_at(FROM Person TO Company)",
    "CREATE REL TABLE IF NOT EXISTS previously_employed_at(FROM Person TO Company, FROM Founder TO Company)",
    "CREATE REL TABLE IF NOT EXISTS member_of(FROM Person TO Org, FROM Founder TO Org)",
    "CREATE REL TABLE IF NOT EXISTS has_signal(FROM Company TO Signal)",
    "CREATE REL TABLE IF NOT EXISTS matched_to(FROM Company TO Product, score DOUBLE)",
    "CREATE REL TABLE IF NOT EXISTS competes_with(FROM Competitor TO Product)",
    "CREATE REL TABLE IF NOT EXISTS builds(FROM Founder TO Product)",
    "CREATE REL TABLE IF NOT EXISTS contacted_via(FROM Person TO Product, channel STRING, ts STRING)",
    "CREATE REL TABLE IF NOT EXISTS replied_to(FROM Person TO Product, ts STRING)",
]

FOUNDER_ID = "founder"
PRODUCT_ID = "product"


def slug(text: str) -> str:
    return "".join(ch if ch.isalnum() else "-" for ch in text.lower()).strip("-")


def conn() -> kuzu.Connection:
    global _db, _conn
    if _conn is None:
        os.makedirs(os.path.dirname(config.GRAPH_DB_PATH) or ".", exist_ok=True)
        _db = kuzu.Database(config.GRAPH_DB_PATH)
        _conn = kuzu.Connection(_db)
        for stmt in SCHEMA:
            _conn.execute(stmt)
    return _conn


def query(cypher: str, params: dict | None = None) -> list[dict]:
    with _lock:
        res = conn().execute(cypher, params or {})
        cols = res.get_column_names()
        rows = []
        while res.has_next():
            rows.append(dict(zip(cols, res.get_next())))
        return rows


def reset() -> None:
    global _db, _conn
    with _lock:
        _conn, _db = None, None
        path = config.GRAPH_DB_PATH
        if os.path.isdir(path):
            shutil.rmtree(path)
        elif os.path.exists(path):
            os.remove(path)
            if os.path.exists(path + ".wal"):
                os.remove(path + ".wal")
    conn()


# ---------- deterministic writes ----------

def _org(name: str, kind: str) -> str:
    oid = f"org:{slug(name)}"
    query("MERGE (o:Org {id:$id}) SET o.name=$n, o.kind=$k", {"id": oid, "n": name, "k": kind})
    return oid


def write_founder(founder: dict, product: dict) -> None:
    query("MERGE (f:Founder {id:$id}) SET f.name=$n", {"id": FOUNDER_ID, "n": founder.get("name", "You")})
    query("MERGE (p:Product {id:$id}) SET p.name=$n", {"id": PRODUCT_ID, "n": product.get("name", "Product")})
    query("MATCH (f:Founder {id:$f}), (p:Product {id:$p}) MERGE (f)-[:builds]->(p)", {"f": FOUNDER_ID, "p": PRODUCT_ID})
    for school in founder.get("schools", []):
        oid = _org(school, "school")
        query("MATCH (f:Founder {id:$f}), (o:Org {id:$o}) MERGE (f)-[:member_of]->(o)", {"f": FOUNDER_ID, "o": oid})
    for prog in founder.get("programs", []):
        oid = _org(prog, "program")
        query("MATCH (f:Founder {id:$f}), (o:Org {id:$o}) MERGE (f)-[:member_of]->(o)", {"f": FOUNDER_ID, "o": oid})
    for emp in founder.get("past_employers", []):
        cid = f"co:{slug(emp)}"
        query("MERGE (c:Company {id:$id}) SET c.name=$n", {"id": cid, "n": emp})
        query("MATCH (f:Founder {id:$f}), (c:Company {id:$c}) MERGE (f)-[:previously_employed_at]->(c)", {"f": FOUNDER_ID, "c": cid})


def write_competitors(comps: list[dict]) -> None:
    for c in comps:
        cid = f"comp:{slug(c['name'])}"
        query("MERGE (x:Competitor {id:$id}) SET x.name=$n, x.category=$k", {"id": cid, "n": c["name"], "k": c["category"]})
        query("MATCH (x:Competitor {id:$c}), (p:Product {id:$p}) MERGE (x)-[:competes_with]->(p)", {"c": cid, "p": PRODUCT_ID})


def write_lead(lead: dict) -> None:
    cid, bid = lead["company_id"], lead["buyer_id"]
    query("MERGE (c:Company {id:$id}) SET c.name=$n, c.domain=$d, c.industry=$i",
          {"id": cid, "n": lead["company"], "d": lead.get("domain") or "", "i": lead.get("industry") or ""})
    query("MATCH (c:Company {id:$c}), (p:Product {id:$p}) MERGE (c)-[r:matched_to]->(p) SET r.score=$s",
          {"c": cid, "p": PRODUCT_ID, "s": float(lead["score"])})
    for sig in lead["signals"]:
        query("MERGE (s:Signal {id:$id}) SET s.type=$t, s.text=$x, s.url=$u, s.days_ago=$d",
              {"id": sig["id"], "t": sig["type"], "x": sig["text"], "u": sig["url"], "d": int(sig["days_ago"])})
        query("MATCH (c:Company {id:$c}), (s:Signal {id:$s}) MERGE (c)-[:has_signal]->(s)", {"c": cid, "s": sig["id"]})
    buyer = lead.get("buyer") or {}
    query("MERGE (b:Person {id:$id}) SET b.name=$n, b.title=$t", {"id": bid, "n": buyer.get("name", "Unknown"), "t": buyer.get("title", "")})
    query("MATCH (b:Person {id:$b}), (c:Company {id:$c}) MERGE (b)-[:works_at]->(c)", {"b": bid, "c": cid})
    conn_ = lead.get("connector")
    if conn_:
        pid = f"person:{slug(conn_['name'])}"
        query("MERGE (x:Person {id:$id}) SET x.name=$n, x.title=$t", {"id": pid, "n": conn_["name"], "t": conn_.get("title", "")})
        query("MATCH (x:Person {id:$x}), (c:Company {id:$c}) MERGE (x)-[:works_at]->(c)", {"x": pid, "c": cid})
        for key, kind in (("school", "school"), ("program", "program")):
            if conn_.get(key):
                oid = _org(conn_[key], kind)
                query("MATCH (x:Person {id:$x}), (o:Org {id:$o}) MERGE (x)-[:member_of]->(o)", {"x": pid, "o": oid})
        if conn_.get("employer"):
            eid = f"co:{slug(conn_['employer'])}"
            query("MERGE (e:Company {id:$id}) SET e.name=$n", {"id": eid, "n": conn_["employer"]})
            query("MATCH (x:Person {id:$x}), (e:Company {id:$e}) MERGE (x)-[:previously_employed_at]->(e)", {"x": pid, "e": eid})


def record_contact(buyer_id: str, channel: str, ts: str) -> None:
    query("MATCH (b:Person {id:$b}), (p:Product {id:$p}) MERGE (b)-[r:contacted_via]->(p) SET r.channel=$c, r.ts=$t",
          {"b": buyer_id, "p": PRODUCT_ID, "c": channel, "t": ts})


def record_reply(buyer_id: str, ts: str) -> None:
    query("MATCH (b:Person {id:$b}), (p:Product {id:$p}) MERGE (b)-[r:replied_to]->(p) SET r.ts=$t",
          {"b": buyer_id, "p": PRODUCT_ID, "t": ts})


# ---------- reads (agents may call these) ----------

WARM_PATH_CYPHER = (
    "MATCH p = (f:Founder {id:$f})-[:member_of|works_at|previously_employed_at* SHORTEST 1..6]-(b:Person {id:$b}) "
    "RETURN nodes(p) AS nodes, rels(p) AS rels"
)


def warm_path(buyer_id: str) -> dict:
    """Shortest *social* path founder -> buyer (only people/org/employer edges)."""
    rows = query(WARM_PATH_CYPHER, {"f": FOUNDER_ID, "b": buyer_id})
    if not rows:
        return {"found": False, "cypher": WARM_PATH_CYPHER, "nodes": [], "edges": [], "summary": None}
    nodes = [{"id": n["id"], "label": n["_label"], "name": n.get("name")} for n in rows[0]["nodes"]]
    edges = []
    for r in rows[0]["rels"]:
        edges.append({"type": r["_label"], "src": _id_of(r["_src"], rows[0]["nodes"]), "dst": _id_of(r["_dst"], rows[0]["nodes"])})
    summary = " → ".join("You" if n["label"] == "Founder" else n["name"] for n in nodes)
    return {"found": True, "cypher": WARM_PATH_CYPHER, "nodes": nodes, "edges": edges,
            "hops": len(nodes) - 1, "summary": summary}


def _id_of(internal, nodes) -> str:
    for n in nodes:
        if n["_id"] == internal:
            return n["id"]
    return str(internal)


def stats() -> dict:
    out = {}
    for label in ("Company", "Person", "Signal", "Org", "Competitor"):
        out[label] = query(f"MATCH (n:{label}) RETURN count(n) AS c")[0]["c"]
    return out
