import Anthropic from "@anthropic-ai/sdk";

// Provider chain: Claude if ANTHROPIC_API_KEY is set, else Gemini if GEMINI_API_KEY is set, else demo data.
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export type Provider = "claude" | "gemini" | "demo";
export const provider = (): Provider => (process.env.ANTHROPIC_API_KEY ? "claude" : process.env.GEMINI_API_KEY ? "gemini" : "demo");

const firstJSON = <T>(text: string): T | null => {
  const m = text.match(/\{[\s\S]*\}/);
  return m ? (JSON.parse(m[0]) as T) : null;
};

async function claude(system: string, user: string, maxTokens: number): Promise<string | null> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    output_config: { effort: "low" },
    messages: [{ role: "user", content: user }],
  } as Anthropic.MessageCreateParamsNonStreaming);
  if (res.stop_reason === "refusal") return null;
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

async function gemini(system: string, user: string, maxTokens: number): Promise<string | null> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: maxTokens },
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}`);
  const j = await r.json();
  return (j.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("") || null;
}

/** One LLM call that must return JSON. Returns null on any failure so routes fall back to demo data. */
export async function llmJSON<T>(system: string, user: string, maxTokens = 4000): Promise<{ data: T; provider: Provider } | null> {
  const p = provider();
  if (p === "demo") return null;
  try {
    const text = p === "claude" ? await claude(system, user, maxTokens) : await gemini(system, user, maxTokens);
    const data = text ? firstJSON<T>(text) : null;
    return data ? { data, provider: p } : null;
  } catch (e) {
    console.error(`[${p}] falling back to demo:`, (e as Error).message);
    return null;
  }
}
