"use client";
import { useEffect, useRef } from "react";

const ITEMS: [string, number, string, string, number, string][] = [
  ["i-moon", 56, "6%", "16%", 0.5, "var(--lav)"], ["i-star", 18, "24%", "9%", 0.9, "var(--gold)"], ["i-cloud", 104, "80%", "12%", 0.35, "var(--ink-3)"],
  ["i-star", 14, "90%", "44%", 1.1, "var(--rose)"], ["i-spark", 26, "4%", "74%", 0.7, "var(--gold)"], ["i-cloud", 86, "16%", "90%", 0.4, "var(--ink-3)"],
  ["i-moon", 40, "93%", "82%", 0.6, "var(--gold)"], ["i-star", 12, "52%", "5%", 1.3, "var(--lav)"],
];

/** Doodle sky, watercolor washes and paper grain with pointer parallax. */
export default function Sky() {
  const sky = useRef<HTMLDivElement>(null);
  const washes = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5;
      sky.current?.querySelectorAll<SVGElement>("svg").forEach((s, i) => { const d = ITEMS[i][4]; s.style.transform = `translate(${-dx * 36 * d}px,${-dy * 26 * d}px)`; });
      washes.current?.querySelectorAll<HTMLDivElement>(".wash").forEach((w, i) => { w.style.transform = `translate(${dx * (i + 1) * 12}px,${dy * (i + 1) * 9}px)`; });
    };
    addEventListener("pointermove", onMove);
    return () => removeEventListener("pointermove", onMove);
  }, []);
  return (
    <>
      <div className="washes" ref={washes}><div className="wash w1" /><div className="wash w2" /><div className="wash w3" /><div className="wash w4" /></div>
      <div className="sky" ref={sky}>
        {ITEMS.map(([id, w, x, y, , c], i) => (
          <svg key={i} width={w} height={id === "i-cloud" ? w / 2 : w} className="doodle" style={{ left: x, top: y, color: c, opacity: 0.6 }}><use href={`#${id}`} /></svg>
        ))}
      </div>
      <div className="grain" />
    </>
  );
}
