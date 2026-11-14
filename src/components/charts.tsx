// Charts (FR-09, file 13 §8 Trends): a line per indicator over mission days, a shaded illustrative threshold band
// around the baseline, gaps never joined, data marked simulated. Every chart has a text/table reading too.
import {
  CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
  type TooltipProps,
} from "recharts";
import type { Deviation } from "../types/health";
import type { HistoryPoint, Metric } from "../lib/history";
import { fmt, Icon, METRIC_META, thresholdBand } from "./ui";

const ACCENT = "#7aa7ff";
const MONO = "Geist Mono Variable";

function domainFor(values: number[], baseline: number, band: [number, number] | null, digits: number): [number, number] {
  const lo = Math.min(...values, baseline, band && Number.isFinite(band[0]) ? band[0] : baseline);
  const hi = Math.max(...values, baseline, band && Number.isFinite(band[1]) ? band[1] : baseline);
  const pad = Math.max((hi - lo) * 0.15, 0.5);
  const step = digits === 0 ? 1 : 0.1;
  return [Math.floor((lo - pad) / step) * step, Math.ceil((hi + pad) / step) * step].map((v) => +v.toFixed(digits)) as [number, number];
}

function ChartTooltip({ active, payload, metric }: TooltipProps<number, string> & { metric: Metric }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as HistoryPoint;
  const v = p[metric];
  const m = METRIC_META[metric];
  return (
    <div className="rounded-lg border border-edge-strong bg-surface-2 px-3 py-2 text-xs shadow-xl shadow-black/40">
      <p className="text-fg-3">Mission day {p.missionDay}</p>
      <p className="num mt-0.5 text-base font-semibold text-fg">
        {v === undefined ? "No reading" : `${fmt(v, m.digits)} ${m.unit}`}
      </p>
      <p className="text-fg-3">{p.source === "check" ? "Check run in this browser" : "Simulated (fictional)"}</p>
    </div>
  );
}

export function TrendChart({ metric, data, baseline, height = 180 }: {
  metric: Metric; data: HistoryPoint[]; baseline: number; height?: number;
}) {
  const m = METRIC_META[metric];
  const band = thresholdBand(baseline, m.rule);
  const values = data.map((p) => p[metric]).filter((v): v is number => typeof v === "number");
  const [y0, y1] = domainFor(values, baseline, band, m.digits);
  const checkDays = data.filter((p) => p.source === "check" && p[metric] !== undefined);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#1f1f23" vertical={false} />
          {band && (
            <ReferenceArea y1={Math.max(band[0], y0)} y2={Math.min(band[1], y1)} fill={ACCENT} fillOpacity={0.045}
              strokeOpacity={0} ifOverflow="hidden" />
          )}
          <ReferenceLine y={baseline} stroke="#71717a" strokeDasharray="4 4" />
          <XAxis dataKey="missionDay" tick={{ fill: "#71717a", fontSize: 11, fontFamily: MONO }}
            tickLine={false} axisLine={{ stroke: "#232327" }} interval="preserveStartEnd" minTickGap={16} />
          <YAxis domain={[y0, y1]} tick={{ fill: "#71717a", fontSize: 11, fontFamily: MONO }}
            tickLine={false} axisLine={false} width={40} tickCount={4}
            allowDecimals={m.digits > 0} tickFormatter={(v: number) => v.toFixed(m.digits)} />
          <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ stroke: "#303036" }} />
          <Line type="linear" dataKey={metric} stroke={ACCENT} strokeWidth={1.75} connectNulls={false} isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; payload?: HistoryPoint; index?: number }) => {
              const { cx, cy, payload, index } = props;
              if (cx === undefined || cy === undefined || payload?.[metric] === undefined) return <g key={index} />;
              const isCheck = payload.source === "check";
              return isCheck
                ? <rect key={index} x={cx - 5} y={cy - 5} width={10} height={10} transform={`rotate(45 ${cx} ${cy})`} fill="#ededef" stroke="#121214" strokeWidth={2} />
                : <circle key={index} cx={cx} cy={cy} r={2} fill={ACCENT} />;
            }}
            activeDot={{ r: 4.5, fill: "#ededef", stroke: "#121214", strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <span className="sr-only">
        {m.label} over mission days {data[0]?.missionDay} to {data[data.length - 1]?.missionDay}. Baseline {baseline} {m.unit}.
        {checkDays.length ? ` ${checkDays.length} check(s) from this browser.` : ""}
      </span>
    </div>
  );
}

