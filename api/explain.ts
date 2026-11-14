// Vercel serverless proxy (file 13 §7). Holds GEMINI_API_KEY server-side only.
// Stub: no key yet, so it always returns { ai: null } and the client shows rules-only output.
export default async function handler(_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) {
  if (!process.env.GEMINI_API_KEY) {
    res.status(200).json({ ai: null, reason: "AI explanation not configured" });
    return;
  }
  // TODO: validate input with Zod, call Gemini with prompt explain.v1, validate reply with AiExplanationSchema.
  res.status(200).json({ ai: null, reason: "AI explanation not implemented yet" });
}
