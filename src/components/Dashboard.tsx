// F01 Mission dashboard (file 07 §4): overall status, indicator cards with baseline and delta, survey completion,
// SpaceLab and environment snapshots, latest log, last-sync / data-age badge. Layout follows the mockup (file 14 §5).
import mission from "../data/mission.json";
import { SCENARIOS } from "../data/scenarios";
import { moodBand } from "../data/catalog";
import { signed, signedPct } from "../lib/deltas";
import { loadTrend, type TrendKey } from "../lib/store";
import type { Ctx } from "../appTypes";
import { Sparkline } from "./charts";
import { StatusBanner } from "./StatusBadge";
import { Card, Icon, SimTag, ago, fmt, type IconName } from "./ui";

export function Dashboard({ ctx }: { ctx: Ctx }) {
  const { snapshot: s, baseline: b, live, now, go } = ctx;
  const trend = loadTrend(s).slice(-7);
  const series = (k: TrendKey) => trend.map((p) => p[k]);
  const d = (ref: string) => live.deltas.find((x) => x.ref === ref);

  const kpis: { key: TrendKey; label: string; icon: IconName; value: string; unit: string; base: string; delta?: string }[] = [
    { key: "hr", label: "Heart Rate", icon: "heart", value: fmt(s.vitals.hr, 0), unit: "bpm", base: `Earth ${b.vitals.hr}`, delta: d("vitals.hr") && `${signed(d("vitals.hr")!.abs, 0)} bpm` },
    { key: "sbp", label: "Blood Pressure", icon: "gauge", value: `${fmt(s.vitals.sbp, 0)}/${fmt(s.vitals.dbp, 0)}`, unit: "mmHg", base: `Earth ${b.vitals.sbp}/${b.vitals.dbp}`,
      delta: d("vitals.sbp") && d("vitals.dbp") && `${signed(d("vitals.sbp")!.abs, 0)} / ${signed(d("vitals.dbp")!.abs, 0)}` },
    { key: "temp", label: "Body Temp", icon: "thermo", value: fmt(s.vitals.temp, 1), unit: "°C", base: `Earth ${b.vitals.temp}`, delta: d("vitals.temp") && `${signed(d("vitals.temp")!.abs, 1)} °C` },
    { key: "sleep", label: "Sleep", icon: "moon", value: fmt(s.vitals.sleep, 1), unit: "h", base: `Earth ${b.vitals.sleep}`, delta: d("vitals.sleep") && `${signed(d("vitals.sleep")!.abs, 1)} h` },
    { key: "mood", label: "Mood", icon: "smile", value: s.vitals.mood === undefined ? "—" : `${s.vitals.mood}/10`, unit: moodBand(s.vitals.mood), base: `Earth ${b.vitals.mood}/10`, delta: d("vitals.mood") && signed(d("vitals.mood")!.abs, 0) },
  ];

  const lastLog = ctx.log[ctx.log.length - 1];
  const surveyAge = s.survey.submittedAt ? now - Date.parse(s.survey.submittedAt) : NaN;
  const surveyDone = surveyAge >= 0 && surveyAge < 24 * 3_600_000;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <Card className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-card-3 ring-1 ring-edge">
            <Icon name="user" className="h-10 w-10 text-accent-2" />
          </div>
          <div className="min-w-0">
            <p className="text-fg-3 text-sm">{mission.astronaut.role}</p>
            <p className="text-xl font-bold text-fg">{mission.astronaut.name}</p>
            <p className="mini">Mission: <span className="text-fg-2">{mission.mission.name}</span> · Day <span className="text-fg-2">{s.missionDay}</span></p>
            <p className="mini">Phase: <span className="text-fg-2">{s.env.phase}</span> · {mission.mission.gravity}</p>
            <p className="mt-1 text-[11px] text-fg-3">{mission.label}</p>
          </div>
        </Card>
        <div>
          <StatusBanner status={live.status} compact>
            <p className="mini mt-2">
              {live.rulesFired.slice(0, 2).map((h) => h.text).join(" · ") || live.dataIssues[0]?.message || "No demo review rules triggered."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => go("self-assessment")}>
                Start daily check-in<Icon name="arrow-right" />
              </button>
              <button type="button" className="btn-ghost" onClick={() => go("assessment")}>Open assessment</button>
            </div>
          </StatusBanner>
          <p className="mini mt-2">Live rules preview from current inputs ({live.rulesVersion}). Run the assessment to log it and get the explanation.</p>
        </div>
      </div>

      <section aria-labelledby="kpi-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="kpi-h" className="text-lg font-semibold">Key Health Indicators</h2>
          <span className="flex items-center gap-2 mini"><SimTag />Measured {ago(s.vitals.measuredAt, now)} · baseline from {b.period.toLowerCase()}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {kpis.map((k) => (
            <button key={k.key} type="button" onClick={() => go("vitals")} className="card p-4 text-left transition-colors hover:border-accent/50">
              <p className="flex items-center gap-2 text-sm font-semibold text-fg-2"><Icon name={k.icon} className="h-4 w-4 text-accent-2" />{k.label}</p>
              <p className="num mt-2 text-2xl font-bold text-fg">{k.value} <span className="text-sm font-medium text-fg-3">{k.unit}</span></p>
              <p className="mini num">{k.base}{k.delta ? ` · ${k.delta}` : ""}</p>
              <Sparkline values={series(k.key)} baseline={(b.vitals as Record<string, number>)[k.key]} className="mt-2 h-9 w-full" />
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Daily check-in" icon="clipboard">
          <p className="flex items-center gap-2 text-sm">
            {surveyDone
              ? <><Icon name="check" className="h-4 w-4 text-ok-fg" /><span className="text-fg">Completed {ago(s.survey.submittedAt, now)}</span></>
              : <><Icon name="alert" className="h-4 w-4 text-warn-fg" /><span className="text-fg">Not completed today</span></>}
          </p>
          <p className="mini mt-1">Fatigue {s.survey.fatigue ?? "—"}/10 · Symptoms: {live.symptoms.join(", ") || (s.survey.symptomsAnswer === "none" ? "none" : "not answered")}</p>
          <button type="button" className="btn-secondary mt-3 w-full" onClick={() => go("self-assessment")}>Open self-assessment</button>
        </Card>
        <Card title="SpaceLab snapshot" icon="flask" aside={<SimTag />}>
          <p className="mini num">Hemoglobin {b.labs.hemoglobin} → {fmt(s.labs.hemoglobin, 0)} g/L ({signedPct(d("labs.hemoglobin")?.pct ?? null)})</p>
          <p className="mini num">WBC {b.labs.wbc} → {fmt(s.labs.wbc, 1)} ×10⁹/L</p>
          <p className="mini">Specimen {ago(s.labs.collectedAt, now)}</p>
          <button type="button" className="btn-secondary mt-3 w-full" onClick={() => go("spacelab")}>View biomarkers</button>
        </Card>
        <Card title="Mission environment" icon="orbit" aside={<SimTag />}>
          <p className="mini num">CO₂ {fmt(s.env.co2Pct, 2)}% · Cabin {fmt(s.env.cabinTempC, 0)} °C · RH {fmt(s.env.humidityPct, 0)}%</p>
          <p className="mini">{s.env.lightCycle} · {live.context.length ? "Context note added" : "No context notes"}</p>
          <p className="mini">Context only. Never changes the status.</p>
          <button type="button" className="btn-secondary mt-3 w-full" onClick={() => go("environment")}>Inspect environment</button>
        </Card>
        <Card title="Latest mission log" icon="list">
          {lastLog
            ? <><p className="mini">{ago(lastLog.createdAt, now)} · {lastLog.type}</p><p className="mt-1 line-clamp-3 text-sm text-fg-2">{lastLog.text}</p></>
            : <p className="mini">No events yet. Save a check-in, run an assessment, or add a note.</p>}
          <button type="button" className="btn-secondary mt-3 w-full" onClick={() => go("log")}>Open mission log</button>
        </Card>
      </div>

      <Card title="Demo scenarios" icon="sparkles" aside={<span className="mini">Fictional inputs. All go through the same rules.</span>}>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((sc) => (
            <button key={sc.id} type="button" className="btn-ghost" onClick={() => ctx.loadScenario(sc.id)} title={sc.description}>
              {sc.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
