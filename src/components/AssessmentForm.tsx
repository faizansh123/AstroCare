// Start form: profile, measurements, symptoms, context (FR-01..FR-03). Single page for the baseline;
// the four-step stepper from file 13 §8 comes later.
import { useState } from "react";
import scenarios from "../data/scenarios.json";
import { validate, type FieldErrors } from "../lib/validate";
import { SymptomTypeSchema, type HealthRecord, type SymptomType } from "../types/health";
import { Card, FIELD_LABELS, inputCls } from "./ui";

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
  mild: "border-slate-500 bg-slate-800 text-slate-100",
  moderate: "border-amber-400/60 bg-amber-950 text-amber-100",
  severe: "border-red-400/70 bg-red-950 text-red-100",
};

const empty = (): HealthRecord => ({
  recordId: crypto.randomUUID(), astronautId: "AC-01", missionDay: 42, recordedAt: "",
  source: "manual", environment: "station", measurements: {}, symptoms: [], symptomsAnswer: undefined, context: {},
});

const pretty = (s: string) => s.replace(/_/g, " ");

export function AssessmentForm({ onSubmit }: { onSubmit: (r: HealthRecord) => void }) {
  const [rec, setRec] = useState<HealthRecord>(empty);
  const [scenarioId, setScenarioId] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [symType, setSymType] = useState<SymptomType>("dizziness");
  const [symSev, setSymSev] = useState<Severity>("mild");

  const setM = (k: MeasureKey, v: string) =>
    setRec((r) => ({ ...r, measurements: { ...r.measurements, [k]: v === "" ? undefined : Number(v) } }));

  const loadScenario = (id: string) => {
    setScenarioId(id);
    setErrors({});
    if (id === "") return setRec(empty());
    const s = scenarios.find((x) => x.id === id);
    if (s) setRec({ ...(structuredClone(s.record) as HealthRecord), recordId: crypto.randomUUID() });
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
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-sky-500/40 bg-sky-950/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-sky-200">Demo scenarios</p>
          <p className="text-sm text-slate-400">Load a fictional case, then edit any value. All cases go through the same rules.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <button key={s.id} type="button" onClick={() => loadScenario(s.id)} aria-pressed={scenarioId === s.id}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                scenarioId === s.id ? "border-sky-400 bg-sky-500 text-slate-950" : "border-slate-600 text-slate-200 hover:border-sky-400"}`}>
              {s.label.replace(" (fictional)", "")}
            </button>
          ))}
          <button type="button" onClick={() => loadScenario("")}
            className="rounded-full px-3 py-1.5 text-sm text-slate-400 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-400">
            Clear
          </button>
        </div>
      </div>

      <Card title="Mission context" step={1}
        aside={<span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">Source: {rec.source}</span>}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <span className="text-sm text-slate-400">Astronaut</span>
            <p className="mt-1 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5 font-mono">AC-01 <span className="text-slate-500">(fictional)</span></p>
          </div>
          <label className="block">
            <span className="text-sm text-slate-400">Mission day</span>
            <input type="number" min={0} className={inputCls + " mt-1"} value={rec.missionDay}
              onChange={(e) => setRec({ ...rec, missionDay: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-sm text-slate-400">Environment</span>
            <select className={inputCls + " mt-1"} value={rec.environment}
              onChange={(e) => setRec({ ...rec, environment: e.target.value as HealthRecord["environment"] })}>
              {ENVIRONMENTS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-slate-500">Environment is recorded as context only. It never changes thresholds or lowers a status.</p>
      </Card>

      <Card title="Measurements" step={2}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm font-medium text-slate-200">{FIELD_LABELS[f.key]}</span>
              <div className="relative mt-1">
                <input type="number" step={f.step} inputMode="decimal" placeholder="—"
                  className={inputCls + " pr-16"}
                  value={rec.measurements[f.key] ?? ""}
                  onChange={(e) => setM(f.key, e.target.value)}
                  aria-invalid={!!errors[f.key]} aria-describedby={`${f.key}-help ${f.key}-err`} />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">{f.unit}</span>
              </div>
              <span id={`${f.key}-help`} className="mt-1 block text-xs text-slate-500">ⓘ {f.help}</span>
              {errors[f.key] && <span id={`${f.key}-err`} className="mt-1 block text-sm text-red-300">⚠ {errors[f.key]}</span>}
            </label>
          ))}
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-slate-200">Mood <span className="font-normal text-slate-500">(private, optional)</span></legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const on = rec.measurements.mood === m.value;
              return (
                <button key={m.value} type="button" aria-pressed={on}
                  onClick={() => setRec({ ...rec, measurements: { ...rec.measurements, mood: on ? undefined : m.value } })}
                  className={`rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                    on ? "border-sky-400 bg-sky-500/20 text-sky-100" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}>
                  {m.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <Card title="Symptoms" step={3}>
        <fieldset>
          <legend className="sr-only">Do you have any symptoms?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["none", "reported", "unknown"] as const).map((a) => {
              const on = rec.symptomsAnswer === a;
              return (
                <label key={a} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 focus-within:ring-2 focus-within:ring-sky-400 ${
                  on ? "border-sky-400 bg-sky-500/10" : "border-slate-700 hover:border-slate-500"}`}>
                  <input type="radio" name="symptomsAnswer" className="accent-sky-400" checked={on}
                    onChange={() => setRec({ ...rec, symptomsAnswer: a, symptoms: a === "reported" ? rec.symptoms : [] })} />
                  {a === "none" ? "No symptoms" : a === "reported" ? "I have symptoms" : "Not sure"}
                </label>
              );
            })}
          </div>
        </fieldset>

        {rec.symptomsAnswer === "reported" && (
          <div className="mt-4 space-y-3 rounded-xl bg-slate-950/50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <select aria-label="Symptom" className={inputCls + " sm:flex-1"} value={symType} onChange={(e) => setSymType(e.target.value as SymptomType)}>
                {SymptomTypeSchema.options.map((t) => <option key={t} value={t}>{pretty(t)}</option>)}
              </select>
              <select aria-label="Severity" className={inputCls + " sm:w-40"} value={symSev} onChange={(e) => setSymSev(e.target.value as Severity)}>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
              <button type="button"
                className="rounded-lg bg-slate-700 px-4 py-2.5 font-medium hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
                onClick={() => setRec({ ...rec, symptoms: [...rec.symptoms, { type: symType, severity: symSev, onset: "today" }] })}>
                + Add
              </button>
            </div>
            {rec.symptoms.length === 0 ? (
              <p className="text-sm text-slate-500">No symptoms added yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {rec.symptoms.map((s, i) => (
                  <li key={i} className={`flex items-center gap-2 rounded-full border py-1 pl-3 pr-1 text-sm capitalize ${SEV_CLS[s.severity]}`}>
                    {pretty(s.type)} · {s.severity}
                    <button type="button" aria-label={`Remove ${pretty(s.type)}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      onClick={() => setRec({ ...rec, symptoms: rec.symptoms.filter((_, j) => j !== i) })}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <Card title="Notes" step={4}>
        <textarea className={inputCls} rows={2} placeholder="Activity, posture, anything else worth recording (optional)"
          value={rec.context.notes ?? ""}
          onChange={(e) => setRec({ ...rec, context: { ...rec.context, notes: e.target.value } })} />
      </Card>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400" aria-live="polite">
          {errorCount > 0 ? <span className="text-red-300">⚠ Fix {errorCount} field{errorCount > 1 ? "s" : ""} above.</span>
            : "Missing values are fine. They give Insufficient Data, never Green."}
        </p>
        <button type="submit" className="rounded-xl bg-sky-500 px-8 py-3 text-lg font-semibold text-slate-950 hover:bg-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-300">
          Run check →
        </button>
      </div>
    </form>
  );
}
