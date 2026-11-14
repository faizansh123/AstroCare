// Trend history (FR-09, file 13 §8 Trends). A fictional simulated series plus the checks run in this browser,
// kept in localStorage (file 13 §4). Display only: nothing here feeds the rules engine.
import sim from "../data/history.json";
import type { HealthRecord } from "../types/health";

export const METRICS = ["heartRateBpm", "systolicMmHg", "diastolicMmHg", "temperatureC", "sleepHours", "fatigueScore"] as const;
export type Metric = (typeof METRICS)[number];

export type HistoryPoint = { missionDay: number; source: "simulated" | "check" } & Partial<Record<Metric, number>>;

const KEY = "astrocare.checks.v1";

function readChecks(): HistoryPoint[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCheck(rec: HealthRecord) {
  const point: HistoryPoint = { missionDay: rec.missionDay, source: "check" };
  for (const k of METRICS) if (typeof rec.measurements[k] === "number") point[k] = rec.measurements[k];
  const next = [...readChecks().filter((p) => p.missionDay !== rec.missionDay), point].slice(-60);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable: keep in memory only */ }
}

export function clearChecks() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export const SIM_LABEL = sim.label;

/** Simulated series merged with saved checks; a check on the same mission day replaces the simulated point. */
export function loadHistory(): HistoryPoint[] {
  const byDay = new Map<number, HistoryPoint>();
  for (const p of sim.points) byDay.set(p.missionDay, { ...p, source: "simulated" });
  for (const p of readChecks()) byDay.set(p.missionDay, p);
  return [...byDay.values()].sort((a, b) => a.missionDay - b.missionDay);
}

/** Fill missing mission days with empty points so charts show gaps instead of joining across them. */
export function withGaps(points: HistoryPoint[]): HistoryPoint[] {
  if (points.length === 0) return points;
  const out: HistoryPoint[] = [];
  const byDay = new Map(points.map((p) => [p.missionDay, p]));
  for (let d = points[0].missionDay; d <= points[points.length - 1].missionDay; d++) {
    out.push(byDay.get(d) ?? { missionDay: d, source: "simulated" });
  }
  return out;
}
