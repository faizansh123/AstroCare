// Calls the server proxy. Any failure returns ai: null with a reason, and the UI shows rules-only output (file 12 §6).
import type { AiExplanation, AssessmentResult, HealthRecord } from "../types/health";
import { guardAiReply } from "./aiGuard";

export interface AiOutcome { ai: AiExplanation | null; reason?: string }

const CLIENT_TIMEOUT_MS = 20_000; // proxy does 8 s + one retry

export async function fetchExplanation(record: HealthRecord, result: AssessmentResult): Promise<AiOutcome> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ai: null, reason: "Offline" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record, result }),
      signal: ctrl.signal,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body) return { ai: null, reason: body?.reason ?? `AI service error (${res.status})` };
    if (body.ai == null) return { ai: null, reason: body.reason };
    const guarded = guardAiReply(body.ai, result.status); // second line of defence; rules status wins
    return guarded.ok ? { ai: guarded.ai } : { ai: null, reason: guarded.reason };
  } catch (err) {
    return { ai: null, reason: (err as Error).name === "AbortError" ? "AI timed out" : "Could not reach the AI service" };
  } finally {
    clearTimeout(timer);
  }
}
