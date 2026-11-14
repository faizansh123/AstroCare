import type { AiOutcome } from "./lib/apiClient";
import type { Assessment, Baseline, LogEvent, Snapshot } from "./types/health";

export type Screen =
  | "dashboard" | "vitals" | "spacelab" | "environment"
  | "self-assessment" | "assessment"
  | "bodymap" | "trends" | "guidance" | "research"
  | "log";

export interface AiState { loading: boolean; outcome: AiOutcome | null }

/** Everything a screen needs. One object so screens stay simple props-in components. */
export interface Ctx {
  now: number;
  baseline: Baseline;
  snapshot: Snapshot;
  updateSnapshot: (fn: (s: Snapshot) => Snapshot) => void;
  /** Rules result for the current inputs, recomputed live (deterministic, local). */
  live: Assessment;
  /** Last assessment the astronaut explicitly ran (logged, explained). */
  assessment: Assessment | null;
  assessedSnapshot: Snapshot | null;
  ai: AiState;
  runAssessment: (s?: Snapshot) => void;
  log: LogEvent[];
  addLog: (e: Omit<LogEvent, "id" | "createdAt" | "missionDay">) => void;
  replaceLog: (log: LogEvent[]) => void;
  loadScenario: (id: string) => void;
  go: (s: Screen) => void;
}
