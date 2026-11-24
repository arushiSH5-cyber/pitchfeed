"use client";
import { useEffect, useState } from "react";
import { HYPE, type Lead } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import Overlay from "./Overlay";
import { Icon } from "./Sprites";

// [label, ok, hard] — any failed hard check blocks the send.
export function checks(t: string, l: Lead): [string, boolean, boolean][] {
  const w = t.trim().split(/\s+/).filter(Boolean).length;
  return [
    ["Names the organization", t.toLowerCase().includes(l.company.split(" ")[0].toLowerCase()), true],
    ["Keeps the cited quote", t.includes(l.signals[0].q.slice(0, 28)), true],
    ["No hype or guarantees", !HYPE.some((h) => t.toLowerCase().includes(h)), true],
    ["No outside links", !/https?:\/\/(?!togather)/i.test(t), true],
    [`Short (${w} words)`, w >= 40 && w <= 130, false],
    ["Ends with a question", t.slice(-220).includes("?"), false],
  ];
}

export default function EditSheet() {
  const editId = useApp((s) => s.editId);
  const lead = useApp((s) => s.leads.find((l) => l.id === s.editId));
  const { openEdit, updateBody, approve, showToast, say } = useApp.getState();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (lead) setText(lead.body); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [editId]);
  const cs = lead ? checks(text, lead) : [];
  const bad = cs.some(([, ok, h]) => h && !ok);

  const redraft = async () => {
    if (!lead) return;
    setBusy(true);
    try {
      const r = await fetch("/api/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lead }) });
      const j = await r.json();
      setText(j.body);
      say("Builder", `Redrafted ${lead.company} from its cited signal only${j.mode === "live" ? (j.provider === "gemini" ? " (Gemini)" : " (Claude)") : " (demo draft)"}.`);
    } catch { showToast("Redraft unavailable, kept your text"); }
    setBusy(false);
  };

  return (
    <Overlay open={!!lead} onClose={() => openEdit(null)} className="">
      <h3>Edit before sending</h3>
      <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Checks update as you type. Anything risky blocks the send.</div>
      <textarea id="editText" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
      <div className="checks" id="editChecks">
        {cs.map(([a, ok, h]) => (
          <div key={a}><Icon id={ok ? "i-check" : "i-x"} size={15} style={{ color: ok ? "#4E7A5C" : h ? "#B5524C" : "#C08A3E" }} />{a}</div>
        ))}
      </div>
      <div className="sheet-foot">
        <span className="faint" style={{ fontSize: 12.5 }}>{bad ? "Fix the red checks to send." : "Reviewer is happy with this."}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={redraft} disabled={busy}><Icon id="i-spark" size={15} style={{ color: "var(--gold)" }} />{busy ? "Redrafting…" : "Redraft from signal"}</button>
          <button className="btn btn-ink" disabled={bad} onClick={() => { if (!lead) return; updateBody(lead.id, text); openEdit(null); approve(lead.id, true); }}>Approve and send</button>
        </div>
      </div>
    </Overlay>
  );
}
