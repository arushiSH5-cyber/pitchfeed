"use client";
import { sigIcon } from "@/lib/demo-data";
import { pending, useApp } from "@/lib/store";
import { Icon } from "./Sprites";

export default function LeadBrief() {
  const l = useApp((s) => pending(s.leads)[0]);
  if (!l) return <div className="brief" id="brief" />;
  return (
    <div className="brief" id="brief">
      <div className="card-s">
        <h4>Contact<span className="chip sage"><Icon id="i-check" size={12} />verified on approve</span></h4>
        <div className="contact"><div className="avatar">{l.buyer.split(" ").map((x) => x[0]).join("")}</div><div><b>{l.buyer}</b><small>{l.title}</small></div></div>
        <div className="verify">
          <div><span><Icon id="i-mail" size={14} />{l.email || "Email lookup needs a Hunter key"}</span>{l.email && <span className="chip">MX ok</span>}</div>
          <div><span><Icon id="i-link" size={14} />{l.linkedin || "No LinkedIn found"}</span>{l.linkedin && <span className="chip">match</span>}</div>
          <div><span><Icon id="i-shield" size={14} />{l.signals[0].src.split("/")[0]}{l.email ? " · Bay Area HQ" : " · public source"}</span><span className="chip">domain ok</span></div>
        </div>
      </div>
      <div className="card-s">
        <h4>Signals<span className="faint" style={{ fontSize: 12, fontFamily: "var(--body)" }}>{l.signals.length} verified</span></h4>
        {l.signals.map((s) => (
          <div className="sig" key={s.t}><div className="ic"><Icon id={sigIcon(s.k)} size={15} /></div><div><b>{s.t}</b><small>{s.src} · {s.days}d</small></div></div>
        ))}
      </div>
      <div className="card-s">
        <h4>Sequence<span className="chip lav">opener: {l.variant}</span></h4>
        <div className="seq">
          <div className="seq-step"><b>Email 1<span>day 0</span></b><p>{l.subject}</p></div>
          <div className="seq-step"><b>Email 2<span>day 3</span></b><p>Short follow-up offering a free pilot on their next event.</p></div>
          <div className="seq-step"><b>LinkedIn note<span>day 5</span></b><p>Copy-to-clipboard task for you. We never auto-post.</p></div>
        </div>
      </div>
    </div>
  );
}
