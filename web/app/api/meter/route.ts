import { NextResponse } from "next/server";

const EVENTS: Record<string, string> = { graph: "graph_query", enrich: "lead_enriched", send: "outreach_sent" };
// Local ledger (per server process). The UI keeps its own copy; this mirrors what Flexprice would see.
const ledger: { event: string; amount: number; target: string; at: string; flexprice: "sent" | "demo" | "error" }[] = [];

export async function POST(req: Request) {
  const { event, amount, target } = (await req.json().catch(() => ({}))) as { event?: string; amount?: number; target?: string };
  const name = EVENTS[event || ""];
  if (!name) return NextResponse.json({ error: "unknown event" }, { status: 400 });
  let flexprice: "sent" | "demo" | "error" = "demo";
  const key = process.env.FLEXPRICE_API_KEY;
  if (key) {
    try {
      const base = process.env.FLEXPRICE_BASE_URL || "https://api.cloud.flexprice.io/v1";
      const r = await fetch(`${base}/events`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key },
        body: JSON.stringify({ event_name: name, external_customer_id: process.env.FLEXPRICE_CUSTOMER_ID || "pitchfeed-demo-org", properties: { credits: amount, target }, source: "pitchfeed-web" }),
      });
      flexprice = r.ok ? "sent" : "error";
    } catch { flexprice = "error"; }
  }
  ledger.unshift({ event: name, amount: amount || 0, target: target || "", at: new Date().toISOString(), flexprice });
  return NextResponse.json({ ok: true, flexprice, events: ledger.length });
}

export async function GET() {
  return NextResponse.json({ events: ledger.slice(0, 100) });
}
