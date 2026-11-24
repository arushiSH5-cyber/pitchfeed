import { NextResponse } from "next/server";
import { makeLeads } from "@/lib/demo-data";

/** Proxies discovery to the FastAPI engine when ENGINE_URL is set; otherwise returns demo leads. */
export async function POST() {
  const base = process.env.ENGINE_URL;
  if (base) {
    try {
      const j = (p: string, body?: object) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) }).then((r) => { if (!r.ok) throw new Error(p + " " + r.status); return r.json(); });
      await j("/intake/demo");
      await j("/icp/approve", { actor: "human" }); // the founder clicked "Approve profile"
      const result = await j("/discover");
      const feed = await fetch(base + "/feed").then((r) => r.json());
      return NextResponse.json({ mode: "live", result, feed });
    } catch (e) {
      console.error("[discover] engine unavailable, using demo:", (e as Error).message);
    }
  }
  return NextResponse.json({ mode: "demo", result: { leads: 4, dropped: 2 }, feed: makeLeads() });
}
