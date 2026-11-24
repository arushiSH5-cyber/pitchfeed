import { NextResponse } from "next/server";
import { claudeJSON } from "@/lib/claude";
import { ICP, INTAKE, type ICPT, type Row } from "@/lib/demo-data";

const SYSTEM = `You turn a founder's product intake into an ideal customer profile (ICP).
Return ONLY a JSON object with keys industries, size, personas, triggers, negatives, expansions.
Each key is an array of 3-4 rows; each row is [label, short detail, confidence 0..1].
Industries use NAICS codes in the detail. Negatives are rule-outs (detail "Drop" or "Lower score").
Expansions are adjacent segments worth testing, with a one-sentence reason as the detail.
Be grounded in the intake only; lower the confidence of anything you are guessing.`;

const KEYS = ["industries", "size", "personas", "triggers", "negatives", "expansions"] as const;
const valid = (x: unknown): x is ICPT =>
  !!x && KEYS.every((k) => Array.isArray((x as Record<string, unknown>)[k]) && ((x as Record<string, Row[]>)[k]).every((r) => Array.isArray(r) && r.length === 3 && typeof r[2] === "number"));

export async function POST(req: Request) {
  const intake = { ...INTAKE, ...(await req.json().catch(() => ({}))) };
  const icp = await claudeJSON<ICPT>(SYSTEM, JSON.stringify(intake));
  if (valid(icp)) return NextResponse.json({ mode: "live", icp });
  return NextResponse.json({ mode: "demo", icp: ICP });
}
