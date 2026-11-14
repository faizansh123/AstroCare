// F07 Environment (file 07 §4): CO2, cabin temperature, humidity, light cycle, mission phase, radiation only if
// entered. Context only: never changes the status, never states a cause, hazards never inferred from vitals.
import mission from "../data/mission.json";
import rules from "../data/rules.json";
import { ENV, type EnvKey } from "../data/catalog";
import { issuesByField } from "../lib/validate";
import type { Ctx } from "../appTypes";
import type { Environment } from "../types/health";
import { Card, Icon, MeasureField, ago, fmt, type IconName } from "./ui";

export function EnvironmentScreen({ ctx }: { ctx: Ctx }) {
  const { snapshot: s, live, now } = ctx;
  const errors = issuesByField(live.dataIssues);
  const setEnv = (patch: Partial<Environment>) =>
    ctx.updateSnapshot((x) => ({ ...x, env: { ...x.env, ...patch, observedAt: new Date().toISOString() } }));
  const kpis: [string, string, IconName][] = [
    ["Cabin CO₂", `${fmt(s.env.co2Pct, 2)} %`, "wind"],
    ["Cabin temp", `${fmt(s.env.cabinTempC, 0)} °C`, "thermo"],
    ["Humidity", `${fmt(s.env.humidityPct, 0)} %`, "droplet"],
    ["Gravity", mission.mission.gravity, "orbit"],
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-edge bg-card lg:grid-cols-4">
        {kpis.map(([l, v, i], n) => (
          <div key={l} className={`p-5 ${n % 2 ? "border-l border-white/[0.06]" : ""} ${n >= 2 ? "border-t border-white/[0.06] lg:border-t-0" : ""} ${n === 2 ? "lg:border-l" : ""}`}>
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-fg-3"><Icon name={i} className="h-4 w-4" />{l}</p>
            <p className="num mt-1.5 text-[24px] font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <p className="mini -mt-3 px-1">Mission context.</p>

      {live.context.map((h) => (
        <div key={h.id} className="callout flex gap-2"><Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span><strong className="text-fg">Context note:</strong> {h.text} <span className="text-[11px] text-fg-3">{h.id}</span></span></div>
      ))}

      <div className="grid grid-cols-1 items-start gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card title="Adjust cabin conditions">
          <div className="grid gap-3 sm:grid-cols-2">
            {(["co2Pct", "cabinTempC", "humidityPct", "radiationMGy"] as EnvKey[]).map((k) => {
              const m = ENV[k];
              return (
                <MeasureField key={k} id={`env-${k}`} label={m.label} unit={m.unit} value={s.env[k]} min={m.min} max={m.max} step={m.step}
                  onChange={(v) => setEnv({ [k]: v } as Partial<Environment>)} error={errors[m.ref]}
                  hint={k === "co2Pct" ? `Demo reference ${mission.environmentReference.co2Pct}%. Context note at ${rules.context.co2PctAtLeast}% or higher.`
                    : k === "radiationMGy" ? "Optional manual entry, shown only if entered. Not live telemetry." : undefined} />
              );
            })}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="mini">Light cycle
              <select className="input mt-1" value={s.env.lightCycle} onChange={(e) => setEnv({ lightCycle: e.target.value })}>
                {["Day shift lighting", "Night shift lighting", "Pre-sleep dimmed lighting", "Sleep period"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="mini">Mission phase
              <input className="input mt-1" value={s.env.phase} maxLength={60} onChange={(e) => setEnv({ phase: e.target.value })} />
            </label>
          </div>
          <p className="mini mt-3">Observed {ago(s.env.observedAt, now)}</p>
        </Card>

        <Card title="How environment enters the assessment">
          <p className="text-[14px] text-fg-2">
            Cabin air quality, temperature, humidity, lighting, radiation exposure and altered gravity can provide important context.
            AstroCare shows these next to symptoms and vital-sign trends but <strong className="text-fg">does not infer individual causation</strong>.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-fg-2">
            <li className="flex gap-2"><Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-ok-fg" />Adds context sentences to the assessment.</li>
            <li className="flex gap-2"><Icon name="x" className="mt-1 h-4 w-4 shrink-0 text-bad-fg" />Never changes or lowers the status.</li>
            <li className="flex gap-2"><Icon name="x" className="mt-1 h-4 w-4 shrink-0 text-bad-fg" />Never changes thresholds and is never inferred from vitals.</li>
          </ul>
          <p className="mini mt-4">Radiation and lighting are contextual indicators, not measured live telemetry.</p>
        </Card>
      </div>
    </div>
  );
}
