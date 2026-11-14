// Status is never colour alone: colour + icon + text (CLAUDE.md, file 07 §10). No animation in any state.
import type { ReactNode } from "react";
import type { Status } from "../types/health";
import { Icon, type IconName } from "./ui";

export const STATUS_STYLE: Record<Status, { icon: IconName; label: string; title: string; subtitle: string; box: string; text: string; solid: string }> = {
  GREEN: {
    icon: "check", label: "GREEN", title: "Green: no flags under demo rules",
    subtitle: "No illustrative review rule fired. This is not a medical clearance and does not establish medical safety.",
    box: "border-ok-line/60 bg-ok-bg/40", text: "text-ok-fg", solid: "bg-ok-fg text-ok-bg",
  },
  YELLOW: {
    icon: "alert", label: "YELLOW", title: "Yellow: monitor",
    subtitle: "Some indicators changed from your Earth baseline under illustrative rules. Verify readings and follow the guidance.",
    box: "border-warn-line/60 bg-warn-bg/40", text: "text-warn-fg", solid: "bg-warn-fg text-warn-bg",
  },
  RED: {
    icon: "octagon", label: "RED", title: "Red: training scenario",
    subtitle: "Follow the approved crew emergency or medical protocol and contact the responsible medical officer. Simulation only.",
    box: "border-bad-line/70 bg-bad-bg/50", text: "text-bad-fg", solid: "bg-bad-fg text-bad-bg",
  },
  INSUFFICIENT_DATA: {
    icon: "help", label: "INSUFFICIENT DATA", title: "Insufficient data",
    subtitle: "Required data is missing, invalid or stale, so no status is given. It never defaults to Green.",
    box: "border-unk-line/70 bg-unk-bg/50", text: "text-unk-fg", solid: "bg-unk-fg text-unk-bg",
  },
};

export function StatusChip({ status, className = "" }: { status: Status; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`chip border border-current/30 bg-card-2 ${s.text} ${className}`}>
      <Icon name={s.icon} className="h-3.5 w-3.5" strokeWidth={2.4} />{s.label}
    </span>
  );
}

export function StatusBanner({ status, children, compact = false }: { status: Status; children?: ReactNode; compact?: boolean }) {
  const s = STATUS_STYLE[status];
  return (
    <div role="status" aria-live="polite" className={`rounded-2xl border ${s.box} ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="flex items-start gap-4">
        <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full ${s.solid} ${compact ? "h-10 w-10" : "h-14 w-14"}`}>
          <Icon name={s.icon} className={compact ? "h-5 w-5" : "h-7 w-7"} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-bold tracking-tight ${s.text} ${compact ? "text-lg" : "text-2xl sm:text-[28px]"}`}>{s.title}</p>
          <p className="mt-1 text-[14px] text-fg-2">{s.subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
