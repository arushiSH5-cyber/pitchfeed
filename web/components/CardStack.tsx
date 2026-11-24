"use client";
import { useEffect, useRef, useState } from "react";
import { tempIcon, tempLabel, type Lead } from "@/lib/demo-data";
import { pending, useApp } from "@/lib/store";
import { Char, Icon } from "./Sprites";

const CHECKS = (l: Lead) => ["Names the organization", "Built on a verified signal", "Every claim has a source", "No hype or guarantees", "Links are safe", `Length, ${l.body.split(/\s+/).length} words`, "Ends with a question"];

function CardFaces({ l, onFlip }: { l: Lead; onFlip: () => void }) {
  const C = 2 * Math.PI * 24, s = l.signals[0];
  const openMap = useApp((st) => st.openMap);
  return (
    <div className="card-inner">
      <div className="face front">
        <div className="stamp send">SEND</div><div className="stamp skip">SKIP</div><div className="stamp edit">EDIT</div>
        <div className="c-top">
          <div><h3>{l.company}</h3><div className="sub">{l.industry} · {l.size}</div></div>
          <div className="score">
            <svg viewBox="0 0 58 58">
              <circle cx="29" cy="29" r="24" fill="none" stroke="#EADFD0" strokeWidth="4.5" />
              <circle cx="29" cy="29" r="24" fill="none" stroke={l.tier === "A" ? "#D39C4A" : "#A39D7B"} strokeWidth="4.5" strokeLinecap="round" strokeDasharray={`${(C * l.score) / 100} ${C}`} transform="rotate(-90 29 29)" />
            </svg>
            <b>{l.score}</b><span className={`tier ${l.tier}`}>{l.tier}</span>
          </div>
        </div>
        <div className="c-tags">
          <span className={`chip ${l.temp === "hot" ? "gold" : "rose"}`}><Icon id={tempIcon(l.temp)} size={13} />{tempLabel(l)}</span>
          <span className="chip">{l.signals.length} verified signal{l.signals.length > 1 ? "s" : ""}</span>
        </div>
        <div className="why"><div className="label">Why now</div><blockquote>“{s.q}”</blockquote><div className="src"><Icon id="i-link" size={13} />{s.src} · {s.days}d ago</div></div>
        {l.path ? (
          <div className="warm"><span>Warm intro via <b>{l.via}</b></span><button onClick={() => openMap(l.id)}><Icon id="i-constel" size={15} />path</button></div>
        ) : (
          <div className="warm" style={{ borderColor: "var(--line-2)", background: "transparent", color: "var(--ink-3)" }}>No warm path yet. This one is a cold intro.</div>
        )}
        <div className="draft"><div className="subj">{l.subject}</div><p>{l.body}</p></div>
        <div className="c-foot"><span>To {l.buyer}</span><button onClick={onFlip}><Icon id="i-flip" size={15} />Receipt</button></div>
      </div>
      <div className="face back"><div className="receipt">
        <div className="r-head"><h4>Proof receipt</h4><small>{l.company.toUpperCase()} · {new Date().toLocaleDateString()}</small></div>
        <div className="r-sec"><h5>CLAIMS IN THIS MESSAGE</h5><div className="r-claim">“{s.q}”</div>
          <div className="r-line"><span>{s.src}</span><span className="dots" /><span className="ok">verified</span></div>
          {l.path && <div className="r-line"><span>Connection: {l.path[2]}</span><span className="dots" /><span className="ok">in graph</span></div>}
        </div>
        <div className="r-sec"><h5>CHECKS</h5>{CHECKS(l).map((a) => <div className="r-line" key={a}><span>{a}</span><span className="dots" /><span className="ok">pass</span></div>)}</div>
        <div className="r-sec"><h5>CREW SIGN-OFF</h5>
          <div className="r-line"><span>Reviewer</span><span className="dots" /><span>approve</span></div>
          <div className="r-line"><span>Security</span><span className="dots" /><span>clear</span></div>
        </div>
        <div className="r-sec" style={{ border: 0 }}>
          <div className="r-line"><span>Graph query</span><span className="dots" /><span>0.1</span></div>
          <div className="r-line"><span>Find verified email</span><span className="dots" /><span>5.0</span></div>
          <div className="r-line"><span>Send message</span><span className="dots" /><span>1.0</span></div>
          <div className="r-total"><span>TOTAL CREDITS</span><span>6.1</span></div>
        </div>
        <div style={{ marginTop: "auto", paddingTop: 6, textAlign: "center" }}><button className="faint" style={{ fontSize: 12.5, fontWeight: 600 }} onClick={onFlip}>Flip back</button></div>
      </div></div>
    </div>
  );
}

const base = (d: number) => `translateZ(${-d * 70}px) translateY(${d * 40}px) rotateX(${-d * 3}deg)`;

