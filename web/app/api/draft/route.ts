import { NextResponse } from "next/server";
import { claudeJSON } from "@/lib/claude";
import { HYPE, type Lead } from "@/lib/demo-data";

const SYSTEM = `You write a short first-touch email for a founder.
Use ONLY the one cited signal you are given: quote it verbatim inside “curly quotes”. Invent no other facts, numbers or names.
Mention the warm intro if one is given. 70-120 words, friendly, no hype words (${HYPE.join(", ")}), no links. End with one question, then a sign-off line "Arushi, Togather".
Return ONLY JSON: {"body": "..."} with \\n for line breaks.`;

export async function POST(req: Request) {
  const { lead } = (await req.json().catch(() => ({}))) as { lead?: Lead };
  if (!lead) return NextResponse.json({ error: "lead required" }, { status: 400 });
  const s = lead.signals[0];
  const out = await claudeJSON<{ body: string }>(SYSTEM, JSON.stringify({
    to: `${lead.buyer}, ${lead.title} at ${lead.company}`, signal: { quote: s.q, source: s.src }, warm_intro: lead.via, product: "Togather: volunteers find shifts in a short video feed, sign up in one tap, get reminders.",
  }), 1500);
  // Citation guard: a live draft that drops the cited quote is rejected in favour of the demo draft.
  if (out?.body && out.body.includes(s.q.slice(0, 28))) return NextResponse.json({ mode: "live", body: out.body });
  return NextResponse.json({ mode: "demo", body: lead.body });
}
