// F08 Body map (file 07 §4): brain/head, heart, lungs, blood/immune, bones, sleep/mood. Shows related current values,
// reported symptoms and fired rules, with a no-causation note. It groups inputs; it never locates or diagnoses.
import { useState } from "react";
import { ENV, LABS, SYMPTOMS, VITALS, type RegionId } from "../data/catalog";
import { signed, signedPct } from "../lib/deltas";
import type { Ctx } from "../appTypes";
import type { RuleHit, SymptomId } from "../types/health";
import { Card, Icon, SimTag, fmt } from "./ui";

const REGIONS: Record<RegionId, { label: string; refs: string[]; symptoms: SymptomId[]; note: string; pos: { top: string; left: string } }> = {
  brain: { label: "Brain / head", refs: [], symptoms: ["headache", "dizziness", "nausea", "difficulty_concentrating"], pos: { top: "6%", left: "60%" },
    note: "Relevant context: sleep quality, mood, cabin CO₂ and circadian timing. No individual cause is inferred." },
  sleep: { label: "Sleep / mood", refs: [VITALS.sleep.ref, VITALS.mood.ref, "survey.fatigue"], symptoms: ["fatigue"], pos: { top: "17%", left: "4%" },
    note: "Record sleep, fatigue and mood alongside the light cycle and workload. Persistent concerns warrant review under crew protocols." },
  heart: { label: "Heart / circulation", refs: [VITALS.hr.ref, VITALS.sbp.ref, VITALS.dbp.ref], symptoms: [], pos: { top: "31%", left: "56%" },
    note: "Relevant context: altered gravity, hydration and measurement conditions (posture, time of day, device)." },
  lungs: { label: "Lungs / breathing", refs: [ENV.co2Pct.ref], symptoms: ["severe_breathing_difficulty"], pos: { top: "38%", left: "6%" },
    note: "Cabin CO₂ alone does not establish respiratory impairment. This prototype collects no oxygenation data." },
  blood: { label: "Blood / immune", refs: [LABS.hemoglobin.ref, LABS.wbc.ref, LABS.glucose.ref], symptoms: [], pos: { top: "55%", left: "55%" },
    note: "Values are fictional. Lab interpretation needs specimen and reference context. A change is not a diagnosis." },
  bones: { label: "Bones / muscles", refs: [LABS.calcium.ref], symptoms: [], pos: { top: "75%", left: "8%" },
    note: "Microgravity can affect bone and muscle physiology. Serum calcium alone does not quantify bone density." },
};
const IDS = Object.keys(REGIONS) as RegionId[];

function regionHits(id: RegionId, fired: RuleHit[], reported: SymptomId[]): RuleHit[] {
  const r = REGIONS[id];
  return fired.filter((h) => {
    if (h.refs.some((ref) => r.refs.includes(ref))) return true;
    if (h.id === "RED-TRAIN-BREATHING") return id === "lungs";
    if (h.id === "YEL-SYMPTOMS") return reported.some((sid) => SYMPTOMS[sid].region === id);
    return false;
  });
}

