import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
export const hasClaude = () => !!process.env.ANTHROPIC_API_KEY;

/** One Claude call that must return JSON. Returns null on any failure so routes can fall back to demo data. */
export async function claudeJSON<T>(system: string, user: string, maxTokens = 4000): Promise<T | null> {
  if (!hasClaude()) return null;
  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: user }],
    } as Anthropic.MessageCreateParamsNonStreaming);
    if (res.stop_reason === "refusal") return null;
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const m = text.match(/\{[\s\S]*\}/);
    return m ? (JSON.parse(m[0]) as T) : null;
  } catch (e) {
    console.error("[claude] falling back to demo:", (e as Error).message);
    return null;
  }
}
