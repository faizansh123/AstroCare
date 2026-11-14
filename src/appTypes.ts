import type { AiOutcome } from "./lib/apiClient";
import type { AssessmentRecord } from "./lib/store";
import type { Assessment, Baseline, Snapshot } from "./types/health";

export type Screen =
  | "dashboard" | "vitals" | "spacelab" | "environment"
  | "self-assessment" | "assessment"
  | "bodymap" | "trends" | "guidance" | "research";

export interface AiState { loading: boolean; outcome: AiOutcome | null }

/** Everything a screen needs. One object so screens stay simple props-in components. */
export interface Ctx {
  now: number;
  baseline: Baseline;
  snapshot: Snapshot;
  updateSnapshot: (fn: (s: Snapshot) => Snapshot) => void;
  /** Rules result for the current inputs, recomputed live (deterministic, local). */
  live: Assessment;
  /** Last assessment the astronaut explicitly ran (saved to history, explained). */
  assessment: Assessment | null;
  assessedSnapshot: Snapshot | null;
  ai: AiState;
  /** Saved assessments, oldest first. The last one is the most recent run. */
  history: AssessmentRecord[];
  runAssessment: (s?: Snapshot) => void;
  loadScenario: (id: string) => void;
  go: (s: Screen) => void;
}
