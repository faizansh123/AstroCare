// Start form: profile, measurements, symptoms, context (FR-01..FR-03). Single page for the baseline;
// the four-step stepper from file 13 §8 comes later. Symptoms are picked through the body map (FR-12): it only
// groups the existing symptom list by area and never changes how the rules treat a symptom.
import { useState } from "react";
import { BODY_MAP_NOTE, BodyMap, REGIONS, type RegionId } from "./BodyMap";
import scenarios from "../data/scenarios.json";
import { validate, type FieldErrors } from "../lib/validate";
import type { HealthRecord, SymptomType } from "../types/health";
import { Card, FIELD_LABELS, Icon, inputCls } from "./ui";

type MeasureKey = Exclude<keyof HealthRecord["measurements"], "mood">;
type Severity = "mild" | "moderate" | "severe";

const FIELDS: { key: MeasureKey; unit: string; step: string; help: string }[] = [
  { key: "heartRateBpm", unit: "bpm", step: "1", help: "Seated, at rest for 5 minutes." },
  { key: "systolicMmHg", unit: "mmHg", step: "1", help: "Record posture and device." },
  { key: "diastolicMmHg", unit: "mmHg", step: "1", help: "Same reading as systolic." },
  { key: "temperatureC", unit: "°C", step: "0.1", help: "Note site and method." },
  { key: "sleepHours", unit: "h", step: "0.1", help: "Self-reported, last 24 hours." },
  { key: "fatigueScore", unit: "/ 10", step: "1", help: "0 = none, 10 = worst." },
];

const ENVIRONMENTS: { value: HealthRecord["environment"]; label: string }[] = [
  { value: "spacecraft", label: "Spacecraft" },
  { value: "station", label: "Station" },
  { value: "rover", label: "Rover" },
  { value: "lunar_base", label: "Lunar base" },
  { value: "mars_base", label: "Mars base" },
];

