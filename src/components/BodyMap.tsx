// Body map (FR-12, file 10 §7; P2 in file 13 §11). It groups the app's existing inputs and symptom types by body
// area so they are easier to find. It never locates, infers or diagnoses anything (FR-12: no diagnostic certainty).
// Region highlights come only from rules that already fired in the local engine; colour is always paired with a
// pattern, an icon and a text label (NFR-06). No animation.
import { useId } from "react";
import type { AssessmentResult, SymptomType } from "../types/health";
import type { Metric } from "../lib/history";
import { FIELD_LABELS, Icon } from "./ui";

export type RegionId = "head" | "chest" | "core" | "limbs";
export type RegionLevel = "RED" | "YELLOW" | "NONE";

export const REGIONS: Record<RegionId, { label: string; symptoms: SymptomType[]; inputs: (Metric | "mood")[] }> = {
  head: { label: "Head", symptoms: ["headache", "dizziness", "fainting", "sleep_problems"], inputs: ["sleepHours", "mood"] },
  chest: { label: "Chest", symptoms: ["chest_pain", "shortness_of_breath"], inputs: ["heartRateBpm", "systolicMmHg", "diastolicMmHg"] },
  core: { label: "Whole body", symptoms: ["unusual_fatigue", "other"], inputs: ["temperatureC", "fatigueScore"] },
  limbs: { label: "Arms and legs", symptoms: ["muscle_weakness"], inputs: [] },
};
export const REGION_IDS = Object.keys(REGIONS) as RegionId[];

const FIELD_REGION: Record<string, RegionId> = {};
for (const id of REGION_IDS) for (const f of REGIONS[id].inputs) FIELD_REGION[f] = id;
const SYMPTOM_REGION: Record<string, RegionId> = {};
for (const id of REGION_IDS) for (const s of REGIONS[id].symptoms) SYMPTOM_REGION[s] = id;

/** Which fired rules belong to which region. Rules that are not region-specific (e.g. concurrent deviations) are left out. */
export function regionRules(result: AssessmentResult | null) {
  const out: Record<RegionId, AssessmentResult["triggeredRules"]> = { head: [], chest: [], core: [], limbs: [] };
  if (!result) return out;
  for (const r of result.triggeredRules) {
    let region: RegionId | undefined;
    if (r.ruleId.startsWith("DEV_")) region = FIELD_REGION[r.ruleId.slice(4)];
    else if (r.ruleId.startsWith("SYM_RED_")) region = SYMPTOM_REGION[r.ruleId.slice(8)];
    else if (r.ruleId.startsWith("SYM_")) region = SYMPTOM_REGION[r.ruleId.slice(4)];
    else if (r.ruleId === "MOOD_LOW") region = "head";
    if (region) out[region].push(r);
  }
  return out;
}

export function regionLevel(rules: AssessmentResult["triggeredRules"]): RegionLevel {
  if (rules.some((r) => r.level === "RED")) return "RED";
  return rules.length ? "YELLOW" : "NONE";
}

export const LEVEL_TEXT: Record<RegionLevel, { label: string; cls: string; icon: "octagon" | "alert" | "check" }> = {
  RED: { label: "Red rule fired", cls: "text-red-300", icon: "octagon" },
  YELLOW: { label: "Flagged", cls: "text-amber-300", icon: "alert" },
  NONE: { label: "No rule fired", cls: "text-fg-3", icon: "check" },
};

const FILL: Record<RegionLevel, { fill: string; stroke: string; pattern: string | null }> = {
  RED: { fill: "rgba(248,113,113,0.26)", stroke: "rgba(248,113,113,0.9)", pattern: "hatch" },
  YELLOW: { fill: "rgba(251,191,36,0.2)", stroke: "rgba(251,191,36,0.85)", pattern: "dots" },
  NONE: { fill: "#1d1d21", stroke: "#34343a", pattern: null },
};

// Figure geometry (viewBox 0 0 200 420), all filled shapes.
const SHAPES: Record<RegionId, string[]> = {
  head: ["M100 14C113 14 122 25 122 40C122 55 113 66 100 66C87 66 78 55 78 40C78 25 87 14 100 14Z"],
  chest: ["M66 84C80 78 120 78 134 84C146 89 150 98 148 112L141 168H59L52 112C50 98 54 89 66 84Z"],
  core: ["M59 172H141L138 222C136 236 124 244 100 246C76 244 64 236 62 222Z"],
  limbs: [
    "M50 98C40 104 36 120 35 140L31 200C30 214 28 228 27 238C27 246 37 247 39 239L45 204L52 150C54 132 54 112 50 98Z",
    "M150 98C160 104 164 120 165 140L169 200C170 214 172 228 173 238C173 246 163 247 161 239L155 204L148 150C146 132 146 112 150 98Z",
    "M66 250C64 290 66 330 70 370L72 404C72 411 88 411 88 404L92 340L98 254Z",
    "M134 250C136 290 134 330 130 370L128 404C128 411 112 411 112 404L108 340L102 254Z",
  ],
};
const MARKER: Record<RegionId, [number, number]> = { head: [126, 22], chest: [146, 92], core: [140, 186], limbs: [172, 214] };

