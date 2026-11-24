"use client";
import { useApp } from "@/lib/store";
import Overlay from "./Overlay";
import { Char } from "./Sprites";

export default function CreditModal() {
  const open = useApp((s) => s.creditOpen);
  const credits = useApp((s) => s.credits);
  const { setCreditOpen, topUp } = useApp.getState();
  return (
    <Overlay open={open} onClose={() => setCreditOpen(false)} className="credit-sheet" closeBtn={false}>
      <Char id="c-security" width={104} />
      <h3>Out of credits</h3>
      <p>Finding a verified email costs 5 credits and sending costs 1. You have <b>{credits.toFixed(1)}</b> left, so Security paused enrichment until you top up.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn btn-ghost" onClick={() => setCreditOpen(false)}>Not now</button>
        <button className="btn btn-gold" onClick={topUp}>Add 30 credits</button>
      </div>
    </Overlay>
  );
}
