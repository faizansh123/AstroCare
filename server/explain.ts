// Framework-agnostic core of the Gemini proxy (file 12 §1 step 4, file 07 §8). Used by api/explain.ts (Vercel)
// and by the Vite dev middleware, so local dev and deploy run the same code.
// Server-side only: holds GEMINI_API_KEY. Never import this from client code (NFR-09).
// Relative imports use .js so the compiled Node ESM function resolves them on Vercel.
import { GoogleGenAI } from "@google/genai";
import { ExplainRequestSchema, type AiExplanation } from "../src/types/health.js";
import { AI_RESPONSE_JSON_SCHEMA, PROMPT_VERSION, SYSTEM_PROMPT, buildUserPrompt } from "../src/prompts/explain.v5.js";
import { guardAiReply } from "../src/lib/aiGuard.js";

// D4 (file 13 §2): Flash-tier model from env. Confirm the current name in Google's docs.
export const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 8_000; // file 13 §7: ~8 s, one retry
const RATE_LIMIT = { max: 10, windowMs: 60_000 }; // per IP, in memory (demo-grade)

export interface ExplainResponse {
  ai: AiExplanation | null;
  reason?: string;
  promptVersion: string;
  model?: string;
}

/** Calls the model and returns its raw text. Injected so tests never hit the real API (file 13 §10). */
export type GenerateFn = (args: { model: string; system: string; user: string; signal: AbortSignal }) => Promise<string | undefined>;

export function geminiGenerate(apiKey: string): GenerateFn {
  const client = new GoogleGenAI({ apiKey });
  return async ({ model, system, user, signal }) => {
    const res = await client.models.generateContent({
      model,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: AI_RESPONSE_JSON_SCHEMA,
        temperature: 0.2, // low for consistency (file 12 §11)
        maxOutputTokens: 4000, // v6 asks for more specific (longer) checks
        abortSignal: signal,
      },
    });
    return res.text;
  };
}

const hits = new Map<string, number[]>();
export function rateLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}
export function resetRateLimit() { hits.clear(); }

async function withTimeout(fn: (signal: AbortSignal) => Promise<string | undefined>, ms: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await Promise.race([
      fn(ctrl.signal),
      new Promise<never>((_, reject) => ctrl.signal.addEventListener("abort", () => reject(new Error("timeout")))),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function explain(
  body: unknown,
  opts: { apiKey?: string; model?: string; ip?: string; generate?: GenerateFn; timeoutMs?: number },
): Promise<{ httpStatus: number; body: ExplainResponse }> {
  const base = { promptVersion: PROMPT_VERSION };
  if (!opts.apiKey && !opts.generate) return { httpStatus: 200, body: { ...base, ai: null, reason: "AI explanation not configured" } };

  const req = ExplainRequestSchema.safeParse(body);
  if (!req.success) return { httpStatus: 400, body: { ...base, ai: null, reason: "Invalid request" } };

  if (rateLimited(opts.ip ?? "unknown")) return { httpStatus: 429, body: { ...base, ai: null, reason: "Too many requests, try again in a minute" } };

  const model = opts.model || DEFAULT_MODEL;
  const generate = opts.generate ?? geminiGenerate(opts.apiKey!);
  const user = buildUserPrompt(req.data);
  let reason = "AI explanation unavailable";

  for (let attempt = 0; attempt < 2; attempt++) { // first try + one retry
    try {
      const text = await withTimeout((signal) => generate({ model, system: SYSTEM_PROMPT, user, signal }), opts.timeoutMs ?? TIMEOUT_MS);
      if (!text) { reason = "AI returned an empty reply"; continue; }
      let json: unknown;
      try { json = JSON.parse(text); } catch { reason = "AI reply was not valid JSON"; continue; }
      const guarded = guardAiReply(json, req.data.assessment, req.data.snapshot);
      if (guarded.ok) return { httpStatus: 200, body: { ...base, model, ai: guarded.ai } };
      reason = guarded.reason;
    } catch (err) {
      reason = (err as Error).message === "timeout" ? "AI timed out" : "AI service error";
      console.error(`[explain] attempt ${attempt + 1} failed:`, (err as Error).message);
    }
  }
  return { httpStatus: 200, body: { ...base, model, ai: null, reason } };
}
