// Charts. Every chart also has a text reading (numbers beside it or an sr-only summary).
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps,
} from "recharts";
import type { TrendKey, TrendPoint } from "../lib/store";

export const SERIES_COLOURS = ["#409cff", "#63e6e2"] as const;
const GRID = "#2a2a2d", AXIS = "#98989f", EARTH = "#aeaeb2";

/** Earth vs in-flight pair of bars. Lengths compare the two readings within one metric only. */
export function EarthSpaceBars({ earth, space, unit, digits }: { earth: number; space?: number; unit: string; digits: number }) {
  const max = Math.max(earth, space ?? 0) || 1;
  const row = (v: number | undefined, cls: string) => (
    <div className="grid grid-cols-[minmax(0,1fr)_88px] items-center gap-3">
      <div className="h-2 rounded-full bg-card-2">
        {v !== undefined && <div className={`h-2 rounded-full ${cls}`} style={{ width: `${(v / max) * 100}%` }} />}
      </div>
      <span className="num whitespace-nowrap text-right text-xs text-fg-2">{v === undefined ? <em className="text-fg-3">not measured</em> : `${v.toFixed(digits)} ${unit}`}</span>
    </div>
  );
  return <div className="space-y-1.5" aria-hidden>{row(earth, "bg-earth")}{row(space, "bg-space")}</div>;
}

const ORIGIN_TEXT = { simulated: "Earlier history", "check-in": "Saved check-in", current: "Current reading" } as const;

export interface Series { key: TrendKey; name: string; baseline: number }

function ChartTip({ active, payload, series, unit, digits }: TooltipProps<number, string> & { series: Series[]; unit: string; digits: number }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as TrendPoint;
  return (
    <div className="rounded-xl border border-edge-strong bg-card-2/95 px-3 py-2 text-xs shadow-2xl shadow-black/60 backdrop-blur">
      <p className="text-fg-3">Mission day {p.missionDay}</p>
      {series.map((s, i) => (
        <p key={s.key} className="num flex items-center gap-1.5 text-[14px] font-semibold text-fg">
          {series.length > 1 && <span className="h-2 w-2 rounded-full" style={{ background: SERIES_COLOURS[i] }} />}
          {series.length > 1 && <span className="font-normal text-fg-3">{s.name}</span>}
          {p[s.key] === undefined ? "No reading" : `${p[s.key]!.toFixed(digits)} ${unit}`}
        </p>
      ))}
      <p className="text-fg-3">{ORIGIN_TEXT[p.origin]}</p>
    </div>
  );
}

/** Line chart for one or two series of the same unit, each with its dashed Earth baseline. */
export function TrendChart({ data, series, unit, digits, height = 300 }: {
  data: TrendPoint[]; series: Series[]; unit: string; digits: number; height?: number;
}) {
  const vals = data.flatMap((p) => series.map((s) => p[s.key])).filter((v): v is number => v !== undefined);
  const bases = series.map((s) => s.baseline);
  const lo = Math.min(...vals, ...bases), hi = Math.max(...vals, ...bases);
  const pad = Math.max((hi - lo) * 0.2, digits ? 0.3 : 2);
  const gid = `fill-${series[0].key}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 12, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES_COLOURS[0]} stopOpacity={0.28} />
              <stop offset="100%" stopColor={SERIES_COLOURS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          {series.map((s) => (
            <ReferenceLine key={`b-${s.key}`} y={s.baseline} stroke={EARTH} strokeOpacity={0.7} strokeDasharray="5 4"
              label={{ value: `Earth ${s.baseline}`, position: "insideBottomLeft", fill: EARTH, fontSize: 11 }} />
          ))}
          <XAxis dataKey="missionDay" tickFormatter={(d: number) => `D${d}`} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis domain={[Math.floor((lo - pad) * 10) / 10, Math.ceil((hi + pad) * 10) / 10]} tick={{ fill: AXIS, fontSize: 12 }}
            tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => v.toFixed(digits)} />
          <Tooltip content={<ChartTip series={series} unit={unit} digits={digits} />} cursor={{ stroke: "#48484a" }} />
          {series.length === 1 && (
            <Area type="monotone" dataKey={series[0].key} stroke="none" fill={`url(#${gid})`} connectNulls={false} isAnimationActive={false} />
          )}
          {series.map((s, i) => (
            <Line key={s.key} type="monotone" dataKey={s.key} stroke={SERIES_COLOURS[i]} strokeWidth={2.5} connectNulls={false} isAnimationActive={false}
              dot={(p: { cx?: number; cy?: number; payload?: TrendPoint; index?: number }) => {
                const { cx, cy, payload, index } = p;
                if (cx === undefined || cy === undefined || payload?.[s.key] === undefined) return <g key={index} />;
                return payload.origin === "simulated"
                  ? <circle key={index} cx={cx} cy={cy} r={3} fill={SERIES_COLOURS[i]} />
                  : <rect key={index} x={cx - 5} y={cy - 5} width={10} height={10} transform={`rotate(45 ${cx} ${cy})`} fill="#f5f5f7" stroke="#000" strokeWidth={2} />;
              }} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Shared legend: shape + text, never colour alone. */
export function TrendLegend({ series }: { series: Series[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-3">
      {series.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: SERIES_COLOURS[i] }} />{s.name}</li>
      ))}
      <li className="flex items-center gap-1.5"><span className="h-2 w-2 rotate-45 bg-fg" />Saved check-in or current</li>
      <li className="flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-earth" />Earth baseline</li>
    </ul>
  );
}
