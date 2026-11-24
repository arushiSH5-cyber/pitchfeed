"""In-memory app state + audit log + crew-room feed. Swap for SQLite/Postgres later."""
from __future__ import annotations

import itertools
from datetime import datetime, timezone
from typing import Any

STAGES = ["matched", "contacted", "replied", "meeting_booked", "closed", "lost"]

_ids = itertools.count(1)
state: dict[str, Any] = {}


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def new_id(prefix: str) -> str:
    return f"{prefix}_{next(_ids)}"


def reset() -> None:
    state.clear()
    state.update(
        product=None,       # intake payload
        founder=None,       # founder background
        icp=None,           # ICP dict
        leads={},           # lead_id -> lead dict
        dropped=[],         # claims that failed validation / negative filters
        audit=[],           # every action
        thinking=[],        # crew-room messages
    )


def audit(action: str, actor: str, target: str | None = None, **detail) -> dict:
    """actor: 'human' | 'ai' | an agent name like 'Builder'."""
    entry = {"id": new_id("evt"), "ts": now(), "action": action, "actor": actor,
             "target": target, "detail": detail}
    state["audit"].append(entry)
    return entry


def think(agent: str, text: str, kind: str = "message", **data) -> dict:
    """Crew-room line. agent: Planner | Builder | Reviewer | Security | System."""
    entry = {"id": new_id("think"), "ts": now(), "agent": agent, "kind": kind,
             "text": text, "data": data}
    state["thinking"].append(entry)
    return entry


reset()
