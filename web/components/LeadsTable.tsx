"use client";
import { useState } from "react";
import { STAGES, tempIcon } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import { Icon } from "./Sprites";

type F = "all" | "A" | "hot" | "warm";

export default function LeadsTable() {
  const leads = useApp((s) => s.leads);
  const showToast = useApp((s) => s.showToast);
  const [f, setF] = useState<F>("all");
  const rows = leads.filter((l) => f === "all" || (f === "A" && l.tier === "A") || (f === "hot" && l.temp === "hot") || (f === "warm" && l.path));
  const csv = () => {
    const h = "company,contact,title,score,tier,freshness_days,top_signal,source,warm_intro,stage\n";
    const b = leads.map((l) => [l.company, l.buyer, l.title, l.score, l.tier, l.days, l.signals[0].t, l.signals[0].src, l.path ? l.path[2] : "", l.stage].map((v) => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([h + b], { type: "text/csv" }));
    a.download = "pitchfeed-leads.csv"; a.click();
    showToast("Exported pitchfeed-leads.csv");
  };
  return (
    <>
      <div className="toolbar">
        <div className="filters">
          {([["all", "All"], ["A", "Tier A"], ["hot", "Hot"], ["warm", "Has warm intro"]] as [F, string][]).map(([k, t]) => (
            <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{t}</button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={csv}><Icon id="i-download" size={15} />Export CSV</button>
      </div>
      <div className="card-s tbl"><table>
        <thead><tr><th>Organization</th><th>Contact</th><th>Score</th><th>Freshness</th><th>Top signal</th><th>Email</th><th>Warm intro</th><th>Stage</th></tr></thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id}>
              <td><div className="co">{l.company}</div><div className="mini">{l.industry}</div></td>
              <td>{l.buyer}<div className="mini">{l.title}</div></td>
              <td><span className={`tier ${l.tier}`}>{l.tier}</span><span className="mono" style={{ marginLeft: 8 }}>{l.score}</span></td>
              <td><span className="vb"><Icon id={tempIcon(l.temp)} size={15} style={{ color: l.temp === "hot" ? "var(--gold)" : "var(--rose)" }} />{l.temp}, {l.days}d</span></td>
              <td>{l.signals[0].t}<div className="mini">{l.signals.length} verified</div></td>
              <td><span className="vb"><Icon id={l.status === "approved" ? "i-check" : "i-mail"} size={14} style={{ color: l.status === "approved" ? "#4E7A5C" : "var(--ink-3)" }} />{l.status === "approved" ? l.email : "on approve"}</span></td>
              <td>{l.path ? <span className="chip gold">{l.path[2]}</span> : <span className="mini">none</span>}</td>
              <td><span className={`chip ${l.stage === "contacted" ? "lav" : ["replied", "meeting"].includes(l.stage) ? "sage" : ""}`}>{STAGES.find((s) => s[0] === l.stage)![1]}</span></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </>
  );
}
