import { useRef, useState } from "react";
import baselines from "./data/baselines.json";
import { AssessmentForm } from "./components/AssessmentForm";
import { Results } from "./components/Results";
import { evaluate } from "./lib/evaluate";
import { fetchExplanation, type AiOutcome } from "./lib/apiClient";
import type { AssessmentResult, Baseline, HealthRecord } from "./types/health";

export default function App() {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [ai, setAi] = useState<AiOutcome | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const latest = useRef<HealthRecord | null>(null);

  const run = async (rec: HealthRecord) => {
    const baseline = (baselines as Baseline[]).find((b) => b.astronautId === rec.astronautId);
    const r = evaluate(rec, baseline); // rules result renders first; AI only explains
    latest.current = rec;
    setRecord(rec);
    setResult(r);
    setAi(null);
    setAiLoading(true);
    window.scrollTo({ top: 0 });
    const outcome = await fetchExplanation(rec, r);
    // Ignore a late reply if the user has already started another check.
    if (latest.current !== rec) return;
    setAi(outcome);
    setAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950/40">
      <div role="note" className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-slate-950">
        ⚠ Simulation. Not for clinical use. Rules are illustrative. Data is fictional.
      </div>

      <header className="border-b border-slate-800/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5">
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-xl">✚</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">AstroCare</h1>
              <p className="text-xs text-slate-400">Decision support only. Not a diagnosis.</p>
            </div>
          </div>
          <div className="hidden text-right text-xs text-slate-400 sm:block">
            <p className="font-mono text-slate-300">AC-01 · Day {record?.missionDay ?? 42}</p>
            <p>{result ? "Check result" : "Daily health check"}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-white">{result ? "Your check result" : "Daily health check"}</h2>
          <p className="text-slate-400">
            {result
              ? "Status comes from the local rules engine. Compare against your baseline below."
              : "About 3 minutes. Enter what you have. Leave blank anything you didn't measure."}
          </p>
        </div>
        {result
          ? <Results result={result} ai={ai} aiLoading={aiLoading} onBack={() => setResult(null)} />
          : <AssessmentForm onSubmit={run} />}
      </main>
    </div>
  );
}
