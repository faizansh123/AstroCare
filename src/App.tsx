// App shell and state (file 07 §6 navigation: 11 screens in 4 groups; mockup visual design, prototype behaviour).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import baselineJson from "./data/baseline.json";
import mission from "./data/mission.json";
import rulesJson from "./data/rules.json";
import { SCENARIOS } from "./data/scenarios";
import type { AiState, Ctx, Screen } from "./appTypes";
import { fetchExplanation } from "./lib/apiClient";
import { assess } from "./lib/rules";
import { loadLog, loadSnapshot, newEvent, saveCheckin, saveLog, saveSnapshot } from "./lib/store";
import type { Baseline, LogEvent, Snapshot } from "./types/health";
import { StatusChip } from "./components/StatusBadge";
import { Icon, ago, type IconName } from "./components/ui";
import { Dashboard } from "./components/Dashboard";
import { VitalSigns } from "./components/VitalSigns";
import { SpaceLab } from "./components/SpaceLab";
import { EnvironmentScreen } from "./components/Environment";
import { SelfAssessment } from "./components/SelfAssessment";
import { AssessmentScreen } from "./components/AssessmentScreen";
import { BodyMapScreen } from "./components/BodyMap";
import { Trends } from "./components/Trends";
import { Guidance } from "./components/Guidance";
import { Research } from "./components/Research";
import { MissionLog } from "./components/MissionLog";

const B = baselineJson as Baseline;

const NAV: { group: string; items: { id: Screen; label: string; icon: IconName; sub: string }[] }[] = [
  { group: "Monitor", items: [
    { id: "dashboard", label: "Dashboard", icon: "grid", sub: "A single view of crew health and context" },
    { id: "vitals", label: "Vital Signs", icon: "heart", sub: "Compare Earth (preflight) and in-flight measurements" },
    { id: "spacelab", label: "SpaceLab", icon: "flask", sub: "Biomarkers against the Earth baseline" },
    { id: "environment", label: "Environment", icon: "orbit", sub: "Cabin and mission context. Context, not causation" },
  ] },
  { group: "Assess", items: [
    { id: "self-assessment", label: "Self-Assessment", icon: "clipboard", sub: "Tell us how you're feeling today" },
    { id: "assessment", label: "Assessment", icon: "shield", sub: "Transparent GREEN / YELLOW / RED / INSUFFICIENT DATA output" },
  ] },
  { group: "Understand", items: [
    { id: "bodymap", label: "Body Map", icon: "body", sub: "Explore connected body systems" },
    { id: "trends", label: "Health Trends", icon: "chart", sub: "Longitudinal changes against the Earth baseline" },
    { id: "guidance", label: "Guidance Library", icon: "book", sub: "Research-informed education and follow-up" },
    { id: "research", label: "NASA Research", icon: "library", sub: "Published studies, kept separate from your simulated data" },
  ] },
  { group: "Record", items: [
    { id: "log", label: "Mission Log", icon: "list", sub: "Chronological crew health events" },
  ] },
];
const ALL = NAV.flatMap((g) => g.items);

function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}
function useOnline() {
  const [on, setOn] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setOn(true), down = () => setOn(false);
    window.addEventListener("online", up); window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return on;
}

