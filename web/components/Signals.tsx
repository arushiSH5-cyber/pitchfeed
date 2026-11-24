"use client";
import { sigIcon } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import { Char, Icon } from "./Sprites";

export default function Signals() {
  const leads = useApp((s) => s.leads);
  const incoming = useApp((s) => s.incoming);
  const shown = useApp((s) => s.signalsShown);
  const addSignal = useApp((s) => s.addSignal);
  const base = leads.filter((l) => !l.id.startsWith("n"));
  const blips = [...base.map(() => false), ...incoming.slice(0, shown).map(() => true)];
  const items = incoming.slice(0, shown).reverse();
  return (
    <div className="sig-wrap">
      <div>
        <div className="radar-wrap"><div className="radar" id="radar">
          <div className="ring" style={{ inset: "16%" }} /><div className="ring" style={{ inset: "33%" }} /><div className="ring" style={{ inset: "48%" }} /><div className="sweep" />
          {blips.map((isNew, i) => {
            const a = i * 2.1, d = 18 + ((i * 13) % 30);
            return <svg key={i} className="blip" viewBox="0 0 32 32" style={{ left: `${50 + Math.cos(a) * d}%`, top: `${50 + Math.sin(a) * d}%`, color: isNew ? "var(--rose)" : "var(--gold)" }}><use href="#i-star" /></svg>;
          })}
        </div></div>
        <div className="card-s box" style={{ marginTop: 10 }}><h4>Always watching</h4><div className="s" style={{ margin: 0 }}>The crew re-checks job boards, press pages and event posts for your ideal customer every few minutes. New matches show up here first, already verified.</div></div>
      </div>
      <div className="card-s">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 14px 10px", borderBottom: "1px solid var(--line)" }}>
          <b style={{ fontFamily: "var(--display)", fontWeight: 500, fontSize: 16 }}>Incoming</b>
          <span className="chip rose">{shown ? `${shown} new` : "listening"}</span>
        </div>
        <div>
          {items.map((s) => (
            <div className="feed-item" key={s.company}>
              <div className="ic" style={{ background: "var(--rose-soft)", color: "#8A3F3B" }}><Icon id={sigIcon(s.k)} size={16} /></div>
              <div><b>{s.company} · {s.t}</b><span className="qt">“{s.q}”</span><small>{s.src} · just now · verified</small></div>
              <div className="acts">{s.added ? <span className="chip sage">in feed</span> : <button className="btn btn-ink btn-sm" onClick={() => addSignal(s.company)}>Add to feed</button>}</div>
            </div>
          ))}
          <div className="feed-item" style={{ opacity: 0.75 }}>
            <div className="ic" style={{ background: "var(--surface-2)" }}><Char id="c-builder" width={26} /></div>
            <div><b>Watching for more</b><small>next check in a few minutes · job boards, press, event pages</small></div>
          </div>
        </div>
      </div>
    </div>
  );
}
