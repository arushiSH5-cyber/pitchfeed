"use client";
import { useEffect, useRef } from "react";
import { CREW_AV } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import { Char, Icon } from "./Sprites";

const hm = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function CrewRoom() {
  const msgs = useApp((s) => s.msgs);
  const open = useApp((s) => s.crewOpen);
  const schemaDecision = useApp((s) => s.schemaDecision);
  const box = useRef<HTMLDivElement>(null);
  const times = useRef<Record<number, string>>({});
  useEffect(() => { if (box.current) box.current.scrollTop = 1e6; }, [msgs]);
  return (
    <aside className={`crew card-s${open ? "" : " closed"}`} id="crew">
      <div className="crew-head">
        <div className="t"><h3>Crew room</h3><span className="band-tag"><Icon id="i-shield" size={13} />runs on Band</span></div>
        <div className="crew-faces">
          {["Planner", "Builder", "Reviewer", "Security"].map((a) => <div key={a}><Char id={CREW_AV[a]} />{a}</div>)}
        </div>
        <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>They research, draft and check. Only you can approve sends or schema changes.</div>
      </div>
      <div className="msgs" id="msgs" ref={box}>
        {msgs.map((m) => {
          const t = (times.current[m.id] ||= hm());
          return (
            <div key={m.id} className={`msg ${m.cls}${m.agent === "You" ? " human" : ""}`}>
              <Char id={CREW_AV[m.agent]} className="av" />
              <div className="bub">
                {m.typing ? (
                  <div className="typing"><i /><i /><i /></div>
                ) : (
                  <>
                    <div className="who">{m.agent}<time>{t}</time></div>
                    <span dangerouslySetInnerHTML={{ __html: m.html }} />
                    {m.ask === "schema" && (
                      <div className="ask">
                        <button className="btn btn-ink btn-sm" onClick={() => schemaDecision(m.id, true)}>Approve</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => schemaDecision(m.id, false)}>Not now</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