export default function CardStack() {
  const leads = useApp((s) => s.leads);
  const discovering = useApp((s) => s.discovering);
  const { approve, skip, openEdit, go, registerFlyOut } = useApp.getState();
  const p = pending(leads);
  const top = p[0];
  const topRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState<string | null>(null);
  const drag = useRef({ sx: 0, sy: 0, dx: 0, dy: 0, down: false });

  const stamps = (send: number, skp: number, edit: number) => {
    const c = topRef.current; if (!c) return;
    (c.querySelector(".stamp.send") as HTMLElement).style.opacity = String(send);
    (c.querySelector(".stamp.skip") as HTMLElement).style.opacity = String(skp);
    (c.querySelector(".stamp.edit") as HTMLElement).style.opacity = String(edit);
  };
  const reset = () => { const c = topRef.current; if (c) { c.style.transform = base(0); stamps(0, 0, 0); } };

  useEffect(() => {
    registerFlyOut((dir) => {
      const c = topRef.current; if (!c) return;
      c.style.transition = "transform .55s cubic-bezier(.4,.1,.6,1),opacity .5s";
      c.style.transform = `translate3d(${dir * 140}%,-10%,120px) rotateY(${dir * 35}deg) rotateZ(${dir * 18}deg)`;
      c.style.opacity = "0";
    });
    return () => registerFlyOut(null);
  }, [registerFlyOut]);

  const act = {
    send: () => { if (!top) return; approve(top.id); if (useApp.getState().creditOpen) reset(); },
    skip: () => top && skip(top.id),
    edit: () => { if (top) { reset(); openEdit(top.id); } },
    flip: () => top && setFlipped((f) => (f === top.id ? null : top.id)),
  };
  const actRef = useRef(act); actRef.current = act;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useApp.getState();
      if (s.screen !== "app" || s.view !== "feed" || s.editId || s.mapId || s.creditOpen || s.wrappedOpen) return;
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight") actRef.current.send();
      if (e.key === "ArrowLeft") actRef.current.skip();
      if (e.key === "ArrowUp") { e.preventDefault(); actRef.current.edit(); }
      if (e.key === " ") { e.preventDefault(); actRef.current.flip(); }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, down: true };
    topRef.current?.classList.add("dragging");
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d.down || !topRef.current) return;
    d.dx = e.clientX - d.sx; d.dy = e.clientY - d.sy;
    topRef.current.style.transform = `translate3d(${d.dx}px,${d.dy}px,40px) rotateY(${d.dx * 0.06}deg) rotateZ(${d.dx * 0.04}deg) rotateX(${-d.dy * 0.05}deg)`;
    stamps(Math.max(0, d.dx / 120), Math.max(0, -d.dx / 120), Math.max(0, -d.dy / 120 - Math.abs(d.dx) / 200));
  };
  const onUp = () => {
    const d = drag.current; if (!d.down) return; d.down = false;
    topRef.current?.classList.remove("dragging");
    if (d.dx > 120) act.send(); else if (d.dx < -120) act.skip(); else if (d.dy < -110) act.edit(); else reset();
  };

  return (
    <div className="feed-col">
      <div className="stack" id="stack">
        {discovering ? (
          <div className="empty">
            <Char id="c-builder" width={120} />
            <h3>Searching the web…</h3><p className="muted">The crew is finding real organizations and re-checking every quote against its source page. About a minute.</p>
          </div>
        ) : !p.length ? (
          <div className="empty">
            <Char id="c-builder" width={120} />
            <h3>All caught up</h3><p className="muted">The crew is watching for new signals. Check Live signals or your pipeline.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => go("signals")}>Live signals</button>
              <button className="btn btn-ink btn-sm" onClick={() => go("pipeline")}>Pipeline</button>
            </div>
          </div>
        ) : (
          p.slice(0, 3).reverse().map((l, ri, arr) => {
            const d = arr.length - 1 - ri;
            return (
              <div key={l.id} ref={d ? undefined : topRef} className={`card${flipped === l.id ? " flipped" : ""}`} data-id={l.id}
                style={{ transform: base(d), opacity: d > 1 ? 0.5 : d ? 0.85 : 1 }}
                onPointerDown={d ? undefined : onDown} onPointerMove={d ? undefined : onMove} onPointerUp={d ? undefined : onUp}>
                <CardFaces l={l} onFlip={() => setFlipped((f) => (f === l.id ? null : l.id))} />
              </div>
            );
          })
        )}
      </div>
      <div className="actions" id="actions" style={{ visibility: p.length ? "visible" : "hidden" }}>
        <div className="act"><button title="Skip" onClick={act.skip}><Icon id="i-x" size={22} style={{ color: "var(--rose)" }} /></button>skip</div>
        <div className="act"><button title="Edit" onClick={act.edit}><Icon id="i-pencil" size={20} style={{ color: "var(--gold)" }} /></button>edit</div>
        <div className="act big"><button title="Approve and send" onClick={act.send}><Icon id="i-check" size={26} style={{ color: "var(--surface)" }} /></button>approve</div>
        <div className="act"><button title="Receipt" onClick={act.flip}><Icon id="i-flip" size={20} /></button>receipt</div>
      </div>
    </div>
  );
}
