// F09 Health trends (file 07 §4): time series with the Earth baseline line, mission-day axis and filters.
// Mission log annotations were removed with the Mission Log (owner request, 14 Nov 2026). Historical points before saved check-ins are fictional.
import { useState } from "react";
import { VITALS, type VitalKey } from "../data/catalog";
import { pctDelta, signed, signedPct } from "../lib/deltas";
import { TREND_LABEL, loadTrend } from "../lib/store";
import type { Ctx } from "../appTypes";
import { TrendChart, TrendLegend } from "./charts";
import { Icon } from "./ui";

const METRICS: VitalKey[] = ["hr", "sbp", "dbp", "temp", "rr", "spo2", "sleep", "mood"];

export function Trends({ ctx }: { ctx: Ctx }) {
  const [metric, setMetric] = useState<VitalKey>("hr");
  const m = VITALS[metric];
  const data = loadTrend(ctx.snapshot);
  const base = ctx.baseline.vitals[metric];
  const pts = data.filter((p) => p[metric] !== undefined);
  const latest = pts[pts.length - 1];
  const first = pts[0];
  const series = [{ key: metric, name: m.label, baseline: base }];

  return (
    <div className="space-y-6">
      <div className="seg-group" role="group" aria-label="Metric">
        {METRICS.map((k) => <button key={k} type="button" className="seg" aria-pressed={metric === k} onClick={() => setMetric(k)}>{VITALS[k].label.replace(" (last night)", "")}</button>)}
      </div>

      <section className="card" aria-labelledby="trend-h">
        <header className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="trend-h" className="text-[17px] font-semibold">{m.label} <span className="font-normal text-fg-3">({m.unit})</span></h2>
            <p className="mini">Mission days {data[0]?.missionDay}–{data[data.length - 1]?.missionDay}</p>
          </div>
          {latest && (
            <p className="num text-right">
              <span className="text-[28px] font-semibold leading-none">{latest[metric]!.toFixed(m.digits)}</span>
              <span className="ml-1 text-[13px] text-fg-3">{m.unit}</span>
              <span className="block text-[13px] text-fg-3">{signed(latest[metric]! - base, m.digits)} ({signedPct(pctDelta(latest[metric]!, base))}) vs Earth {base}</span>
            </p>
          )}
        </header>
        {pts.length === 0 ? <p className="mini py-16 text-center">No readings for this metric yet.</p> :
          <TrendChart data={data} series={series} unit={m.unit} digits={m.digits} height={340} />}
        <div className="mt-2">
          <TrendLegend series={series} />
        </div>
        <p className="mini mt-3">{TREND_LABEL} Gaps are missed readings and are not joined. A trend is context for review, not a diagnosis.</p>
        {first && latest && first !== latest && (
          <p className="mini num mt-1">Since day {first.missionDay}: {first[metric]!.toFixed(m.digits)} → {latest[metric]!.toFixed(m.digits)} {m.unit}.</p>
        )}
      </section>

      {latest && (
        <details className="group rounded-2xl border border-edge bg-card">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-5 text-[14px] font-medium text-fg-2 [&::-webkit-details-marker]:hidden">
            All readings ({pts.length})<Icon name="chevron-right" className="h-4 w-4 text-fg-3 transition-transform group-open:rotate-90" />
          </summary>
          <div className="px-5 pb-5">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[12px] text-fg-3"><th className="py-1 font-medium">Day</th><th className="py-1 text-right font-medium">{m.unit}</th><th className="py-1 text-right font-medium">Source</th></tr></thead>
              <tbody>
                {pts.map((p) => (
                  <tr key={p.missionDay} className="border-t border-white/[0.06]">
                    <td className="num py-1.5">D{p.missionDay}</td>
                    <td className="num py-1.5 text-right">{p[metric]!.toFixed(m.digits)}</td>
                    <td className="py-1.5 text-right text-xs text-fg-3">{p.origin === "simulated" ? "History" : p.origin === "check-in" ? "Check-in" : "Current"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
