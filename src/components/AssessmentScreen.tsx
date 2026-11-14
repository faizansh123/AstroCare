// F05 Assessment (traffic light) + F06 explanation (file 07 §7-8). Lists readings, baselines, deltas, rules fired,
// timestamp, rules version and limitations. Symptoms and "seek help regardless of colour" are always shown.
import { SCENARIOS } from "../data/scenarios";
import { signed, signedPct } from "../lib/deltas";
import type { Ctx } from "../appTypes";
import { Explanation } from "./Explanation";
import { HazardCard } from "./HazardCard";
import { StatusBanner } from "./StatusBadge";
import { Card, Icon, ago } from "./ui";

export function AssessmentScreen({ ctx }: { ctx: Ctx }) {
  const { assessment: a, assessedSnapshot: s, now } = ctx;

  if (!a || !s) {
    return (
      <div className="space-y-5">
        <Card title="Integrated health assessment" icon="shield" aside={<span className="chip bg-card-3 text-fg-2">NOT RUN</span>}>
          <p className="text-fg-2">Uses your simulated vital signs, Earth baseline differences, SpaceLab values, self-assessment and environmental context.
            GREEN / YELLOW / RED are illustrative training states, not medical risk scores.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => ctx.runAssessment()}>Generate assessment and explanation<Icon name="arrow-right" /></button>
            <button type="button" className="btn-ghost" onClick={() => ctx.go("self-assessment")}>Complete the self-assessment first</button>
          </div>
        </Card>
        <Card title="Or load a demo scenario" icon="sparkles">
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((sc) => <button key={sc.id} type="button" className="btn-ghost" onClick={() => { ctx.loadScenario(sc.id); ctx.runAssessment(sc.build()); }}>{sc.label}</button>)}
          </div>
        </Card>
      </div>
    );
  }

  const changed = JSON.stringify(s) !== JSON.stringify(ctx.snapshot);
  const symptomsShown = s.survey.symptoms.length > 0;

  return (
    <div className="space-y-5">
      {changed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-unk-line bg-unk-bg/40 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-unk-fg"><Icon name="info" className="h-4 w-4" />Inputs have changed since this assessment was run.</span>
          <button type="button" className="btn-secondary min-h-[36px]" onClick={() => ctx.runAssessment()}><Icon name="refresh" />Run again</button>
        </div>
      )}

      <StatusBanner status={a.status}>
        <p className="mini mt-2">Run {ago(a.createdAt, now)} · rules {a.rulesVersion} · vitals {a.dataAgeHours === null ? "time unknown" : `${a.dataAgeHours} h old`} at run time · simulated data</p>
      </StatusBanner>

      {/* Always visible (D6): symptoms and the escalation reminder, whatever the colour. */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className={`rounded-xl border p-4 ${symptomsShown ? "border-warn-line/60 bg-warn-bg/25" : "border-edge bg-card-2"}`}>
          <p className="flex items-center gap-2 text-sm font-semibold"><Icon name="body" className="h-4 w-4 text-accent-2" />Symptoms you reported</p>
          <p className="mt-1 text-sm text-fg-2">{a.symptoms.join(", ") || (s.survey.symptomsAnswer === "none" ? "None reported." : "Not answered.")}</p>
          {symptomsShown && <p className="mini mt-1">Shown whatever the vital signs say.</p>}
        </div>
        <div className="rounded-xl border border-accent/40 bg-card-3/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold"><Icon name="shield" className="h-4 w-4 text-accent" />Seek help regardless of colour</p>
          <p className="mt-1 text-sm text-fg-2">If you feel unwell or a symptom worries you, follow approved crew medical procedures and contact the crew medical officer, whatever this screen shows.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card title="Assessment summary" icon="list">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead><tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-fg-3">
                <th className="py-2">Measure</th><th className="py-2 text-right">Earth</th><th className="py-2 text-right">In-flight</th><th className="py-2 text-right">Change</th>
              </tr></thead>
              <tbody>
                {a.deltas.map((d) => {
                  const flagged = a.rulesFired.some((h) => h.refs.includes(d.ref));
                  return (
                    <tr key={d.ref} className="border-b border-edge/60">
                      <th scope="row" className="py-2 pr-2 text-left font-medium text-fg">{d.label}</th>
                      <td className="num py-2 text-right text-fg-3">{d.baseline.toFixed(d.digits)}</td>
                      <td className="num py-2 text-right font-semibold">{d.current.toFixed(d.digits)} <span className="text-xs font-normal text-fg-3">{d.unit}</span></td>
                      <td className={`num py-2 text-right ${flagged ? "font-semibold text-warn-fg" : "text-fg-2"}`}>
                        {flagged && <Icon name="alert" className="-mt-0.5 mr-1 inline h-3.5 w-3.5" aria-label="review flag" />}
                        {signed(d.abs, d.digits)} ({signedPct(d.pct)})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="What changed? (reason codes)" icon="target">
          <ul className="space-y-2 text-sm">
            {a.rulesFired.map((h) => (
              <li key={h.id} className="flex gap-2">
                <Icon name={h.level === "RED" ? "octagon" : "alert"} className={`mt-0.5 h-4 w-4 shrink-0 ${h.level === "RED" ? "text-bad-fg" : "text-warn-fg"}`} />
                <span><span className="font-mono text-xs text-fg-3">{h.id}</span> {h.text}</span>
              </li>
            ))}
            {a.dataIssues.map((i, n) => (
              <li key={`d${n}`} className="flex gap-2"><Icon name="help" className="mt-0.5 h-4 w-4 shrink-0 text-unk-fg" /><span><span className="font-mono text-xs text-fg-3">{i.id}</span> {i.message}</span></li>
            ))}
            {a.context.map((h) => (
              <li key={h.id} className="flex gap-2"><Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" /><span><span className="font-mono text-xs text-fg-3">{h.id}</span> {h.text} <em className="text-fg-3">(context, status unchanged)</em></span></li>
            ))}
            {!a.rulesFired.length && !a.dataIssues.length && !a.context.length && <li className="text-fg-3">No illustrative review rule was triggered.</li>}
          </ul>
        </Card>
      </div>

      <HazardCard ctx={ctx} />

      <Explanation assessment={a} snapshot={s} ai={ctx.ai} />

      <Card title="Limitations" icon="info">
        <ul className="grid gap-1 text-sm text-fg-2 sm:grid-cols-2">{a.limitations.map((l) => <li key={l} className="flex gap-2"><span aria-hidden className="text-fg-3">•</span>{l}</li>)}</ul>
      </Card>

      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" className="btn-ghost" onClick={() => ctx.go("self-assessment")}><Icon name="arrow-left" />Back to self-assessment</button>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => ctx.go("log")}>View mission log</button>
          <button type="button" className="btn-primary" onClick={() => ctx.go("guidance")}>View guidance<Icon name="arrow-right" /></button>
        </div>
      </div>
    </div>
  );
}
