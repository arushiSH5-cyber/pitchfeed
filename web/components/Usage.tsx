"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Icon } from "./Sprites";

type Health = { integrations: Record<string, "live" | "demo"> };

export default function Usage() {
  const ledger = useApp((s) => s.ledger);
  const credits = useApp((s) => s.credits);
  const [health, setHealth] = useState<Health | null>(null);
  useEffect(() => { fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => {}); }, []);
  const spent = ledger.graph * 0.1 + ledger.enrich * 5 + ledger.send;
  const rows: [string, string, number, number][] = [["Graph query", "graph_query", 0.1, ledger.graph], ["Lead enriched", "lead_enriched", 5, ledger.enrich], ["Outreach sent", "outreach_sent", 1, ledger.send]];
  return (
    <>
      <div className="usage-grid">
        <div className="card-s kpi"><div className="label">Balance</div><div className="v">{credits.toFixed(1)}</div><div className="d">credits remaining</div></div>
        <div className="card-s kpi"><div className="label">Spent this session</div><div className="v">{spent.toFixed(1)}</div><div className="d">across {ledger.graph + ledger.enrich + ledger.send} metered events</div></div>
        <div className="card-s kpi"><div className="label">Cost per contacted lead</div><div className="v">{ledger.send ? (spent / ledger.send).toFixed(1) : "6.1"}</div><div className="d">graph + email + send</div></div>
      </div>
      <div className="grid2">
        <div className="card-s tbl"><table className="price">
          <thead><tr><th>Metered event</th><th>Unit price</th><th>Used</th><th>Spent</th></tr></thead>
          <tbody>{rows.map(([n, k, p, u]) => (
            <tr key={k}><td><b style={{ fontWeight: 600 }}>{n}</b><div className="mini mono">{k}</div></td><td className="mono">{p.toFixed(1)}</td><td className="mono">{u}</td><td className="mono">{(p * u).toFixed(1)}</td></tr>
          ))}</tbody>
        </table></div>
        <div className="card-s box"><h4>How credits protect you</h4><div className="s">Usage-based billing powered by Flexprice.</div>
          <div className="verify">
            {["Pay only for leads you act on", "Expensive enrichment pauses at zero", "Cost shows on every receipt", "Daily send cap protects your domain"].map((t) => (
              <div key={t}><span><Icon id="i-check" size={15} style={{ color: "var(--sage)" }} />{t}</span></div>
            ))}
          </div>
          {health && (
            <div style={{ marginTop: 14 }}><h4 style={{ fontSize: 14 }}>Integrations</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {Object.entries(health.integrations).map(([k, v]) => <span key={k} className={`chip ${v === "live" ? "sage" : ""}`}>{k} · {v}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
