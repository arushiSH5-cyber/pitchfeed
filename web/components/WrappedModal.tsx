"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import Overlay from "./Overlay";
import { Char, Icon } from "./Sprites";

const COLS = ["#F5DAD6", "#E6E6F4", "#F3E0BC", "#E2ECE4", "#F4E1CC"];

export default function WrappedModal() {
  const open = useApp((s) => s.wrappedOpen);
  const leads = useApp((s) => s.leads);
  const setWrappedOpen = useApp((s) => s.setWrappedOpen);
  const [a, setA] = useState(0);
  useEffect(() => { if (open) setA(0); }, [open]);
  const sent = leads.filter((l) => l.status === "approved").length;
  const cards: [string, string | number, string, string][] = [
    ["Leads found", leads.length + 2, "2 dropped because the facts didn't check out or they weren't a fit.", "c-builder"],
    ["You approved", sent, sent ? "Every send had your sign-off." : "Swipe right to send your first.", "c-you"],
    ["Warm paths", leads.filter((l) => l.path).length, "People you already know who can introduce you.", "c-planner"],
    ["Best opener", "Quote", "Opening with their own words beats opening with a question.", "c-reviewer"],
    ["Hours saved", ((leads.length * 25) / 60).toFixed(1), "About 25 minutes of research per lead, done by the crew.", "c-security"],
  ];
  return (
    <Overlay open={open} onClose={() => setWrappedOpen(false)} className="wrap-sheet">
      <span className="label">This week</span><h3>Founder Wrapped</h3>
      <div className="ring-wrap">
        <div className="ring3d" style={{ transform: a ? `rotateY(${a}deg)` : "" }}>
          {cards.map(([k, v, d, ch], i) => (
            <div key={k} className="wcard" style={{ background: COLS[i], transform: `rotateY(${i * 72}deg) translateZ(240px)` }}>
              <div><div className="k">{k}</div><div className="v">{v}</div></div>
              <Char id={ch} width={90} style={{ alignSelf: "flex-end" }} />
              <div className="c">{d}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
        <button className="icon-btn" onClick={() => setA(a + 72)}><Icon id="i-arrowL" size={18} /></button>
        <span className="faint" style={{ fontSize: 12.5 }}>spin through your week</span>
        <button className="icon-btn" onClick={() => setA(a - 72)}><Icon id="i-arrowR" size={18} /></button>
      </div>
    </Overlay>
  );
}
