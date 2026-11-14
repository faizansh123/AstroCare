// Results (file 13 §8): status, rules that fired, deviations, missing fields, body map, trend context, AI panel.
// The status shown here comes only from the local rules engine. No animation on this screen (RED included).
import { useState } from "react";
import type { AssessmentResult, HealthRecord } from "../types/health";
import type { AiOutcome } from "../lib/apiClient";
import { withGaps, type HistoryPoint, type Metric } from "../lib/history";
import { AiPanel } from "./AiPanel";
import { BODY_MAP_NOTE, BodyMap, RegionList, type RegionId } from "./BodyMap";
import { DeviationRow, TrendChart } from "./charts";
import { StatusBadge } from "./StatusBadge";
import { Card, FIELD_LABELS, Icon, METRIC_META, SimTag } from "./ui";

const LEVEL = {
  RED: { cls: "bg-red-400/10 text-red-300", icon: "octagon", label: "Red" },
  YELLOW: { cls: "bg-amber-400/10 text-amber-300", icon: "alert", label: "Yellow" },
} as const;

export function Results({ result, ai, aiLoading, onBack, history, missionDay, onOpenTrends, symptoms }: {
  symptoms: HealthRecord["symptoms"]; result: AssessmentResult; ai: AiOutcome | null; aiLoading: boolean; onBack: () => void;
  history: HistoryPoint[]; missionDay: number; onOpenTrends: () => void;
}) {
  const [region, setRegion] = useState<RegionId | null>(null);
  const flagged = result.deviations.filter((d) => d.flagged);
  const trendFields = (flagged.length ? flagged : result.deviations).slice(0, 2);
  const data = withGaps(history.filter((p) => p.missionDay <= missionDay).slice(-15));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Mission day {missionDay} · {new Date(result.evaluatedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-fg">Check result</h1>
        </div>
        <button type="button" onClick={onBack} className="btn-secondary self-start sm:self-auto"><Icon name="arrow-left" /> New check</button>
      </div>

      <StatusBadge status={result.status} meta={<span className="code">{result.engineVersion}</span>} />

      {result.missingFields.length > 0 && (
        <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
          <Icon name="help" className="h-5 w-5 shrink-0 text-zinc-300" />
          <div>
            <p className="font-medium text-fg">Missing inputs</p>
            <p className="text-sm text-fg-2">Remeasure or answer these to get a full result. Missing data never counts as Green.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.missingFields.map((f) => <span key={f} className="tag bg-surface-3 text-fg-2">{FIELD_LABELS[f] ?? f}</span>)}
            </div>
          </div>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1fr]">
        <Card title="Why this status" kicker="Rules engine"
          aside={<span className="text-sm text-fg-3">{result.triggeredRules.length} rule(s) fired</span>}>
          {result.triggeredRules.length === 0 ? (
            <p className="text-fg-2">No demo rules fired.</p>
          ) : (
            <ol className="divide-y divide-edge">
              {result.triggeredRules.map((r, i) => {
                const l = LEVEL[r.level];
                return (
                  <li key={`${r.ruleId}-${i}`} className="flex items-start gap-3 py-3 first:pt-0">
                    <span className={`tag mt-0.5 shrink-0 ${l.cls}`}><Icon name={l.icon} className="h-3.5 w-3.5" strokeWidth={2.2} />{l.label}</span>
                    <span className="min-w-0">
                      <span className="block text-fg">{r.explanation}</span>
                      <span className="code text-fg-3">{r.ruleId}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          {/* Symptom override: every reported symptom is shown, whatever the vitals say (file 10 §7) */}
          <div className="mt-5 border-t border-edge pt-4">
            <p className="eyebrow mb-2">Reported symptoms ({symptoms.length})</p>
            {symptoms.length === 0 ? (
              <p className="text-sm text-fg-2">None reported in this check.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {symptoms.map((s, i) => (
                  <li key={i} className="tag bg-surface-3 text-fg">
                    {s.type.replace(/_/g, " ")} · {s.severity} · {s.onset}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card title="Body map" kicker="Rules by body area">
          <div className="grid items-center gap-6 sm:grid-cols-[140px_1fr]">
            <div className="mx-auto h-[280px] w-full max-w-[140px]">
              <BodyMap result={result} selected={region} onSelect={setRegion} />
            </div>
            <RegionList result={result} selected={region} onSelect={setRegion} />
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-fg-3"><Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />{BODY_MAP_NOTE}</p>
        </Card>
      </div>

      <section aria-labelledby="bc-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="bc-h" className="text-base font-semibold tracking-tight text-fg">Baseline comparison</h2>
          <SimTag>Simulated placeholder baseline</SimTag>
        </div>
        {result.deviations.length === 0 ? (
          <p className="card p-5 text-fg-2">No values to compare.</p>
        ) : (
          <div className="card overflow-hidden">
            <ul className="divide-y divide-edge">
              {result.deviations.map((d) => <DeviationRow key={d.field} d={d} />)}
            </ul>
            <p className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-edge bg-surface-2/50 px-5 py-3 text-xs text-fg-3">
              <span className="flex items-center gap-2"><span className="h-3 w-px bg-fg-3" />Baseline</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-5 rounded-full bg-accent/25" />Illustrative band (no rule fires inside it)</span>
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-fg" />Today</span>
            </p>
          </div>
        )}
      </section>

      {trendFields.length > 0 && data.length > 1 && (
        <Card title={flagged.length ? "Flagged indicators over recent days" : "Recent days"} kicker="Trend context"
          aside={<button type="button" onClick={onOpenTrends} className="btn-quiet !min-h-[36px]">All trends <Icon name="arrow-right" /></button>}>
          <div className="grid gap-6 md:grid-cols-2">
            {trendFields.map((d) => (
              <div key={d.field}>
                <p className="mb-2 text-sm text-fg-2">{METRIC_META[d.field as Metric].label}</p>
                <TrendChart metric={d.field as Metric} data={data} baseline={d.baseline} height={160} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-fg-3">Earlier days are simulated (fictional). The diamond is this check.</p>
        </Card>
      )}

      <AiPanel ai={ai} loading={aiLoading} />

      <p className="text-xs leading-relaxed text-fg-3">{result.disclaimer}</p>
    </div>
  );
}
