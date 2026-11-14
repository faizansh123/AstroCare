// Validation and data-age checks (file 07 §7 step 1 and 3, file 15 §8 "Validation").
// Missing, implausible, conflicting or stale required data -> DATA-* issues -> INSUFFICIENT_DATA. Never GREEN.
import rules from "../data/rules.json";
import { FIELD_REFS } from "../data/catalog";
import type { DataIssue, Snapshot } from "../types/health";

const HOUR = 3_600_000;
const FUTURE_TOLERANCE_MS = 5 * 60_000;

/** Read a field from the snapshot by its ref ID, e.g. "vitals.hr". */
export function readRef(s: Snapshot, ref: string): unknown {
  const [group, key] = ref.split(".") as [keyof Snapshot, string];
  const g = s[group];
  return g && typeof g === "object" ? (g as Record<string, unknown>)[key] : undefined;
}

export function dataAgeHours(s: Snapshot, now: number): number | null {
  const t = Date.parse(s.vitals.measuredAt);
  return Number.isNaN(t) ? null : (now - t) / HOUR;
}

export function validate(s: Snapshot, now = Date.now()): DataIssue[] {
  const issues: DataIssue[] = [];
  const label = (ref: string) => FIELD_REFS[ref] ?? ref;

  // Required fields (D22).
  for (const ref of rules.required) {
    if (ref === "survey.symptoms") {
      const a = s.survey.symptomsAnswer;
      if (a === "unanswered" || (a === "reported" && s.survey.symptoms.length === 0)) {
        issues.push({ id: "DATA-MISSING", field: ref, message: "Symptoms question not answered (choose none, or select symptoms)." });
      }
      continue;
    }
    if (typeof readRef(s, ref) !== "number") issues.push({ id: "DATA-MISSING", field: ref, message: `${label(ref)} is missing.` });
  }

  // Plausibility (input sanity ranges, not clinical limits).
  for (const [ref, [min, max]] of Object.entries(rules.plausibility as Record<string, number[]>)) {
    const v = readRef(s, ref);
    if (typeof v !== "number") continue;
    // Glucose may be entered in mg/dL; check it in canonical mmol/L.
    const value = ref === "labs.glucose" && s.labs.glucoseUnit === "mg/dL" ? v / 18 : v;
    if (!Number.isFinite(value) || value < min || value > max) {
      issues.push({ id: "DATA-INVALID", field: ref, message: `${label(ref)} ${v} is outside the plausible input range (${min} to ${max}).` });
    }
  }
  for (const ref of ["vitals.mood", "survey.fatigue"]) {
    const v = readRef(s, ref);
    if (typeof v === "number" && !Number.isInteger(v)) issues.push({ id: "DATA-INVALID", field: ref, message: `${label(ref)} must be a whole number.` });
  }

  // Conflicting values.
  const { sbp, dbp } = s.vitals;
  if (typeof sbp === "number" && typeof dbp === "number" && sbp <= dbp) {
    issues.push({ id: "DATA-INVALID", field: "vitals.sbp", message: "Systolic BP must be higher than diastolic BP. Re-check the reading." });
  }
  if (s.survey.symptomsAnswer === "none" && s.survey.symptoms.length > 0) {
    issues.push({ id: "DATA-INVALID", field: "survey.symptoms", message: "Symptoms are selected but the answer says none. Re-check." });
  }

  // Timestamps and data age.
  const t = Date.parse(s.vitals.measuredAt);
  if (Number.isNaN(t)) issues.push({ id: "DATA-INVALID", field: "data.age", message: "Measurement time is missing or invalid." });
  else if (t - now > FUTURE_TOLERANCE_MS) issues.push({ id: "DATA-INVALID", field: "data.age", message: "Measurement time is in the future." });
  else if (now - t > rules.staleLimitHours * HOUR) {
    issues.push({ id: "DATA-STALE", field: "data.age",
      message: `Readings are ${Math.floor((now - t) / HOUR)} h old, older than the ${rules.staleLimitHours} h demo limit. Take new readings.` });
  }
  if (s.labs.collectedAt) {
    const lt = Date.parse(s.labs.collectedAt);
    if (Number.isNaN(lt) || lt - now > FUTURE_TOLERANCE_MS) {
      issues.push({ id: "DATA-INVALID", field: "labs.collectedAt", message: "Specimen time is invalid or in the future." });
    }
  }
  return issues;
}

/** Field-level messages for forms. */
export function issuesByField(issues: DataIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) if (!out[i.field]) out[i.field] = i.message;
  return out;
}
