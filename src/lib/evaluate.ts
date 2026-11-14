// Local deterministic rules engine (file 13 §6). Pure: (record, baseline) => AssessmentResult.
// Never references environment or Mission Log (FR-01, file 11 §2). Gemini never sets status.
import rules from "../data/rules.json";
import type { AssessmentResult, Baseline, Deviation, HealthRecord } from "../types/health";

export const DISCLAIMER =
  "Simulation. Not for clinical use. Rules are illustrative. Follow approved mission procedures and contact the designated medical authority.";

const UNITS: Record<string, string> = {
  heartRateBpm: "bpm", systolicMmHg: "mmHg", diastolicMmHg: "mmHg",
  temperatureC: "°C", sleepHours: "h", fatigueScore: "/10",
};

type Rule = { up?: number; down?: number; abs?: number };

export function evaluate(record: HealthRecord, baseline: Baseline | undefined): AssessmentResult {
  const m = record.measurements;
  const triggered: AssessmentResult["triggeredRules"] = [];
  const missingFields = (rules.requiredFields as (keyof Baseline)[]).filter(
    (f) => typeof m[f as keyof typeof m] !== "number",
  ) as string[];
  if (!baseline) missingFields.push("baseline");
  if (!record.symptomsAnswer || record.symptomsAnswer === "unknown") missingFields.push("symptomsAnswer");

  // Deviations (computed whenever both values exist, so they can be shown even on RED / INSUFFICIENT_DATA)
  const deviations: Deviation[] = [];
  const yellow = rules.yellow as Record<string, Rule>;
  if (baseline) {
    for (const field of Object.keys(UNITS)) {
      const current = m[field as keyof typeof m];
      const base = baseline[field as keyof Baseline];
      if (typeof current !== "number" || typeof base !== "number") continue;
      const delta = +(current - base).toFixed(2);
      const r = yellow[field];
      const flagged = !!r && ((r.up !== undefined && delta >= r.up) ||
        (r.down !== undefined && -delta >= r.down) ||
        (r.abs !== undefined && Math.abs(delta) >= r.abs));
      deviations.push({ field, baseline: base, current, delta, unit: UNITS[field], flagged });
      if (flagged) triggered.push({ ruleId: `DEV_${field}`, level: "YELLOW", explanation: `${field} changed by ${delta > 0 ? "+" : ""}${delta} ${UNITS[field]} vs baseline (illustrative threshold).` });
    }
  }

  // Symptom override (T07): red-flag or severe symptoms are RED regardless of vitals or missing data.
  for (const s of record.symptoms) {
    if ((rules.redFlagSymptoms as string[]).includes(s.type) || s.severity === "severe") {
      triggered.push({ ruleId: `SYM_RED_${s.type}`, level: "RED", explanation: `Reported ${s.severity} ${s.type.replace(/_/g, " ")}. Escalate per approved mission procedures.` });
    } else if (s.severity === "moderate") {
      triggered.push({ ruleId: `SYM_${s.type}`, level: "YELLOW", explanation: `Reported moderate ${s.type.replace(/_/g, " ")}.` });
    } else {
      triggered.push({ ruleId: `SYM_${s.type}`, level: "YELLOW", explanation: `Reported mild ${s.type.replace(/_/g, " ")}. Recorded and shown.` });
    }
  }
  if (m.mood === "low") triggered.push({ ruleId: "MOOD_LOW", level: "YELLOW", explanation: "Self-reported low mood. Check-in recorded." });

  const flaggedCount = deviations.filter((d) => d.flagged).length;
  if (flaggedCount >= rules.redConcurrentDeviations) {
    triggered.push({ ruleId: "DEV_CONCURRENT", level: "RED", explanation: `${flaggedCount} concurrent deviations (illustrative protocol trigger).` });
  }

  let status: AssessmentResult["status"];
  if (triggered.some((t) => t.level === "RED")) status = "RED";
  else if (missingFields.length > 0) status = "INSUFFICIENT_DATA"; // never defaults to GREEN
  else if (triggered.length > 0) status = "YELLOW";
  else status = "GREEN";

  // TODO: staleness check (file 13 §6.4). Limit not defined in the docs yet; needs a team decision.
  return {
    recordId: record.recordId, status, deviations, triggeredRules: triggered,
    guidanceIds: [], missingFields, evaluatedAt: new Date().toISOString(),
    engineVersion: rules.engineVersion, disclaimer: DISCLAIMER,
  };
}
