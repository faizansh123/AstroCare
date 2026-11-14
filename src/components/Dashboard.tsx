// F01 Mission dashboard (file 07 §4): indicator cards with baseline and delta, survey completion, SpaceLab and
// environment snapshots. Overall status is shown by the header status chip (App.tsx). v3.1 layout
// (project owner request, 14 Nov 2026): indicator tiles, the body map, then a short "Today" list. Tiles show
// respiratory rate and SpO2 in place of sleep and mood (D26); all eight stay in Health Trends.
import { SCENARIOS } from "../data/scenarios";
import { signed, signedPct } from "../lib/deltas";
import type { Ctx, Screen } from "../appTypes";
import { BodyMapScreen } from "./BodyMap";
import { Icon, ago, fmt, type IconName } from "./ui";

type MetricId = "hr" | "bp" | "temp" | "rr" | "spo2";

export function Dashboard({ ctx }: { ctx: Ctx }) {
  const { snapshot: s, baseline: b, live, now, go } = ctx;
  const d = (ref: string) => live.deltas.find((x) => x.ref === ref);
  const flagged = (...refs: string[]) => live.rulesFired.some((h) => h.refs.some((r) => refs.includes(r)));

  const metrics: Record<MetricId, { label: string; icon: IconName; value: string; unit: string; delta: string; flag: boolean}> = {
    hr: { label: "Heart rate", icon: "heart", value: fmt(s.vitals.hr, 0), unit: "bpm", flag: flagged("vitals.hr"),
      delta: d("vitals.hr") ? `${signed(d("vitals.hr")!.abs, 0)} vs Earth ${b.vitals.hr}` : `Earth ${b.vitals.hr}` },
    bp: { label: "Blood pressure", icon: "gauge", value: `${fmt(s.vitals.sbp, 0)}/${fmt(s.vitals.dbp, 0)}`, unit: "mmHg", flag: flagged("vitals.sbp", "vitals.dbp"),
      delta: d("vitals.sbp") && d("vitals.dbp") ? `${signed(d("vitals.sbp")!.abs, 0)}/${signed(d("vitals.dbp")!.abs, 0)} vs Earth` : `Earth ${b.vitals.sbp}/${b.vitals.dbp}` },
    temp: { label: "Body temp", icon: "thermo", value: fmt(s.vitals.temp, 1), unit: "°C", flag: flagged("vitals.temp"),
      delta: d("vitals.temp") ? `${signed(d("vitals.temp")!.abs, 1)} vs Earth ${b.vitals.temp}` : `Earth ${b.vitals.temp}` },
    rr: { label: "Resp. rate", icon: "wind", value: fmt(s.vitals.rr, 0), unit: "/min", flag: flagged("vitals.rr"),
      delta: d("vitals.rr") ? `${signed(d("vitals.rr")!.abs, 0)} vs Earth ${b.vitals.rr}` : `Earth ${b.vitals.rr}` },
    spo2: { label: "SpO₂", icon: "droplet", value: fmt(s.vitals.spo2, 0), unit: "%", flag: flagged("vitals.spo2"),
      delta: d("vitals.spo2") ? `${signed(d("vitals.spo2")!.abs, 0)} vs Earth ${b.vitals.spo2}` : `Earth ${b.vitals.spo2}` },
  };
  const ids = Object.keys(metrics) as MetricId[];

  const surveyAge = s.survey.submittedAt ? now - Date.parse(s.survey.submittedAt) : NaN;
  const surveyDone = surveyAge >= 0 && surveyAge < 24 * 3_600_000;
  const hb = d("labs.hemoglobin");

  const today: { to: Screen; icon: IconName; title: string; detail: string; tone?: "ok" | "warn" }[] = [
    { to: "self-assessment", icon: "clipboard", title: "Daily check-in", tone: surveyDone ? "ok" : "warn",
      detail: surveyDone ? `Completed ${ago(s.survey.submittedAt, now)}` : "Not completed today" },
    { to: "spacelab", icon: "flask", title: "SpaceLab",
      detail: `Hemoglobin ${fmt(s.labs.hemoglobin, 0)} g/L${hb ? ` · ${signedPct(hb.pct)} vs Earth` : ""}` },
    { to: "environment", icon: "orbit", title: "Cabin environment",
      detail: `CO₂ ${fmt(s.env.co2Pct, 2)}% · ${fmt(s.env.cabinTempC, 0)} °C · ${live.context.length ? "context note" : "no context notes"}` },
  ];

  return (
    <div className="space-y-6">
      <section aria-labelledby="kpi-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="kpi-h" className="px-1 text-[17px] font-semibold">Key health indicators</h2>
          {surveyDone
            ? <button type="button" className="btn-primary" onClick={() => ctx.runAssessment()}>Run assessment<Icon name="arrow-right" /></button>
            : <button type="button" className="btn-primary" onClick={() => go("self-assessment")}>Start daily check-in<Icon name="arrow-right" /></button>}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {ids.map((id, i) => {
            const k = metrics[id];
            return (
              <div key={id} className={`rounded-2xl border border-edge bg-card p-4 ${i === ids.length - 1 ? "col-span-2 md:col-span-1" : ""}`}>
                <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-fg-2">
                  <span className="flex items-center gap-1.5"><Icon name={k.icon} className="h-4 w-4 text-accent" />{k.label}</span>
                  {k.flag && <span className="chip bg-warn-bg px-1.5 text-warn-fg"><Icon name="alert" className="h-3 w-3" /><span className="sr-only">Review flag</span></span>}
                </span>
                <span className="num mt-2 block text-[26px] font-semibold leading-none text-fg">{k.value}<span className="ml-1 text-[13px] font-medium text-fg-3">{k.unit}</span></span>
                <span className="num mt-2 block text-[12px] text-fg-3">{k.delta}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-label="Body map">
        <BodyMapScreen ctx={ctx} />
      </section>

      <section aria-labelledby="today-h">
          <h2 id="today-h" className="mb-2 px-1 text-[17px] font-semibold">Today</h2>
          <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-edge bg-card">
            {today.map((t) => (
              <li key={t.to}>
                <button type="button" className="row" onClick={() => go(t.to)}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card-2"><Icon name={t.icon} className="h-[18px] w-[18px] text-accent" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-fg">{t.title}</span>
                    <span className="flex items-center gap-1 truncate text-[13px] text-fg-3">
                      {t.tone === "ok" && <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-ok-fg" />}
                      {t.tone === "warn" && <Icon name="alert" className="h-3.5 w-3.5 shrink-0 text-warn-fg" />}
                      <span className="truncate">{t.detail}</span>
                    </span>
                  </span>
                  <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-fg-3" />
                </button>
              </li>
            ))}
          </ul>
        </section>

      <details className="group rounded-2xl border border-edge bg-card">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-5 text-[14px] font-medium text-fg-2 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><Icon name="sparkles" className="h-4 w-4 text-fg-3" />Demo scenarios<span className="hidden text-fg-3 sm:inline">· same rules</span></span>
          <Icon name="chevron-right" className="h-4 w-4 text-fg-3 transition-transform group-open:rotate-90" />
        </summary>
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {SCENARIOS.map((sc) => (
            <button key={sc.id} type="button" className="btn-secondary min-h-[40px] px-4 text-[13px]" onClick={() => ctx.loadScenario(sc.id)} title={sc.description}>
              {sc.label}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
