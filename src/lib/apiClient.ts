// Calls the server proxy (file 12 §1 step 4). Any failure returns ai: null with a reason and the UI keeps the
// template explanation (file 12 §6). The reply is checked again here: the rules status always wins.
import type { AiExplanation, Assessment, Snapshot } from "../types/health";
import { guardAiReply } from "./aiGuard";

export interface AiOutcome { ai: AiExplanation | null; reason?: string; model?: string; promptVersion?: string }

const CLIENT_TIMEOUT_MS = 20_000; // proxy does ~8 s + one retry

export async function fetchExplanation(snapshot: Snapshot, assessment: Assessment): Promise<AiOutcome> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ai: null, reason: "Offline" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshot, assessment }),
      signal: ctrl.signal,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body) return { ai: null, reason: body?.reason ?? `AI service error (${res.status})` };
    if (body.ai == null) return { ai: null, reason: body.reason, model: body.model };
    const guarded = guardAiReply(body.ai, assessment, snapshot);
    return guarded.ok
      ? { ai: guarded.ai, model: body.model, promptVersion: body.promptVersion }
      : { ai: null, reason: guarded.reason, model: body.model };
  } catch (err) {
    return { ai: null, reason: (err as Error).name === "AbortError" ? "AI timed out" : "Could not reach the AI service" };
  } finally {
    clearTimeout(timer);
  }
}