const MOODS = [
  { value: "good", label: "Good" },
  { value: "ok", label: "OK" },
  { value: "low", label: "Low" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

const SEV_CLS: Record<Severity, string> = {
  mild: "border-edge-strong bg-surface-3 text-fg",
  moderate: "border-amber-400/60 bg-amber-950 text-amber-100",
  severe: "border-red-400/70 bg-red-950 text-red-100",
};

const empty = (): HealthRecord => ({
  recordId: crypto.randomUUID(), astronautId: "AC-01", missionDay: 42, recordedAt: "",
  source: "manual", environment: "station", measurements: {}, symptoms: [], symptomsAnswer: undefined, context: {},
});

const pretty = (s: string) => s.replace(/_/g, " ");

const fromScenario = (id: string): HealthRecord | null => {
  const s = scenarios.find((x) => x.id === id);
  return s ? { ...(structuredClone(s.record) as HealthRecord), recordId: crypto.randomUUID() } : null;
};

export function AssessmentForm({ onSubmit, initialScenarioId = "" }: { onSubmit: (r: HealthRecord) => void; initialScenarioId?: string }) {
  const [rec, setRec] = useState<HealthRecord>(() => fromScenario(initialScenarioId) ?? empty());
  const [scenarioId, setScenarioId] = useState(initialScenarioId);
  const [region, setRegion] = useState<RegionId>("head");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [symType, setSymType] = useState<SymptomType>("dizziness");
  const [symSev, setSymSev] = useState<Severity>("mild");

  const setM = (k: MeasureKey, v: string) =>
    setRec((r) => ({ ...r, measurements: { ...r.measurements, [k]: v === "" ? undefined : Number(v) } }));

  const loadScenario = (id: string) => {
    setScenarioId(id);
    setErrors({});
    if (id === "") return setRec(empty());
    const r = fromScenario(id);
    if (r) setRec(r);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(rec.measurements);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit({ ...rec, recordedAt: new Date().toISOString() });
  };

  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {/* Scenario loader */}
      <div className="flex flex-col gap-3 card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Demo scenarios</p>
          <p className="text-sm text-fg-2">Load a fictional case, then edit any value. All cases go through the same rules.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <button key={s.id} type="button" onClick={() => loadScenario(s.id)} aria-pressed={scenarioId === s.id}
              className={`min-h-[44px] rounded-lg border px-4 text-sm font-medium transition active:scale-[0.98] ${
                scenarioId === s.id ? "border-fg bg-fg text-bg" : "border-edge-strong bg-surface-2 text-fg hover:bg-surface-3"}`}>
              {s.label.replace(" (fictional)", "")}
            </button>
          ))}
          <button type="button" onClick={() => loadScenario("")}
            className="min-h-[44px] rounded-lg px-3 text-sm text-fg-2 underline-offset-4 hover:text-fg hover:underline">
            Clear
          </button>
        </div>
      </div>

      <Card kicker="Step one" title="Mission context" step={1}
        aside={<span className="tag border-edge-strong text-fg-2">Source: {rec.source}</span>}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <span className="text-sm text-fg-2">Astronaut</span>
            <p className="mt-1 flex min-h-[44px] items-center rounded-lg border border-edge bg-bg px-3.5 num">AC-01 <span className="ml-2 text-fg-3">(fictional)</span></p>
          </div>
          <label className="block">
            <span className="text-sm text-fg-2">Mission day</span>
            <input type="number" min={0} className={inputCls + " mt-1"} value={rec.missionDay}
              onChange={(e) => setRec({ ...rec, missionDay: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-sm text-fg-2">Environment</span>
            <select className={inputCls + " mt-1"} value={rec.environment}
              onChange={(e) => setRec({ ...rec, environment: e.target.value as HealthRecord["environment"] })}>
              {ENVIRONMENTS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-fg-3">Environment is recorded as context only. It never changes thresholds or lowers a status.</p>
      </Card>

      <Card kicker="Step two" title="Measurements" step={2}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="flex items-center gap-2 text-sm font-medium text-fg">{FIELD_LABELS[f.key]}</span>
              <div className="relative mt-1">
                <input type="number" step={f.step} inputMode="decimal" placeholder="—"
                  className={inputCls + " num pr-16"}
                  value={rec.measurements[f.key] ?? ""}
                  onChange={(e) => setM(f.key, e.target.value)}
                  aria-invalid={!!errors[f.key]} aria-describedby={`${f.key}-help ${f.key}-err`} />
                <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-fg-3">{f.unit}</span>
              </div>
              <span id={`${f.key}-help`} className="mt-1.5 flex items-center gap-1.5 text-xs text-fg-3"><Icon name="info" className="h-3 w-3 shrink-0" />{f.help}</span>
              {errors[f.key] && <span id={`${f.key}-err`} className="mt-1 flex items-center gap-1.5 text-sm text-red-300"><Icon name="alert" className="h-3.5 w-3.5 shrink-0" />{errors[f.key]}</span>}
            </label>
          ))}
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-fg">Mood <span className="font-normal text-fg-3">(private, optional)</span></legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const on = rec.measurements.mood === m.value;
              return (
                <button key={m.value} type="button" aria-pressed={on}
                  onClick={() => setRec({ ...rec, measurements: { ...rec.measurements, mood: on ? undefined : m.value } })}
                  className={`min-h-[44px] rounded-lg border px-4 text-sm transition active:scale-[0.98] ${
                    on ? "border-accent bg-accent/15 text-accent" : "border-edge-strong text-fg-2 hover:border-accent/60"}`}>
                  {m.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <Card kicker="Step three" title="Symptoms" step={3}>
        <fieldset>
          <legend className="sr-only">Do you have any symptoms?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["none", "reported", "unknown"] as const).map((a) => {
              const on = rec.symptomsAnswer === a;
              return (
                <label key={a} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition focus-within:ring-2 focus-within:ring-accent ${
                  on ? "border-accent bg-accent/10 text-fg" : "border-edge-strong text-fg-2 hover:border-accent/60"}`}>
                  <input type="radio" name="symptomsAnswer" className="accent-accent" checked={on}
                    onChange={() => setRec({ ...rec, symptomsAnswer: a, symptoms: a === "reported" ? rec.symptoms : [] })} />
                  {a === "none" ? "No symptoms" : a === "reported" ? "I have symptoms" : "Not sure"}
                </label>
              );
            })}
          </div>
        </fieldset>

        {rec.symptomsAnswer === "reported" && (
          <div className="mt-4 grid gap-5 rounded-lg border border-edge bg-bg p-4 md:grid-cols-[200px_1fr] sm:p-5">
            <div>
              <p className="eyebrow mb-2">Pick a body area</p>
              <div className="mx-auto h-[300px] w-full max-w-[170px]">
                <BodyMap result={null} selected={region} onSelect={(r) => { setRegion(r); setSymType(REGIONS[r].symptoms[0]); }} />
              </div>
            </div>
            <div className="min-w-0 space-y-4">
              <fieldset>
                <legend className="text-sm font-medium text-fg">{REGIONS[region].label}: symptom</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(REGIONS) as RegionId[]).map((r) => (
                    <button key={r} type="button" onClick={() => { setRegion(r); setSymType(REGIONS[r].symptoms[0]); }} aria-pressed={region === r}
                      className={`min-h-[36px] rounded-lg px-3 text-xs transition ${region === r ? "bg-accent/15 text-accent" : "text-fg-3 hover:text-fg-2"}`}>
                      {REGIONS[r].label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {REGIONS[region].symptoms.map((t) => (
                    <button key={t} type="button" onClick={() => setSymType(t)} aria-pressed={symType === t}
                      className={`min-h-[44px] rounded-lg border px-4 text-sm capitalize transition active:scale-[0.98] ${symType === t ? "border-accent bg-accent/15 text-accent" : "border-edge-strong text-fg-2 hover:border-accent/60"}`}>
                      {pretty(t)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium text-fg">Severity</legend>
                <div className="mt-2 inline-flex rounded-lg border border-edge-strong p-1">
                  {(["mild", "moderate", "severe"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setSymSev(v)} aria-pressed={symSev === v}
                      className={`min-h-[40px] rounded-lg px-4 text-sm capitalize transition ${symSev === v ? "bg-surface-3 text-fg" : "text-fg-2 hover:text-fg"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </fieldset>
              <button type="button" className="btn-secondary"
                onClick={() => setRec({ ...rec, symptoms: [...rec.symptoms, { type: symType, severity: symSev, onset: "today" }] })}>
                <Icon name="plus" /> Add {pretty(symType)} ({symSev})
              </button>
              <div className="border-t border-edge pt-4">
                <p className="eyebrow mb-2">Reported ({rec.symptoms.length})</p>
                {rec.symptoms.length === 0 ? (
                  <p className="text-sm text-fg-3">No symptoms added yet.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {rec.symptoms.map((s, i) => (
                      <li key={i} className={`flex items-center gap-2 rounded-full border py-1 pl-3 pr-1 text-sm capitalize ${SEV_CLS[s.severity]}`}>
                        {s.severity !== "mild" && <Icon name={s.severity === "severe" ? "octagon" : "alert"} className="h-3.5 w-3.5" />}
                        {pretty(s.type)} · {s.severity}
                        <button type="button" aria-label={`Remove ${pretty(s.type)}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10"
                          onClick={() => setRec({ ...rec, symptoms: rec.symptoms.filter((_, j) => j !== i) })}><Icon name="x" className="h-3.5 w-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="flex items-start gap-2 text-xs text-fg-3"><Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />{BODY_MAP_NOTE} Any symptom is always shown in the result.</p>
            </div>
          </div>
        )}
      </Card>

      <Card kicker="Step four" title="Notes" step={4}>
        <textarea className={inputCls} rows={2} placeholder="Activity, posture, anything else worth recording (optional)"
          value={rec.context.notes ?? ""}
          onChange={(e) => setRec({ ...rec, context: { ...rec.context, notes: e.target.value } })} />
      </Card>

      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-xl border border-edge-strong bg-surface-2/95 p-3 pl-4 shadow-2xl shadow-black/50 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-2" aria-live="polite">
          {errorCount > 0 ? <span className="text-red-300">Fix {errorCount} field{errorCount > 1 ? "s" : ""} above.</span>
            : "Missing values are fine. They give Insufficient Data, never Green."}
        </p>
        <button type="submit" className="btn-primary px-6">
          Run check <Icon name="arrow-right" />
        </button>
      </div>
    </form>
  );
}
