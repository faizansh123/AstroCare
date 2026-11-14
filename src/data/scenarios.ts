// Demo scenarios (file 07 §11, file 08). They carry no status label: every one goes through the same rules engine.
// All values are fictional. Defaults match the clickable prototype (file 14 §2).
import mission from "./mission.json";
import type { Snapshot } from "../types/health";

const HOUR = 3_600_000;
const iso = (now: number, hoursAgo = 0) => new Date(now - hoursAgo * HOUR).toISOString();

export function defaultSnapshot(now = Date.now()): Snapshot {
  return {
    missionDay: mission.mission.day,
    source: "simulated",
    vitals: { hr: 88, sbp: 116, dbp: 74, temp: 36.8, rr: 16, spo2: 97, sleep: 5.5, mood: 6, posture: "seated", tempSite: "oral", measuredAt: iso(now, 0.5) },
    survey: { fatigue: 6, symptomsAnswer: "reported", symptoms: [{ id: "fatigue", severity: "mild" }], notes: "" },
    labs: { hemoglobin: 137, wbc: 5.8, glucose: 5.1, glucoseUnit: "mmol/L", calcium: 2.29, specimen: "Blood", collectedAt: iso(now, 20) },
    env: { co2Pct: 0.45, cabinTempC: 24, humidityPct: 38, lightCycle: "Day shift lighting", phase: mission.mission.phase, observedAt: iso(now, 0.2) },
  };
}

export interface Scenario { id: string; label: string; description: string; build: (now?: number) => Snapshot }

export const SCENARIOS: Scenario[] = [
  {
    id: "normal", label: "Normal day", description: "Small changes, no symptoms",
    build: (now = Date.now()) => {
      const s = defaultSnapshot(now);
      s.vitals = { ...s.vitals, hr: 76, sbp: 118, dbp: 78, temp: 36.7, rr: 14, spo2: 98, sleep: 7.5, mood: 7 };
      s.survey = { fatigue: 3, symptomsAnswer: "none", symptoms: [], notes: "" };
      s.labs = { ...s.labs, hemoglobin: 141 };
      return s;
    },
  },
  {
    id: "small-changes", label: "Several small changes", description: "HR +24, sleep 5.0 h, dizziness",
    build: (now = Date.now()) => {
      const s = defaultSnapshot(now);
      s.vitals = { ...s.vitals, hr: 96, sbp: 118, dbp: 78, temp: 36.8, sleep: 5, mood: 6 };
      s.survey = { fatigue: 5, symptomsAnswer: "reported", symptoms: [{ id: "dizziness", severity: "mild" }], notes: "Light-headed after waking." };
      return s;
    },
  },
  {
    id: "breathing", label: "Breathing difficulty (training)", description: "Normal vitals, training trigger selected",
    build: (now = Date.now()) => {
      const s = SCENARIOS[0].build(now);
      s.survey = { fatigue: 3, symptomsAnswer: "reported", symptoms: [{ id: "severe_breathing_difficulty", severity: "severe" }], notes: "" };
      return s;
    },
  },
  {
    id: "missing-bp", label: "Missing blood pressure", description: "BP not measured today",
    build: (now = Date.now()) => {
      const s = SCENARIOS[0].build(now);
      delete s.vitals.sbp;
      delete s.vitals.dbp;
      return s;
    },
  },
  {
    id: "stale", label: "Stale readings", description: "Vitals 30 hours old",
    build: (now = Date.now()) => {
      const s = SCENARIOS[0].build(now);
      s.vitals.measuredAt = iso(now, 30);
      return s;
    },
  },
  {
    id: "co2-headache", label: "CO₂ raised + headache", description: "Context only, no causal claim",
    build: (now = Date.now()) => {
      const s = SCENARIOS[0].build(now);
      s.env.co2Pct = 0.6;
      s.survey = { fatigue: 3, symptomsAnswer: "reported", symptoms: [{ id: "headache", severity: "mild" }], notes: "" };
      return s;
    },
  },
];
