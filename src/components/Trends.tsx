// F09 Health trends (file 07 §4): time series with the Earth baseline line, mission-day axis, annotations from
// mission log events, and filters. Historical points before saved check-ins are fictional.
import { useState } from "react";
import { VITALS, type VitalKey } from "../data/catalog";
import { pctDelta, signed, signedPct } from "../lib/deltas";
import { TREND_LABEL, loadTrend } from "../lib/store";
import type { Ctx } from "../appTypes";
import { TrendChart } from "./charts";
import { Card, Icon, SimTag } from "./ui";

const METRICS: VitalKey[] = ["hr", "sbp", "dbp", "temp", "sleep", "mood"];

export function Trends({ ctx }: { ctx: Ctx }) {
  const [metric, setMetric] = useState<VitalKey>("hr");
  const [showLog, setShowLog] = useState(true);
  const m = VITALS[metric];
  const data = loadTrend(ctx.snapshot);
  const base = ctx.baseline.vitals[metric];
  const pts = data.filter((p) => p[metric] !== undefined);
  const latest = pts[pts.length - 1];
  const first = pts[0];
  const annotationDays = showLog ? [...new Set(ctx.log.map((e) => e.missionDay))].filter((d) => data.some((p) => p.missionDay === d)) : [];

  return (
    <div className="space-y-5">
      <Card title={`Health trends · Mission days ${data[0]?.missionDay}–${data[data.length - 1]?.missionDay}`} icon="chart" aside={<SimTag />}>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="mini">Metric
            <select className="input mt-1 w-56" value={metric} onChange={(e) => setMetric(e.target.value as VitalKey)}>
              {METRICS.map((k) => <option key={k} value={k}>{VITALS[k].label}</option>)}
            </select>
          </label>
          <label className="flex min-h-[42px] items-center gap-2 text-sm text-fg-2">
            <input type="checkbox" className="h-4 w-4 accent-[#46c9c2]" checked={showLog} onChange={(e) => setShowLog(e.target.checked)} />
            Show mission log annotations
          </label>
        </div>
        {pts.length === 0 ? <p className="mini py-10 text-center">No readings for this metric yet.</p> :
          <TrendChart data={data} metric={metric} unit={m.unit} digits={m.digits} baseline={base} annotations={annotationDays} />}
        <ul className="mt-2 flex flex-wrap gap-4 text-xs text-fg-3">
          <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#5fd5e4]" />Simulated history (fictional)</li>
          <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rotate-45 bg-fg" />Saved check-in or current reading</li>
          <li className="flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-earth" />Earth baseline</li>
          <li className="flex items-center gap-1.5"><span className="h-3 w-0 border-l-2 border-dashed border-space" />Mission log event</li>
        </ul>
        <p className="mini mt-2">{TREND_LABEL} Gaps are missed readings and are not joined.</p>
      </Card>

      {latest && (
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Summary" icon="info">
            <p className="text-sm text-fg-2 num">
              <strong className="text-fg">{m.label}</strong>: Earth baseline {base} {m.unit}; latest (day {latest.missionDay}) {latest[metric]!.toFixed(m.digits)} {m.unit};
              change {signed(latest[metric]! - base, m.digits)} {m.unit} ({signedPct(pctDelta(latest[metric]!, base))}).
            </p>
            {first && first !== latest && (
              <p className="mini mt-2 num">Since day {first.missionDay}: {first[metric]!.toFixed(m.digits)} → {latest[metric]!.toFixed(m.digits)} {m.unit}.</p>
            )}
            <p className="mini mt-2">A trend is context for review, not a diagnosis.</p>
          </Card>
          <Card title="Readings" icon="list">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-fg-3"><th className="py-1">Day</th><th className="py-1 text-right">{m.unit}</th><th className="py-1 text-right">Source</th></tr></thead>
              <tbody>
                {pts.map((p) => (
                  <tr key={p.missionDay} className="border-t border-edge/60">
                    <td className="num py-1.5">D{p.missionDay}</td>
                    <td className="num py-1.5 text-right">{p[metric]!.toFixed(m.digits)}</td>
                    <td className="py-1.5 text-right text-xs text-fg-3">
                      {p.origin === "simulated" ? "Fictional" : p.origin === "check-in" ? "Check-in" : <span className="inline-flex items-center gap-1"><Icon name="clock" className="h-3 w-3" />Current</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
