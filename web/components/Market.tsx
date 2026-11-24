import { COMPETITORS } from "@/lib/demo-data";
import { Char, Icon } from "./Sprites";

export default function Market() {
  return (
    <div className="grid2" style={{ gridTemplateColumns: "1fr 1.2fr" }}>
      <div className="card-s box">
        <h4>Positioning map</h4>
        <div className="s">Where volunteer tools sit today. Dots are sized by how often they show up in your prospects&apos; job posts and pages.</div>
        <svg viewBox="0 0 400 300" width="100%">
          <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 8 4 0 8" fill="none" stroke="#8F95A8" /></marker></defs>
          <path d="M40 260 H380 M40 260 V20" stroke="#8F95A8" strokeWidth="1.2" markerEnd="url(#ar)" fill="none" />
          <text x="380" y="282" textAnchor="end" fontSize="11" fill="#5A6380" fontFamily="DM Sans">more setup effort</text>
          <text x="18" y="22" fontSize="11" fill="#5A6380" fontFamily="DM Sans" transform="rotate(-90 18 22)" textAnchor="end">better for volunteers</text>
          <rect x="44" y="24" width="160" height="114" rx="14" fill="#E2ECE4" opacity=".6" />
          <text x="56" y="44" fill="#3D5A46" fontFamily="Caveat" style={{ fontSize: 17 }}>open space</text>
          {COMPETITORS.map((c) => {
            const x = 40 + c.x * 330, y = 260 - c.y * 230;
            return (
              <g key={c.name}>
                <circle cx={x} cy={y} r={c.r} fill={c.you ? "#D39C4A" : "#E6E6F4"} stroke="#2B3555" strokeWidth="1.4" />
                {c.you && <path transform={`translate(${x - 7} ${y - 7}) scale(.45)`} d="M16 3.5c1 6.5 2.6 10.6 12.5 12.5C18.6 17.9 17 22 16 28.5 15 22 13.4 17.9 3.5 16 13.4 14.1 15 10 16 3.5Z" fill="#fff" />}
                <text x={x + c.r + 6} y={y + 4} fontSize="12" fontWeight={c.you ? 700 : 500} fill="#2B3555" fontFamily="DM Sans">{c.name}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="market-grid">
        {COMPETITORS.filter((c) => !c.you).map((c) => (
          <div className="card-s comp" key={c.name}>
            <h4>{c.name}<span className="chip">{c.cat}</span></h4>
            <div className="kv"><span>Positioning</span><span>{c.pos}</span></div>
            <div className="kv"><span>Pricing</span><span>{c.price}</span></div>
            <div className="edge"><b>Where Togather wins:</b> {c.gap}</div>
            <div className="src"><Icon id="i-link" size={12} />demo summary, verify against their site before pitching</div>
          </div>
        ))}
        <div className="card-s comp" style={{ background: "var(--gold-soft)", borderColor: "transparent" }}>
          <h4>Your one-liner</h4>
          <div style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: 17, lineHeight: 1.4 }}>&quot;Spreadsheets are free but leak volunteers. Togather is free to start and gets people to actually show up.&quot;</div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}><Char id="c-planner" width={64} /></div>
        </div>
      </div>
    </div>
  );
}
