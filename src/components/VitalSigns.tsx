// F02 Earth vs space vital signs (file 07 §4): HR, SBP, DBP, temperature, sleep, mood. Absolute and % change,
// baseline timestamp, BP components separate. Published research is shown in a separate, labelled panel.
import research from "../data/research.json";
import { VITALS, VITAL_KEYS, moodBand, type VitalKey } from "../data/catalog";
import { signed, signedPct } from "../lib/deltas";
import { issuesByField } from "../lib/validate";
import type { Ctx } from "../appTypes";
import type { Vitals } from "../types/health";
import { EarthSpaceBars } from "./charts";
import { Card, Icon, MeasureField, Unverified, ago } from "./ui";

export function VitalSigns({ ctx }: { ctx: Ctx }) {
  const { snapshot: s, baseline: b, live, now } = ctx;
  const errors = issuesByField(live.dataIssues);
  const setVital = (k: VitalKey, v: number | undefined) =>
    ctx.updateSnapshot((x) => ({ ...x, vitals: { ...x.vitals, [k]: v, measuredAt: new Date().toISOString() } }));
  const setMeta = (patch: Partial<Vitals>) => ctx.updateSnapshot((x) => ({ ...x, vitals: { ...x.vitals, ...patch } }));
  const norsk = research.studies[0];

  return (
    <div className="space-y-5">
      <Card title="Earth vs space: individual astronaut">
        <p className="mini -mt-2 mb-4">
          Earth values are the preflight baseline ({b.period}, recorded {new Date(b.recordedAt).toLocaleDateString()}).
          In-flight values are this mission day's readings, measured {ago(s.vitals.measuredAt, now)}. Edit them below.
        </p>
        <div className="mb-2 flex gap-4 text-xs text-fg-2">
          <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-4 rounded-full bg-earth" />Earth baseline (top)</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-4 rounded-full bg-space" />In-flight (bottom)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-[12px] text-fg-3">
                <th className="py-2 font-semibold">Measure</th>
                <th className="w-[42%] py-2 font-semibold">Earth vs in-flight</th>
                <th className="py-2 text-right font-semibold">Change</th>
                <th className="py-2 text-right font-semibold">%</th>
              </tr>
            </thead>
            <tbody>
              {VITAL_KEYS.map((k) => {
                const m = VITALS[k];
                const d = live.deltas.find((x) => x.ref === m.ref);
                const flagged = live.rulesFired.some((h) => h.refs.includes(m.ref));
                return (
                  <tr key={k} className="border-t border-white/[0.06]">
                    <th scope="row" className="py-3 pr-3 text-left font-semibold text-fg">
                      {m.label}
                      {flagged && <span className="ml-2 chip bg-warn-bg text-warn-fg"><Icon name="alert" className="h-3 w-3" />Review flag</span>}
                    </th>
                    <td className="py-3 pr-4"><EarthSpaceBars earth={b.vitals[k]} space={s.vitals[k]} unit={m.unit} digits={m.digits} /></td>
                    <td className="num py-3 text-right text-fg">{d ? `${signed(d.abs, m.digits)} ${m.unit}` : "—"}</td>
                    <td className="num py-3 text-right font-semibold text-fg">{d ? signedPct(d.pct) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mini mt-3">Blood pressure components are compared separately. Percentages are shown only when the baseline is nonzero and units match.</p>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card title="Adjust in-flight vital signs">
          <div className="grid gap-3 sm:grid-cols-2">
            {VITAL_KEYS.map((k) => {
              const m = VITALS[k];
              const d = live.deltas.find((x) => x.ref === m.ref);
              return (
                <MeasureField key={k} id={`v-${k}`} label={m.label} unit={m.unit} value={s.vitals[k]} min={m.min} max={m.max} step={m.step}
                  onChange={(v) => setVital(k, v)} error={errors[m.ref]}
                  hint={<>Earth {b.vitals[k]} {m.unit}{d ? ` · Δ ${signed(d.abs, m.digits)}` : ""}{k === "mood" ? ` · ${moodBand(s.vitals.mood)}` : ""}</>} />
              );
            })}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="mini">BP posture
              <select className="input mt-1" value={s.vitals.posture} onChange={(e) => setMeta({ posture: e.target.value as Vitals["posture"] })}>
                <option value="seated">Seated</option><option value="supine">Supine</option><option value="standing">Standing</option><option value="unknown">Unknown</option>
              </select>
            </label>
            <label className="mini">Temperature site
              <select className="input mt-1" value={s.vitals.tempSite} onChange={(e) => setMeta({ tempSite: e.target.value as Vitals["tempSite"] })}>
                <option value="oral">Oral</option><option value="tympanic">Tympanic</option><option value="forehead">Forehead</option><option value="unknown">Unknown</option>
              </select>
            </label>
          </div>
          <p className="mini mt-3">Clearing a number box marks it as not measured. Missing or implausible required values give INSUFFICIENT DATA.</p>
        </Card>

        <Card title="Published astronaut research" aside={<Unverified />}>
          <p className="mini">Separate reference. {norsk.cohort}, {norsk.origin.toLowerCase()}. <strong className="text-fg-2">Not this astronaut</strong> and never used as a personal baseline.</p>
          <ul className="mt-3 divide-y divide-edge/60">
            {norsk.values.map((v) => (
              <li key={v.label} className="num flex justify-between py-2 text-sm"><span className="text-fg-2">{v.label}</span><span>Earth {v.earth} → ISS {v.space} {v.unit}</span></li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <a className="btn-ghost" href={norsk.url} target="_blank" rel="noopener noreferrer">Open study<Icon name="external" /></a>
            <button type="button" className="btn-secondary" onClick={() => ctx.go("research")}>NASA Research panel</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
