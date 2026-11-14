// Assessment Review: F05 Assessment (traffic light) + F06 explanation (file 07 §7-8), plus the saved assessment
// history (file 15 §10 workflow 2). Past records show the status the rules gave at the time; they are never re-run.
// Lists readings, baselines, deltas, rules fired,
// timestamp, rules version and limitations. Symptoms and "seek help regardless of colour" are always shown.
// Reading order (UI-UX-AUDIT #25): status with symptoms and escalation -> next steps -> what changed -> explanation
// -> spaceflight factors -> limitations.
import { useRef, useState, type Ref } from "react";
import { SCENARIOS } from "../data/scenarios";
import { signed, signedPct } from "../lib/deltas";
import type { Ctx } from "../appTypes";
import { Explanation } from "./Explanation";
import { HazardCard } from "./HazardCard";
import { StatusBanner, StatusChip } from "./StatusBadge";
import type { AssessmentRecord } from "../lib/store";
import { Card, Icon, ago, type IconName } from "./ui";

// Assessment summary groups. Display grouping only; the rules engine does not use it.
const SUMMARY_GROUPS = [
  { id: "vitals", label: "Vital signs", icon: "heart", refs: ["vitals.hr", "vitals.sbp", "vitals.dbp", "vitals.temp", "vitals.rr", "vitals.spo2"] },
  { id: "wellbeing", label: "Sleep and mood", icon: "moon", refs: ["vitals.sleep", "vitals.mood"] },
  { id: "labs", label: "Blood labs (SpaceLab)", icon: "flask", refs: ["labs.hemoglobin", "labs.wbc", "labs.glucose", "labs.calcium"] },
] as const satisfies readonly { id: string; label: string; icon: IconName; refs: readonly string[] }[];
// Anything not listed above still shows, so a new measure is never silently dropped.
const OTHER_GROUP = { id: "other", label: "Other measures", icon: "info", refs: [] } as const;

export function AssessmentScreen({ ctx }: { ctx: Ctx }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLElement>(null);
  const history = ctx.history;
  const latest = history[history.length - 1];
  const selected = selectedId ? history.find((r) => r.id === selectedId) : undefined;
  // The run in memory (with its live Gemini state) is the latest record when their timestamps match.
  const currentIsLatest = !!ctx.assessment && (!latest || latest.assessment.createdAt === ctx.assessment.createdAt);

  let view: Ctx = ctx;
  let shownId: string | undefined = latest?.id;
  let isPast = false;
  const fromRecord = (r: AssessmentRecord): Ctx =>
    ({ ...ctx, assessment: r.assessment, assessedSnapshot: r.snapshot, ai: { loading: false, outcome: r.ai ?? null } });
  if (selected && !(selected === latest && currentIsLatest)) {
    view = fromRecord(selected);
    shownId = selected.id;
    isPast = selected !== latest;
  } else if (!ctx.assessment && latest) {
    view = fromRecord(latest); // after a reload, show the most recent saved assessment
  }

  const pick = (id: string) => {
    setSelectedId(id);
    top.current?.scrollIntoView({ block: "start" });
  };

  return (
    <div ref={top} className="scroll-mt-24 space-y-8">
      {history.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] text-fg-3">{history.length} saved assessments on this device.</p>
          <button type="button" className="btn-ghost min-h-[40px] px-3 text-[13px]"
            onClick={() => historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            <Icon name="list" />Previous assessments
          </button>
        </div>
      )}
      {isPast && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-card-2 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-fg-2"><Icon name="clock" className="h-4 w-4 text-accent" />
            You are viewing a previous assessment. Its status is what the rules gave at that time.</span>
          <button type="button" className="btn-secondary min-h-[40px] px-4" onClick={() => setSelectedId(null)}>Back to latest</button>
        </div>
      )}
      <AssessmentDetail key={shownId ?? "current"} ctx={view} past={isPast} />
      {history.length > 0 && <AssessmentHistory sectionRef={historyRef} history={history} shownId={shownId} now={ctx.now} onPick={pick} />}
    </div>
  );
}

