// Possible spaceflight factors for reported symptoms (D24, file 11). Pure and deterministic.
// For each of NASA's five hazards it lists the reported symptoms that MAY be related to it and the readings that
// support the link. It never states a cause, never changes the status and never changes a threshold.
import hazards from "../data/hazards.json";
import mission from "../data/mission.json";
import rules from "../data/rules.json";
import { SYMPTOMS } from "../data/catalog";
import type { HazardLink, Snapshot, SymptomId } from "../types/health";

export type HazardId = "radiation" | "isolation" | "distance" | "gravity" | "environment";
type Link = { hazard: string; why: string };
const LINKS = hazards.symptomLinks as Record<SymptomId, Link[]>;

/** Readings that support (or are missing for) each hazard. Text only; no inference from vitals alone. */
function supporting(id: HazardId, s: Snapshot): { notes: string[]; refs: string[] } {
  const v = s.vitals, e = s.env;
  switch (id) {
    case "radiation":
      return e.radiationMGy !== undefined
        ? { notes: [`Radiation entry: ${e.radiationMGy} mGy (manual entry, not live telemetry).`], refs: ["env.radiationMGy"] }
        : { notes: ["No radiation reading was entered, so this link cannot be checked against exposure data."], refs: ["env.radiationMGy"] };
    case "isolation": {
      const notes: string[] = [], refs: string[] = [];
      if (v.sleep !== undefined && v.sleep < rules.yellow.sleepBelowHours) { notes.push(`Sleep was ${v.sleep} h.`); refs.push("vitals.sleep"); }
      if (v.mood !== undefined && v.mood <= rules.yellow.moodAtMost) { notes.push(`Mood is ${v.mood}/10.`); refs.push("vitals.mood"); }
      if (s.survey.fatigue !== undefined && s.survey.fatigue >= rules.yellow.fatigueAtLeast) { notes.push(`Fatigue is ${s.survey.fatigue}/10.`); refs.push("survey.fatigue"); }
      if (!notes.length) { notes.push(`Mission day ${s.missionDay} of a long-duration mission.`); refs.push("env.phase"); }
      return { notes, refs };
    }
    case "distance":
      return { notes: ["Plan to escalate early under approved crew medical procedures."], refs: ["env.phase"] };
    case "gravity":
      return { notes: [`${mission.mission.gravity} during the ${e.phase} phase.`], refs: ["env.phase"] };
    case "environment": {
      const notes: string[] = [], refs: string[] = [];
      if (e.co2Pct !== undefined) {
        notes.push(e.co2Pct >= rules.context.co2PctAtLeast
          ? `Cabin CO₂ is ${e.co2Pct}%, at or above the ${rules.context.co2PctAtLeast}% demo reference setting.`
          : `Cabin CO₂ is ${e.co2Pct}%, below the ${rules.context.co2PctAtLeast}% demo reference setting.`);
        refs.push("env.co2Pct");
      }
      if (e.cabinTempC !== undefined) { notes.push(`Cabin temperature ${e.cabinTempC} °C.`); refs.push("env.cabinTempC"); }
      if (e.humidityPct !== undefined) { notes.push(`Humidity ${e.humidityPct}%.`); refs.push("env.humidityPct"); }
      if (!notes.length) { notes.push("No cabin readings were entered."); refs.push("env.co2Pct"); }
      return { notes, refs };
    }
  }
}

/** Does the entered data add weight to a link? Only environment readings and self-report count, never vitals alone. */
function contextPresent(id: HazardId, s: Snapshot): boolean {
  switch (id) {
    case "radiation": return s.env.radiationMGy !== undefined;
    case "environment": return s.env.co2Pct !== undefined && s.env.co2Pct >= rules.context.co2PctAtLeast;
    case "isolation": return (s.vitals.sleep ?? 99) < rules.yellow.sleepBelowHours || (s.vitals.mood ?? 99) <= rules.yellow.moodAtMost
      || (s.survey.fatigue ?? -1) >= rules.yellow.fatigueAtLeast;
    default: return false;
  }
}

export function linkHazards(s: Snapshot): HazardLink[] {
  return hazards.hazards.map((h) => {
    const id = h.id as HazardId;
    const linked = s.survey.symptoms
      .map((sym) => ({ sym, link: (LINKS[sym.id] ?? []).find((l) => l.hazard === id) }))
      .filter((x): x is { sym: typeof x.sym; link: Link } => !!x.link);
    const sup = supporting(id, s);
    return {
      id,
      name: h.name,
      summary: h.summary,
      symptoms: linked.map((x) => SYMPTOMS[x.sym.id].label),
      why: linked.map((x) => `${SYMPTOMS[x.sym.id].label}: ${x.link.why}`),
      supporting: sup.notes,
      refs: [...new Set([...(linked.length ? ["survey.symptoms"] : []), ...sup.refs])],
      level: linked.length === 0 ? "none" : contextPresent(id, s) ? "possible-with-context" : "possible",
    };
  });
}
