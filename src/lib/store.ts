// localStorage persistence + JSON export/import (D16, file 07 §10). Not encrypted clinical storage, and the UI never
// claims it is. Every read is validated; anything unreadable falls back to defaults instead of crashing.
import { z } from "zod";
import mission from "../data/mission.json";
import sim from "../data/history.json";
import { defaultSnapshot } from "../data/scenarios";
import { LogEventSchema, SnapshotSchema, type Assessment, type LogEvent, type Snapshot } from "../types/health";

const KEYS = { snapshot: "astrocare.v2.snapshot", log: "astrocare.v2.log", checkins: "astrocare.v2.checkins" };

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

// ---- Mission log ----
const LogSchema = z.array(LogEventSchema);
export const loadLog = () => read(KEYS.log, LogSchema, [] as LogEvent[]);
export const saveLog = (log: LogEvent[]) => write(KEYS.log, log.slice(-500));

let seq = 0;
export function newEvent(e: Omit<LogEvent, "id" | "createdAt" | "missionDay"> & { missionDay?: number }, now = Date.now()): LogEvent {
  return { ...e, missionDay: e.missionDay ?? mission.mission.day, id: `ev-${now.toString(36)}-${(seq++).toString(36)}`, createdAt: new Date(now).toISOString() };
}

/** Chronological (oldest first) export with simulated provenance (file 07 §11 "Export mission log"). */
export function exportLogJson(log: LogEvent[], now = Date.now()): string {
  return JSON.stringify({
    app: "AstroCare",
    exportedAt: new Date(now).toISOString(),
    provenance: "Simulated demo data. Fictional crew member and mission. Not for clinical use.",
    astronaut: mission.astronaut,
    mission: mission.mission,
    events: [...log].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }, null, 2);
}

/** Accepts an AstroCare export. Returns the merged log (deduplicated by id) or an error message. */
export function importLogJson(text: string, current: LogEvent[]): { log: LogEvent[] } | { error: string } {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { error: "File is not valid JSON." }; }
  const events = z.object({ events: LogSchema }).safeParse(data);
  if (!events.success) return { error: "File is not an AstroCare mission log export." };
  const byId = new Map(current.map((e) => [e.id, e]));
  for (const e of events.data.events) byId.set(e.id, e);
  return { log: [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) };
}

// ---- Trend history (F09) ----
export const TREND_KEYS = ["hr", "sbp", "dbp", "temp", "sleep", "mood"] as const;
export type TrendKey = (typeof TREND_KEYS)[number];
export type TrendPoint = { missionDay: number; origin: "simulated" | "check-in" | "current" } & Partial<Record<TrendKey, number>>;

const n = z.number().optional();
const CheckinSchema = z.array(z.object({ missionDay: z.number(), createdAt: z.string(), hr: n, sbp: n, dbp: n, temp: n, sleep: n, mood: n }));
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
