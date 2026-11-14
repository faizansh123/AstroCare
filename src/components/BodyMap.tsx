// F08 Body map (file 07 §4, file 15 F08): brain/head, heart, lungs, blood/immune, bones, sleep/mood. Shows related
// current values, reported symptoms and fired rules, with a no-causation note. It groups inputs; it never locates or
// diagnoses. Layout follows UI-UX-AUDIT #30: the figure, the selected region and its readings stay visually connected,
// and an ordinary region list is the equivalent (keyboard and screen-reader) control. The figure itself is decorative.
import { useState } from "react";
import { ENV, LABS, SYMPTOMS, VITALS, type RegionId } from "../data/catalog";
import { signed, signedPct } from "../lib/deltas";
import type { Ctx } from "../appTypes";
import type { RuleHit, SymptomId } from "../types/health";
import { Card, Icon, fmt, type IconName } from "./ui";

type Level = "RED" | "YELLOW" | "SYMPTOM" | "NONE";

const REGIONS: Record<RegionId, {
  label: string; icon: IconName; refs: string[]; symptoms: SymptomId[]; note: string;
  anchor: [number, number]; side: "left" | "right"; labelY: number;
}> = {
  brain: { label: "Brain / head", icon: "sparkles", refs: [], symptoms: ["headache", "dizziness", "nausea", "difficulty_concentrating"],
    anchor: [170, 34], side: "right", labelY: 34,
    note: "Relevant context: sleep quality, mood, cabin CO₂ and circadian timing. No individual cause is inferred." },
  sleep: { label: "Sleep / mood", icon: "moon", refs: [VITALS.sleep.ref, VITALS.mood.ref, "survey.fatigue"], symptoms: ["fatigue"],
    anchor: [146, 26], side: "left", labelY: 26,
    note: "Record sleep, fatigue and mood alongside the light cycle and workload. Persistent concerns warrant review under crew protocols." },
  heart: { label: "Heart / circulation", icon: "heart", refs: [VITALS.hr.ref, VITALS.sbp.ref, VITALS.dbp.ref], symptoms: [],
    anchor: [178, 128], side: "right", labelY: 112,
    note: "Relevant context: altered gravity, hydration and measurement conditions (posture, time of day, device)." },
  lungs: { label: "Lungs / breathing", icon: "wind", refs: [ENV.co2Pct.ref], symptoms: ["severe_breathing_difficulty"],
    anchor: [152, 124], side: "left", labelY: 118,
    note: "Cabin CO₂ alone does not establish respiratory impairment. This prototype collects no oxygenation data." },
  blood: { label: "Blood / immune", icon: "droplet", refs: [LABS.hemoglobin.ref, LABS.wbc.ref, LABS.glucose.ref], symptoms: [],
    anchor: [170, 190], side: "right", labelY: 200,
    note: "Lab interpretation needs specimen and reference context. A change is not a diagnosis." },
  bones: { label: "Bones / muscles", icon: "body", refs: [LABS.calcium.ref], symptoms: [],
    anchor: [152, 300], side: "left", labelY: 300,
    note: "Microgravity can affect bone and muscle physiology. Serum calcium alone does not quantify bone density." },
};
const IDS: RegionId[] = ["brain", "sleep", "heart", "lungs", "blood", "bones"];

const LEVEL_TEXT: Record<Level, string> = {
  RED: "Red training rule", YELLOW: "Review flag", SYMPTOM: "Symptom reported", NONE: "Nothing flagged",
};
const LEVEL_ICON: Record<Level, IconName> = { RED: "octagon", YELLOW: "alert", SYMPTOM: "info", NONE: "check" };
const LEVEL_CLASS: Record<Level, string> = { RED: "text-bad-fg", YELLOW: "text-warn-fg", SYMPTOM: "text-accent", NONE: "text-fg-3" };
const LEVEL_HEX: Record<Level, string> = { RED: "#ff6961", YELLOW: "#ffd60a", SYMPTOM: "#409cff", NONE: "#98989f" };

function regionHits(id: RegionId, fired: RuleHit[], reported: SymptomId[]): RuleHit[] {
  const r = REGIONS[id];
  return fired.filter((h) => {
    if (h.refs.some((ref) => r.refs.includes(ref))) return true;
    if (h.id === "RED-TRAIN-BREATHING") return id === "lungs";
    if (h.id === "YEL-SYMPTOMS") return reported.some((sid) => SYMPTOMS[sid].region === id);
    return false;
  });
}

