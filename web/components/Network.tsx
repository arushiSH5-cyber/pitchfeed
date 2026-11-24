"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import Constellation from "./Constellation";
import { Icon } from "./Sprites";

export default function Network() {
  const leads = useApp((s) => s.leads);
  const spend = useApp((s) => s.spend);
  const [focus, setFocus] = useState("l1");
  const l = leads.find((x) => x.id === focus) || leads[0];
  const pick = (id: string) => { setFocus(id); spend("graph", "Network path"); };
  const dot = (s: React.CSSProperties) => <span style={{ width: 10, height: 10, border: "1px solid var(--ink)", ...s }} />;
  return (
    <>
      <div className="net-side">
        <span className="label" style={{ padding: "2px 4px 4px" }}>Pick a lead</span>
        {leads.map((x) => (
          <button key={x.id} className={x.id === focus ? "on" : ""} onClick={() => pick(x.id)}>
            <b>{x.company}</b><span>{x.path ? `via ${x.path[2]} · ${x.path.length - 1} hops` : "no warm path yet"}</span>
          </button>
        ))}
        <div className="card-s box" style={{ marginTop: 6, padding: 12 }}>
          <div style={{ display: "grid", gap: 6, fontSize: 12 }} className="muted">
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon id="i-sun" size={12} style={{ color: "var(--gold)" }} />You</span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>{dot({ borderRadius: "50%", background: "var(--lav-soft)" })}Schools and programs</span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon id="i-star" size={12} style={{ color: "var(--ink-2)" }} />People you know</span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>{dot({ borderRadius: 3 })}Organizations</span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon id="i-star" size={12} style={{ color: "var(--rose)" }} />Buyers</span>
          </div>
        </div>
      </div>
      <div className="map-box">
        <Constellation focus={focus} id="netCanvas" />
        <div className="map-cap">
          <div className="path">{l.path ? l.path.join("  →  ") : "No path yet. The crew keeps looking as your network grows."}</div>
          <div className="cypher">{`MATCH p=(f:Founder)-[:member_of|works_at|previously_employed_at* SHORTEST 1..6]-(b:Person {name:'${l.buyer}'}) RETURN p`}</div>
        </div>
      </div>
    </>
  );
}
