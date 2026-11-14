import { useRef, useState } from "react";
import baselines from "./data/baselines.json";
import { AssessmentForm } from "./components/AssessmentForm";
import { Dashboard } from "./components/Dashboard";
import { Results } from "./components/Results";
import { StatusChip } from "./components/StatusBadge";
import { Trends } from "./components/Trends";
import { Icon, type IconName } from "./components/ui";
import { evaluate } from "./lib/evaluate";
import { fetchExplanation, type AiOutcome } from "./lib/apiClient";
import { loadHistory, saveCheck } from "./lib/history";
import type { AssessmentResult, Baseline, HealthRecord } from "./types/health";

type Screen = "dashboard" | "check" | "results" | "trends";
const NAV: { id: Screen; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "check", label: "Daily check", icon: "clipboard" },
  { id: "results", label: "Results", icon: "pulse" },
  { id: "trends", label: "Trends", icon: "chart" },
];

const baselineFor = (id: string) => (baselines as Baseline[]).find((b) => b.astronautId === id);

function Logo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6">
      <circle cx="12" cy="12" r="11" fill="#ededef" />
      <path d="M12 7v10M7 12h10" stroke="#0b0b0c" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [ai, setAi] = useState<AiOutcome | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState(loadHistory);
  const [formKey, setFormKey] = useState({ n: 0, scenario: "" });
  const latest = useRef<HealthRecord | null>(null);
  const baseline = baselineFor("AC-01");

  const go = (s: Screen) => { setScreen(s); window.scrollTo({ top: 0 }); };
  const startCheck = (scenario = "") => { setFormKey((k) => ({ n: k.n + 1, scenario })); go("check"); };

  const run = async (rec: HealthRecord) => {
    const r = evaluate(rec, baselineFor(rec.astronautId)); // rules result renders first; AI only explains
    latest.current = rec;
    saveCheck(rec);
    setHistory(loadHistory());
    setRecord(rec);
    setResult(r);
    setAi(null);
    setAiLoading(true);
    go("results");
    const outcome = await fetchExplanation(rec, r);
    // Ignore a late reply if the user has already started another check.
    if (latest.current !== rec) return;
    setAi(outcome);
    setAiLoading(false);
  };

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-fg focus:px-4 focus:py-2 focus:text-bg">
        Skip to content
      </a>
      <div role="note" className="border-b border-amber-400/20 bg-amber-400/[0.08] px-4 py-2 text-center text-[13px] font-medium text-amber-200">
        <Icon name="alert" className="-mt-0.5 mr-1.5 inline h-3.5 w-3.5" strokeWidth={2.2} />
        Simulation. Not for clinical use. Rules are illustrative. Data is fictional.
      </div>

      <header className="sticky top-0 z-20 border-b border-edge bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <button type="button" onClick={() => go("dashboard")} className="flex shrink-0 items-center gap-2.5 rounded-md">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight text-fg">AstroCare</span>
          </button>
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => {
                const disabled = n.id === "results" && !result;
                const on = screen === n.id;
                return (
                  <li key={n.id}>
                    <button type="button" disabled={disabled} aria-current={on ? "page" : undefined}
                      onClick={() => (n.id === "check" ? startCheck() : go(n.id))}
                      className={`rounded-md px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                        on ? "bg-surface-3 text-fg" : "text-fg-2 hover:bg-surface-2 hover:text-fg"}`}>
                      {n.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            {result && <StatusChip status={result.status} />}
            <span className="hidden text-fg-3 sm:inline">AC-01 · Day {record?.missionDay ?? 42}</span>
          </div>
        </div>
        {/* Mobile nav: full-width segmented control */}
        <nav aria-label="Main" className="border-t border-edge px-3 py-2 md:hidden">
          <ul className="grid grid-cols-4 gap-1 rounded-lg bg-surface p-1">
            {NAV.map((n) => {
              const disabled = n.id === "results" && !result;
              const on = screen === n.id;
              return (
                <li key={n.id}>
                  <button type="button" disabled={disabled} aria-current={on ? "page" : undefined}
                    onClick={() => (n.id === "check" ? startCheck() : go(n.id))}
                    className={`flex min-h-[40px] w-full items-center justify-center rounded-md text-[13px] transition-colors disabled:opacity-35 ${
                      on ? "bg-surface-3 font-medium text-fg" : "text-fg-2"}`}>
                    {n.label.replace("Daily check", "Check")}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {screen === "dashboard" && (
          <div className="animate-enter">
            <Dashboard baseline={baseline} history={history} result={result} record={record}
              onStart={startCheck} onOpenResults={() => go("results")} onOpenTrends={() => go("trends")} />
          </div>
        )}
        {screen === "check" && (
          <div className="animate-enter">
            <div className="mb-6">
              <p className="eyebrow">Self-assessment · about 3 minutes</p>
              <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-fg">Daily health check</h1>
              <p className="mt-1 text-fg-2">Enter what you have. Leave blank anything you didn't measure.</p>
            </div>
            <AssessmentForm key={formKey.n} initialScenarioId={formKey.scenario} onSubmit={run} />
          </div>
        )}
        {/* No entrance animation on Results: no animation in urgent states (file 13 §8) */}
        {screen === "results" && result && record && (
          <Results result={result} ai={ai} aiLoading={aiLoading} onBack={() => startCheck()}
            symptoms={record.symptoms} history={history} missionDay={record.missionDay} onOpenTrends={() => go("trends")} />
        )}
        {screen === "trends" && (
          <div className="animate-enter"><Trends history={history} baseline={baseline} /></div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 text-xs text-fg-3"><div className="border-t border-edge py-6">
        AstroCare prototype · NASA Space Apps 2026 · Fictional data · Status from local demo rules only
      </div></footer>
    </div>
  );
}