/* ---------- Figure geometry ---------- */

/** Smooth closed path through points (Catmull-Rom converted to cubic Béziers). */
function smooth(pts: [number, number][]): string {
  const n = pts.length;
  const p = (i: number) => pts[(i + n) % n];
  let d = `M${p(0)[0]},${p(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = p(i - 1), [x1, y1] = p(i), [x2, y2] = p(i + 1), [x3, y3] = p(i + 2);
    const t = 0.18;
    d += ` C${(x1 + (x2 - x0) * t).toFixed(1)},${(y1 + (y2 - y0) * t).toFixed(1)} ${(x2 - (x3 - x1) * t).toFixed(1)},${(y2 - (y3 - y1) * t).toFixed(1)} ${x2},${y2}`;
  }
  return d + "Z";
}

// Right half of the figure (x > 170), from the neck down the outside and back up the inside. Mirrored for the left.
const HALF: [number, number][] = [
  [179, 64], [181, 78], [200, 86], [216, 92], [224, 106], [227, 134], [231, 166], [236, 200], [241, 228],
  [246, 252], [242, 266], [233, 256], [229, 236], [221, 204], [214, 172], [209, 140], [205, 124], [204, 152],
  [199, 196], [205, 228], [203, 268], [199, 312], [197, 336], [196, 372], [193, 404], [203, 420], [199, 428],
  [180, 427], [179, 404], [180, 372], [178, 334], [176, 290], [170, 250],
];
const BODY = smooth([...HALF, ...HALF.slice(0, -1).reverse().map(([x, y]) => [340 - x, y] as [number, number])]);

/** Organ artwork, drawn at low contrast; the selected region is lit. */
function Organ({ id, lit, tone }: { id: RegionId; lit: boolean; tone: string }) {
  const fill = lit ? tone : "#ffffff";
  const fo = lit ? 0.28 : 0.05;
  const so = lit ? 0.95 : 0.18;
  const common = { fill, fillOpacity: fo, stroke: lit ? tone : "#ffffff", strokeOpacity: so, strokeWidth: 1.2, style: { transition: "all 220ms ease" } };
  switch (id) {
    case "brain":
      return (
        <g {...common}>
          <path d="M170 18c-10 0-17 6-17 15 0 7 5 12 11 13 2 0 4-1 6-2 2 1 4 2 6 2 6-1 11-6 11-13 0-9-7-15-17-15Z" />
          <path d="M170 19v26M160 26c3 2 4 5 3 8M180 26c-3 2-4 5-3 8M157 37c3 0 5-1 6-3M183 37c-3 0-5-1-6-3" fill="none" />
        </g>
      );
    case "sleep":
      return <path {...common} fill="none" strokeDasharray="2 3" d="M146 30a26 30 0 0 1 48 0" />;
    case "lungs":
      return (
        <g {...common}>
          <path d="M163 104c-2-4-7-4-10 0-8 10-12 30-11 46 1 6 6 8 12 5 6-3 9-8 9-14Z" />
          <path d="M177 104c2-4 7-4 10 0 8 10 12 30 11 46-1 6-6 8-12 5-6-3-9-8-9-14Z" />
          <path d="M170 86v18M170 104l-6 6M170 104l6 6" fill="none" />
        </g>
      );
    case "heart":
      return <path {...common} d="M176 120c3-5 11-4 12 2 1 5-3 10-12 18-6-5-11-9-11-14 0-6 7-8 11-6Z" />;
    case "blood":
      return (
        <g {...common} fill="none">
          <path d="M172 140v80M172 220l-12 30-6 70-2 60M172 220l10 30 6 70 2 60" />
          <path d="M168 96l-30 12-6 50-4 60M176 96l30 12 6 50 4 60" />
          <ellipse cx="188" cy="186" rx="7" ry="4" fill={fill} fillOpacity={fo} />
        </g>
      );
    case "bones":
      return (
        <g {...common}>
          <path d="M152 256h6l2 58h-8ZM182 256h6l-2 58h-8Z" />
          <circle cx="156" cy="322" r="5" /><circle cx="184" cy="322" r="5" />
          <path d="M152 332h6l1 64h-7ZM182 332h6l-1 64h-7Z" />
          <path d="M148 236q22 14 44 0" fill="none" />
        </g>
      );
  }
}

/* ---------- Screen ---------- */

export function BodyMapScreen({ ctx }: { ctx: Ctx }) {
  const { live, snapshot: s, baseline: b } = ctx;
  const [sel, setSel] = useState<RegionId>("heart");
  const reported = s.survey.symptoms.map((x) => x.id);
  const state = (id: RegionId) => {
    const hits = regionHits(id, live.rulesFired, reported);
    const syms = reported.filter((sid) => SYMPTOMS[sid].region === id);
    const level: Level = hits.some((h) => h.level === "RED") ? "RED" : hits.length ? "YELLOW" : syms.length ? "SYMPTOM" : "NONE";
    return { hits, syms, level };
  };
  const r = REGIONS[sel];
  const st = state(sel);
  const selTone = st.level === "NONE" ? "#409cff" : LEVEL_HEX[st.level];

  const rows = r.refs.map((ref) => {
    const d = live.deltas.find((x) => x.ref === ref);
    if (d) return { ref, label: d.label, value: `${d.current.toFixed(d.digits)}`, unit: d.unit,
      sub: `Earth ${d.baseline.toFixed(d.digits)} · ${signed(d.abs, d.digits)} (${signedPct(d.pct)})` };
    if (ref === "survey.fatigue") return { ref, label: "Fatigue", value: `${s.survey.fatigue ?? "—"}`, unit: "/10", sub: "No Earth baseline" };
    if (ref === ENV.co2Pct.ref) return { ref, label: "Cabin CO₂", value: fmt(s.env.co2Pct, 2), unit: "%", sub: "Context only" };
    return { ref, label: ref, value: "—", unit: "", sub: "Not measured" };
  });

  // Callout geometry for the selected region.
  const [ax, ay] = r.anchor;
  const lx = r.side === "right" ? 262 : 78;
  const elbowX = r.side === "right" ? lx - 14 : lx + 14;

  return (
    <div className="grid grid-cols-1 items-start gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card title="Body map">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[radial-gradient(ellipse_at_50%_35%,rgba(64,156,255,0.14),transparent_62%),linear-gradient(180deg,#0b0d12,#050608)]">
          {/* faint scan grid */}
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
          <svg viewBox="0 0 340 440" className="relative mx-auto block h-auto w-full max-w-[420px]" aria-hidden>
            <defs>
              <linearGradient id="bm-skin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2a3442" />
                <stop offset="1" stopColor="#141922" />
              </linearGradient>
              <radialGradient id="bm-glow">
                <stop offset="0" stopColor={selTone} stopOpacity="0.55" />
                <stop offset="1" stopColor={selTone} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* figure */}
            <ellipse cx="170" cy="36" rx="23" ry="28" fill="url(#bm-skin)" stroke="#5b6b80" strokeOpacity="0.6" />
            <path d={BODY} fill="url(#bm-skin)" stroke="#5b6b80" strokeOpacity="0.6" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M170 96v130" stroke="#ffffff" strokeOpacity="0.05" />

            {/* glow behind selected region */}
            <circle cx={ax} cy={ay} r="34" fill="url(#bm-glow)" style={{ transition: "all 260ms ease" }} />

            {IDS.map((id) => <Organ key={id} id={id} lit={id === sel} tone={selTone} />)}

            {/* callout for the selected region */}
            <g key={sel} className="animate-enter">
              <path d={`M${ax},${ay} L${elbowX},${r.labelY} L${lx},${r.labelY}`} fill="none" stroke={selTone} strokeOpacity="0.8" strokeWidth="1" />
              <text x={r.side === "right" ? lx + 4 : lx - 4} y={r.labelY + 4} textAnchor={r.side === "right" ? "start" : "end"}
                fill="#f5f5f7" fontSize="12" fontWeight="600">{r.label.split(" / ")[0]}</text>
            </g>

            {/* hotspots: pointer shortcut only; the region list below is the accessible control */}
            {IDS.map((id) => {
              const [x, y] = REGIONS[id].anchor;
              const { level } = state(id);
              const on = id === sel;
              const tone = level === "NONE" ? "#409cff" : LEVEL_HEX[level];
              return (
                <g key={id} onClick={() => setSel(id)} className="group cursor-pointer">
                  <circle cx={x} cy={y} r="16" fill="transparent" />
                  {on && (
                    <circle cx={x} cy={y} r="6" fill="none" stroke={tone} strokeWidth="1.5"
                      className="animate-ping" style={{ transformBox: "fill-box", transformOrigin: "center", animationDuration: "2.4s" }} />
                  )}
                  <circle cx={x} cy={y} r={on ? 5 : 3.5} fill={on ? tone : "#0b0d12"} stroke={tone} strokeWidth="1.5"
                    className="transition-all duration-200 group-hover:[r:5]" />
                  {level !== "NONE" && (
                    <g transform={`translate(${x + 7},${y - 15})`}>
                      <circle cx="5" cy="5" r="6" fill={LEVEL_HEX[level]} />
                      <text x="5" y="8.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#000">{level === "SYMPTOM" ? "i" : "!"}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Region list: the real control (keyboard, screen reader, large text). Status always has icon + text. */}
        <ul className="mt-4 grid grid-cols-2 gap-2" aria-label="Body regions">
          {IDS.map((id) => {
            const { level } = state(id);
            const on = id === sel;
            return (
              <li key={id} className="min-w-0">
                <button type="button" onClick={() => setSel(id)} aria-pressed={on}
                  className={`flex h-full min-h-[56px] w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-150 hover:-translate-y-px active:scale-[0.98] ${
                    on ? "border-accent/60 bg-accent/[0.12]" : "border-white/[0.06] bg-card-2/60 hover:bg-card-2"}`}>
                  <Icon name={REGIONS[id].icon} className={`mt-0.5 h-4 w-4 shrink-0 ${on ? "text-accent" : "text-fg-3"}`} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-tight text-fg">{REGIONS[id].label}</span>
                    <span className={`mt-1 flex items-center gap-1 whitespace-nowrap text-[12px] leading-tight ${LEVEL_CLASS[level]}`}>
                      <Icon name={LEVEL_ICON[level]} className="h-3 w-3 shrink-0" />{LEVEL_TEXT[level]}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card key={sel} className="animate-enter" title={
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15"><Icon name={r.icon} className="h-[18px] w-[18px] text-accent" /></span>
          {r.label}
        </span>
      } aside={
        <span className={`chip bg-card-2 ${LEVEL_CLASS[st.level]}`}><Icon name={LEVEL_ICON[st.level]} className="h-3.5 w-3.5" />{LEVEL_TEXT[st.level]}</span>
      }>
        <h3 className="eyebrow">Related current values</h3>
        {rows.length ? (
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {rows.map((x) => (
              <li key={x.ref} className="well py-3">
                <span className="block text-[12px] text-fg-3">{x.label}</span>
                <span className="num mt-1 block text-[22px] font-semibold leading-none text-fg">{x.value}<span className="ml-1 text-[12px] font-medium text-fg-3">{x.unit}</span></span>
                <span className="num mt-1.5 block text-[12px] text-fg-3">{x.sub}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mini mt-1">No direct measurement in this prototype. See symptoms and context below.</p>}

        <h3 className="eyebrow mt-5">Symptoms</h3>
        {st.syms.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {st.syms.map((sid) => <li key={sid} className="chip bg-accent/15 text-accent"><Icon name="info" className="h-3 w-3" />{SYMPTOMS[sid].label}</li>)}
          </ul>
        ) : <p className="mt-1 text-sm text-fg-3">None reported for this region.</p>}
        <p className="mini mt-1.5">Tracked here: {r.symptoms.length ? r.symptoms.map((sid) => SYMPTOMS[sid].label.toLowerCase()).join(", ") : "none"}.</p>

        <h3 className="eyebrow mt-5">Rules fired (live)</h3>
        {st.hits.length ? (
          <ul className="mt-2 space-y-1.5 text-sm">{st.hits.map((h) => (
            <li key={h.id} className={`flex gap-2 rounded-xl px-3 py-2 ${h.level === "RED" ? "bg-bad-bg" : "bg-warn-bg"}`}>
              <Icon name={h.level === "RED" ? "octagon" : "alert"} className={`mt-0.5 h-4 w-4 shrink-0 ${h.level === "RED" ? "text-bad-fg" : "text-warn-fg"}`} />
              <span><span className="sr-only">{h.level === "RED" ? "Red training rule: " : "Review flag: "}</span>{h.text}</span>
            </li>
          ))}</ul>
        ) : <p className="mini mt-1">None for this region.</p>}

        <p className="callout mt-5">{r.note} The body map groups inputs to help you find them. It does not locate or diagnose anything.</p>
        {sel === "blood" && <p className="mini mt-2">Earth baselines: Hb {b.labs.hemoglobin} g/L, WBC {b.labs.wbc} ×10⁹/L, glucose {b.labs.glucose} mmol/L.</p>}
      </Card>
    </div>
  );
}
