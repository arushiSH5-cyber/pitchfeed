"use client";
import { pending, useApp, type View } from "@/lib/store";
import { Char, Icon } from "./Sprites";

const NAV: [string, [View, string, string][]][] = [
  ["Work", [["feed", "i-feed", "Feed"], ["pipeline", "i-board", "Pipeline"], ["leads", "i-grid", "All leads"]]],
  ["Intelligence", [["signals", "i-radar", "Live signals"], ["network", "i-constel", "Warm network"], ["market", "i-chess", "Market"]]],
  ["Reports", [["insights", "i-chart", "Insights"], ["activity", "i-list", "Activity log"], ["usage", "i-gauge", "Usage & billing"]]],
];

export default function Sidebar() {
  const view = useApp((s) => s.view);
  const go = useApp((s) => s.go);
  const credits = useApp((s) => s.credits);
  const product = useApp((s) => s.intake.product);
  const topUp = useApp((s) => s.topUp);
  const nFeed = useApp((s) => pending(s.leads).length);
  const n = Math.floor(credits / 6);
  return (
    <aside className="side">
      <div className="brand"><Icon id="i-plane" size={26} className="doodle" /><b>pitchfeed</b></div>
      <div className="ws"><div className="logo"><Icon id="i-spark" size={18} style={{ color: "#3D5A46" }} /></div><div><b>{product}</b><small>Volunteer coordination</small></div></div>
      <nav className="nav" id="nav">
        {NAV.map(([g, items]) => (
          <div className="nav-group" key={g}><div className="label">{g}</div>
            {items.map(([v, ic, t]) => (
              <a key={v} className={view === v ? "on" : ""} onClick={() => go(v)}>
                <Icon id={ic} size={18} />{t}
                {v === "feed" && nFeed > 0 && <span className="count">{nFeed}</span>}
                {v === "signals" && <span className="live" />}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <div className="side-foot">
        <div className="meter card-s">
          <div className="row"><span className="label">Credits</span><span className="faint mono" style={{ fontSize: 11 }}>Flexprice</span></div>
          <div className="row" style={{ marginTop: 4 }}><b id="credNum">{credits.toFixed(1)}</b><button className="btn btn-ghost btn-sm" onClick={topUp}>Top up</button></div>
          <div className="bar"><i style={{ width: `${Math.min(100, (credits / 20) * 100)}%`, background: credits < 6 ? "var(--rose)" : "var(--gold)" }} /></div>
          <div className="faint" style={{ fontSize: 11.5 }}>{n ? `About ${n} more approval${n > 1 ? "s" : ""}` : "Top up to keep sending"}</div>
        </div>
        <div className="me"><Char id="c-you" width={38} /><div><b>Arushi</b><small>Founder · that&apos;s you</small></div></div>
      </div>
    </aside>
  );
}