export function BodyMapScreen({ ctx }: { ctx: Ctx }) {
  const { live, snapshot: s, baseline: b } = ctx;
  const [sel, setSel] = useState<RegionId>("heart");
  const reported = s.survey.symptoms.map((x) => x.id);
  const state = (id: RegionId) => {
    const hits = regionHits(id, live.rulesFired, reported);
    const syms = reported.filter((sid) => SYMPTOMS[sid].region === id);
    const level = hits.some((h) => h.level === "RED") ? "RED" : hits.length ? "YELLOW" : syms.length ? "SYMPTOM" : "NONE";
    return { hits, syms, level };
  };
  const r = REGIONS[sel];
  const st = state(sel);

  const rows = r.refs.map((ref) => {
    const d = live.deltas.find((x) => x.ref === ref);
    if (d) return { ref, label: d.label, text: `${d.current.toFixed(d.digits)} ${d.unit} vs Earth ${d.baseline.toFixed(d.digits)} (${signed(d.abs, d.digits)}, ${signedPct(d.pct)})` };
    if (ref === "survey.fatigue") return { ref, label: "Fatigue", text: `${s.survey.fatigue ?? "—"}/10 (no Earth baseline)` };
    if (ref === ENV.co2Pct.ref) return { ref, label: "Cabin CO₂", text: `${fmt(s.env.co2Pct, 2)}% (context only)` };
    return { ref, label: ref, text: "Not measured" };
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <Card title="Interactive body map" icon="body" aside={<SimTag />}>
        <p className="mini mb-3">Select a region to see related values, symptoms and context. Markers show where a rule fired or a symptom was reported.</p>
        <div className="relative mx-auto flex min-h-[380px] max-w-[420px] items-center justify-center rounded-xl bg-card-2">
          <svg viewBox="0 0 170 320" aria-hidden className="h-[340px] w-[190px]">
            <circle cx="85" cy="35" r="29" fill="#1e5871" stroke="#76c8e8" strokeWidth="2" />
            <rect x="72" y="63" width="26" height="21" rx="8" fill="#1e5871" />
            <path d="M52 82 Q85 72 118 82 L132 185 L109 197 L108 288 Q108 307 96 307 L86 307 L85 204 L82 204 L81 307 L70 307 Q58 305 59 288 L61 197 L38 185Z" fill="#1e5871" stroke="#76c8e8" strokeWidth="2" />
            <path d="M52 88 L23 180 L36 186 L68 111 M118 88 L147 180 L134 186 L102 111" fill="#1e5871" stroke="#76c8e8" strokeWidth="2" />
          </svg>
          {IDS.map((id) => {
            const { level } = state(id);
            const on = sel === id;
            return (
              <button key={id} type="button" onClick={() => setSel(id)} aria-pressed={on} style={REGIONS[id].pos}
                className={`absolute flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  on ? "border-accent bg-action text-white" : "border-[#9cd4e8]/70 bg-[#164f68] text-white hover:bg-[#3489a4]"}`}>
                {level === "RED" && <Icon name="octagon" className="h-3.5 w-3.5 text-bad-fg" aria-label="red rule" />}
                {level === "YELLOW" && <Icon name="alert" className="h-3.5 w-3.5 text-warn-fg" aria-label="review flag" />}
                {level === "SYMPTOM" && <Icon name="info" className="h-3.5 w-3.5 text-accent" aria-label="symptom reported" />}
                {REGIONS[id].label.split(" / ")[0]}
              </button>
            );
          })}
        </div>
        <ul className="mt-3 flex flex-wrap gap-3 text-xs text-fg-3">
          <li className="flex items-center gap-1"><Icon name="octagon" className="h-3.5 w-3.5 text-bad-fg" />Red training rule</li>
          <li className="flex items-center gap-1"><Icon name="alert" className="h-3.5 w-3.5 text-warn-fg" />Review flag</li>
          <li className="flex items-center gap-1"><Icon name="info" className="h-3.5 w-3.5 text-accent" />Symptom reported</li>
        </ul>
      </Card>

      <Card title={r.label} icon="target">
        <h3 className="text-sm font-semibold text-fg-2">Related current values</h3>
        {rows.length ? (
          <ul className="mt-2 divide-y divide-edge/60 text-sm">
            {rows.map((x) => <li key={x.ref} className="num flex justify-between gap-3 py-2"><span className="text-fg-3">{x.label}</span><span className="text-right">{x.text}</span></li>)}
          </ul>
        ) : <p className="mini mt-1">No direct measurement in this prototype. See symptoms and context below.</p>}

        <h3 className="mt-4 text-sm font-semibold text-fg-2">Symptoms</h3>
        <p className="mt-1 text-sm">
          {st.syms.length ? st.syms.map((sid) => SYMPTOMS[sid].label).join(", ") : <span className="text-fg-3">None reported for this region.</span>}
        </p>
        <p className="mini">Tracked here: {r.symptoms.length ? r.symptoms.map((sid) => SYMPTOMS[sid].label.toLowerCase()).join(", ") : "none"}.</p>

        <h3 className="mt-4 text-sm font-semibold text-fg-2">Rules fired (live)</h3>
        {st.hits.length ? (
          <ul className="mt-1 space-y-1 text-sm">{st.hits.map((h) => <li key={h.id} className="flex gap-2"><Icon name={h.level === "RED" ? "octagon" : "alert"} className={`mt-0.5 h-4 w-4 shrink-0 ${h.level === "RED" ? "text-bad-fg" : "text-warn-fg"}`} />{h.text}</li>)}</ul>
        ) : <p className="mini mt-1">None for this region.</p>}

        <p className="callout mt-4">{r.note} The body map groups inputs to help you find them. It does not locate or diagnose anything.</p>
        {sel === "blood" && <p className="mini mt-2">Earth baselines: Hb {b.labs.hemoglobin} g/L, WBC {b.labs.wbc} ×10⁹/L, glucose {b.labs.glucose} mmol/L.</p>}
      </Card>
    </div>
  );
}
