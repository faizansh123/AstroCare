// Status is never colour alone: colour + icon + text (CLAUDE.md, file 07 §10). No animation in any state.
import type { ReactNode } from "react";
import type { Status } from "../types/health";
import { Icon, type IconName } from "./ui";

export const STATUS_STYLE: Record<Status, { icon: IconName; label: string; title: string; subtitle: string; box: string; text: string; solid: string }> = {
  GREEN: {
    icon: "check", label: "GREEN", title: "Green: no flags under demo rules",
    subtitle: "No illustrative review rule fired. This is not a medical clearance and does not establish medical safety.",
    box: "border-ok-line/60 bg-ok-bg/50", text: "text-ok-fg", solid: "bg-ok-fg text-black",
  },
  YELLOW: {
    icon: "alert", label: "YELLOW", title: "Yellow: monitor",
    subtitle: "Some indicators changed from your Earth baseline under illustrative rules. Verify readings and follow the guidance.",
    box: "border-warn-line/60 bg-warn-bg/50", text: "text-warn-fg", solid: "bg-warn-fg text-black",
  },
  RED: {
    icon: "octagon", label: "RED", title: "Red: training scenario",
    subtitle: "Follow the approved crew emergency or medical protocol and contact the responsible medical officer.",
    box: "border-bad-line/70 bg-bad-bg/60", text: "text-bad-fg", solid: "bg-bad-fg text-black",
  },
  INSUFFICIENT_DATA: {
    icon: "help", label: "INSUFFICIENT DATA", title: "Insufficient data",
    subtitle: "Required data is missing, invalid or stale, so no status is given. It never defaults to Green.",
    box: "border-unk-line/70 bg-unk-bg/60", text: "text-unk-fg", solid: "bg-unk-fg text-black",
  },
};

export function StatusChip({ status, className = "" }: { status: Status; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`chip border ${s.box} ${s.text} ${className}`}>
      <Icon name={s.icon} className="h-3.5 w-3.5" strokeWidth={2.4} />{s.label}
    </span>
  );
}

/** Large status block. `action` renders on the right on wide screens (one primary next step). */
export function StatusBanner({ status, children, compact = false, action }: {
  status: Status; children?: ReactNode; compact?: boolean; action?: ReactNode;
}) {
  const s = STATUS_STYLE[status];
  return (
    <div role="status" aria-live="polite" className={`rounded-2xl border ${s.box} ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full ${s.solid} ${compact ? "h-10 w-10" : "h-12 w-12"}`}>
          <Icon name={s.icon} className={compact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold ${s.text} ${compact ? "text-lg" : "text-[22px] sm:text-[26px] leading-tight"}`}>{s.title}</p>
          <p className="mt-1 max-w-[68ch] text-[14px] text-fg-2">{s.subtitle}</p>
          {children}
        </div>
        {action && <div className="flex shrink-0 flex-wrap gap-2 sm:self-center">{action}</div>}
      </div>
    </div>
  );
}
