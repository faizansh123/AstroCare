import type { AiExplanation, AssessmentResult } from "../types/health";
import { StatusBadge } from "./StatusBadge";
import { Card, FIELD_LABELS } from "./ui";

const LEVEL_CLS = {
  RED: "border-red-400/60 bg-red-950/50 text-red-200",
  YELLOW: "border-amber-400/60 bg-amber-950/50 text-amber-200",
} as const;

export function Results({ result, ai, aiLoading, onBack }: {
  result: AssessmentResult; ai: AiExplanation | null; aiLoading: boolean; onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <StatusBadge status={result.status} />

      {result.missingFields.length > 0 && (
        <div className="rounded-xl border border-slate-600 bg-slate-900 p-4">
          <p className="font-semibold text-slate-100">? Missing inputs</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.missingFields.map((f) => (
              <span key={f} className="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-300">{FIELD_LABELS[f] ?? f}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-400">Remeasure or answer these to get a full result.</p>
        </div>
      )}

      <Card title="Why this status" aside={<span className="text-xs text-slate-500">{result.triggeredRules.length} rule(s) fired</span>}>
        {result.triggeredRules.length === 0 ? (
          <p className="text-slate-400">No demo rules fired.</p>
        ) : (
          <ul className="space-y-2">
            {result.triggeredRules.map((r, i) => (
              <li key={`${r.ruleId}-${i}`} className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 rounded border px-2 py-0.5 text-xs font-bold ${LEVEL_CLS[r.level]}`}>
                  {r.level === "RED" ? "▲ RED" : "! YELLOW"}
                </span>
                <span className="text-slate-200">{r.explanation}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Baseline comparison"
        aside={<span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">Simulated placeholder baseline</span>}>
        {result.deviations.length === 0 ? (
          <p className="text-slate-400">No values to compare.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.deviations.map((d) => (
              <div key={d.field} className={`rounded-xl border p-4 ${d.flagged ? "border-amber-400/60 bg-amber-950/30" : "border-slate-800 bg-slate-950/40"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{FIELD_LABELS[d.field] ?? d.field}</p>
                  {d.flagged && <span className="text-xs font-bold text-amber-300">⚑ Flagged</span>}
                </div>
                <p className="mt-1 text-2xl font-bold text-white">{d.current}<span className="ml-1 text-sm font-normal text-slate-400">{d.unit}</span></p>
                <p className="text-sm text-slate-400">
                  Baseline {d.baseline} ·{" "}
                  <span className={d.flagged ? "font-semibold text-amber-300" : "text-slate-300"}>
                    {d.delta > 0 ? "▲ +" : d.delta < 0 ? "▼ " : "= "}{d.delta}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="AI-generated explanation"
        aside={<span className="rounded-full border border-violet-400/40 px-3 py-1 text-xs text-violet-300">AI · does not set status</span>}>
        {aiLoading ? (
          <p className="text-slate-400">Loading explanation…</p>
        ) : ai ? (
          <p className="text-slate-200">{ai.explanation}</p>
        ) : (
          <p className="text-slate-400">AI explanation unavailable. The rules result above is complete on its own.</p>
        )}
      </Card>

      <div className="flex flex-col gap-4 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {result.disclaimer}<br />
          Engine {result.engineVersion} · {new Date(result.evaluatedAt).toLocaleString()}
        </p>
        <button onClick={onBack}
          className="shrink-0 rounded-xl border border-slate-600 px-6 py-2.5 font-medium hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400">
          ← New check
        </button>
      </div>
    </div>
  );
}
