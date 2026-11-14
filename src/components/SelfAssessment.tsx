// F04 Daily self-assessment, 4-step stepper (D13, file 07 §6): 1 Symptoms and feelings -> 2 Measurements ->
// 3 Lifestyle and environment -> 4 Review (shows missing or invalid fields, then Calculate).
// Stores sleep in hours (D11), fatigue 0-10 (D10), mood 1-10 (D9). Quick-pick chips only fill the number.
import { useEffect, useMemo, useRef, useState } from "react";
import rules from "../data/rules.json";
import { ENV, FATIGUE, SYMPTOMS, SYMPTOM_IDS, VITALS, fatigueBand, moodBand, type VitalKey } from "../data/catalog";
import { assess } from "../lib/rules";
import { issuesByField } from "../lib/validate";
import type { Ctx } from "../appTypes";
import type { Severity, Snapshot, SymptomId, Vitals } from "../types/health";
import { Card, Icon, MeasureField, ago, type IconName } from "./ui";

const STEPS = ["Symptoms", "Measurements", "Lifestyle", "Review"] as const;
// Field ownership is UI metadata only; validation remains in the existing rules pipeline.
const STEP_FIELDS = [
  ["vitals.sleep", "survey.fatigue", "vitals.mood", "survey.symptoms"],
  ["vitals.hr", "vitals.sbp", "vitals.dbp", "vitals.temp", "data.age"],
  ["env.co2Pct", "env.cabinTempC", "env.humidityPct"],
];
const FIELD_TARGETS: Record<string, string> = {
  "vitals.sleep": "sa-sleep", "survey.fatigue": "sa-fatigue", "vitals.mood": "sa-mood",
  "survey.symptoms": "sa-symptoms", "data.age": "sa-remeasure",
  ...Object.fromEntries(["hr", "sbp", "dbp", "temp"].map((k) => [`vitals.${k}`, `sa-${k}`])),
  ...Object.fromEntries(["co2Pct", "cabinTempC", "humidityPct"].map((k) => [`env.${k}`, `sa-${k}`])),
};
const SLEEP_PICKS: [string, number][] = [["≥ 8 h", 8], ["6–7 h", 6.5], ["4–5 h", 4.5], ["< 4 h", 3.5]];
const FATIGUE_PICKS: [string, number][] = [["None", 0], ["Mild", 3], ["Moderate", 5], ["High", 8]];
const MOOD_PICKS: [string, number][] = [["Very good", 10], ["Good", 8], ["Neutral", 6], ["Low", 4], ["Very low", 2]];

function Question({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 border-t border-white/[0.06] pt-5 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <p aria-hidden className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-fg"><Icon name={icon} className="h-[18px] w-[18px] text-accent" />{title}</p>
      {children}
    </fieldset>
  );
}

function Picks({ picks, value, onPick, label }: { picks: [string, number][]; value?: number; onPick: (v: number) => void; label: string }) {
  return (
    <div className="seg-group" role="group" aria-label={`${label} quick picks`}>
      {picks.map(([l, v]) => <button key={l} type="button" className="seg" aria-pressed={value === v} onClick={() => onPick(v)}>{l}</button>)}
    </div>
  );
}

