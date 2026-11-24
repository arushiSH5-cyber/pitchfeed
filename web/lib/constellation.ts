// 3D constellation canvas, ported from pitchfeed-v2.html. Draws the warm-path graph.
import type { Lead } from "./demo-data";

type N = { id: string; kind: string; x: number; y: number; z: number };
const ORGS = ["Bayview State", "LaunchLab", "Campus Union", "Code Commons"];

export function createConstellation(canvas: HTMLCanvasElement, leads: Lead[], opts: { reveal?: boolean } = {}) {
  const ctx = canvas.getContext("2d")!;
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0, rotY = 0, rotX = -0.28, raf = 0, alive = true;
  let drag: number[] | null = null, highlight: string | null = null;
  const t0 = performance.now();
  let reveal = opts.reveal ? 0 : 1;
  const nodes: N[] = [], edges: [string, string][] = [], idx: Record<string, number> = {};
  const add = (id: string, kind: string, p: number[]) => { if (idx[id] == null) { idx[id] = nodes.length; nodes.push({ id, kind, x: p[0], y: p[1], z: p[2] }); } };
  const orgOf = (l: Lead) => ORGS.find((o) => l.path![1].startsWith(o.split(" ")[0]))!;

  add("You", "sun", [0, 0, 0]);
  ORGS.forEach((o, i) => { const a = (i / ORGS.length) * Math.PI * 2; add(o, "org", [Math.cos(a) * 120, i % 2 ? -40 : 50, Math.sin(a) * 120]); edges.push(["You", o]); });
  leads.forEach((l, i) => {
    const a = (i / leads.length) * Math.PI * 2 + 0.6, r = 250;
    add(l.company, "co", [Math.cos(a) * r, i % 2 ? 70 : -60, Math.sin(a) * r]);
    add(l.buyer, "buyer", [Math.cos(a + 0.18) * (r + 70), i % 2 ? 110 : -100, Math.sin(a + 0.18) * (r + 70)]);
    edges.push([l.buyer, l.company]);
    if (l.path) { const c = l.path[2]; add(c, "person", [Math.cos(a - 0.2) * 185, i % 2 ? 20 : -10, Math.sin(a - 0.2) * 185]); edges.push([orgOf(l), c], [c, l.company]); }
  });
  const dust = [...Array(70)].map(() => [(Math.random() - 0.5) * 900, (Math.random() - 0.5) * 600, (Math.random() - 0.5) * 900, Math.random()]);

  function resize() { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  function P(x: number, y: number, z: number) {
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    const X = x * cy - z * sy; let Z = x * sy + z * cy; const Y = y * cx - Z * sx; Z = y * sx + Z * cx;
    const f = 900 / (900 + Z + 200), s = Math.min(W, H) / 440;
    return [W / 2 + X * f * s, H / 2 + Y * f * s, f, Z];
  }
  const pathIds = () => { const l = leads.find((x) => x.id === highlight); if (!l || !l.path) return null; return ["You", orgOf(l), l.path[2], l.company, l.buyer]; };
  function star(x: number, y: number, r: number, c: string) { ctx.fillStyle = c; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, rr = i % 2 ? r * 0.32 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
  function sun(x: number, y: number, r: number, t: number) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.0003); ctx.strokeStyle = "#D39C4A"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35); ctx.lineTo(Math.cos(a) * r * (i % 2 ? 1.7 : 1.95), Math.sin(a) * r * (i % 2 ? 1.7 : 1.95)); ctx.stroke(); }
    ctx.restore();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r); g.addColorStop(0, "#FBE3A8"); g.addColorStop(1, "#E0AA55");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.strokeStyle = "#2B3555"; ctx.lineWidth = 1.4; ctx.stroke();
  }
  function frame(t: number) {
    if (!alive) return;
    if (!W) resize();
    if (!W) { raf = requestAnimationFrame(frame); return; }
    ctx.clearRect(0, 0, W, H);
    if (!drag) rotY += 0.002;
    if (reveal < 1) reveal = Math.min(1, (t - t0) / 3200);
    dust.forEach(([x, y, z, b]) => { const [px, py, f] = P(x, y, z); ctx.globalAlpha = 0.25 * b * f; star(px, py, 2.2 * f, "#8F95A8"); });
    ctx.globalAlpha = 1;
    const Pp = nodes.map((n) => P(n.x, n.y, n.z)), hp = pathIds(), hs = new Set<string>();
    if (hp) for (let i = 0; i < hp.length - 1; i++) { hs.add(hp[i] + "|" + hp[i + 1]); hs.add(hp[i + 1] + "|" + hp[i]); }
    edges.slice(0, Math.ceil(edges.length * reveal)).forEach(([a, b]) => {
      const A = Pp[idx[a]], B = Pp[idx[b]]; if (!A || !B) return; const on = hs.has(a + "|" + b);
      ctx.strokeStyle = on ? "#D39C4A" : "rgba(43,53,85,.22)"; ctx.lineWidth = on ? 2.6 : 1; ctx.setLineDash(on ? [] : [3, 5]);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo((A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 14, B[0], B[1]); ctx.stroke();
    });
    ctx.setLineDash([]);
    if (hp) { const k = ((t / 1400) % 1) * (hp.length - 1), i = Math.floor(k), f = k - i, A = Pp[idx[hp[i]]], B = Pp[idx[hp[i + 1]]]; if (A && B) star(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, 7, "#D4888A"); }
    nodes.map((_, i) => i).sort((a, b) => Pp[b][3] - Pp[a][3]).forEach((i) => {
      const n = nodes[i], [x, y, f] = Pp[i]; if (i / nodes.length > reveal + 0.05) return; const on = !!hp && hp.includes(n.id);
      if (n.kind === "sun") sun(x, y, 13 * f, t);
      else if (n.kind === "org") { ctx.fillStyle = "#E6E6F4"; ctx.strokeStyle = "#2B3555"; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(x, y, 8 * f, 0, 7); ctx.fill(); ctx.stroke(); }
      else if (n.kind === "co") { ctx.fillStyle = on ? "#F3E0BC" : "#FCFAF6"; ctx.strokeStyle = "#2B3555"; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.roundRect(x - 9 * f, y - 9 * f, 18 * f, 18 * f, 5 * f); ctx.fill(); ctx.stroke(); }
      else star(x, y, (on ? 11 : 8) * f, on ? "#D39C4A" : n.kind === "buyer" ? "#D4888A" : "#5A6380");
      if (on || n.kind === "sun" || n.kind === "org" || (n.kind !== "person" && f > 0.95)) {
        ctx.font = `${on ? 600 : 500} ${Math.round(12 * f)}px DM Sans,system-ui`; ctx.fillStyle = on ? "#2B3555" : "rgba(43,53,85,.6)"; ctx.textAlign = "center";
        ctx.fillText(n.id, x, y + (n.kind === "sun" ? 34 : 22) * f);
      }
    });
    raf = requestAnimationFrame(frame);
  }
  const down = (e: PointerEvent) => { drag = [e.clientX, e.clientY, rotY, rotX]; canvas.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => { if (drag) { rotY = drag[2] + (e.clientX - drag[0]) * 0.008; rotX = Math.max(-1, Math.min(1, drag[3] + (e.clientY - drag[1]) * 0.006)); } };
  const up = () => { drag = null; };
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerup", up);
  window.addEventListener("resize", resize);
  raf = requestAnimationFrame(frame);
  return {
    focus(id: string | null) { highlight = id; },
    resize,
    destroy() { alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); },
  };
}
