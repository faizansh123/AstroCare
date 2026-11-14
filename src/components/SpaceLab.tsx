// F03 SpaceLab biomarkers (file 07 §4): hemoglobin, WBC, glucose, calcium. Specimen time, units, baseline, delta,
// data-quality status. Labs never diagnose (file 07 §7). Glucose in mg/dL converts visibly to mmol/L (D23).
import { useState } from "react";
import { LABS, LAB_KEYS, type LabKey } from "../data/catalog";
import { glucoseMmol, signed, signedPct } from "../lib/deltas";
import { issuesByField } from "../lib/validate";
import type { Ctx } from "../appTypes";
import type { Labs } from "../types/health";
import { Card, Icon, MeasureField, ago, fmt } from "./ui";

export function SpaceLab({ ctx }: { ctx: Ctx }) {
  const { snapshot: s, baseline: b, live, now } = ctx;
  const [sel, setSel] = useState<LabKey>("hemoglobin");
  const errors = issuesByField(live.dataIssues);
  const m = LABS[sel];
  const d = live.deltas.find((x) => x.ref === m.ref);
  const raw = s.labs[sel];
  const isMgdl = sel === "glucose" && s.labs.glucoseUnit === "mg/dL";
  const setLab = (patch: Partial<Labs>) => ctx.updateSnapshot((x) => ({ ...x, labs: { ...x.labs, ...patch } }));
  const flagged = live.rulesFired.some((h) => h.refs.includes(m.ref));

  const quality = (k: LabKey) => {
    if (s.labs[k] === undefined) return { text: "No sample", cls: "text-fg-3", icon: "help" as const };
    if (errors[LABS[k].ref]) return { text: "Implausible, excluded", cls: "text-bad-fg", icon: "alert" as const };
    return { text: "Sample", cls: "text-ok-fg", icon: "check" as const };
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="group" aria-label="Biomarker">
        {LAB_KEYS.map((k) => {
          const lm = LABS[k];
          const ld = live.deltas.find((x) => x.ref === lm.ref);
          const q = quality(k);
          return (
            <button key={k} type="button" aria-pressed={sel === k} onClick={() => setSel(k)}
              className={`rounded-2xl border bg-card p-4 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] ${sel === k ? "border-accent/70 ring-1 ring-accent/40" : "border-edge hover:bg-[#232325]"}`}>
              <p className="text-sm font-semibold text-fg-2">{lm.label}</p>
              <p className="num mt-1 text-[22px] font-semibold">{fmt(k === "glucose" ? glucoseMmol(s.labs) : s.labs[k], lm.digits)} <span className="text-xs font-medium text-fg-3">{lm.unit}</span></p>
              <p className="mini num">Earth {b.labs[k]} · {ld ? signedPct(ld.pct) : "—"}</p>
              <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${q.cls}`}><Icon name={q.icon} className="h-3.5 w-3.5" />{q.text}</p>
            </button>
          );
        })}
      </div>

      <Card title={`SpaceLab · ${m.label}`}>
        <p className="mini -mt-2 mb-4">Laboratory values are invented solely to test the interface. A production system would need validated specimen, source, timestamp and reference information.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="well"><p className="mini uppercase tracking-wider">Earth baseline</p><p className="num mt-1 text-3xl font-semibold text-earth">{b.labs[sel]} <span className="text-base text-fg-3">{m.unit}</span></p></div>
          <div className="well"><p className="mini uppercase tracking-wider">In-flight sample</p>
            <p className="num mt-1 text-3xl font-semibold text-space">{fmt(sel === "glucose" ? glucoseMmol(s.labs) : raw, m.digits)} <span className="text-base text-fg-3">{m.unit}</span></p>
            {isMgdl && raw !== undefined && <p className="mini">Entered as {raw} mg/dL, converted ÷18 to mmol/L.</p>}
          </div>
        </div>
        <div className={`mt-3 rounded-xl p-4 text-sm ${flagged ? "bg-warn-bg" : "bg-card-2/70"}`}>
          <p className="flex flex-wrap items-center gap-2">
            {flagged && <span className="chip bg-warn-bg text-warn-fg"><Icon name="alert" className="h-3 w-3" />Review flag</span>}
            <strong>Baseline change:</strong>
            <span className="num">{d ? `${signed(d.abs, m.digits)} ${m.unit} (${signedPct(d.pct)})` : "no sample"}</span>
          </p>
          <p className="mini mt-1">A change alone is not a diagnosis.{sel === "hemoglobin" ? " Review trigger: a change of 10% or more (illustrative)." : " Display only, no rule."}</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MeasureField id={`lab-${sel}`} label={`Adjust ${m.label.toLowerCase()}`} unit={isMgdl ? "mg/dL" : m.unit} value={raw}
            min={isMgdl ? m.min * 18 : m.min} max={isMgdl ? m.max * 18 : m.max} step={isMgdl ? 1 : m.step}
            onChange={(v) => setLab({ [sel]: v, collectedAt: new Date().toISOString() } as Partial<Labs>)} error={errors[m.ref]} />
          <div className="well space-y-3">
            {sel === "glucose" && (
              <label className="mini block">Glucose unit
                <select className="input mt-1" value={s.labs.glucoseUnit} onChange={(e) => {
                  const unit = e.target.value as Labs["glucoseUnit"];
                  const g = s.labs.glucose;
                  const conv = g === undefined || unit === s.labs.glucoseUnit ? g : unit === "mg/dL" ? Math.round(g * 18) : Math.round((g / 18) * 10) / 10;
                  setLab({ glucoseUnit: unit, glucose: conv });
                }}>
                  <option value="mmol/L">mmol/L (canonical)</option><option value="mg/dL">mg/dL (converts ÷18)</option>
                </select>
              </label>
            )}
            <p className="mini"><Icon name="clock" className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />Specimen: {s.labs.specimen}, collected {ago(s.labs.collectedAt, now)}</p>
            {errors["labs.collectedAt"] && <p className="text-[13px] text-bad-fg">{errors["labs.collectedAt"]}</p>}
          </div>
        </div>
        <p className="callout mt-4">{m.note}</p>
      </Card>
    </div>
  );
}
