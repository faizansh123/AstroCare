// Field metadata shared by the engine, the UI and the AI reference check. Every field has a stable ref ID that
// explanation sentences must cite (file 07 §8: "every sentence must reference an input field").
import type { SymptomId } from "../types/health";

export type VitalKey = "hr" | "sbp" | "dbp" | "temp" | "rr" | "spo2" | "sleep" | "mood";
export type LabKey = "hemoglobin" | "wbc" | "glucose" | "calcium";
export type EnvKey = "co2Pct" | "cabinTempC" | "humidityPct" | "radiationMGy";

export interface FieldMeta { ref: string; label: string; short: string; unit: string; digits: number; min: number; max: number; step: number }

// Slider ranges come from the clickable prototype (file 14).
export const VITALS: Record<VitalKey, FieldMeta> = {
  hr: { ref: "vitals.hr", label: "Heart rate", short: "HR", unit: "bpm", digits: 0, min: 45, max: 135, step: 1 },
  sbp: { ref: "vitals.sbp", label: "Systolic BP", short: "SBP", unit: "mmHg", digits: 0, min: 85, max: 165, step: 1 },
  dbp: { ref: "vitals.dbp", label: "Diastolic BP", short: "DBP", unit: "mmHg", digits: 0, min: 50, max: 110, step: 1 },
  temp: { ref: "vitals.temp", label: "Body temperature", short: "Temp", unit: "°C", digits: 1, min: 35, max: 39, step: 0.1 },
  // Respiratory rate and SpO2 (D26): display and trend only. No rules thresholds; input ranges are illustrative.
  rr: { ref: "vitals.rr", label: "Respiratory rate", short: "RR", unit: "/min", digits: 0, min: 6, max: 40, step: 1 },
  spo2: { ref: "vitals.spo2", label: "SpO₂", short: "SpO₂", unit: "%", digits: 0, min: 80, max: 100, step: 1 },
  sleep: { ref: "vitals.sleep", label: "Sleep (last night)", short: "Sleep", unit: "h", digits: 1, min: 0, max: 12, step: 0.5 },
  mood: { ref: "vitals.mood", label: "Mood", short: "Mood", unit: "/10", digits: 0, min: 1, max: 10, step: 1 },
};
export const VITAL_KEYS = Object.keys(VITALS) as VitalKey[];

export const LABS: Record<LabKey, FieldMeta & { note: string }> = {
  hemoglobin: { ref: "labs.hemoglobin", label: "Hemoglobin", short: "Hb", unit: "g/L", digits: 0, min: 90, max: 180, step: 1,
    note: "Spaceflight research examines blood-volume and red-cell adaptation. This value is fictional." },
  wbc: { ref: "labs.wbc", label: "White blood cells", short: "WBC", unit: "×10⁹/L", digits: 1, min: 2, max: 15, step: 0.1,
    note: "Spaceflight may affect immune function. A single WBC value is not a diagnosis." },
  glucose: { ref: "labs.glucose", label: "Glucose", short: "Glucose", unit: "mmol/L", digits: 1, min: 2.5, max: 12, step: 0.1,
    note: "Metabolic health and nutrition are relevant to long missions. Interpretation depends on sampling conditions." },
  calcium: { ref: "labs.calcium", label: "Calcium", short: "Ca", unit: "mmol/L", digits: 2, min: 1.8, max: 3, step: 0.01,
    note: "Altered gravity affects bone metabolism, but serum calcium alone does not quantify bone loss." },
};
export const LAB_KEYS = Object.keys(LABS) as LabKey[];

export const ENV: Record<EnvKey, FieldMeta> = {
  co2Pct: { ref: "env.co2Pct", label: "Cabin CO₂", short: "CO₂", unit: "%", digits: 2, min: 0.1, max: 1, step: 0.05 },
  cabinTempC: { ref: "env.cabinTempC", label: "Cabin temperature", short: "Cabin temp", unit: "°C", digits: 0, min: 18, max: 30, step: 1 },
  humidityPct: { ref: "env.humidityPct", label: "Humidity", short: "Humidity", unit: "%", digits: 0, min: 20, max: 65, step: 1 },
  radiationMGy: { ref: "env.radiationMGy", label: "Radiation dose (manual entry)", short: "Radiation", unit: "mGy", digits: 2, min: 0, max: 5, step: 0.01 },
};

export const FATIGUE: FieldMeta = { ref: "survey.fatigue", label: "Fatigue", short: "Fatigue", unit: "/10", digits: 0, min: 0, max: 10, step: 1 };

/** D10: store 0-10, show a band label beside it. */
export function fatigueBand(v: number | undefined): string {
  if (v === undefined) return "Not answered";
  if (v <= 1) return "None";
  if (v <= 4) return "Mild";
  if (v <= 6) return "Moderate";
  return "High";
}
/** D9: 1-10 with labelled anchors. */
export function moodBand(v: number | undefined): string {
  if (v === undefined) return "Not answered";
  if (v <= 2) return "Very low";
  if (v <= 4) return "Low";
  if (v <= 6) return "Neutral";
  if (v <= 8) return "Good";
  return "Very good";
}

export type RegionId = "brain" | "heart" | "lungs" | "blood" | "bones" | "sleep";

export const SYMPTOMS: Record<SymptomId, { label: string; region: RegionId }> = {
  fatigue: { label: "Fatigue", region: "sleep" },
  headache: { label: "Headache", region: "brain" },
  dizziness: { label: "Dizziness", region: "brain" },
  nausea: { label: "Nausea", region: "brain" },
  difficulty_concentrating: { label: "Difficulty concentrating", region: "brain" },
  severe_breathing_difficulty: { label: "Difficulty breathing / shortness of breath", region: "lungs" },
};
export const SYMPTOM_IDS = Object.keys(SYMPTOMS) as SymptomId[];

/** Every ref ID an explanation sentence may cite, with a readable label (used by the AI guard and the UI). */
export const FIELD_REFS: Record<string, string> = {
  ...Object.fromEntries(VITAL_KEYS.map((k) => [VITALS[k].ref, VITALS[k].label])),
  ...Object.fromEntries(LAB_KEYS.map((k) => [LABS[k].ref, LABS[k].label])),
  ...Object.fromEntries(Object.values(ENV).map((m) => [m.ref, m.label])),
  "vitals.posture": "Posture",
  "vitals.tempSite": "Temperature site",
  "survey.fatigue": "Fatigue",
  "survey.symptoms": "Symptoms",
  "survey.notes": "Notes",
  "survey.otherSymptoms": "Other symptoms",
  "labs.collectedAt": "Specimen time",
  "env.lightCycle": "Light cycle",
  "env.phase": "Mission phase",
  "data.age": "Data age",
  "rules.result": "Rules result",
};
