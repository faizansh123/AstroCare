// FR-02, T06: implausible input returns field errors and no calculation.
import rules from "../data/rules.json";
import type { Measurements } from "../types/health";

export type FieldErrors = Record<string, string>;

export function validate(m: Measurements): FieldErrors {
  const errors: FieldErrors = {};
  const ranges = rules.plausibility as Record<string, number[]>;
  for (const [field, [min, max]] of Object.entries(ranges)) {
    const v = m[field as keyof Measurements];
    if (typeof v !== "number") continue; // missing is handled by evaluate (INSUFFICIENT_DATA)
    if (Number.isNaN(v)) errors[field] = "Not a number.";
    else if (v < min || v > max) errors[field] = `Must be between ${min} and ${max}.`;
  }
  if (typeof m.systolicMmHg === "number" && typeof m.diastolicMmHg === "number" && m.systolicMmHg <= m.diastolicMmHg) {
    errors.systolicMmHg = "Systolic must be higher than diastolic.";
  }
  return errors;
}
