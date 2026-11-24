"use client";
import { useState } from "react";
import { RULES, type Row } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import OnbTop from "./OnbTop";
import { Char, Icon } from "./Sprites";

const Conf = ({ rows }: { rows: Row[] }) => (
  <>
    {rows.map(([a, b, c]) => (
      <div className="conf-row" key={a}>
        <div>{a}{b ? <small>{b}</small> : null}</div>
        <div className="bar"><i style={{ width: `${c * 100}%` }} /></div>
        <div className="num">{c.toFixed(2)}</div>
      </div>
    ))}
  </>
);

const Panel = ({ ic, t, cls = "", children }: { ic: string; t: string; cls?: string; children: React.ReactNode }) => (
  <div className={`panel card-s ${cls}`}>
    <h3><Icon id={ic} size={20} className="doodle" style={{ color: "var(--gold)" }} />{t}</h3>
    {children}
  </div>
);

export default function IcpReview({ onGo }: { onGo: () => void }) {
  const icp = useApp((s) => s.icp);
  const live = useApp((s) => s.icpSource);
  const [exp, setExp] = useState<Record<number, "accepted" | "dismissed">>({});
  return (
    <section className="screen onb on" id="icp">
      <OnbTop step={2} />
      <div className="onb-body"><div className="icp-wrap">
        <div className="icp-head">
          <div><span className="label">Inferred from your product{live !== "demo" ? ` · live from ${live === "gemini" ? "Gemini" : "Claude"}` : ""}</span><h2>Here&apos;s who we think you should talk to</h2></div>
          <p>Bars show how confident the crew is. Tweak anything, add the ideas you like, then we&apos;ll find real organizations.</p>
        </div>
        <div className="icp-grid" id="icpGrid">
          <Panel ic="i-board" t="Industries"><Conf rows={icp.industries} /></Panel>
          <Panel ic="i-grid" t="Size and region"><Conf rows={icp.size} /></Panel>
          <Panel ic="i-hand" t="Who to talk to"><Conf rows={icp.personas} /></Panel>
          <Panel ic="i-sun" t="Moments that matter" cls="span2"><Conf rows={icp.triggers} /></Panel>
          <Panel ic="i-shield" t="Rule-outs"><Conf rows={icp.negatives} /></Panel>
          <Panel ic="i-mail" t="Messaging rules per persona" cls="span2">
            <div className="rules">
              {RULES.map(([p, tone, len, cta]) => (
                <div className="rule" key={p}><b>{p}</b>
                  <div className="kv"><span>Tone</span><span>{tone}</span></div>
                  <div className="kv"><span>Max length</span><span>{len}</span></div>
                  <div className="kv"><span>Ask</span><span>{cta}</span></div>
                </div>
              ))}
            </div>
          </Panel>
          <div className="panel card-s" style={{ background: "var(--sage-soft)", borderColor: "transparent", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div><h3>Grounded, not guessed</h3><div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>Built from your description, pricing and pilot customer. Low-confidence fields get re-checked after the first replies come in.</div></div>
            <Char id="c-reviewer" width={74} style={{ alignSelf: "flex-end" }} />
          </div>
        </div>
        <div style={{ marginTop: 20 }}><span className="label">Adjacent segments worth testing</span>
          <div className="exp-list" id="expList">
            {icp.expansions.map(([t, w, c], i) => (
              <div className={`exp ${exp[i] || ""}`} key={t}>
                <h4>{t}</h4><p>{w}</p>
                <div className="foot">
                  <div style={{ display: "flex", gap: 6 }} className="acts">
                    {exp[i] ? (
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: exp[i] === "accepted" ? "#3D5A46" : "var(--ink-3)" }}>{exp[i] === "accepted" ? "Added to profile" : "Skipped"}</span>
                    ) : (
                      <>
                        <button className="btn btn-ink btn-sm" onClick={() => setExp({ ...exp, [i]: "accepted" })}>Add</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setExp({ ...exp, [i]: "dismissed" })}>Skip</button>
                      </>
                    )}
                  </div>
                  <span className="num">{c.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="icp-cta"><span className="faint" style={{ fontSize: 12.5 }}>Finding leads uses about 0.1 credits per organization checked.</span>
          <button className="btn btn-ink" id="icpGo" onClick={onGo}>Approve profile and find leads <Icon id="i-arrowR" size={16} /></button></div>
      </div></div>
    </section>
  );
}