export function SelfAssessment({ ctx }: { ctx: Ctx }) {
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);
  const content = useRef<HTMLDivElement>(null);
  const focusTarget = useRef<string | null>(null);
  const navigate = (next: number, target?: string) => {
    if (next === step) return;
    focusTarget.current = target ?? "heading";
    setVisited((previous) => previous.includes(next) ? previous : [...previous, next]);
    setStep(next);
  };
  useEffect(() => {
    if (!focusTarget.current) return;
    const target = focusTarget.current === "heading"
      ? content.current?.querySelector("h2")
      : document.getElementById(focusTarget.current);
    if (target) {
      if (target.tagName === "H2") target.tabIndex = -1;
      target.focus();
    }
    focusTarget.current = null;
  }, [step]);
  const [d, setD] = useState<Snapshot>(() => structuredClone(ctx.snapshot));
  const now = ctx.now;
  const preview = useMemo(() => assess(d, ctx.baseline, Date.now()), [d, ctx.baseline]);
  const errors = issuesByField(preview.dataIssues);
  const invalid = preview.dataIssues.filter((i) => i.id === "DATA-INVALID");
  const trigger = preview.rulesFired.some((h) => h.level === "RED");

  const setVital = (k: VitalKey, v: number | undefined) => setD((x) => ({ ...x, vitals: { ...x.vitals, [k]: v, measuredAt: new Date().toISOString() } }));
  const setSurvey = (patch: Partial<Snapshot["survey"]>) => setD((x) => ({ ...x, survey: { ...x.survey, ...patch } }));
  const toggleSymptom = (id: SymptomId, on: boolean) => setD((x) => {
    const list = on ? [...x.survey.symptoms.filter((y) => y.id !== id), { id, severity: "mild" as Severity }] : x.survey.symptoms.filter((y) => y.id !== id);
    return { ...x, survey: { ...x.survey, symptoms: list, symptomsAnswer: list.length ? "reported" : x.survey.symptomsAnswer === "reported" ? "unanswered" : x.survey.symptomsAnswer } };
  });
  const setSeverity = (id: SymptomId, sev: Severity) => setSurvey({ symptoms: d.survey.symptoms.map((y) => (y.id === id ? { ...y, severity: sev } : y)) });

  const calculate = () => {
    const final: Snapshot = { ...d, survey: { ...d.survey, submittedAt: new Date().toISOString() } };
    ctx.runAssessment(final);
  };

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <ol className="flex items-center gap-2 rounded-2xl border border-edge bg-card px-3 py-3 sm:px-5" aria-label="Progress">
        {STEPS.map((label, i) => {
          const needsAttention = i < 3 && preview.dataIssues.some((issue) => STEP_FIELDS[i].includes(issue.field));
          const complete = i < 3 && visited.includes(i) && !needsAttention;
          const state = needsAttention ? "Needs attention" : complete ? "Complete" : visited.includes(i) ? "Visited" : "Not visited";
          return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button type="button" onClick={() => navigate(i)} aria-current={step === i ? "step" : undefined}
              className="flex shrink-0 flex-col items-center gap-1 sm:flex-row sm:gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${
                step === i ? "border-action bg-action text-white" : needsAttention ? "border-unk-line text-unk-fg" : complete ? "border-transparent bg-card-3 text-accent" : "border-edge-strong text-fg-3"}`}>
                {complete ? <Icon name="check" className="h-4 w-4" strokeWidth={2.6} /> : needsAttention ? <Icon name="alert" className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`text-[13px] sm:text-sm ${step === i ? "font-semibold text-fg" : "text-fg-3"}`}>{label}<span className="sr-only"> · {step === i ? `Current · ${state}` : state}</span><span aria-hidden className="hidden text-xs font-normal text-fg-3 md:block">{state}</span></span>
            </button>
            {i < STEPS.length - 1 && <span aria-hidden className={`h-px min-w-[8px] flex-1 ${complete ? "bg-accent/60" : "bg-edge-strong"}`} />}
          </li>
        );})}
      </ol>

      <div ref={content}>

      {step === 0 && (
        <Card title="Step 1 · Symptoms and feelings">
          <p className="mini -mt-2 mb-5">Tell us how you are feeling today. This helps identify changes that need attention.</p>
          <div className="space-y-5">
            <Question icon="moon" title="How long did you sleep last night?">
              <Picks label="Sleep" picks={SLEEP_PICKS} value={d.vitals.sleep} onPick={(v) => setVital("sleep", v)} />
              <div className="mt-3 max-w-md"><MeasureField id="sa-sleep" label="Sleep (hours, saved as a number)" unit="h" value={d.vitals.sleep}
                min={0} max={12} step={0.5} onChange={(v) => setVital("sleep", v)} error={errors["vitals.sleep"]} /></div>
            </Question>
            <Question icon="battery" title="How would you rate your fatigue?">
              <Picks label="Fatigue" picks={FATIGUE_PICKS} value={d.survey.fatigue} onPick={(v) => setSurvey({ fatigue: v })} />
              <div className="mt-3 max-w-md"><MeasureField id="sa-fatigue" label={`Fatigue: ${fatigueBand(d.survey.fatigue)}`} unit="0–10" value={d.survey.fatigue}
                min={FATIGUE.min} max={FATIGUE.max} step={1} onChange={(v) => setSurvey({ fatigue: v })} error={errors["survey.fatigue"]} /></div>
            </Question>
            <Question icon="smile" title="How is your mood today?">
              <Picks label="Mood" picks={MOOD_PICKS} value={d.vitals.mood} onPick={(v) => setVital("mood", v)} />
              <div className="mt-3 max-w-md"><MeasureField id="sa-mood" label={`Mood: ${moodBand(d.vitals.mood)}`} unit="1–10" value={d.vitals.mood}
                min={1} max={10} step={1} onChange={(v) => setVital("mood", v)} error={errors["vitals.mood"]}
                hint="1 = very low, 10 = very good. Same scale as your preflight baseline." /></div>
            </Question>
            <Question icon="body" title="Are you experiencing any of the following?">
              <label className="mb-3 flex min-h-[36px] cursor-pointer items-center gap-2 text-sm">
                <input id="sa-symptoms" type="checkbox" className="h-4 w-4 accent-[#0a84ff]" checked={d.survey.symptomsAnswer === "none"}
                  onChange={(e) => setSurvey(e.target.checked ? { symptomsAnswer: "none", symptoms: [] } : { symptomsAnswer: "unanswered" })} />
                None of these
              </label>
              <ul className="grid gap-2 sm:grid-cols-2">
                {SYMPTOM_IDS.map((id) => {
                  const cur = d.survey.symptoms.find((y) => y.id === id);
                  const isTrigger = rules.trainingTriggers.includes(id);
                  return (
                    <li key={id} className={`rounded-xl px-3 py-2 transition-colors ${cur ? "bg-card-3/70 ring-1 ring-accent/50" : "bg-card-2/70"}`}>
                      <label className="flex min-h-[32px] cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" className="h-4 w-4 accent-[#0a84ff]" checked={!!cur} onChange={(e) => toggleSymptom(id, e.target.checked)} />
                        {SYMPTOMS[id].label}
                        {isTrigger && <span className="chip ml-auto bg-bad-bg text-[11px] text-bad-fg">Training trigger</span>}
                      </label>
                      {cur && (
                        <div className="seg-group mt-2" role="group" aria-label={`${SYMPTOMS[id].label} severity`}>
                          {(["mild", "moderate", "severe"] as Severity[]).map((sev) => (
                            <button key={sev} type="button" className="seg min-h-[32px] px-2.5 text-xs capitalize" aria-pressed={cur.severity === sev} onClick={() => setSeverity(id, sev)}>{sev}</button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <label htmlFor="sa-other-symptoms" className="mt-4 block text-sm font-semibold">Any other symptoms?</label>
              <textarea id="sa-other-symptoms" className="input mt-1 min-h-[72px]" maxLength={300} value={d.survey.otherSymptoms ?? ""}
                placeholder="Describe anything not listed above" onChange={(e) => setSurvey({ otherSymptoms: e.target.value })} />
              <p className="mini mt-1 flex justify-between gap-3"><span>Shown with your results and to the crew medical officer. The rules do not read this text, so tick a box above if one fits.</span><span className="shrink-0">{(d.survey.otherSymptoms ?? "").length}/300</span></p>
              {errors["survey.symptoms"] && <p className="mt-2 text-[13px] text-bad-fg">{errors["survey.symptoms"]}</p>}
              <p className="mini mt-2">Any symptom is always shown in your results, even if every number looks normal.</p>
            </Question>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title="Step 2 · Measurements">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card-2/70 px-4 py-2">
            <p className="mini flex items-center gap-1.5"><Icon name="clock" className="h-4 w-4" />Readings taken {ago(d.vitals.measuredAt, now)}{errors["data.age"] ? ` · ${errors["data.age"]}` : ""}</p>
            <button id="sa-remeasure" type="button" className="btn-ghost min-h-[34px] text-xs" onClick={() => setD((x) => ({ ...x, vitals: { ...x.vitals, measuredAt: new Date().toISOString() } }))}>I just re-measured these</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["hr", "sbp", "dbp", "temp", "rr", "spo2"] as VitalKey[]).map((k) => {
              const m = VITALS[k];
              return <MeasureField key={k} id={`sa-${k}`} label={m.label} unit={m.unit} value={d.vitals[k]} min={m.min} max={m.max} step={m.step}
                onChange={(v) => setVital(k, v)} error={errors[m.ref]} hint={`Earth baseline ${ctx.baseline.vitals[k]} ${m.unit}`} />;
            })}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="mini">BP posture
              <select className="input mt-1" value={d.vitals.posture} onChange={(e) => setD((x) => ({ ...x, vitals: { ...x.vitals, posture: e.target.value as Vitals["posture"] } }))}>
                <option value="seated">Seated</option><option value="supine">Supine</option><option value="standing">Standing</option><option value="unknown">Unknown</option>
              </select>
            </label>
            <label className="mini">Temperature site
              <select className="input mt-1" value={d.vitals.tempSite} onChange={(e) => setD((x) => ({ ...x, vitals: { ...x.vitals, tempSite: e.target.value as Vitals["tempSite"] } }))}>
                <option value="oral">Oral</option><option value="tympanic">Tympanic</option><option value="forehead">Forehead</option><option value="unknown">Unknown</option>
              </select>
            </label>
          </div>
          <p className="mini mt-3">Leave a box empty if you did not measure it. Missing required values give INSUFFICIENT DATA, never Green.</p>
        </Card>
      )}

      {step === 2 && (
        <Card title="Step 3 · Lifestyle and environment">
          <div className="grid gap-3 sm:grid-cols-3">
            {(["co2Pct", "cabinTempC", "humidityPct"] as const).map((k) => {
              const m = ENV[k];
              return <MeasureField key={k} id={`sa-${k}`} label={m.label} unit={m.unit} value={d.env[k]} min={m.min} max={m.max} step={m.step}
                onChange={(v) => setD((x) => ({ ...x, env: { ...x.env, [k]: v, observedAt: new Date().toISOString() } }))} error={errors[m.ref]} />;
            })}
          </div>
          <p className="callout mt-3">Environment is context only. It never changes your status and is never treated as the cause of a symptom.</p>
          <label htmlFor="sa-notes" className="mt-4 block text-sm font-semibold">Notes (optional)</label>
          <textarea id="sa-notes" className="input mt-1 min-h-[90px]" maxLength={500} value={d.survey.notes}
            placeholder="Timing of symptoms, workload, exercise, anything relevant…" onChange={(e) => setSurvey({ notes: e.target.value })} />
          <p className="mini mt-1 text-right">{d.survey.notes.length}/500</p>
        </Card>
      )}

      {step === 3 && (
        <Card title="Step 4 · Review">
          <p className="mini -mt-2">Check your answers below. Saving runs the local rules, saves the result to your assessment history and adds the explanation.</p>
          {preview.dataIssues.length > 0 && (
            <div className="mt-4 rounded-xl bg-unk-bg p-4">
              <p className="flex items-center gap-2 font-semibold text-unk-fg"><Icon name="help" className="h-4 w-4" />Missing, invalid or stale</p>
              <ul className="mt-2 space-y-1 text-sm">
                {preview.dataIssues.map((issue, n) => {
                  const owner = STEP_FIELDS.findIndex((fields) => fields.includes(issue.field));
                  const target = FIELD_TARGETS[issue.field];
                  return <li key={n} className="flex gap-2">
                    {owner >= 0 && target
                      ? <a className="text-accent underline" href={`#${target}`} onClick={(event) => { event.preventDefault(); navigate(owner, target); }}>{issue.message}</a>
                      : <span>{issue.message} <span className="text-fg-3">Review in {issue.field.startsWith("labs.") ? "SpaceLab" : "Environment"}.</span></span>}
                  </li>;
                })}
              </ul>
            </div>
          )}
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[
              ["Sleep", d.vitals.sleep !== undefined ? `${d.vitals.sleep} h` : "—"],
              ["Fatigue", d.survey.fatigue !== undefined ? `${d.survey.fatigue}/10 (${fatigueBand(d.survey.fatigue)})` : "—"],
              ["Mood", d.vitals.mood !== undefined ? `${d.vitals.mood}/10 (${moodBand(d.vitals.mood)})` : "—"],
              ["Symptoms", preview.symptoms.join(", ") || (d.survey.symptomsAnswer === "none" ? "None" : "Not answered")],
              ["Other symptoms", d.survey.otherSymptoms?.trim() || "—"],
              ["Heart rate", d.vitals.hr !== undefined ? `${d.vitals.hr} bpm` : "—"],
              ["Blood pressure", `${d.vitals.sbp ?? "—"}/${d.vitals.dbp ?? "—"} mmHg (${d.vitals.posture})`],
              ["Temperature", d.vitals.temp !== undefined ? `${d.vitals.temp} °C (${d.vitals.tempSite})` : "—"],
              ["Respiratory rate", d.vitals.rr !== undefined ? `${d.vitals.rr} /min` : "—"],
              ["SpO₂", d.vitals.spo2 !== undefined ? `${d.vitals.spo2}%` : "—"],
              ["Cabin", `CO₂ ${d.env.co2Pct ?? "—"}%, ${d.env.cabinTempC ?? "—"} °C, ${d.env.humidityPct ?? "—"}% RH`],
            ].map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-edge/60 py-1.5"><dt className="text-fg-3">{k}</dt><dd className="num text-right text-fg">{v}</dd></div>)}
          </dl>
          {invalid.length > 0 && !trigger && <p className="mt-4 text-[13px] font-medium text-bad-fg">Fix the invalid values above before calculating.</p>}
        </Card>
      )}

      </div>
      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" className="btn-ghost" disabled={step === 0} onClick={() => navigate(step - 1)}><Icon name="arrow-left" />Back</button>
        {step < 3
          ? <button type="button" className="btn-primary" onClick={() => navigate(step + 1)}>Next: {["Enter measurements", "Lifestyle and environment", "Review"][step]}<Icon name="arrow-right" /></button>
          : <button type="button" className="btn-primary" disabled={invalid.length > 0 && !trigger} onClick={calculate}>Save check-in and run assessment<Icon name="arrow-right" /></button>}
      </div>
    </div>
  );
}
