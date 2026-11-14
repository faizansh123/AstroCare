// Small shared UI pieces.
import type { ReactNode } from "react";

export function Card({ title, step, children, aside }: { title: string; step?: number; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-white">
          {step !== undefined && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-sm font-bold text-sky-300">{step}</span>
          )}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 placeholder:text-slate-600 " +
  "focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 aria-[invalid=true]:border-red-400";

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
