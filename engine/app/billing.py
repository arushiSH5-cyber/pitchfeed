"""Flexprice metering + credit gate. A local ledger always runs so the demo works offline."""
from __future__ import annotations

import httpx
from fastapi import HTTPException

from . import config, store

PRICES = {"lead_enriched": 5.0, "outreach_sent": 1.0, "graph_query": 0.1}

ledger = {"balance": config.DEMO_CREDITS, "usage": {k: 0 for k in PRICES}, "spent": 0.0}


def reset() -> None:
    ledger.update(balance=config.DEMO_CREDITS, usage={k: 0 for k in PRICES}, spent=0.0)


def _flexprice_balance() -> float | None:
    if not config.FLEXPRICE_API_KEY:
        return None
    try:
        r = httpx.get(f"{config.FLEXPRICE_BASE_URL}/customers/external/{config.FLEXPRICE_CUSTOMER_ID}/wallets",
                      headers={"x-api-key": config.FLEXPRICE_API_KEY}, timeout=8)
        r.raise_for_status()
        wallets = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        return float(wallets[0].get("credit_balance", wallets[0].get("balance"))) if wallets else None
    except Exception as exc:
        print(f"[billing] flexprice balance fallback: {exc}")
        return None


def balance() -> float:
    remote = _flexprice_balance()
    return remote if remote is not None else ledger["balance"]


def check(event: str, units: int = 1) -> None:
    """Raise 402 before doing expensive work if credits won't cover it."""
    cost = PRICES[event] * units
    if balance() < cost:
        store.think("System", f"Out of credits: {event} needs {cost}, balance {balance():.1f}. Gated.", kind="credit_block")
        raise HTTPException(status_code=402, detail={"error": "out_of_credits", "event": event,
                                                     "needed": cost, "balance": round(balance(), 2)})


def meter(event: str, units: int = 1, lead_id: str | None = None) -> float:
    cost = PRICES[event] * units
    ledger["balance"] = round(ledger["balance"] - cost, 2)
    ledger["usage"][event] += units
    ledger["spent"] = round(ledger["spent"] + cost, 2)
    if config.FLEXPRICE_API_KEY:
        try:
            httpx.post(f"{config.FLEXPRICE_BASE_URL}/events", timeout=8,
                       headers={"x-api-key": config.FLEXPRICE_API_KEY},
                       json={"event_name": event, "external_customer_id": config.FLEXPRICE_CUSTOMER_ID,
                             "properties": {"units": units, "lead_id": lead_id}})
        except Exception as exc:
            print(f"[billing] flexprice event failed: {exc}")
    return cost


def summary() -> dict:
    return {"balance": round(balance(), 2), "spent": ledger["spent"], "usage": ledger["usage"],
            "prices": PRICES, "mode": config.modes()["billing"]}
