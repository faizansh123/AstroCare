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

export const DeviationSchema = z.object({
  field: z.string(), baseline: z.number(), current: z.number(), delta: z.number(), unit: z.string(), flagged: z.boolean(),
});
export type Deviation = z.infer<typeof DeviationSchema>;

export const AssessmentResultSchema = z.object({
  recordId: z.string(),
  status: StatusSchema,
  deviations: z.array(DeviationSchema),
  triggeredRules: z.array(z.object({ ruleId: z.string(), level: z.enum(["YELLOW", "RED"]), explanation: z.string() })),
  guidanceIds: z.array(z.string()),
  missingFields: z.array(z.string()),
  evaluatedAt: z.string(),
  engineVersion: z.string(),
  disclaimer: z.string(),
});
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

// Body of POST /api/explain (file 13 §7). Free text is length-capped before it reaches the model.
export const ExplainRequestSchema = z.object({
  record: HealthRecordSchema.extend({
    symptoms: z.array(z.object({
      type: SymptomTypeSchema, severity: SeveritySchema,
      onset: z.string().max(100), note: z.string().max(500).optional(),
    })).max(20),
    context: z.object({
      activity: z.string().max(200).optional(),
      posture: z.string().max(100).optional(),
      notes: z.string().max(500).optional(),
    }),
  }),
  result: AssessmentResultSchema,
});
export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;

// What Gemini must return (file 13 §5). Checked by the proxy and again by aiGuard on the client.
export const AiExplanationSchema = z.object({
  explanation: z.string(),
  contributingFactors: z.array(z.string()),
  nextSteps: z.array(z.string()),
  measurementTips: z.array(z.string()),
  reportSummary: z.string(),
  statusEcho: StatusSchema,
});
export type AiExplanation = z.infer<typeof AiExplanationSchema>;
