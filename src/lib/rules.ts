// Local deterministic rules engine (file 07 §7, D4-D7). Pure: (snapshot, baseline, now) -> Assessment.
// Evaluation order: validate -> training triggers (RED) -> missing/invalid/stale (INSUFFICIENT_DATA) -> YELLOW -> GREEN.
// Environment data is context only: they never change the status and never state a cause.
// No LLM is involved. Gemini only explains the result afterwards.
import rules from "../data/rules.json";
import { SYMPTOMS } from "../data/catalog";
import type { Assessment, Baseline, RuleHit, Snapshot } from "../types/health";
import { computeDeltas, labValue, pctDelta, signed } from "./deltas";
import { dataAgeHours, validate } from "./validate";
import { linkHazards } from "./hazards";

export const RULES_VERSION = rules.rulesVersion;

export const LIMITATIONS = [
  "Not for clinical use.",
  "Thresholds are illustrative demonstration rules, not validated flight medicine.",
  "Lab values show change from baseline only. They do not diagnose anything.",
  "Environment is context only. It never changes the status and is not treated as a cause.",
  "Spaceflight hazard links show what a symptom may be related to. They are not a diagnosis or a proven cause.",
];

const Y = rules.yellow;

export function assess(s: Snapshot, b: Baseline, now = Date.now()): Assessment {
  const issues = validate(s, now);
  const bad = new Set(issues.filter((i) => i.id === "DATA-INVALID").map((i) => i.field));
  const ok = (ref: string) => !bad.has(ref);
  const fired: RuleHit[] = [];

  // Training triggers (RED even when every number looks normal, D6).
  const triggers = new Set(rules.trainingTriggers);
  for (const sym of s.survey.symptoms) {
    if (triggers.has(sym.id)) {
      fired.push({ id: "RED-TRAIN-BREATHING", level: "RED", refs: ["survey.symptoms"],
        text: `${SYMPTOMS[sym.id].label} selected. RED training scenario.` });
    }
  }

  // YELLOW rules: evaluated on every valid value, so they are shown under any status.
  const v = s.vitals;
  if (typeof v.hr === "number" && ok("vitals.hr") && v.hr - b.vitals.hr >= Y.hrRiseBpm) {
    fired.push({ id: "YEL-HR", level: "YELLOW", refs: ["vitals.hr"],
      text: `Heart rate ${v.hr} bpm is ${signed(v.hr - b.vitals.hr, 0)} bpm from the Earth baseline of ${b.vitals.hr} bpm (review trigger: +${Y.hrRiseBpm} bpm).` });
  }
  if (typeof v.sleep === "number" && ok("vitals.sleep") && v.sleep < Y.sleepBelowHours) {
    fired.push({ id: "YEL-SLEEP", level: "YELLOW", refs: ["vitals.sleep"],
      text: `Sleep was ${v.sleep} h, below the illustrative ${Y.sleepBelowHours} h review trigger.` });
  }
  const f = s.survey.fatigue;
  if (typeof f === "number" && ok("survey.fatigue") && f >= Y.fatigueAtLeast) {
    fired.push({ id: "YEL-FATIGUE", level: "YELLOW", refs: ["survey.fatigue"],
      text: `Self-reported fatigue is ${f}/10 (review trigger: ${Y.fatigueAtLeast} or higher).` });
  }
  if (typeof v.mood === "number" && ok("vitals.mood") && v.mood <= Y.moodAtMost) {
    fired.push({ id: "YEL-MOOD", level: "YELLOW", refs: ["vitals.mood"],
      text: `Self-reported mood is ${v.mood}/10 (review trigger: ${Y.moodAtMost} or lower).` });
  }
  if (s.survey.symptoms.length >= Y.symptomCountAtLeast) {
    fired.push({ id: "YEL-SYMPTOMS", level: "YELLOW", refs: ["survey.symptoms"],
      text: `${s.survey.symptoms.length} symptoms reported: ${s.survey.symptoms.map((x) => SYMPTOMS[x.id].label).join(", ")}.` });
  }
  const hb = labValue(s.labs, "hemoglobin");
  const hbPct = typeof hb === "number" ? pctDelta(hb, b.labs.hemoglobin) : null;
  if (hbPct !== null && ok("labs.hemoglobin") && Math.abs(hbPct) >= Y.hemoglobinPctAtLeast) {
    fired.push({ id: "YEL-HEMOGLOBIN", level: "YELLOW", refs: ["labs.hemoglobin"],
      text: `Hemoglobin ${hb} g/L differs from the ${b.labs.hemoglobin} g/L baseline by ${signed(hbPct, 1)}% (review trigger: ${Y.hemoglobinPctAtLeast}%). A trend, not a diagnosis.` });
  }

  // Context only. Never changes the status.
  const context: RuleHit[] = [];
  const e = s.env;
  if (typeof e.co2Pct === "number" && ok("env.co2Pct") && e.co2Pct >= rules.context.co2PctAtLeast) {
    context.push({ id: "CTX-CO2", level: "CONTEXT", refs: ["env.co2Pct"],
      text: `Cabin CO₂ is ${e.co2Pct}%, at or above the ${rules.context.co2PctAtLeast}% demo reference setting. Review air-quality readings and any coincident symptoms without inferring a cause.` });
  }

  let status: Assessment["status"];
  if (fired.some((h) => h.level === "RED")) status = "RED";
  else if (issues.length > 0) status = "INSUFFICIENT_DATA";
  else if (fired.length > 0) status = "YELLOW";
  else status = "GREEN";

  const age = dataAgeHours(s, now);
  return {
    status,
    hazards: linkHazards(s), // possible factors only; computed after the status and never feeds back into it
    rulesFired: fired,
    context,
    dataIssues: issues,
    deltas: computeDeltas(s, b),
    symptoms: s.survey.symptoms.map((x) => `${SYMPTOMS[x.id].label}${x.severity ? ` (${x.severity})` : ""}`),
    dataAgeHours: age === null ? null : Math.round(age * 10) / 10,
    createdAt: new Date(now).toISOString(),
    rulesVersion: RULES_VERSION,
    limitations: LIMITATIONS,
  };
}
