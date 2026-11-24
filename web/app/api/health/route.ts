import { NextResponse } from "next/server";
import { CLAUDE_MODEL, GEMINI_MODEL, provider } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function GET() {
  let engine: "live" | "demo" = "demo";
  if (process.env.ENGINE_URL) {
    try { engine = (await fetch(`${process.env.ENGINE_URL}/health`, { signal: AbortSignal.timeout(1500) })).ok ? "live" : "demo"; } catch { engine = "demo"; }
  }
  return NextResponse.json({
    ok: true,
    integrations: {
      claude: process.env.ANTHROPIC_API_KEY ? "live" : "demo",
      gemini: process.env.GEMINI_API_KEY ? "live" : "demo",
      flexprice: process.env.FLEXPRICE_API_KEY ? "live" : "demo",
      engine,
    },
    llm: provider(),
    model: provider() === "gemini" ? GEMINI_MODEL : CLAUDE_MODEL,
  });
}
