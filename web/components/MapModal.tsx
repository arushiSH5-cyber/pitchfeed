"use client";
import { useApp } from "@/lib/store";
import Constellation from "./Constellation";
import Overlay from "./Overlay";

export default function MapModal() {
  const lead = useApp((s) => s.leads.find((l) => l.id === s.mapId));
  const openMap = useApp((s) => s.openMap);
  return (
    <Overlay open={!!lead} onClose={() => openMap(null)} className="map-sheet">
      <h3>{lead ? `Your path to ${lead.buyer}` : "Your warm path"}</h3>
      <div className="muted" style={{ fontSize: 13.5 }}>Drag to spin. Gold is the shortest path from you to the buyer.</div>
      <div className="map-box">
        {lead && <Constellation focus={lead.id} />}
        <div className="map-cap"><div className="path">{lead?.path?.join("  →  ")}</div></div>
      </div>
    </Overlay>
  );
}
