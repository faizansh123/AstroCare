// Typed entities for the v2 plan (file 07 §9, file 15 §9). Zod schemas are the single source of truth and are
// also used by the server proxy to validate what the client sends.
import { z } from "zod";

export const StatusSchema = z.enum(["GREEN", "YELLOW", "RED", "INSUFFICIENT_DATA"]);
export type Status = z.infer<typeof StatusSchema>;

// Symptom options from the clickable prototype (file 14 §2). "severe_breathing_difficulty" is the default
// RED training trigger (D4, file 11); the trigger list itself lives in rules.json.
export const SymptomIdSchema = z.enum([
  "fatigue", "headache", "dizziness", "nausea", "difficulty_concentrating", "severe_breathing_difficulty",
]);
export type SymptomId = z.infer<typeof SymptomIdSchema>;
export const SeveritySchema = z.enum(["mild", "moderate", "severe"]);
export type Severity = z.infer<typeof SeveritySchema>;

const num = z.number().finite();

export const VitalsSchema = z.object({
  hr: num.optional(), // bpm
  sbp: num.optional(), // mmHg
  dbp: num.optional(), // mmHg
  temp: num.optional(), // °C
  rr: num.optional(), // breaths/min, display only (D26)
  spo2: num.optional(), // %, display only (D26)
  sleep: num.optional(), // hours, preceding night (D11)
  mood: num.optional(), // 1-10, 10 best (D9)
  posture: z.enum(["seated", "supine", "standing", "unknown"]).default("seated"),
  tempSite: z.enum(["oral", "tympanic", "forehead", "unknown"]).default("oral"),
  measuredAt: z.string(),
});
export type Vitals = z.infer<typeof VitalsSchema>;

export const SurveySchema = z.object({
  fatigue: num.optional(), // 0-10 (D10)
  symptomsAnswer: z.enum(["none", "reported", "unanswered"]),
  symptoms: z.array(z.object({ id: SymptomIdSchema, severity: SeveritySchema.optional() })).max(10),
  notes: z.string().max(500),
  // Free text. Always shown with the results; the rules engine does not read it (cannot interpret free text).
  otherSymptoms: z.string().max(300).optional(),
  submittedAt: z.string().optional(),
});
export type Survey = z.infer<typeof SurveySchema>;

export const LabsSchema = z.object({
  hemoglobin: num.optional(), // g/L
  wbc: num.optional(), // x10^9/L
  glucose: num.optional(), // in glucoseUnit
  glucoseUnit: z.enum(["mmol/L", "mg/dL"]).default("mmol/L"), // D23: mmol/L canonical, mg/dL converts at /18
  calcium: num.optional(), // mmol/L
  specimen: z.string().max(60).default("Blood"),
  collectedAt: z.string().optional(),
});
export type Labs = z.infer<typeof LabsSchema>;

export const EnvironmentSchema = z.object({
  co2Pct: num.optional(),
  cabinTempC: num.optional(),
  humidityPct: num.optional(),
  radiationMGy: num.optional(), // optional manual entry, shown only if entered (file 11, still-open 2)
  lightCycle: z.string().max(60).default("Day shift lighting"),
  phase: z.string().max(60),
  observedAt: z.string(),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

/** Everything the astronaut has entered for the current mission day. */
export const SnapshotSchema = z.object({
  missionDay: z.number().int().nonnegative(),
  source: z.literal("simulated"),
  vitals: VitalsSchema,
  survey: SurveySchema,
  labs: LabsSchema,
  env: EnvironmentSchema,
});
export type Snapshot = z.infer<typeof SnapshotSchema>;

export interface Baseline {
  source: "simulated";
  period: string;
  recordedAt: string;
  vitals: { hr: number; sbp: number; dbp: number; temp: number; rr: number; spo2: number; sleep: number; mood: number };
  labs: { hemoglobin: number; wbc: number; glucose: number; calcium: number };
}

// ---- Assessment (rules engine output) ----

export const RuleHitSchema = z.object({
  id: z.string(), // reason code, e.g. YEL-HR (file 07 §7)
  level: z.enum(["RED", "YELLOW", "CONTEXT"]),
  text: z.string(),
  refs: z.array(z.string()),
});
export type RuleHit = z.infer<typeof RuleHitSchema>;

export const DataIssueSchema = z.object({
  id: z.enum(["DATA-MISSING", "DATA-INVALID", "DATA-STALE"]),
  field: z.string(),
  message: z.string(),
});
export type DataIssue = z.infer<typeof DataIssueSchema>;

export const DeltaSchema = z.object({
  ref: z.string(),
  label: z.string(),
  unit: z.string(),
  baseline: z.number(),
  current: z.number(),
  abs: z.number(),
  pct: z.number().nullable(),
  digits: z.number(),
});
export type Delta = z.infer<typeof DeltaSchema>;

/** Possible spaceflight factor for reported symptoms (D24). Never a cause, never changes the status. */
export const HazardLinkSchema = z.object({
  id: z.enum(["radiation", "isolation", "distance", "gravity", "environment"]),
  name: z.string(),
  summary: z.string(),
  symptoms: z.array(z.string()),
  why: z.array(z.string()),
  supporting: z.array(z.string()),
  refs: z.array(z.string()),
  level: z.enum(["none", "possible", "possible-with-context"]),
});
export type HazardLink = z.infer<typeof HazardLinkSchema>;

export const AssessmentSchema = z.object({
  status: StatusSchema,
  hazards: z.array(HazardLinkSchema).max(5),
  rulesFired: z.array(RuleHitSchema),
  context: z.array(RuleHitSchema),
  dataIssues: z.array(DataIssueSchema),
  deltas: z.array(DeltaSchema),
  symptoms: z.array(z.string()),
  dataAgeHours: z.number().nullable(),
  createdAt: z.string(),
  rulesVersion: z.string(),
  limitations: z.array(z.string()),
});
export type Assessment = z.infer<typeof AssessmentSchema>;

// ---- AI explanation (F06 output contract, file 07 §8, file 12 §5) ----

export const AiItemSchema = z.object({ text: z.string().min(1).max(400), refs: z.array(z.string()).min(1).max(8) });
export type AiItem = z.infer<typeof AiItemSchema>;

export const AiExplanationSchema = z.object({
  statusEcho: StatusSchema,
  observedEvidence: z.array(AiItemSchema).max(10),
  baselineComparison: z.array(AiItemSchema).max(12),
  contextualFactors: z.array(AiItemSchema).max(6),
  missingOrUncertain: z.array(AiItemSchema).max(8),
  recommendedVerification: z.array(AiItemSchema).min(1).max(6),
  // One note per NASA hazard (prompt rule 14, D24): possible factors for reported symptoms. Never a cause, never
  // changes the status.
  spaceHazards: z.array(AiItemSchema).max(5),
  escalationPathway: AiItemSchema,
  // D28: AI-written Guidance page. Optional so saved history from before explain.v5 still loads; the prompt and
  // Gemini response schema always ask for it. Checked by the same response check as every other item.
  guidance: z.object({
    forYouNow: z.array(AiItemSchema).min(1).max(5),
    prevention: z.array(AiItemSchema).max(4),
    measurement: z.array(AiItemSchema).max(3),
  }).optional(),
});
export type AiExplanation = z.infer<typeof AiExplanationSchema>;

/** Body of POST /api/explain. Free text is length-capped by the schemas above. */
export const ExplainRequestSchema = z.object({ snapshot: SnapshotSchema, assessment: AssessmentSchema });
export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;
