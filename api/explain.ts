// Vercel serverless proxy (file 13 §7). Holds GEMINI_API_KEY server-side only (NFR-09).
// Without a key it returns { ai: null } and the client shows the rules-only result (file 12 §6).
import { explain } from "../server/explain.js";

type Req = { method?: string; body?: unknown; headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } };
type Res = { status: (n: number) => { json: (b: unknown) => void }; setHeader: (k: string, v: string) => void };

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ai: null, reason: "Method not allowed" });
    return;
  }
  const fwd = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0].trim() ?? req.socket?.remoteAddress;
  const out = await explain(req.body, { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL, ip });
  res.status(out.httpStatus).json(out.body);
}
