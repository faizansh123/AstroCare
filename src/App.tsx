// App shell and state (file 07 §6 navigation: 10 screens in 3 groups; Mission Log removed, owner request 14 Nov 2026). Visual design: macOS-style dark appearance
// (file 14 §5a). Each screen has a hash URL (#/vitals) so Back, refresh and direct links work (UI-UX-AUDIT #07).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import baselineJson from "./data/baseline.json";
import mission from "./data/mission.json";
import rulesJson from "./data/rules.json";
import { SCENARIOS } from "./data/scenarios";
import type { AiState, Ctx, Screen } from "./appTypes";
import { fetchExplanation } from "./lib/apiClient";
import { assess } from "./lib/rules";
import { loadAssessments, loadSnapshot, saveAssessments, saveCheckin, saveSnapshot, trimAssessments, type AssessmentRecord } from "./lib/store";
import type { Baseline, Snapshot } from "./types/health";
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

const B = baselineJson as Baseline;

// hidden: kept as screens (reachable from the dashboard and by URL) but not listed in the sidebar (owner request, 14 Nov 2026).
const NAV: { group: string; items: { id: Screen; label: string; icon: IconName; sub: string; hidden?: boolean }[] }[] = [
  { group: "Monitor", items: [
    { id: "dashboard", label: "Dashboard", icon: "grid", sub: "" },
    { id: "vitals", label: "Vital Signs", icon: "heart", sub: "Earth (preflight) baseline compared with today's in-flight readings.", hidden: true },
    { id: "spacelab", label: "SpaceLab", icon: "flask", sub: "Biomarkers against the Earth baseline.", hidden: true },
    { id: "environment", label: "Environment", icon: "orbit", sub: "Cabin and mission context. Context, not causation.", hidden: true },
  ] },
  { group: "Assess", items: [
    { id: "self-assessment", label: "Self-Assessment", icon: "clipboard", sub: "Four short steps. Tell us how you're feeling today." },
    { id: "assessment", label: "Assessment Review", icon: "shield", sub: "Status from the local rules, with the reasons behind it. Open any previous assessment." },
  ] },
  { group: "Understand", items: [
    { id: "bodymap", label: "Body Map", icon: "body", sub: "Find related readings by body system.", hidden: true },
    { id: "trends", label: "Health Trends", icon: "chart", sub: "How each reading has moved against the Earth baseline." },
    { id: "guidance", label: "Guidance", icon: "book", sub: "Research-informed education and follow-up." },
    { id: "research", label: "NASA Research", icon: "library", sub: "Published studies, kept separate from your personal data.", hidden: true },
  ] },
];
const ALL = NAV.flatMap((g) => g.items);
const isScreen = (x: string): x is Screen => ALL.some((n) => n.id === x);
const fromHash = (): Screen => {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace(/^#\/?/, "");
  return isScreen(h) ? h : "dashboard";
};

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

const SIDEBAR_KEY = "astrocare.sidebarCollapsed";
function loadCollapsed() {
  try { return localStorage.getItem(SIDEBAR_KEY) === "1"; } catch { return false; }
}

function NavList({ screen, onPick, compact = false }: { screen: Screen; onPick: (s: Screen) => void; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      {NAV.map((g) => (
        <div key={g.group}>
          {compact
            ? <p className="sr-only">{g.group}</p>
            : <p className="px-2.5 pb-1 text-[11px] font-semibold text-fg-3">{g.group}</p>}
          <ul className="space-y-0.5">
            {g.items.filter((n) => !n.hidden).map((n) => {
              const on = n.id === screen;
              return (
                <li key={n.id}>
                  <button type="button" onClick={() => onPick(n.id)} aria-current={on ? "page" : undefined}
                    title={compact ? n.label : undefined}
                    className={`flex min-h-[40px] w-full items-center gap-2.5 rounded-lg text-[14px] transition-colors ${
                      compact ? "justify-center px-0" : "px-2.5"} ${
                      on ? "bg-white/10 font-medium text-fg" : "text-fg-2 hover:bg-white/[0.05] hover:text-fg"}`}>
                    <Icon name={n.icon} className={`h-[18px] w-[18px] shrink-0 ${on ? "text-accent" : "text-fg-3"}`} />
                    <span className={compact ? "sr-only" : undefined}>{n.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const now = useNow();
  const online = useOnline();
  const [screen, setScreen] = useState<Screen>(fromHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [snapshot, setSnapshot] = useState<Snapshot>(loadSnapshot);
  const [assessment, setAssessment] = useState<Ctx["assessment"]>(null);
  const [assessedSnapshot, setAssessedSnapshot] = useState<Snapshot | null>(null);
  const [ai, setAi] = useState<AiState>({ loading: false, outcome: null });
  const [history, setHistory] = useState<AssessmentRecord[]>(loadAssessments);
  const runId = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);

  useEffect(() => saveSnapshot(snapshot), [snapshot]);
  useEffect(() => saveAssessments(history), [history]);
  useEffect(() => { try { localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0"); } catch { /* storage unavailable */ } }, [collapsed]);

  // Hash routing: Back/forward and direct links change the screen.
  useEffect(() => {
    const onHash = () => { navigated.current = true; setScreen(fromHash()); setMenuOpen(false); window.scrollTo({ top: 0 }); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  // Move focus to the new page heading after navigation (not on first load).
  useEffect(() => {
    if (!navigated.current) return;
    heading.current?.focus({ preventScroll: true });
    document.title = `${ALL.find((n) => n.id === screen)!.label} · AstroCare`;
  }, [screen]);
  useEffect(() => {
    if (!menuOpen) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [menuOpen]);

  const live = useMemo(() => assess(snapshot, B, now), [snapshot, now]);

  const go = useCallback((s: Screen) => {
    setMenuOpen(false);
    if (window.location.hash === `#/${s}`) { window.scrollTo({ top: 0 }); return; }
    window.location.hash = `/${s}`; // hashchange listener updates the screen
  }, []);

  const runAssessment = useCallback((s: Snapshot = snapshot) => {
    const t = Date.now();
    const a = assess(s, B, t); // rules decide first; Gemini only explains afterwards
    const id = ++runId.current;
    setSnapshot(s);
    setAssessment(a);
    setAssessedSnapshot(s);
    saveCheckin(s, a);
    const recordId = `as-${t.toString(36)}-${id}`;
    setHistory((h) => trimAssessments([...h, { id: recordId, assessment: a, snapshot: s }]));
    setAi({ loading: true, outcome: null });
    go("assessment");
    fetchExplanation(s, a).then((outcome) => {
      if (runId.current !== id) return; // a newer run started; ignore the late reply
      setAi({ loading: false, outcome });
      setHistory((h) => h.map((r) => (r.id === recordId ? { ...r, ai: outcome } : r)));
    });
  }, [snapshot, go]);

  const loadScenario = useCallback((id: string) => {
    const sc = SCENARIOS.find((x) => x.id === id);
    if (!sc) return;
    setSnapshot(sc.build());
    setAssessment(null);
    setAi({ loading: false, outcome: null });
  }, []);

  const ctx: Ctx = {
    now, baseline: B, snapshot, updateSnapshot: (fn) => setSnapshot((s) => fn(s)), live, assessment, assessedSnapshot, ai, history,
    runAssessment, loadScenario, go,
  };

  const page = ALL.find((n) => n.id === screen)!;
  const ageH = live.dataAgeHours;
  const stale = ageH !== null && ageH > rulesJson.staleLimitHours;
  const sub = screen === "dashboard"
    ? `${mission.astronaut.name} · ${mission.mission.name} · Day ${snapshot.missionDay}`
    : page.sub;

  return (
    <div className={`min-h-screen lg:grid lg:transition-[grid-template-columns] lg:duration-200 ${
      collapsed ? "lg:grid-cols-[68px_minmax(0,1fr)]" : "lg:grid-cols-[240px_minmax(0,1fr)]"}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-fg focus:px-4 focus:py-2 focus:text-page">Skip to content</a>

      {/* Sidebar (desktop), collapsible to an icon rail */}
      <aside className="hidden border-r border-white/[0.06] bg-side/80 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
        <div className={`flex items-center pb-5 pt-6 ${collapsed ? "flex-col gap-3 px-2" : "gap-2.5 px-5"}`}>
          <img src="/logo-mark.png" alt="" className="h-8 w-8 shrink-0 rounded-full" />
          {!collapsed && <p className="flex-1 text-[17px] font-semibold tracking-tight text-fg">AstroCare</p>}
          <button type="button" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed} aria-controls="desktop-nav"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-fg-3 transition-colors hover:bg-white/[0.05] hover:text-fg">
            <Icon name="sidebar" className="h-[18px] w-[18px]" />
          </button>
        </div>
        <nav id="desktop-nav" aria-label="Main" className={`flex-1 ${collapsed ? "px-2" : "px-3"}`}>
          <NavList screen={screen} onPick={go} compact={collapsed} />
        </nav>
      </aside>

      {/* Top bar + menu (phone and tablet) */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-side/85 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="" className="h-7 w-7 rounded-full" />
            <span className="font-semibold">AstroCare</span>
          </span>
          <button type="button" className="btn-secondary min-h-[40px] px-4" aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen((o) => !o)}>
            <Icon name={menuOpen ? "x" : "menu"} />{menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-nav" aria-label="Main" className="max-h-[75vh] overflow-y-auto border-t border-white/[0.06] px-3 py-4">
            <NavList screen={screen} onPick={go} />
          </nav>
        )}
      </div>

      <div className="min-w-0">
        <main id="main" className="mx-auto max-w-[1200px] px-4 pb-10 pt-6 sm:px-8 sm:pt-10">
          <header className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h1 ref={heading} tabIndex={-1} className="text-[28px] font-bold leading-tight tracking-tight text-fg outline-none sm:text-[34px]">{page.label}</h1>
              <p className="mt-1 text-[15px] text-fg-3">{sub}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`chip ${stale ? "bg-unk-bg text-unk-fg" : "bg-card-2 text-fg-2"}`}>
                <Icon name="clock" className="h-3.5 w-3.5" />Vitals {ago(snapshot.vitals.measuredAt, now)}{stale ? " · stale" : ""}
              </span>
              {!online && <span className="chip bg-unk-bg text-unk-fg"><Icon name="wifi-off" className="h-3.5 w-3.5" />Offline: rules still work</span>}
              <span className="flex items-center gap-1.5 text-[12px] text-fg-3">Current inputs preview <StatusChip status={live.status} /></span>
            </div>
          </header>
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
          </div>
        </main>
      </div>
    </div>
  );
}
