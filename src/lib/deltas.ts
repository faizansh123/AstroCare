// Baseline comparison (file 15 §3, file 07 §5). Pure functions.
// absolute = current - baseline; % = (current - baseline) / baseline x 100, only when the baseline is nonzero.
import { LABS, LAB_KEYS, VITALS, VITAL_KEYS } from "../data/catalog";
import type { Baseline, Delta, Labs, Snapshot } from "../types/health";

export const round = (v: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round((v + Number.EPSILON * Math.sign(v)) * f) / f;
};

export const absDelta = (current: number, baseline: number) => round(current - baseline, 2);

/** null when the baseline is zero (no meaningful percentage). Rounded to 0.1 %. */
export function pctDelta(current: number, baseline: number): number | null {
  if (baseline === 0 || !Number.isFinite(baseline)) return null;
  return round(((current - baseline) / baseline) * 100, 1);
}

/** D23: glucose is canonical in mmol/L; mg/dL converts at /18 (visible conversion in the UI). */
export function glucoseMmol(labs: Labs): number | undefined {
  if (labs.glucose === undefined) return undefined;
  return labs.glucoseUnit === "mg/dL" ? round(labs.glucose / 18, 2) : labs.glucose;
}

export function labValue(labs: Labs, key: (typeof LAB_KEYS)[number]): number | undefined {
  return key === "glucose" ? glucoseMmol(labs) : labs[key];
}

export function computeDeltas(s: Snapshot, b: Baseline): Delta[] {
  const out: Delta[] = [];
  for (const k of VITAL_KEYS) {
    const cur = s.vitals[k];
    if (cur === undefined) continue;
    const m = VITALS[k];
    out.push({ ref: m.ref, label: m.label, unit: m.unit, baseline: b.vitals[k], current: cur,
      abs: absDelta(cur, b.vitals[k]), pct: pctDelta(cur, b.vitals[k]), digits: m.digits });
  }
  for (const k of LAB_KEYS) {
    const cur = labValue(s.labs, k);
    if (cur === undefined) continue;
    const m = LABS[k];
    out.push({ ref: m.ref, label: m.label, unit: m.unit, baseline: b.labs[k], current: cur,
      abs: absDelta(cur, b.labs[k]), pct: pctDelta(cur, b.labs[k]), digits: m.digits });
  }
  return out;
}

export const signed = (v: number, digits: number) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toFixed(digits)}`;
export const signedPct = (p: number | null) => (p === null ? "n/a" : `${signed(p, 1)}%`);