function AssessmentHistory({ history, shownId, now, onPick, sectionRef }: {
  history: AssessmentRecord[]; shownId?: string; now: number; onPick: (id: string) => void; sectionRef: Ref<HTMLElement>;
}) {
  const newestFirst = [...history].reverse();
  return (
    <section ref={sectionRef} aria-labelledby="hist-h" className="scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h2 id="hist-h" className="text-[17px] font-semibold text-fg">Previous assessments</h2>
        <p className="mini">Newest first · stored in this browser only (last 50)</p>
      </div>
      <ul className="space-y-2">
        {newestFirst.map((r, i) => {
          const a = r.assessment;
          const on = r.id === shownId;
          const reasons = a.rulesFired.length + a.dataIssues.length + a.context.length;
          return (
            <li key={r.id}>
              <button type="button" onClick={() => onPick(r.id)} aria-current={on ? "true" : undefined}
                className={`flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border px-4 py-3 text-left transition-colors ${
                  on ? "border-accent/50 bg-white/[0.06]" : "border-white/[0.06] bg-card hover:bg-white/[0.04]"}`}>
                <StatusChip status={a.status} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-fg">
                    <time dateTime={a.createdAt}>{new Date(a.createdAt).toLocaleString()}</time>
                    <span className="font-normal text-fg-3"> · {ago(a.createdAt, now)} · Day {r.snapshot.missionDay}</span>
                  </span>
                  <span className="block text-[13px] text-fg-3">
                    {a.symptoms.length ? `Symptoms: ${a.symptoms.join(", ")}` : "No symptoms reported"} · {reasons} {reasons === 1 ? "reason" : "reasons"} · rules {a.rulesVersion}
                  </span>
                </span>
                <span className="text-[12px] font-medium text-fg-3">
                  {on ? "Viewing" : i === 0 ? "Latest" : "Open"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AssessmentDetail({ ctx, past }: { ctx: Ctx; past: boolean }) {
  const { assessment: a, assessedSnapshot: s, now } = ctx;

  if (!a || !s) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-6 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-card-2"><Icon name="shield" className="h-8 w-8 text-accent" /></span>
        <div>
          <h2 className="text-[22px] font-semibold">No assessment yet</h2>
          <p className="mt-2 text-fg-3">Uses your vital signs, Earth baseline differences, SpaceLab values, self-assessment and environmental context.
            GREEN / YELLOW / RED are illustrative training states, not medical risk scores.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className="btn-primary" onClick={() => ctx.go("self-assessment")}>Start the self-assessment<Icon name="arrow-right" /></button>
          <button type="button" className="btn-secondary" onClick={() => ctx.runAssessment()}>Assess current inputs</button>
        </div>
        <div className="pt-4">
          <p className="eyebrow">Or load a demo scenario</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {SCENARIOS.map((sc) => <button key={sc.id} type="button" className="btn-ghost min-h-[40px] px-4 text-[13px]" onClick={() => { ctx.loadScenario(sc.id); ctx.runAssessment(sc.build()); }}>{sc.label}</button>)}
          </div>
        </div>
      </div>
    );
  }

  const changed = !past && JSON.stringify(s) !== JSON.stringify(ctx.snapshot);
  const otherSymptoms = s.survey.otherSymptoms?.trim() ?? "";
  const symptomsShown = s.survey.symptoms.length > 0 || otherSymptoms.length > 0;
  const reasons = a.rulesFired.length + a.dataIssues.length + a.context.length;

  return (
    <div className="space-y-6">
      {changed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card-2 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-fg-2"><Icon name="info" className="h-4 w-4 text-accent" />Inputs have changed since this assessment was run.</span>
          <button type="button" className="btn-secondary min-h-[40px] px-4" onClick={() => ctx.runAssessment()}><Icon name="refresh" />Run again</button>
        </div>
      )}

      <StatusBanner status={a.status}>
        <p className="mini mt-2">
          Assessment at <time dateTime={a.createdAt}>{new Date(a.createdAt).toLocaleString()}</time> · {ago(a.createdAt, now)} · rules {a.rulesVersion} ·
          vitals {a.dataAgeHours === null ? "time unknown" : `${a.dataAgeHours} h old`} at run time
        </p>
        {/* Always visible (D6): symptoms and the escalation reminder, whatever the colour. */}
        <div className="mt-5 grid gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-[14px] font-semibold text-fg">
              <Icon name="body" className={`h-4 w-4 ${symptomsShown ? "text-warn-fg" : "text-fg-3"}`} />Symptoms you reported
            </p>
            <p className="mt-1 text-[14px] text-fg-2">{a.symptoms.join(", ") || (otherSymptoms ? "None ticked." : s.survey.symptomsAnswer === "none" ? "None reported." : "Not answered.")}</p>
            {otherSymptoms && <p className="mt-1 break-words text-[14px] text-fg-2"><span className="font-semibold text-fg">Other symptoms:</span> {otherSymptoms} <span className="text-fg-3">(free text, not read by the rules)</span></p>}
            {symptomsShown && <p className="mini mt-1">Shown whatever the vital signs say.</p>}
          </div>
          <div>
            <p className="flex items-center gap-2 text-[14px] font-semibold text-fg"><Icon name="shield" className="h-4 w-4 text-accent" />Seek help regardless of colour</p>
            <p className="mt-1 text-[14px] text-fg-2">If you feel unwell or a symptom worries you, follow approved crew medical procedures and contact the crew medical officer, whatever this screen shows.</p>
          </div>
        </div>
      </StatusBanner>

      <Explanation assessment={a} snapshot={s} ai={ctx.ai} part="actions" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn-ghost px-3" onClick={() => ctx.go("self-assessment")}><Icon name="arrow-left" />Back to self-assessment</button>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => ctx.go("guidance")}>View guidance<Icon name="arrow-right" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card title="Assessment summary">
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[380px] text-sm">
              <thead><tr className="text-left text-[12px] text-fg-3">
                <th className="pb-2 font-medium">Measure</th><th className="pb-2 text-right font-medium">Earth</th><th className="pb-2 text-right font-medium">In-flight</th><th className="pb-2 text-right font-medium">Change</th>
              </tr></thead>
              {[...SUMMARY_GROUPS, OTHER_GROUP].map((g) => {
                const rows = g.id === "other"
                  ? a.deltas.filter((d) => !SUMMARY_GROUPS.some((x) => (x.refs as readonly string[]).includes(d.ref)))
                  : a.deltas.filter((d) => (g.refs as readonly string[]).includes(d.ref));
                if (!rows.length) return null;
                const isFlagged = (ref: string) => a.rulesFired.some((h) => h.refs.includes(ref));
                const flaggedCount = rows.filter((d) => isFlagged(d.ref)).length;
                return (
                  <tbody key={g.id}>
                    <tr>
                      <th scope="rowgroup" colSpan={4} className="pb-1.5 pt-5 text-left">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-fg-2">
                            <Icon name={g.icon} className="h-3.5 w-3.5 text-accent" />{g.label}
                          </span>
                          <span className={`text-[12px] font-medium ${flaggedCount ? "text-warn-fg" : "text-fg-3"}`}>
                            {flaggedCount ? `${flaggedCount} flagged` : "No flags"}
                          </span>
                        </span>
                      </th>
                    </tr>
                    {rows.map((d) => {
                      const flagged = isFlagged(d.ref);
                      return (
                        <tr key={d.ref} className={`border-t border-white/[0.06] ${flagged ? "bg-warn-bg/40" : ""}`}>
                          <th scope="row" className={`py-2.5 pl-2 pr-2 text-left font-medium text-fg ${flagged ? "border-l-2 border-warn-fg" : "border-l-2 border-transparent"}`}>{d.label}</th>
                          <td className="num py-2.5 text-right text-fg-3">{d.baseline.toFixed(d.digits)}</td>
                          <td className="num py-2.5 text-right font-semibold">{d.current.toFixed(d.digits)} <span className="text-xs font-normal text-fg-3">{d.unit}</span></td>
                          <td className={`num py-2.5 pr-2 text-right ${flagged ? "font-semibold text-warn-fg" : "text-fg-2"}`}>
                            {flagged && <Icon name="alert" className="-mt-0.5 mr-1 inline h-3.5 w-3.5" aria-label="review flag" />}
                            {signed(d.abs, d.digits)} ({signedPct(d.pct)})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                );
              })}
            </table>
          </div>
        </Card>

        <Card title="What changed?" aside={<span className="mini">{reasons} {reasons === 1 ? "reason" : "reasons"}</span>}>
          <ul className="space-y-3 text-[14px]">
            {a.rulesFired.map((h) => (
              <li key={h.id} className="flex gap-2.5">
                <Icon name={h.level === "RED" ? "octagon" : "alert"} className={`mt-0.5 h-4 w-4 shrink-0 ${h.level === "RED" ? "text-bad-fg" : "text-warn-fg"}`} />
                <span className="text-fg-2">{h.text} <span className="whitespace-nowrap text-[11px] text-fg-3">{h.id}</span></span>
              </li>
            ))}
            {a.dataIssues.map((i, n) => (
              <li key={`d${n}`} className="flex gap-2.5"><Icon name="help" className="mt-0.5 h-4 w-4 shrink-0 text-unk-fg" /><span className="text-fg-2">{i.message} <span className="whitespace-nowrap text-[11px] text-fg-3">{i.id}</span></span></li>
            ))}
            {a.context.map((h) => (
              <li key={h.id} className="flex gap-2.5"><Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span className="text-fg-2">{h.text} <em className="text-fg-3">(context, status unchanged)</em> <span className="whitespace-nowrap text-[11px] text-fg-3">{h.id}</span></span></li>
            ))}
            {!reasons && <li className="text-fg-3">No illustrative review rule was triggered.</li>}
          </ul>
        </Card>
      </div>

      <Explanation assessment={a} snapshot={s} ai={ctx.ai} part="evidence" />

      <HazardCard ctx={ctx} />

      <section aria-labelledby="lim-h" className="px-1">
        <h2 id="lim-h" className="text-[15px] font-semibold text-fg-2">Limitations</h2>
        <ul className="mt-2 grid gap-x-8 gap-y-1 text-[13px] text-fg-3 sm:grid-cols-2">{a.limitations.map((l) => <li key={l} className="flex gap-2"><span aria-hidden>•</span>{l}</li>)}</ul>
      </section>
    </div>
  );
}
