// Never colour alone: colour + icon + text (FR-07, NFR-06). No animation in any state, including RED (file 13 §8).
import type { ReactNode } from "react";
import type { Status } from "../types/health";
import { Icon, type IconName } from "./ui";

export const STATUS_STYLE: Record<Status, {
  icon: IconName; short: string; title: string; subtitle: string; tint: string; dot: string; text: string; solid: string;
}> = {
  GREEN: {
    icon: "check", short: "Green", title: "No flags under demo rules",
    subtitle: "No demo rules fired. This is not a medical clearance.",
    tint: "bg-emerald-400/[0.06] border-emerald-400/25", dot: "bg-emerald-400", text: "text-emerald-300", solid: "bg-emerald-400 text-emerald-950",
  },
  YELLOW: {
    icon: "alert", short: "Yellow", title: "Monitor",
    subtitle: "One or more changes from baseline under illustrative rules. Recheck and follow the guidance.",
    tint: "bg-amber-400/[0.06] border-amber-400/25", dot: "bg-amber-400", text: "text-amber-300", solid: "bg-amber-400 text-amber-950",
  },
  RED: {
    icon: "octagon", short: "Red", title: "Action required",
    subtitle: "Follow approved mission procedures and contact the designated medical authority.",
    tint: "bg-red-400/[0.08] border-red-400/35", dot: "bg-red-400", text: "text-red-300", solid: "bg-red-400 text-red-950",
  },
  INSUFFICIENT_DATA: {
    icon: "help", short: "Insufficient data", title: "Insufficient data",
    subtitle: "Some inputs are missing, so no status can be given. Remeasure or answer the missing items.",
    tint: "bg-zinc-400/[0.06] border-zinc-400/25", dot: "bg-zinc-300", text: "text-zinc-300", solid: "bg-zinc-300 text-zinc-900",
  },
};

/** Small inline status label: icon + text. */
export function StatusChip({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`tag bg-surface-3 ${s.text}`}>
      <Icon name={s.icon} className="h-3.5 w-3.5" strokeWidth={2.2} />{s.short}
    </span>
  );
}

export function StatusBadge({ status, meta }: { status: Status; meta?: ReactNode }) {
  const s = STATUS_STYLE[status];
  return (
    <div role="status" aria-live="polite" className={`rounded-xl border p-5 sm:p-6 ${s.tint}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span aria-hidden className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${s.solid}`}>
          <Icon name={s.icon} className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${s.text}`}>{s.short === s.title ? s.short : `${s.short} status`}</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">{s.title}</p>
          <p className="mt-1.5 max-w-2xl text-fg-2">{s.subtitle}</p>
        </div>
        {meta && <div className="shrink-0 text-sm text-fg-3 sm:text-right">{meta}</div>}
      </div>
    </div>
  );
}
