// Dashboard (FR-07, file 13 §8): fictional profile, mission day, environment, indicator cards with baseline delta,
// latest status (colour + icon + text), "Start check", and the scenario picker. Values shown here that were not run
// through the rules engine are labelled "not evaluated" and carry no flag.
import { useState } from "react";
import scenarios from "../data/scenarios.json";
import type { AssessmentResult, Baseline, HealthRecord } from "../types/health";
import { METRICS, type HistoryPoint } from "../lib/history";
import { BODY_MAP_NOTE, BodyMap, RegionList, type RegionId } from "./BodyMap";
import { Sparkline } from "./charts";
import { STATUS_STYLE, StatusChip } from "./StatusBadge";
import { Card, fmt, Icon, METRIC_META, SimTag } from "./ui";

const ENV_LABEL: Record<HealthRecord["environment"], string> = {
  spacecraft: "Spacecraft", station: "Station", rover: "Rover", lunar_base: "Lunar base", mars_base: "Mars base",
};

export function Dashboard({ baseline, history, result, record, onStart, onOpenResults, onOpenTrends }: {
  baseline: Baseline | undefined; history: HistoryPoint[]; result: AssessmentResult | null; record: HealthRecord | null;
  onStart: (scenarioId?: string) => void; onOpenResults: () => void; onOpenTrends: () => void;
}) {
  const [region, setRegion] = useState<RegionId | null>(null);
  const day = record?.missionDay ?? (history.at(-1)?.missionDay ?? 41) + 1;
  const env = record?.environment ?? "station";
  const recent = history.slice(-14);
  const st = result ? STATUS_STYLE[result.status] : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Mission day {day} · {ENV_LABEL[env]}</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-fg sm:text-[32px]">AC-01 health overview</h1>
          <p className="mt-1 max-w-xl text-fg-2">Today's readings against a personal baseline. Status comes from transparent demo rules, never from AI.</p>
        </div>
        <div className="flex gap-2">
          {result && <button type="button" onClick={onOpenResults} className="btn-secondary">Last result</button>}
          <button type="button" onClick={() => onStart()} className="btn-primary">Start daily check <Icon name="arrow-right" /></button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Latest status */}
        <section aria-labelledby="st-h" className={`card flex flex-col justify-between gap-6 p-5 sm:p-6 lg:col-span-2 ${st ? st.tint : ""}`}>
          <div className="flex items-start gap-4">
            {st ? (
              <span aria-hidden className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${st.solid}`}>
                <Icon name={st.icon} className="h-5 w-5" strokeWidth={2.4} />
              </span>
            ) : (
              <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-edge-strong text-fg-3">
                <Icon name="clipboard" className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              <p className="eyebrow">Latest status</p>
              <h2 id="st-h" className="text-xl font-semibold tracking-tight text-fg">
                {result && st ? <><span className={st.text}>{st.short}</span> · {st.title}</> : "No check run today"}
              </h2>
              <p className="mt-1 text-sm text-fg-2">
                {result
                  ? `Day ${record?.missionDay} · ${result.triggeredRules.length} rule(s) fired · ${new Date(result.evaluatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "There is no status until a check runs. Missing data never shows as Green."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-edge pt-4">
            <span className="mr-1 text-sm text-fg-3">Try a fictional case</span>
            {scenarios.map((s) => (
              <button key={s.id} type="button" onClick={() => onStart(s.id)} className="btn-secondary !min-h-[36px] !px-3">
                {s.label.replace(" (fictional)", "")}
              </button>
            ))}
          </div>
        </section>

        {/* Profile */}
        <section aria-labelledby="pf-h" className="card p-5 sm:p-6">
          <h2 id="pf-h" className="eyebrow">Crew profile</h2>
          <dl className="mt-3 divide-y divide-edge text-sm">
            {[
              ["Astronaut", "AC-01 (fictional)"],
              ["Mission day", String(day)],
              ["Habitat", ENV_LABEL[env]],
              ["Baseline", baseline ? "Simulated placeholder" : "Missing"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-fg-3">{k}</dt>
                <dd className="text-right font-medium text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Indicators: one surface, divided cells */}
      <section aria-labelledby="ind-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="ind-h" className="text-base font-semibold tracking-tight text-fg">Indicators <span className="font-normal text-fg-3">· last 14 days</span></h2>
          <div className="flex items-center gap-2">
            <SimTag>Simulated history</SimTag>
            <button type="button" onClick={onOpenTrends} className="btn-quiet !min-h-[36px]">View trends <Icon name="arrow-right" /></button>
          </div>
        </div>
        <div className="grid gap-px overflow-hidden rounded-xl border border-edge bg-edge sm:grid-cols-2 xl:grid-cols-3">
          {METRICS.map((k) => {
            const m = METRIC_META[k];
            const dev = result?.deviations.find((d) => d.field === k);
            const lastPoint = [...history].reverse().find((p) => p[k] !== undefined);
            const value = dev?.current ?? lastPoint?.[k];
            const base = baseline?.[k];
            const delta = value !== undefined && base !== undefined ? value - base : undefined;
            return (
              <button key={k} type="button" onClick={onOpenTrends}
                className="group bg-surface p-5 text-left transition-colors hover:bg-surface-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-fg-2">{m.label}</span>
                  {dev?.flagged
                    ? <span className="tag bg-amber-400/10 text-amber-300"><Icon name="alert" className="h-3 w-3" strokeWidth={2.2} />Flagged</span>
                    : <span className="text-xs text-fg-3">{dev ? "Evaluated" : "Not evaluated"}</span>}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="num text-[28px] font-semibold leading-none text-fg">{fmt(value, m.digits)}</span>
                  <span className="text-sm text-fg-3">{m.unit}</span>
                  <span className={`num ml-auto text-xs ${dev?.flagged ? "text-amber-300" : "text-fg-3"}`}>
                    {delta === undefined ? "" : `${delta > 0 ? "+" : ""}${fmt(delta, m.digits)} vs ${fmt(base, m.digits)}`}
                  </span>
                </div>
                {base !== undefined && <Sparkline values={recent.map((p) => p[k])} baseline={base} className="mt-4 h-9 w-full" />}
                <p className="mt-2 text-xs text-fg-3">
                  {dev ? `This check · day ${record?.missionDay}` : lastPoint ? `Simulated · day ${lastPoint.missionDay}` : "No reading"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Body map */}
      <Card title="Body map" kicker="Latest check by body area"
        aside={result ? <StatusChip status={result.status} /> : <span className="tag bg-surface-3 text-fg-3">No check yet</span>}>
        <div className="grid items-center gap-8 md:grid-cols-[200px_1fr]">
          <div className="mx-auto h-[300px] w-full max-w-[160px] md:h-[340px] md:max-w-[180px]">
            <BodyMap result={result} selected={region} onSelect={setRegion} />
          </div>
          <div>
            <RegionList result={result} selected={region} onSelect={setRegion} />
            <p className="mt-3 flex items-start gap-2 text-xs text-fg-3"><Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />{BODY_MAP_NOTE}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
