"use client";
import { HIST, STAGES } from "@/lib/demo-data";
import { counts } from "@/lib/counts";
import { useApp } from "@/lib/store";
import { Char } from "./Sprites";

export default function Insights() {
  const leads = useApp((s) => s.leads);
  const logs = useApp((s) => s.logs);
  const credits = useApp((s) => s.credits);
  const setWrappedOpen = useApp((s) => s.setWrappedOpen);
  const c = counts(leads);
  const rr = c.contacted ? c.replied / c.contacted : 0;
  const spent = 20 + logs.filter((x) => x.cr > 0).reduce((a, x) => a + x.cr, 0) - credits;
  const meetings = leads.filter((l) => l.stage === "meeting").length;
  const kpis: [string, string | number, string][] = [
    ["Leads matched", c.matched, "all verified"], ["Messages sent", c.contacted, "100% approved by you"],
    ["Reply rate", Math.round(rr * 100) + "%", "cold email avg is about 5%"], ["Meetings", c.meeting, "booked from replies"],
    ["Credits per meeting", c.meeting ? (spent / Math.max(1, meetings || 1)).toFixed(1) : "--", "this session"],
  ];
  const cols = ["#E6E6F4", "#F3E0BC", "#F5DAD6", "#E2ECE4", "#EADFD0"];
  const ab = { Quote: [...HIST.ab.Quote], Question: [...HIST.ab.Question] };
  leads.forEach((l) => { if (l.status === "approved") { ab[l.variant][0]++; if (["replied", "meeting"].includes(l.stage)) ab[l.variant][1]++; } });
  const rA = ab.Quote[1] / ab.Quote[0], rB = ab.Question[1] / ab.Question[0];
  const you = HIST.by.you + logs.filter((x) => x.who === "You").length, crew = HIST.by.crew + logs.filter((x) => x.who !== "You").length, tot = you + crew, C = 2 * Math.PI * 30;
  const hb = (obj: Record<string, number[]>, col: string) => Object.entries(obj).map(([k, [s, r]]) => (
    <div className="hbar" key={k}><span>{k}</span><div className="track"><div className="fill" style={{ width: `${s ? (r / s) * 100 : 0}%`, background: col }} /></div><span className="num">{s ? Math.round((r / s) * 100) : 0}%</span></div>
  ));
  return (
    <>
      <div className="kpis">{kpis.map(([k, v, d]) => <div className="card-s kpi" key={k}><div className="label">{k}</div><div className="v">{v}</div><div className="d">{d}</div></div>)}</div>
      <div className="grid2">
        <div className="card-s box"><h4>Funnel</h4><div className="s">Includes 2 weeks of demo history plus this session.</div>
          <div className="funnel">
            {STAGES.map(([k, n], i) => (
              <div className="r" key={k}><span>{n}</span>
                <div className="track"><div className="fill" style={{ width: `${Math.max(6, (c[k] / c.matched) * 100)}%`, background: cols[i] }}>{c[k]}</div></div>
                <span className="num">{i ? Math.round((c[k] / c[STAGES[i - 1][0]]) * 100) + "%" : ""}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-s box"><h4>Opener split test</h4><div className="s">Which first line gets more replies.</div>
          <div className="ab">
            {([["Quote their words", ab.Quote, rA >= rB], ["Open with a question", ab.Question, rB > rA]] as [string, number[], boolean][]).map(([n, [s, r], w]) => (
              <div className={w ? "win" : ""} key={n}><span className="label">{n}</span><b>{Math.round((r / s) * 100)}%</b><span className="faint" style={{ fontSize: 12 }}>{r} replies / {s} sent{w ? " · leading" : ""}</span></div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}><h4 style={{ fontSize: 14 }}>Who moved leads</h4>
            <div className="donut">
              <svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="42" r="30" fill="none" stroke="#F3E0BC" strokeWidth="12" /><circle cx="42" cy="42" r="30" fill="none" stroke="#2B3555" strokeWidth="12" strokeDasharray={`${(C * you) / tot} ${C}`} transform="rotate(-90 42 42)" /></svg>
              <div style={{ display: "grid", gap: 6, fontSize: 12.5 }}>
                <span className="by"><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ink)" }} />You · {you} actions</span>
                <span className="by"><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--gold-soft)" }} />Crew · {crew} actions</span>
                <span className="faint">Sends are always yours.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid3">
        <div className="card-s box"><h4>Reply rate by industry</h4><div className="s">Out of contacted leads</div><div>{hb(HIST.ind, "var(--rose)")}</div></div>
        <div className="card-s box"><h4>Reply rate by tier</h4><div className="s">Does scoring work?</div><div>{hb(HIST.tier, "var(--gold)")}<div className="faint" style={{ fontSize: 12, marginTop: 8 }}>Tier A replies about 2x more than B, so scoring is pulling its weight.</div></div></div>
        <div className="card-s box" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "var(--rose-soft)", borderColor: "transparent" }}>
          <div><h4>Founder Wrapped</h4><div className="s" style={{ color: "var(--ink-2)" }}>Your week as a 3D story. Good for the team channel.</div></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}><Char id="c-you" width={84} /><button className="btn btn-ink btn-sm" onClick={() => setWrappedOpen(true)}>Play your week</button></div>
        </div>
      </div>
    </>
  );
}