/** Tiny line for indicator cards. Gaps break the line. Decorative: the card shows the numbers as text. */
export function Sparkline({ values, baseline, className = "h-10 w-full" }: { values: (number | undefined)[]; baseline: number; className?: string }) {
  const nums = values.filter((v): v is number => v !== undefined);
  if (nums.length < 2) return <div className={className} />;
  const lo = Math.min(...nums, baseline), hi = Math.max(...nums, baseline);
  const span = hi - lo || 1;
  const W = 120, H = 36;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - 3 - ((v - lo) / span) * (H - 6);
  const segs: string[] = [];
  let cur = "";
  values.forEach((v, i) => {
    if (v === undefined) { if (cur) segs.push(cur); cur = ""; return; }
    cur += `${cur ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
  });
  if (cur) segs.push(cur);
  const lastIdx = values.length - 1 - [...values].reverse().findIndex((v) => v !== undefined);
  const last = values[lastIdx]!;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className={className}>
      <line x1="0" x2={W} y1={y(baseline)} y2={y(baseline)} stroke="#52525b" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      {segs.map((d, i) => <path key={i} d={d} fill="none" stroke={ACCENT} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />)}
      <circle cx={x(lastIdx)} cy={y(last)} r="2.4" fill="#ededef" />
    </svg>
  );
}

/** One row of the baseline comparison: label, value, a track with the illustrative band, baseline tick and today. */
export function DeviationRow({ d }: { d: Deviation }) {
  const meta = METRIC_META[d.field as Metric];
  const band = meta ? thresholdBand(d.baseline, meta.rule) : null;
  const finite = band ? band.filter(Number.isFinite) : [];
  const reach = Math.max(Math.abs(d.delta), ...finite.map((b) => Math.abs(b - d.baseline)), d.baseline * 0.05) * 1.6;
  const lo = d.baseline - reach, hi = d.baseline + reach;
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
  const bandL = band ? pct(Number.isFinite(band[0]) ? band[0] : lo) : 0;
  const bandR = band ? pct(Number.isFinite(band[1]) ? band[1] : hi) : 0;
  const digits = meta?.digits ?? 1;

  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-5 md:grid-cols-[minmax(150px,1.1fr)_110px_minmax(160px,2fr)_120px]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">{meta?.label ?? d.field}</p>
        <p className="text-xs text-fg-3">Baseline <span className="num">{fmt(d.baseline, digits)}</span> {d.unit}</p>
      </div>
      <p className="num text-right text-xl font-semibold text-fg md:text-left">
        {fmt(d.current, digits)}<span className="ml-1 text-xs font-normal text-fg-3">{d.unit}</span>
      </p>
      <div className="relative col-span-2 h-1.5 rounded-full bg-surface-3 md:col-span-1" aria-hidden>
        {band && <div className="absolute inset-y-0 rounded-full bg-accent/25" style={{ left: `${bandL}%`, right: `${100 - bandR}%` }} />}
        <div className="absolute -top-1.5 h-[18px] w-px bg-fg-3" style={{ left: `${pct(d.baseline)}%` }} />
        <div className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-surface ${d.flagged ? "bg-amber-400" : "bg-fg"}`}
          style={{ left: `${pct(d.current)}%` }} />
      </div>
      <p className="col-span-2 flex items-center justify-between gap-2 text-xs md:col-span-1 md:flex-col md:items-end md:gap-0.5">
        <span className={`num ${d.flagged ? "font-medium text-amber-300" : "text-fg-2"}`}>
          {d.delta > 0 ? "+" : ""}{fmt(d.delta, digits)} {d.unit}
        </span>
        {d.flagged
          ? <span className="flex items-center gap-1 font-medium text-amber-300"><Icon name="alert" className="h-3.5 w-3.5" strokeWidth={2.2} />Flagged</span>
          : <span className="text-fg-3">{band ? "Inside band" : "No demo threshold"}</span>}
      </p>
    </li>
  );
}
