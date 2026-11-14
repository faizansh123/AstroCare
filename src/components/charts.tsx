// Charts. Every chart also has a text reading (numbers beside it or an sr-only summary).
import {
  CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps,
} from "recharts";
import type { TrendKey, TrendPoint } from "../lib/store";

const ACCENT = "#5fd5e4";

/** Tiny decorative line for indicator cards (numbers are shown as text on the card). */
export function Sparkline({ values, baseline, className = "h-9 w-full" }: { values: (number | undefined)[]; baseline: number; className?: string }) {
  const nums = values.filter((v): v is number => v !== undefined);
  if (nums.length < 2) return <div className={className} />;
  const lo = Math.min(...nums, baseline), hi = Math.max(...nums, baseline);
  const span = hi - lo || 1;
  const W = 120, H = 34;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - 3 - ((v - lo) / span) * (H - 6);
  let d = "";
  values.forEach((v, i) => { if (v !== undefined) d += `${d && values[i - 1] !== undefined ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`; });
  const lastIdx = values.length - 1 - [...values].reverse().findIndex((v) => v !== undefined);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className={className}>
      <line x1="0" x2={W} y1={y(baseline)} y2={y(baseline)} stroke="#4daee7" strokeOpacity="0.6" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke={ACCENT} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={x(lastIdx)} cy={y(values[lastIdx]!)} r="2.6" fill="#e8f3ff" />
    </svg>
  );
}

/** Earth vs in-flight pair of bars (prototype "barrow"). Width relative to the larger value. */
export function EarthSpaceBars({ earth, space, unit, digits }: { earth: number; space?: number; unit: string; digits: number }) {
  const max = Math.max(earth, space ?? 0) * 1.12 || 1;
  return (
    <div className="space-y-1.5" aria-hidden>
      <div className="flex items-center gap-2">
        <div className="h-3 rounded bg-earth" style={{ width: `${(earth / max) * 100}%` }} />
        <span className="num text-xs text-fg-3">{earth.toFixed(digits)} {unit}</span>
      </div>
      <div className="flex items-center gap-2">
        {space === undefined
          ? <span className="text-xs italic text-fg-3">not measured</span>
          : <><div className="h-3 rounded bg-space" style={{ width: `${(space / max) * 100}%` }} /><span className="num text-xs text-fg-3">{space.toFixed(digits)} {unit}</span></>}
      </div>
    </div>
  );
}

const ORIGIN_TEXT = { simulated: "Simulated history (fictional)", "check-in": "Saved check-in", current: "Current reading" } as const;

function ChartTip({ active, payload, metric, unit, digits }: TooltipProps<number, string> & { metric: TrendKey; unit: string; digits: number }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as TrendPoint;
  const v = p[metric];
  return (
    <div className="rounded-lg border border-edge-strong bg-card px-3 py-2 text-xs shadow-xl shadow-black/50">
      <p className="text-fg-3">Mission day {p.missionDay}</p>
      <p className="num text-base font-semibold text-fg">{v === undefined ? "No reading" : `${v.toFixed(digits)} ${unit}`}</p>
      <p className="text-fg-3">{ORIGIN_TEXT[p.origin]}</p>
    </div>
  );
}

export function TrendChart({ data, metric, unit, digits, baseline, annotations, height = 280 }: {
  data: TrendPoint[]; metric: TrendKey; unit: string; digits: number; baseline: number; annotations: number[]; height?: number;
}) {
  const vals = data.map((p) => p[metric]).filter((v): v is number => v !== undefined);
  const lo = Math.min(...vals, baseline), hi = Math.max(...vals, baseline);
  const pad = Math.max((hi - lo) * 0.2, digits ? 0.3 : 2);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="#25445d" strokeOpacity={0.5} vertical={false} />
          {annotations.map((d) => (
            <ReferenceLine key={d} x={d} stroke="#b69bff" strokeOpacity={0.55} strokeDasharray="2 4"
              label={{ value: "log", position: "top", fill: "#b69bff", fontSize: 10 }} />
          ))}
          <ReferenceLine y={baseline} stroke="#4daee7" strokeDasharray="5 4"
            label={{ value: `Earth ${baseline}`, position: "insideBottomLeft", fill: "#4daee7", fontSize: 11 }} />
          <XAxis dataKey="missionDay" tickFormatter={(d: number) => `D${d}`} tick={{ fill: "#96aec7", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#365570" }} />
          <YAxis domain={[Math.floor((lo - pad) * 10) / 10, Math.ceil((hi + pad) * 10) / 10]} tick={{ fill: "#96aec7", fontSize: 12 }}
            tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => v.toFixed(digits)} />
          <Tooltip content={<ChartTip metric={metric} unit={unit} digits={digits} />} cursor={{ stroke: "#365570" }} />
          <Line type="monotone" dataKey={metric} stroke={ACCENT} strokeWidth={2.5} connectNulls={false} isAnimationActive={false}
            dot={(p: { cx?: number; cy?: number; payload?: TrendPoint; index?: number }) => {
              const { cx, cy, payload, index } = p;
              if (cx === undefined || cy === undefined || payload?.[metric] === undefined) return <g key={index} />;
              return payload.origin === "simulated"
                ? <circle key={index} cx={cx} cy={cy} r={4} fill={ACCENT} />
                : <rect key={index} x={cx - 5} y={cy - 5} width={10} height={10} transform={`rotate(45 ${cx} ${cy})`} fill="#e8f3ff" stroke="#071322" strokeWidth={2} />;
            }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
