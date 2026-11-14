// Never colour alone: colour + icon + text (FR-07, NFR-06). No animation in any state, including RED (file 13 §8).
import type { Status } from "../types/health";

export const STATUS_STYLE: Record<Status, { icon: string; title: string; subtitle: string; ring: string; chip: string }> = {
  GREEN: {
    icon: "✓", title: "Green: no flags under demo rules",
    subtitle: "No demo rules fired. This is not a medical clearance.",
    ring: "border-emerald-400/60 bg-emerald-950/60", chip: "bg-emerald-400 text-emerald-950",
  },
  YELLOW: {
    icon: "!", title: "Yellow: monitor",
    subtitle: "One or more changes from baseline under illustrative rules. Recheck and follow the guidance.",
    ring: "border-amber-400/60 bg-amber-950/60", chip: "bg-amber-400 text-amber-950",
  },
  RED: {
    icon: "▲", title: "Red: action required",
    subtitle: "Follow approved mission procedures and contact the designated medical authority.",
    ring: "border-red-400/70 bg-red-950/70", chip: "bg-red-400 text-red-950",
  },
  INSUFFICIENT_DATA: {
    icon: "?", title: "Insufficient data",
    subtitle: "Some inputs are missing, so no status can be given. Remeasure or answer the missing items.",
    ring: "border-slate-400/60 bg-slate-900/80", chip: "bg-slate-300 text-slate-900",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <div role="status" aria-live="polite" className={`flex items-start gap-4 rounded-2xl border-2 p-5 ${s.ring}`}>
      <span aria-hidden className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-black ${s.chip}`}>
        {s.icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">Status · {status.replace("_", " ")}</p>
        <p className="text-2xl font-bold text-white">{s.title}</p>
        <p className="mt-1 text-slate-200">{s.subtitle}</p>
      </div>
    </div>
  );
}
