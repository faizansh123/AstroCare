// Trends (FR-09, file 13 §8, P1): one chart per indicator over mission days with the baseline and a shaded
// illustrative threshold band. Gaps are not joined. Data is marked simulated. A data table gives the same values as text.
import rules from "../data/rules.json";
import { METRICS, SIM_LABEL, withGaps, type HistoryPoint } from "../lib/history";
import type { Baseline } from "../types/health";
import { TrendChart } from "./charts";
import { fmt, Icon, METRIC_META, SimTag } from "./ui";

export function Trends({ history, baseline }: { history: HistoryPoint[]; baseline: Baseline | undefined }) {
  const data = withGaps(history);
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Mission days {data[0]?.missionDay}–{data.at(-1)?.missionDay}</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-fg">Trends</h1>
          <p className="mt-1 max-w-2xl text-fg-2">{SIM_LABEL}</p>
        </div>
        <SimTag />
      </div>

      {/* Legend: line style and shape, never colour alone */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-fg-2">
        <span className="flex items-center gap-2"><svg width="22" height="8" aria-hidden><line x1="0" x2="22" y1="4" y2="4" stroke="#7aa7ff" strokeWidth="1.75" /><circle cx="11" cy="4" r="2" fill="#7aa7ff" /></svg>Simulated reading</span>
        <span className="flex items-center gap-2"><svg width="12" height="12" aria-hidden><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" fill="#ededef" /></svg>Check run in this browser</span>
        <span className="flex items-center gap-2"><svg width="22" height="8" aria-hidden><line x1="0" x2="22" y1="4" y2="4" stroke="#71717a" strokeDasharray="4 4" /></svg>Personal baseline (simulated)</span>
        <span className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm bg-accent/15" />Illustrative threshold band</span>
        <span className="flex items-center gap-2"><Icon name="info" className="h-3.5 w-3.5" />Breaks in a line are missed readings</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {METRICS.map((k) => {
          const m = METRIC_META[k];
          const base = baseline?.[k];
          return (
            <section key={k} className="card p-5" aria-labelledby={`tr-${k}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 id={`tr-${k}`} className="text-sm font-semibold text-fg">
                                    {m.label}
                </h2>
                <span className="num text-xs text-fg-3">{m.unit} · baseline {fmt(base, m.digits)}</span>
              </div>
              {base === undefined
                ? <p className="text-sm text-fg-2">No baseline, so no chart.</p>
                : <TrendChart metric={k} data={data} baseline={base} />}
              <p className="mt-2 text-xs text-fg-3">
                {m.rule ? `Band: ${[m.rule.up && `+${m.rule.up}`, m.rule.down && `−${m.rule.down}`, m.rule.abs && `±${m.rule.abs}`].filter(Boolean).join(" / ")} ${m.unit} (illustrative, ${rules.engineVersion})` : "No demo threshold for this indicator"}
              </p>
            </section>
          );
        })}
      </div>

      <details className="card p-5">
        <summary className="cursor-pointer text-sm font-medium text-fg">Show the data as a table</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm num">
            <thead className="text-xs text-fg-3">
              <tr>
                <th className="py-2 pr-4 font-medium">Day</th>
                {METRICS.map((k) => <th key={k} className="py-2 pr-4 font-medium">{METRIC_META[k].short} ({METRIC_META[k].unit})</th>)}
                <th className="py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.missionDay} className="border-t border-edge text-fg-2">
                  <td className="py-1.5 pr-4 text-fg-2">{p.missionDay}</td>
                  {METRICS.map((k) => <td key={k} className="py-1.5 pr-4">{fmt(p[k], METRIC_META[k].digits)}</td>)}
                  <td className="py-1.5 text-xs text-fg-3">{METRICS.every((k) => p[k] === undefined) ? "Missed" : p.source === "check" ? "Check" : "Simulated"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
