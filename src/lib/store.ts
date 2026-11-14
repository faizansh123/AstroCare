// localStorage persistence + JSON export/import (D16, file 07 §10). Not encrypted clinical storage, and the UI never
// claims it is. Every read is validated; anything unreadable falls back to defaults instead of crashing.
import { z } from "zod";
import sim from "../data/history.json";
import { defaultSnapshot } from "../data/scenarios";
import { AiExplanationSchema, AssessmentSchema, SnapshotSchema, type Assessment, type Snapshot } from "../types/health";

const KEYS = { snapshot: "astrocare.v2.snapshot", checkins: "astrocare.v2.checkins", assessments: "astrocare.v2.assessments" };

function read<T>(key: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable: keep in memory only */ }
}

export const loadSnapshot = () => read(KEYS.snapshot, SnapshotSchema, defaultSnapshot());
export const saveSnapshot = (s: Snapshot) => write(KEYS.snapshot, s);

// ---- Assessment history (file 15 §10 workflow 2: "record crew notes and assessment history") ----
// Each record keeps the rules result exactly as it was run, the inputs it was run on, and the explanation outcome
// (Gemini or offline) that was shown. Past records are never re-assessed, so their status cannot drift.
const AiOutcomeSchema = z.object({
  ai: AiExplanationSchema.nullable(), reason: z.string().optional(), model: z.string().optional(), promptVersion: z.string().optional(),
});
export const AssessmentRecordSchema = z.object({
  id: z.string(), assessment: AssessmentSchema, snapshot: SnapshotSchema, ai: AiOutcomeSchema.optional(),
});
export type AssessmentRecord = z.infer<typeof AssessmentRecordSchema>;
const HISTORY_LIMIT = 50;
/** Assessment records, oldest first. Invalid entries are dropped one by one, not the whole list. */
export function loadAssessments(): AssessmentRecord[] {
  const raw = read(KEYS.assessments, z.array(z.unknown()), [] as unknown[]);
  return raw.flatMap((r) => { const p = AssessmentRecordSchema.safeParse(r); return p.success ? [p.data] : []; });
}
export const saveAssessments = (list: AssessmentRecord[]) => write(KEYS.assessments, list.slice(-HISTORY_LIMIT));
export const trimAssessments = (list: AssessmentRecord[]) => list.slice(-HISTORY_LIMIT);

// ---- Trend history (F09) ----
export const TREND_KEYS = ["hr", "sbp", "dbp", "temp", "rr", "spo2", "sleep", "mood"] as const;
export type TrendKey = (typeof TREND_KEYS)[number];
export type TrendPoint = { missionDay: number; origin: "simulated" | "check-in" | "current" } & Partial<Record<TrendKey, number>>;

const n = z.number().optional();
const CheckinSchema = z.array(z.object({ missionDay: z.number(), createdAt: z.string(), hr: n, sbp: n, dbp: n, temp: n, rr: n, spo2: n, sleep: n, mood: n }));
type Checkin = z.infer<typeof CheckinSchema>[number];

export function saveCheckin(s: Snapshot, a: Assessment) {
  const point: Checkin = { missionDay: s.missionDay, createdAt: a.createdAt };
  for (const k of TREND_KEYS) if (typeof s.vitals[k] === "number") point[k] = s.vitals[k]!;
  const prior = read(KEYS.checkins, CheckinSchema, []).filter((p) => p.missionDay !== s.missionDay);
  write(KEYS.checkins, [...prior, point].slice(-90));
}

/** Fictional history, then saved check-ins (latest per day wins), then the current unsaved reading. */
export function loadTrend(current?: Snapshot): TrendPoint[] {
  const byDay = new Map<number, TrendPoint>();
  for (const p of sim.points) byDay.set(p.missionDay, { ...p, origin: "simulated" });
  for (const p of read(KEYS.checkins, CheckinSchema, [])) {
    const { createdAt: _c, missionDay, ...vals } = p;
    byDay.set(missionDay, { missionDay, origin: "check-in", ...vals });
  }
  if (current) {
    const pt: TrendPoint = { missionDay: current.missionDay, origin: "current" };
    for (const k of TREND_KEYS) if (typeof current.vitals[k] === "number") pt[k] = current.vitals[k];
    byDay.set(current.missionDay, pt);
  }
  return [...byDay.values()].sort((a, b) => a.missionDay - b.missionDay);
}

export const TREND_LABEL = sim.label;

export function resetAll() {
  try { Object.values(KEYS).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
}
