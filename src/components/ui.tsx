// Shared UI pieces: console panel, icons, metric metadata.
import type { ReactNode, SVGProps } from "react";
import rules from "../data/rules.json";
import type { Metric } from "../lib/history";

export function Card({ title, step, kicker, children, aside, className = "" }: {
  title: string; step?: number; kicker?: string; children: ReactNode; aside?: ReactNode; className?: string;
}) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          {(kicker || step !== undefined) && (
            <p className="eyebrow mb-0.5">{step !== undefined ? `Step ${step} of 4` : kicker}</p>
          )}
          <h2 className="text-base font-semibold tracking-tight text-fg">{title}</h2>
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

export const inputCls =
  "w-full min-h-[44px] rounded-lg border border-edge-strong bg-bg px-3 py-2 text-fg placeholder:text-fg-3 " +
  "transition-colors hover:border-fg-3/50 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-red-400";

export const FIELD_LABELS: Record<string, string> = {
  heartRateBpm: "Resting heart rate",
  systolicMmHg: "Systolic BP",
  diastolicMmHg: "Diastolic BP",
  temperatureC: "Body temperature",
  sleepHours: "Sleep (last 24 h)",
  fatigueScore: "Fatigue",
  baseline: "Baseline",
  symptomsAnswer: "Symptoms question",
};

type Rule = { up?: number; down?: number; abs?: number };
const YELLOW = rules.yellow as Record<string, Rule>;

export const METRIC_META: Record<Metric, { label: string; short: string; unit: string; icon: IconName; digits: number; rule?: Rule }> = {
  heartRateBpm: { label: FIELD_LABELS.heartRateBpm, short: "Heart rate", unit: "bpm", icon: "heart", digits: 0, rule: YELLOW.heartRateBpm },
  systolicMmHg: { label: FIELD_LABELS.systolicMmHg, short: "Systolic", unit: "mmHg", icon: "gauge", digits: 0, rule: YELLOW.systolicMmHg },
  diastolicMmHg: { label: FIELD_LABELS.diastolicMmHg, short: "Diastolic", unit: "mmHg", icon: "gauge", digits: 0, rule: YELLOW.diastolicMmHg },
  temperatureC: { label: FIELD_LABELS.temperatureC, short: "Temperature", unit: "°C", icon: "thermo", digits: 1, rule: YELLOW.temperatureC },
  sleepHours: { label: FIELD_LABELS.sleepHours, short: "Sleep", unit: "h", icon: "moon", digits: 1, rule: YELLOW.sleepHours },
  fatigueScore: { label: FIELD_LABELS.fatigueScore, short: "Fatigue", unit: "/10", icon: "battery", digits: 0, rule: YELLOW.fatigueScore },
};

/** The illustrative band around a baseline inside which a value does not trip a demo rule (display only). */
export function thresholdBand(baseline: number, rule?: Rule): [number, number] | null {
  if (!rule) return null;
  const up = rule.up ?? rule.abs;
  const down = rule.down ?? rule.abs;
  return [down !== undefined ? baseline - down : -Infinity, up !== undefined ? baseline + up : Infinity];
}

export const fmt = (v: number | undefined, digits: number) => (v === undefined ? "—" : v.toFixed(digits));

// Icons: simple stroked glyphs (Lucide-style geometry), always decorative next to a text label.
export type IconName =
  | "heart" | "gauge" | "thermo" | "moon" | "battery" | "check" | "alert" | "octagon" | "help" | "arrow-right"
  | "arrow-left" | "plus" | "x" | "info" | "grid" | "clipboard" | "chart" | "body" | "spark" | "orbit" | "flag" | "pulse";

const PATHS: Record<IconName, ReactNode> = {
  heart: <><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" /><path d="M3.2 12h4.3l1.5-3 3 6 1.5-3h7.3" /></>,
  gauge: <><path d="m12 14 4-4" /><path d="M3.3 19a10 10 0 1 1 17.4 0" /></>,
  thermo: <path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />,
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  battery: <><rect x="2" y="7" width="16" height="10" rx="2" /><path d="M22 11v2" /><path d="M6 11v2" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  octagon: <><path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9Z" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>,
  "arrow-right": <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  "arrow-left": <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  grid: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  clipboard: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>,
  body: <><circle cx="12" cy="4.5" r="2.5" /><path d="M12 7v7" /><path d="m8 22 4-8 4 8" /><path d="M5 10h14" /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.3 6.3 2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1" /></>,
  orbit: <><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)" /></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></>,
  pulse: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
};

export function Icon({ name, className = "h-4 w-4", ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden className={className} {...rest}>
      {PATHS[name]}
    </svg>
  );
}

export function SimTag({ children = "Simulated data" }: { children?: ReactNode }) {
  return <span className="tag bg-surface-3 text-fg-2"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-fg-3" />{children}</span>;
}
