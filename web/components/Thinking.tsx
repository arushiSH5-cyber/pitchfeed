"use client";
import { useEffect, useState } from "react";
import { CREW_AV } from "@/lib/demo-data";
import Constellation from "./Constellation";
import OnbTop from "./OnbTop";
import { Char, Icon } from "./Sprites";

const STEPS: [string, string][] = [
  ["Planner", "Reading what you built"], ["Builder", "Drafting your ideal customer"], ["Builder", "Searching public pages, job posts and press"],
  ["Reviewer", "Checking every quote against its source"], ["Security", "Screening links and personal data"], ["Builder", "Mapping who you already know"],
];

export default function Thinking({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = STEPS.map((_, i) => setTimeout(() => setDone(i + 1), 520 * (i + 1)));
    const end = setTimeout(onDone, 3900);
    return () => { t.forEach(clearTimeout); clearTimeout(end); };
  }, [onDone]);
  return (
    <section className="screen onb on" id="thinking">
      <OnbTop step={2} />
      <div className="onb-body">
        <Constellation reveal id="thinkCanvas" />
        <ul className="think-steps" id="thinkSteps">
          {STEPS.map(([a, s], i) => (
            <li key={i} className={i < done ? "done" : ""}>
              <Char id={CREW_AV[a]} width={26} />
              <span><b style={{ fontWeight: 600 }}>{a}</b> · {s}</span>
              <Icon id="i-check" size={16} className="tick" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
