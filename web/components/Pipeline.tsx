"use client";
import { useState } from "react";
import { STAGES, type Stage } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import { Icon } from "./Sprites";

export default function Pipeline() {
  const leads = useApp((s) => s.leads);
  const { moveLead, simulateReplies } = useApp.getState();
  const [over, setOver] = useState<Stage | null>(null);
  return (
    <>
      <div className="toolbar">
        <div className="filters">
          <span className="by faint" style={{ fontSize: 12.5, marginRight: 10 }}><Icon id="i-hand" size={15} />moved by you</span>
          <span className="by faint" style={{ fontSize: 12.5 }}><Icon id="i-spark" size={15} style={{ color: "var(--gold)" }} />moved by crew</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={simulateReplies}>Simulate replies (demo)</button>
      </div>
      <div className="board" id="board">
        {STAGES.map(([k, n]) => {
          const ls = leads.filter((l) => l.stage === k);
          return (
            <div key={k} className={`col${over === k ? " over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setOver(k); }} onDragLeave={() => setOver(null)}
              onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text"); if (id) moveLead(id, k); }}>
              <h4>{n}<span>{ls.length}</span></h4>
              {ls.map((l) => (
                <div key={l.id} className="kcard" draggable onDragStart={(e) => e.dataTransfer.setData("text", l.id)}>
                  <div className="n">{l.company}</div>
                  <div className="m">
                    <span className={`tier ${l.tier}`} style={{ width: 19, height: 19, fontSize: 10 }}>{l.tier}</span>
                    <span className="by">{l.by === "you" ? <><Icon id="i-hand" size={13} />you</> : <><Icon id="i-spark" size={13} style={{ color: "var(--gold)" }} />crew</>}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
