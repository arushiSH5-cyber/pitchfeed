"use client";
import { useApp, type View } from "@/lib/store";
import { Icon } from "./Sprites";

export const PAGES: Record<View, [string, string]> = {
  feed: ["Your feed", "Swipe right to approve, left to skip, up to edit. Space flips to the receipt."],
  pipeline: ["Pipeline", "Drag cards between stages. Every move records who made it."],
  leads: ["All leads", "The same leads, spreadsheet style. Filter, sort, export."],
  signals: ["Live signals", "New reasons to reach out, found and verified as they happen."],
  network: ["Warm network", "Everyone between you and your buyers. Pick a lead to light up the shortest path."],
  market: ["Market", "Who else your buyers could choose, and why they'd pick you."],
  insights: ["Insights", "What's working, by stage, industry, tier and opener."],
  activity: ["Activity log", "A timestamped record of every action by you and the crew."],
  usage: ["Usage and billing", "Metered by Flexprice. You pay for leads, not seats."],
};

export default function Topbar() {
  const view = useApp((s) => s.view);
  const sent = useApp((s) => s.sentToday);
  const toggleCrew = useApp((s) => s.toggleCrew);
  return (
    <header className="topbar">
      <div><h1>{PAGES[view][0]}</h1><p>{PAGES[view][1]}</p></div>
      <div className="tb-right">
        <span className="demo-flag"><Icon id="i-shield" size={14} />Demo data, fictional organizations</span>
        <span className="sendcap" title="Daily send cap protects your domain"><Icon id="i-mail" size={15} />Sent today <b className="mono">{sent}</b>/20</span>
        <button className="icon-btn" title="Crew room" onClick={toggleCrew}><Icon id="i-chat" size={18} /></button>
      </div>
    </header>
  );
}
