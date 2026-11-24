// Live discovery for a custom intake: Gemini + Google Search finds candidates,
// then every quote is re-checked against its live source page. Unverified claims are dropped.
import type { ICPT, Intake, Lead } from "./demo-data";
import { geminiGenerate } from "./llm";

type Cand = {
  company: string; industry?: string; size?: string; contact_role?: string;
  signal_type?: string; signal_title?: string; quote?: string; source_url?: string; days_ago?: number;
};
export type Dropped = { company: string; reason: string };

const SYSTEM = `You are a B2B prospect researcher. Use Google Search to find REAL organizations that fit the ideal customer profile and have a PUBLIC, RECENT reason to talk now (hiring for a relevant role, an upcoming event, a stated pain, new funding).
For each one, copy ONE sentence fragment (8-30 words) EXACTLY as written on the source page, and give the direct URL of that page (not a search or redirect URL).
Never invent organizations, quotes, people or URLs. Do not include personal names; give the role to contact instead.
Return ONLY JSON: {"leads":[{"company":"","industry":"","size":"","contact_role":"","signal_type":"hiring|event|pain|funding","signal_title":"","quote":"","source_url":"","days_ago":0}]} with up to 8 leads.`;

async function geminiSearch(intake: Intake, icp: ICPT): Promise<Cand[]> {
  const brief = {
    product: intake.product, what: intake.what, pricing: intake.pricing, current_customers: intake.customers,
    industries: icp.industries.map((r) => r[0]), size_and_region: icp.size.map((r) => r[0]),
    personas: icp.personas.map((r) => r[0]), triggers: icp.triggers.map((r) => r[0]), rule_outs: icp.negatives.map((r) => r[0]),
  };
  const j = await geminiGenerate({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify(brief) }] }],
    tools: [{ google_search: {} }],
  }, 60000);
  const text = (j.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("");
  const m = text.match(/\{[\s\S]*\}/);
  return m ? (JSON.parse(m[0]).leads as Cand[]) || [] : [];
}

const norm = (t: string) =>
  t.toLowerCase().replace(/[‘’“”"'`]/g, "").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const privateHost = (h: string) => /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1)/.test(h) || !h.includes(".");

/** Citation validator: the quote must appear on the live page. */
async function verify(url: string, quote: string): Promise<string | null> {
  let u: URL;
  try { u = new URL(url); } catch { return "bad source URL"; }
  if (!/^https?:$/.test(u.protocol) || privateHost(u.hostname)) return "unsafe source URL";
  try {
    const r = await fetch(u, { redirect: "follow", signal: AbortSignal.timeout(9000), headers: { "user-agent": "Mozilla/5.0 (compatible; PitchfeedValidator/1.0)" } });
    if (!r.ok) return `source returned ${r.status}`;
    const html = await r.text();
    const page = norm(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
    const q = norm(quote);
    return page.includes(q) || page.includes(q.slice(0, 60)) ? null : "quote not found on source page";
  } catch { return "source page unreachable"; }
}

const KINDS = ["hiring", "event", "pain", "funding"];

export async function realPull(intake: Intake, icp: ICPT): Promise<{ leads: Lead[]; dropped: Dropped[] }> {
  const cands = (await geminiSearch(intake, icp)).filter((c) => c.company && c.quote && c.source_url).slice(0, 8);
  const checks = await Promise.all(cands.map((c) => verify(c.source_url!, c.quote!)));
  const dropped: Dropped[] = [];
  const first = (intake.founder || "").split(" ")[0] || "Me";
  const pitch = (intake.what || "").split(/(?<=\.)\s/)[0];
  const leads: Lead[] = [];
  cands.forEach((c, i) => {
    if (checks[i]) { dropped.push({ company: c.company, reason: checks[i]! }); return; }
    const k = KINDS.includes(c.signal_type || "") ? c.signal_type! : "pain";
    const days = Math.max(0, Math.min(60, Number(c.days_ago) || 7));
    const score = Math.min(95, 62 + (k === "hiring" || k === "pain" ? 14 : 9) + Math.max(0, 14 - days));
    const quote = c.quote!.trim();
    const src = c.source_url!.replace(/^https?:\/\//, "").replace(/\/$/, "");
    leads.push({
      id: "r" + i, company: c.company, industry: c.industry || "Matched to your profile", size: c.size || "Public organization",
      score, tier: score >= 70 ? "A" : "B", temp: days <= 10 ? "hot" : "warm", days,
      buyer: c.contact_role || "Program lead", title: "Role named on their public page", email: "", linkedin: null,
      signals: [{ t: c.signal_title || "Public signal", q: quote, src, days, k }],
      path: null, via: null, variant: "Quote",
      subject: `${c.company.split(" ")[0]} + ${intake.product}`,
      body: `Hi there,\n\nI came across this from ${c.company}: “${quote}”\n\nI'm building ${intake.product}. ${pitch}\n\nWould a short demo be useful for your team?\n\n${first}, ${intake.product}`,
      status: "pending", stage: "matched", by: "crew",
    });
  });
  return { leads, dropped };
}