export function BodyMap({ result, selected, onSelect, className = "" }: {
  result: AssessmentResult | null; selected?: RegionId | null; onSelect?: (r: RegionId) => void; className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const byRegion = regionRules(result);

  return (
    <svg viewBox="0 0 200 420" role="group" aria-label="Body map. Groups inputs by body area. It does not diagnose."
      className={`h-full w-full ${className}`}>
      <defs>
        <pattern id={`hatch-${uid}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#fca5a5" strokeWidth="1.2" strokeOpacity="0.7" />
        </pattern>
        <pattern id={`dots-${uid}`} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="0.9" fill="#fcd34d" fillOpacity="0.8" />
        </pattern>
      </defs>
      <rect x="92" y="62" width="16" height="20" rx="6" fill="#1d1d21" stroke="#34343a" />

      {REGION_IDS.map((id) => {
        const level = regionLevel(byRegion[id]);
        const f = FILL[level];
        const isSel = selected === id;
        const interactive = !!onSelect;
        const label = `${REGIONS[id].label}: ${LEVEL_TEXT[level].label}${byRegion[id].length ? `, ${byRegion[id].length} rule(s)` : ""}`;
        return (
          <g key={id} role={interactive ? "button" : "img"} aria-label={label} aria-pressed={interactive ? isSel : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? () => onSelect(id) : undefined}
            onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id); } } : undefined}
            className={`${interactive ? "cursor-pointer" : ""} outline-none transition-[filter] [&:focus-visible]:brightness-150 [&:hover]:brightness-125`}>
            {SHAPES[id].map((d, i) => (
              <g key={i}>
                <path d={d} fill={f.fill} stroke={isSel ? "#7aa7ff" : f.stroke} strokeWidth={isSel ? 2 : 1} strokeLinejoin="round" />
                {f.pattern && <path d={d} fill={`url(#${f.pattern}-${uid})`} />}
              </g>
            ))}
          </g>
        );
      })}

      {/* Markers so a flagged region never relies on colour alone */}
      {REGION_IDS.map((id) => {
        const level = regionLevel(byRegion[id]);
        if (level === "NONE") return null;
        const [x, y] = MARKER[id];
        return (
          <g key={`m-${id}`} aria-hidden pointerEvents="none">
            {level === "RED"
              ? <path d={`M${x - 4.5} ${y - 11}h9l6.5 6.5v9l-6.5 6.5h-9l-6.5-6.5v-9Z`} fill="#f87171" stroke="#0b0b0c" strokeWidth="2" />
              : <path d={`M${x} ${y - 11}L${x + 11} ${y + 9}H${x - 11}Z`} fill="#fbbf24" stroke="#0b0b0c" strokeWidth="2" strokeLinejoin="round" />}
            <text x={x} y={y + (level === "RED" ? 4 : 6)} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0b0b0c">!</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Text legend + region list beside the map (the accessible, colour-independent reading of the same data). */
export function RegionList({ result, selected, onSelect }: {
  result: AssessmentResult | null; selected?: RegionId | null; onSelect?: (r: RegionId) => void;
}) {
  const byRegion = regionRules(result);
  return (
    <ul className="divide-y divide-edge overflow-hidden rounded-lg border border-edge">
      {REGION_IDS.map((id) => {
        const level = regionLevel(byRegion[id]);
        const t = LEVEL_TEXT[level];
        const isSel = selected === id;
        const inner = (
          <>
            <span className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-fg">{REGIONS[id].label}</span>
              <span className={`flex items-center gap-1.5 text-xs font-medium ${result ? t.cls : "text-fg-3"}`}>
                {result && <Icon name={t.icon} className="h-3.5 w-3.5" strokeWidth={2.2} />}{result ? t.label : "No check yet"}
              </span>
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-fg-3">
              {[...REGIONS[id].inputs.map((f) => (f === "mood" ? "Mood" : FIELD_LABELS[f])), ...REGIONS[id].symptoms.map((s) => s.replace(/_/g, " "))].join(", ")}
            </span>
          </>
        );
        return (
          <li key={id}>
            {onSelect ? (
              <button type="button" onClick={() => onSelect(id)} aria-pressed={isSel}
                className={`block w-full px-3.5 py-2.5 text-left transition-colors ${isSel ? "bg-surface-3" : "hover:bg-surface-2"}`}>
                {inner}
              </button>
            ) : <div className="px-3.5 py-2.5">{inner}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export const BODY_MAP_NOTE = "Groups your inputs by body area to help you find them. It does not locate or diagnose anything.";
