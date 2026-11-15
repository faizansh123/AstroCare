// Built-in rule-grounded explanation (the prototype's template wording, file 14 §1). It is the fallback whenever
// Gemini is offline, slow or rejected (D8, file 12 §6), and it uses the same F06 shape so the UI renders both alike.
// Every item cites input fields, fired rules or approved guidance IDs, exactly like the AI must.
import { SYMPTOMS } from "../data/catalog";
import type { AiExplanation, AiItem, Assessment, Snapshot } from "../types/health";
import { signed, signedPct } from "./deltas";

export const ESCALATION_TEXT =
  "Follow approved crew medical procedures. If you feel unwell or a symptom worries you, contact the crew medical officer regardless of the colour shown.";

export function templateExplanation(a: Assessment, s: Snapshot): AiExplanation {
  const evidence: AiItem[] = a.rulesFired.map((h) => ({ text: h.text, refs: [`rules.${h.id}`, ...h.refs] }));
  if (s.survey.symptoms.length > 0 && !a.rulesFired.some((h) => h.id === "YEL-SYMPTOMS" || h.id.startsWith("RED-"))) {
    evidence.push({ text: `You reported: ${s.survey.symptoms.map((x) => SYMPTOMS[x.id].label.toLowerCase()).join(", ")}. Reported symptoms are always shown.`, refs: ["survey.symptoms"] });
  }
  if (evidence.length === 0) evidence.push({ text: "No illustrative review rule was triggered.", refs: ["rules.result"] });

  const comparison: AiItem[] = a.deltas.map((d) => ({
    text: `${d.label}: Earth ${d.baseline.toFixed(d.digits)} → in-flight ${d.current.toFixed(d.digits)} ${d.unit} (${signed(d.abs, d.digits)} ${d.unit}, ${signedPct(d.pct)}).`,
    refs: [d.ref],
  }));

  const context: AiItem[] = a.context.map((h) => ({ text: h.text, refs: [`rules.${h.id}`, ...h.refs] }));
  const e = s.env;
  if (e.co2Pct !== undefined || e.cabinTempC !== undefined || e.humidityPct !== undefined) {
    const parts = [
      e.co2Pct !== undefined && `cabin CO₂ ${e.co2Pct}%`,
      e.cabinTempC !== undefined && `temperature ${e.cabinTempC} °C`,
      e.humidityPct !== undefined && `humidity ${e.humidityPct}%`,
    ].filter(Boolean);
    context.push({ text: `Environment: ${parts.join(", ")}. Context only, not a cause.`, refs: ["env.co2Pct", "env.cabinTempC", "env.humidityPct"] });
  }
  if (a.deltas.some((d) => d.ref.startsWith("labs."))) {
    context.push({ text: "SpaceLab values are observations. A change from baseline is not a diagnosis.", refs: ["labs.hemoglobin", "guide.lab-immune"] });
  }

  const missing: AiItem[] = a.dataIssues.map((i) => ({ text: i.message, refs: [i.field] }));
  if (a.dataAgeHours !== null) {
    missing.push({ text: `Vital signs were taken ${a.dataAgeHours < 1 ? "less than 1 hour" : `${Math.floor(a.dataAgeHours)} h`} ago.`, refs: ["data.age"] });
  }
  if (s.labs.collectedAt) missing.push({ text: "Lab values come from the last specimen, not a live feed.", refs: ["labs.collectedAt"] });

  const verify = verificationSteps(a, s);

  // Spaceflight hazards (D24): one note per NASA hazard, possible factors only, from the local hazard links.
  const hazards: AiItem[] = a.hazards.map((h) => ({
    text: h.symptoms.length
      ? `${h.name}: ${h.symptoms.join(", ").toLowerCase()} may be related to this hazard. ${h.why.map((w) => w.split(": ").slice(1).join(": ")).join(" ")} ${h.supporting.join(" ")} Worth considering, not a proven cause.`
      : `${h.name}: no reported symptom is linked to this hazard. ${h.supporting.join(" ")}`,
    refs: [`hazard.${h.id}`, ...h.refs],
  }));

  return {
    statusEcho: a.status,
    observedEvidence: evidence,
    baselineComparison: comparison,
    contextualFactors: context,
    missingOrUncertain: missing,
    recommendedVerification: verify,
    spaceHazards: hazards,
    escalationPathway: { text: escalationText(a), refs: ["guide.escalation"] },
  };
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** One concrete check per fired rule, symptom or data issue (no new numbers: only values already in the inputs). */
function verificationSteps(a: Assessment, s: Snapshot): AiItem[] {
  const out: AiItem[] = [];
  const same = "at the same time of day, in the same posture and with the same device as your Earth baseline";
  const delta = (ref: string) => a.deltas.find((d) => d.ref === ref);

  if (a.status === "RED") {
    out.push({ text: "Follow the approved crew emergency or medical protocol and contact the responsible medical officer now. This is a demo, not an operational alert.", refs: ["rules.RED-TRAIN-BREATHING", "guide.escalation"] });
  }
  if (a.status === "INSUFFICIENT_DATA") {
    for (const i of a.dataIssues) {
      const what = i.id === "DATA-STALE" ? "Take a fresh reading" : i.id === "DATA-MISSING" ? "Add the missing value" : "Check and re-enter the value";
      out.push({ text: `${what}: ${lower(i.message)} No status is given until this is fixed.`, refs: [i.field, `rules.${i.id}`, "guide.measurement-guide"] });
    }
  }

  for (const h of a.rulesFired) {
    if (h.id === "YEL-HR") {
      const d = delta("vitals.hr");
      out.push({ text: `Re-measure your resting heart rate ${same}, after a few minutes of quiet rest${d ? ` (now ${d.current} bpm, baseline ${d.baseline} bpm)` : ""}. Note whether fatigue or any symptom changes at the same time.`, refs: ["vitals.hr", "rules.YEL-HR", "guide.measurement-guide"] });
    } else if (h.id === "YEL-SLEEP") {
      out.push({ text: `Log tonight's sleep against the mission sleep window (last night: ${s.vitals.sleep} h). If it stays short, note cabin light, noise and workload at the next check-in.`, refs: ["vitals.sleep", "rules.YEL-SLEEP"] });
    } else if (h.id === "YEL-FATIGUE") {
      out.push({ text: `Re-rate fatigue at the next check-in (now ${s.survey.fatigue}/10) and compare it with your sleep and heart rate for the same day.`, refs: ["survey.fatigue", "rules.YEL-FATIGUE"] });
    } else if (h.id === "YEL-MOOD") {
      out.push({ text: `Re-rate mood at the next check-in (now ${s.vitals.mood}/10). If it stays low, raise it in your next private conference with the crew medical team.`, refs: ["vitals.mood", "rules.YEL-MOOD", "guide.escalation"] });
    } else if (h.id === "YEL-HEMOGLOBIN") {
      out.push({ text: "Compare the hemoglobin result with the next scheduled SpaceLab specimen to see whether the change from baseline holds. One sample is a trend point, not a finding.", refs: ["labs.hemoglobin", "rules.YEL-HEMOGLOBIN", "guide.lab-immune"] });
    } else if (h.id === "YEL-SYMPTOMS") {
      out.push({ text: `Track each reported symptom (${a.symptoms.join(", ").toLowerCase()}): when it started, whether it is getting better or worse, and anything that makes it change.`, refs: ["survey.symptoms", "rules.YEL-SYMPTOMS"] });
    }
  }
  if (s.survey.symptoms.length > 0 && !a.rulesFired.some((h) => h.id === "YEL-SYMPTOMS")) {
    out.push({ text: `Keep logging ${a.symptoms.join(", ").toLowerCase()} at each check-in, including any change in severity.`, refs: ["survey.symptoms"] });
  }
  if (a.context.some((h) => h.id === "CTX-CO2")) {
    out.push({ text: `Check the cabin air-quality readings again (CO₂ now ${s.env.co2Pct}%) and note whether any symptom changes when they change. Context only, not a cause.`, refs: ["env.co2Pct", "rules.CTX-CO2"] });
  }

  if (a.status === "GREEN") {
    const biggest = [...a.deltas].sort((x, y) => Math.abs(y.pct ?? 0) - Math.abs(x.pct ?? 0))[0];
    out.push({ text: "Continue routine monitoring at your scheduled check-ins. GREEN means no flags under demo rules and does not establish medical safety.", refs: ["rules.result"] });
    if (biggest) out.push({ text: `${biggest.label} has moved most from baseline (${biggest.baseline.toFixed(biggest.digits)} → ${biggest.current.toFixed(biggest.digits)} ${biggest.unit}). Keep measuring it ${same} so the trend stays comparable.`, refs: [biggest.ref, "guide.measurement-guide"] });
  } else if (a.status === "YELLOW") {
    out.push({ text: "Run the assessment again after the repeat checks. If the same rules still fire, share the trend with the crew medical team according to mission procedures.", refs: ["rules.result", "guide.escalation"] });
  }
  return out.slice(0, 6);
}

/** The fixed escalation reminder, plus what would be a reason to call sooner for this assessment. */
function escalationText(a: Assessment): string {
  if (a.status === "RED") return `${ESCALATION_TEXT} For this result, contact them now.`;
  const sooner = a.symptoms.length
    ? `Contact them sooner if ${a.symptoms.join(", ").toLowerCase()} gets worse or a new symptom appears.`
    : a.status === "YELLOW"
      ? "Contact them sooner if any symptom appears or the flagged readings stay off baseline on the repeat check."
      : "Contact them sooner if any new symptom appears.";
  return `${ESCALATION_TEXT} ${sooner}`;
}
