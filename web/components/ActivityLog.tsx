"use client";
import { CREW_AV } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import { Char } from "./Sprites";

export default function ActivityLog() {
  const logs = useApp((s) => s.logs);
  return (
    <>
      <div className="toolbar"><span className="faint" style={{ fontSize: 12.5 }}>Every action, with who did it and what it cost. Required for trust, and for the judges.</span></div>
      <div className="card-s tbl"><table>
        <thead><tr><th style={{ width: 110 }}>Time</th><th style={{ width: 150 }}>Who</th><th>Action</th><th style={{ width: 220 }}>Target</th><th style={{ width: 90, textAlign: "right" }}>Credits</th></tr></thead>
        <tbody>
          {logs.map((x, i) => (
            <tr key={logs.length - i}>
              <td className="mono" style={{ fontSize: 12 }}>{x.t}</td>
              <td><span className="by"><Char id={CREW_AV[x.who] || "c-builder"} width={22} />{x.who}</span></td>
              <td>{x.action}</td><td className="muted">{x.target}</td>
              <td className="mono" style={{ textAlign: "right", color: x.cr < 0 ? "var(--ink)" : x.cr > 0 ? "#4E7A5C" : "var(--ink-3)" }}>{x.cr ? (x.cr > 0 ? "+" : "") + x.cr.toFixed(1) : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </>
  );
}