export default function App() {
  const now = useNow();
  const online = useOnline();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [snapshot, setSnapshot] = useState<Snapshot>(loadSnapshot);
  const [log, setLog] = useState<LogEvent[]>(loadLog);
  const [assessment, setAssessment] = useState<Ctx["assessment"]>(null);
  const [assessedSnapshot, setAssessedSnapshot] = useState<Snapshot | null>(null);
  const [ai, setAi] = useState<AiState>({ loading: false, outcome: null });
  const runId = useRef(0);

  useEffect(() => saveSnapshot(snapshot), [snapshot]);
  useEffect(() => saveLog(log), [log]);

  const live = useMemo(() => assess(snapshot, B, now), [snapshot, now]);

  const addLog = useCallback((e: Omit<LogEvent, "id" | "createdAt" | "missionDay">) => {
    setLog((l) => [...l, newEvent(e)]);
  }, []);

  const go = useCallback((s: Screen) => { setScreen(s); window.scrollTo({ top: 0 }); }, []);

  const runAssessment = useCallback((s: Snapshot = snapshot) => {
    const t = Date.now();
    const a = assess(s, B, t); // rules decide first; Gemini only explains afterwards
    const id = ++runId.current;
    setSnapshot(s);
    setAssessment(a);
    setAssessedSnapshot(s);
    saveCheckin(s, a);
    setLog((l) => [...l, newEvent({
      type: "assessment", author: `Rules engine ${a.rulesVersion}`, source: "system", status: a.status,
      reasonCodes: [...a.rulesFired.map((h) => h.id), ...a.context.map((h) => h.id), ...new Set(a.dataIssues.map((i) => i.id))],
      text: `${a.status.replace("_", " ")} (illustrative). ${a.rulesFired.map((h) => h.text).join(" ") || "No demo rules triggered."}`,
    }, t)]);
    setAi({ loading: true, outcome: null });
    go("assessment");
    fetchExplanation(s, a).then((outcome) => {
      if (runId.current !== id) return; // a newer run started; ignore the late reply
      setAi({ loading: false, outcome });
      if (!outcome.ai) {
        setLog((l) => [...l, newEvent({ type: "ai-check", author: "AI response check", source: "system",
          text: `Gemini explanation not shown (${outcome.reason ?? "unavailable"}). Offline explanation used.` })]);
      }
    });
  }, [snapshot, go]);

  const loadScenario = useCallback((id: string) => {
    const sc = SCENARIOS.find((x) => x.id === id);
    if (!sc) return;
    setSnapshot(sc.build());
    setAssessment(null);
    setAi({ loading: false, outcome: null });
    addLog({ type: "measurement", author: "Demo loader", source: "simulated", text: `Demo scenario loaded: ${sc.label} (${sc.description}).` });
  }, [addLog]);

  const ctx: Ctx = {
    now, baseline: B, snapshot, updateSnapshot: (fn) => setSnapshot((s) => fn(s)), live, assessment, assessedSnapshot, ai,
    runAssessment, log, addLog, replaceLog: setLog, loadScenario, go,
  };

  const page = ALL.find((n) => n.id === screen)!;
  const ageH = live.dataAgeHours;
  const stale = ageH !== null && ageH > rulesJson.staleLimitHours;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-fg focus:px-4 focus:py-2 focus:text-page">Skip to content</a>

      {/* Sidebar */}
      <aside className="border-b border-edge bg-side/95 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-4 pb-3 pt-4 lg:px-5 lg:pt-6">
          <img src="/logo-mark.png" alt="" className="h-10 w-10 rounded-full ring-1 ring-edge" />
          <div>
            <p className="text-lg font-bold leading-tight tracking-tight text-fg">AstroCare</p>
            <p className="text-[11px] leading-tight text-fg-3">Astronaut Health Assessment &amp; Guidance</p>
          </div>
        </div>
        <nav aria-label="Main" className="px-3 pb-3 lg:px-3 lg:pb-6">
          <div className="flex gap-1 overflow-x-auto lg:block">
            {NAV.map((g) => (
              <div key={g.group} className="flex shrink-0 gap-1 lg:mt-4 lg:block">
                <p className="hidden px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-3/80 lg:block">{g.group}</p>
                {g.items.map((n) => {
                  const on = n.id === screen;
                  return (
                    <button key={n.id} type="button" onClick={() => go(n.id)} aria-current={on ? "page" : undefined}
                      className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-[14px] transition-colors lg:w-full ${
                        on ? "bg-card-3 font-semibold text-white shadow-[inset_3px_0_0_theme(colors.accent.DEFAULT)]" : "text-fg-2 hover:bg-card-3/60 hover:text-fg"}`}>
                      <Icon name={n.icon} className="h-[18px] w-[18px]" />{n.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>
        <div className="mx-4 mb-6 hidden rounded-xl border border-edge bg-card-2 p-3 lg:block">
          <p className="eyebrow">Demo environment</p>
          <p className="mini mt-1 leading-snug">{mission.astronaut.name} and the {mission.mission.name} are fictional. All personal data is simulated.</p>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Simulation label, visible on every screen (file 07 §3) */}
        <div role="note" className="border-b border-warn-line/40 bg-warn-bg/40 px-4 py-1.5 text-center text-[12.5px] font-medium text-warn-fg">
          <Icon name="alert" className="-mt-0.5 mr-1.5 inline h-3.5 w-3.5" />
          Simulation · Not for clinical use · Illustrative rules · Fictional data
        </div>

        {/* Top bar */}
        <header className="flex flex-wrap items-center gap-2 border-b border-edge/70 px-4 py-3 sm:px-6">
          <span className="chip border border-edge-strong bg-card-2 text-fg-2">
            <Icon name="rocket" className="h-3.5 w-3.5 text-accent-2" />{mission.mission.name} (fictional) · Day {snapshot.missionDay}
          </span>
          <span className={`chip border ${stale ? "border-unk-line bg-unk-bg text-unk-fg" : "border-edge-strong bg-card-2 text-fg-2"}`}>
            <Icon name="clock" className="h-3.5 w-3.5" />Vitals {ago(snapshot.vitals.measuredAt, now)}{stale ? " · stale" : ""}
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-fg-2">Current inputs preview</span>
              <StatusChip status={live.status} />
            </span>
            <span className={`chip border ${online ? "border-ok-line/50 text-ok-fg" : "border-unk-line text-unk-fg"} bg-card-2`}>
              <Icon name={online ? "wifi" : "wifi-off"} className="h-3.5 w-3.5" />
              {online ? "Online" : "Offline: rules still work"}
            </span>
          </span>
        </header>

        <main id="main" className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6">
            <h1 className="text-[26px] font-bold tracking-tight text-fg sm:text-[30px]">{page.label === "Dashboard" ? "Mission Health Dashboard" : page.label}</h1>
            <p className="text-fg-3">{page.sub}</p>
          </div>
          <div key={screen} className="animate-enter">
            {screen === "dashboard" && <Dashboard ctx={ctx} />}
            {screen === "vitals" && <VitalSigns ctx={ctx} />}
            {screen === "spacelab" && <SpaceLab ctx={ctx} />}
            {screen === "environment" && <EnvironmentScreen ctx={ctx} />}
            {screen === "self-assessment" && <SelfAssessment ctx={ctx} />}
            {screen === "assessment" && <AssessmentScreen ctx={ctx} />}
            {screen === "bodymap" && <BodyMapScreen ctx={ctx} />}
            {screen === "trends" && <Trends ctx={ctx} />}
            {screen === "guidance" && <Guidance ctx={ctx} />}
            {screen === "research" && <Research ctx={ctx} />}
            {screen === "log" && <MissionLog ctx={ctx} />}
          </div>
        </main>

        <footer className="mx-auto max-w-[1280px] px-4 pb-8 text-xs leading-relaxed text-fg-3 sm:px-6">
          <div className="border-t border-edge pt-4">
            AstroCare · NASA Space Apps 2026 prototype · Personal readings, biomarkers, environment values, thresholds and trend
            history are simulated. Published study figures are labelled separately. Status comes from local rules ({rulesJson.rulesVersion});
            Gemini only explains it. Decision support only: no diagnosis, no medication, no doses.
          </div>
        </footer>
      </div>
    </div>
  );
}
