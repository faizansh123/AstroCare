// Shared UI pieces: icons, cards, page header, form fields, labels.
import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "grid" | "heart" | "flask" | "orbit" | "clipboard" | "shield" | "body" | "chart" | "book" | "library" | "list"
  | "check" | "alert" | "octagon" | "help" | "arrow-right" | "arrow-left" | "info" | "x" | "plus" | "download" | "upload"
  | "wifi" | "wifi-off" | "clock" | "moon" | "thermo" | "gauge" | "battery" | "smile" | "wind" | "droplet" | "sun"
  | "sparkles" | "external" | "target" | "rocket" | "user" | "refresh";

const PATHS: Record<IconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  heart: <><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" /><path d="M3.2 12h4.3l1.5-3 3 6 1.5-3h7.3" /></>,
  flask: <><path d="M9 3h6" /><path d="M10 3v6.5L4.6 18.4A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.4-2.6L14 9.5V3" /><path d="M7.5 15h9" /></>,
  orbit: <><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)" /></>,
  clipboard: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="M8 12h2l1.5-3 2 6 1.5-3h1" /></>,
  body: <><circle cx="12" cy="4.5" r="2.5" /><path d="M12 7v7" /><path d="m8 22 4-8 4 8" /><path d="M5 10h14" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>,
  book: <><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z" /><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z" /></>,
  library: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  octagon: <><path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9Z" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>,
  "arrow-right": <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  "arrow-left": <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></>,
  wifi: <><path d="M5 12.6a10 10 0 0 1 14 0" /><path d="M8.5 16.1a5 5 0 0 1 7 0" /><path d="M2 8.8a15 15 0 0 1 20 0" /><path d="M12 20h.01" /></>,
  "wifi-off": <><path d="m2 2 20 20" /><path d="M8.5 16.4a5 5 0 0 1 7 0" /><path d="M5 12.9a10 10 0 0 1 5.2-2.8" /><path d="M19 12.9a10 10 0 0 0-2.1-1.6" /><path d="M12 20h.01" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  thermo: <path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />,
  gauge: <><path d="m12 14 4-4" /><path d="M3.3 19a10 10 0 1 1 17.4 0" /></>,
  battery: <><rect x="2" y="7" width="16" height="10" rx="2" /><path d="M22 11v2" /><path d="M6 11v2" /></>,
  smile: <><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01M15 9h.01" /></>,
  wind: <><path d="M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2" /><path d="M9.6 4.6A2 2 0 1 1 11 8H2" /><path d="M12.6 19.4A2 2 0 1 0 14 16H2" /></>,
  droplet: <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5 12 2.5C11.5 5 10 7.9 8 9.5S5 13 5 15a7 7 0 0 0 7 7Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  sparkles: <><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></>,
  external: <><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  rocket: <><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1Z" /><path d="m12 15-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2Z" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
};

export function Icon({ name, className = "h-4 w-4", ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden className={className} {...rest}>
      {PATHS[name]}
    </svg>
  );
}

export function Card({ title, icon, aside, children, className = "" }: {
  title?: ReactNode; icon?: IconName; aside?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || aside) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
              {icon && <Icon name={icon} className="h-[18px] w-[18px] text-accent-2" />}{title}
            </h2>
          )}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export function SimTag({ children = "Simulated" }: { children?: ReactNode }) {
  return <span className="chip bg-card-3 text-[11px] uppercase tracking-wider text-accent-2">{children}</span>;
}

export function Unverified() {
  return <span className="chip bg-warn-bg/70 text-[11px] uppercase tracking-wider text-warn-fg"><Icon name="alert" className="h-3 w-3" />Unverified</span>;
}

/** Slider + number box for one value. Empty number box = not measured (undefined). */
export function MeasureField({ id, label, unit, value, min, max, step, onChange, error, hint, allowEmpty = true }: {
  id: string; label: string; unit: string; value: number | undefined; min: number; max: number; step: number;
  onChange: (v: number | undefined) => void; error?: string; hint?: ReactNode; allowEmpty?: boolean;
}) {
  const errId = `${id}-err`;
  return (
    <div className="well">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-fg">{label}</label>
        <div className="flex items-center gap-2">
          <input id={id} type="number" inputMode="decimal" step={step} value={value ?? ""} aria-invalid={!!error}
            aria-describedby={error ? errId : undefined}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") { if (allowEmpty) onChange(undefined); return; }
              const n = Number(raw);
              onChange(Number.isFinite(n) ? n : undefined);
            }}
            className="input num w-24 min-h-[36px] py-1 text-right" />
          <span className="w-12 text-xs text-fg-3">{unit}</span>
        </div>
      </div>
      <input type="range" aria-label={`${label} slider`} min={min} max={max} step={step}
        value={value ?? min} onChange={(e) => onChange(Number(e.target.value))}
        className={`mt-2 w-full ${value === undefined ? "opacity-40" : ""}`} />
      {hint && <div className="mini mt-1">{hint}</div>}
      {error && <p id={errId} className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-bad-fg"><Icon name="alert" className="h-3.5 w-3.5" />{error}</p>}
    </div>
  );
}

export function ago(iso: string | undefined, now: number): string {
  if (!iso) return "unknown";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "invalid time";
  const m = Math.round((now - t) / 60_000);
  if (m < 0) return "in the future";
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.floor(h / 24)} days ago`;
}

export const fmt = (v: number | undefined, digits: number) => (v === undefined ? "—" : v.toFixed(digits));
