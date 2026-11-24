import { NextResponse } from "next/server";
import { ICP, INTAKE, makeLeads, type ICPT, type Intake } from "@/lib/demo-data";
import { realPull } from "@/lib/discover";

export const maxDuration = 90;

const isCustom = (i: Partial<Intake>) => !!i.product && (i.product !== INTAKE.product || i.what !== INTAKE.what);

/**
 * Custom intake + GEMINI_API_KEY → real pull (web search + citation validation).
 * Otherwise ENGINE_URL → FastAPI engine. Otherwise demo leads. Never throws.
 */
export async function POST(req: Request) {
  const { intake = {}, icp = ICP } = (await req.json().catch(() => ({}))) as { intake?: Partial<Intake>; icp?: ICPT };

  if (isCustom(intake) && process.env.GEMINI_API_KEY) {
    try {
      const { leads, dropped } = await realPull({ ...INTAKE, ...intake }, icp);
      if (leads.length) return NextResponse.json({ mode: "live", source: "gemini-search", leads, dropped });
      return NextResponse.json({ mode: "demo", reason: `No candidate survived citation checks (${dropped.length} dropped)`, leads: makeLeads(), dropped });
    } catch (e) {
      console.error("[discover] live pull failed, using demo:", (e as Error).message);
      return NextResponse.json({ mode: "demo", reason: "Live search failed", leads: makeLeads(), dropped: [] });
    }
  }

  const base = process.env.ENGINE_URL;
  if (base) {
    try {
      const j = (p: string, body?: object) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) }).then((r) => { if (!r.ok) throw new Error(p + " " + r.status); return r.json(); });
      await j("/intake/demo");
      await j("/icp/approve", { actor: "human" }); // the founder clicked "Approve profile"
      const result = await j("/discover");
      return NextResponse.json({ mode: "engine", result, leads: makeLeads() });
    } catch (e) {
      console.error("[discover] engine unavailable, using demo:", (e as Error).message);
    }
  }
  return NextResponse.json({ mode: "demo", reason: isCustom(intake) ? "No GEMINI_API_KEY for live search" : "Demo intake", leads: makeLeads(), dropped: [] });
}
