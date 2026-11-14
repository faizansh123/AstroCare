// Data contracts from file 13 §5 / file 10 §11. Zod schemas are the single source of truth.
import { z } from "zod";

export const StatusSchema = z.enum(["GREEN", "YELLOW", "RED", "INSUFFICIENT_DATA"]);
export type Status = z.infer<typeof StatusSchema>;

export const SymptomTypeSchema = z.enum([
  "dizziness", "headache", "unusual_fatigue", "sleep_problems", "muscle_weakness",
  "chest_pain", "shortness_of_breath", "fainting", "other",
]); // FR-03; red-flag subset lives in rules.json (pending Nabeeha's review)
export type SymptomType = z.infer<typeof SymptomTypeSchema>;

export const SeveritySchema = z.enum(["mild", "moderate", "severe"]);

export const HealthRecordSchema = z.object({
  recordId: z.string(),
  astronautId: z.string(),
  missionDay: z.number().int().nonnegative(),
  recordedAt: z.string(), // ISO
  source: z.enum(["simulated", "manual"]),
  environment: z.enum(["spacecraft", "station", "rover", "lunar_base", "mars_base"]),
  measurements: z.object({
    heartRateBpm: z.number().optional(),
    systolicMmHg: z.number().optional(),
    diastolicMmHg: z.number().optional(),
    temperatureC: z.number().optional(),
    sleepHours: z.number().optional(),
    fatigueScore: z.number().optional(),
    mood: z.enum(["good", "ok", "low", "prefer_not_to_say"]).optional(),
  }),
  symptoms: z.array(z.object({
    type: SymptomTypeSchema,
    severity: SeveritySchema,
    onset: z.string(),
    note: z.string().optional(),
  })),
  symptomsAnswer: z.enum(["reported", "none", "unknown"]).optional(),
  context: z.object({
    activity: z.string().optional(),
    posture: z.string().optional(),
    notes: z.string().optional(),
  }),
});
export type HealthRecord = z.infer<typeof HealthRecordSchema>;
export type Measurements = HealthRecord["measurements"];

export interface Baseline {
  astronautId: string;
  heartRateBpm: number; systolicMmHg: number; diastolicMmHg: number;
  temperatureC: number; sleepHours: number; fatigueScore: number;
}

export interface Deviation {
  field: string; baseline: number; current: number; delta: number; unit: string; flagged: boolean;
}

export interface AssessmentResult {
  recordId: string;
  status: Status;
  deviations: Deviation[];
  triggeredRules: { ruleId: string; level: "YELLOW" | "RED"; explanation: string }[];
  guidanceIds: string[];
  missingFields: string[];
  evaluatedAt: string;
  engineVersion: string;
  disclaimer: string;
}

// What Gemini must return (file 13 §5). Used by the proxy once the key exists.
export const AiExplanationSchema = z.object({
  explanation: z.string(),
  contributingFactors: z.array(z.string()),
  nextSteps: z.array(z.string()),
  measurementTips: z.array(z.string()),
  reportSummary: z.string(),
  statusEcho: StatusSchema,
});
export type AiExplanation = z.infer<typeof AiExplanationSchema>;
