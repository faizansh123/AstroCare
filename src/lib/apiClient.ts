// Calls the server proxy. Any failure returns null and the UI shows rules-only output (file 12 §6).
import { AiExplanationSchema, type AiExplanation, type AssessmentResult, type HealthRecord } from "../types/health";

export async function fetchExplanation(record: HealthRecord, result: AssessmentResult): Promise<AiExplanation | null> {
  try {
    const res = await fetch("/api/explain", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record, result }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const parsed = AiExplanationSchema.safeParse(body.ai);
    if (!parsed.success || parsed.data.statusEcho !== result.status) return null; // rules status wins
    return parsed.data;
  } catch {
    return null;
  }
}
