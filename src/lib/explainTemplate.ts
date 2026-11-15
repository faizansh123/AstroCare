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

  const verify: AiItem[] = {
    RED: [
      { text: "Follow the approved crew emergency or medical protocol and contact the responsible medical officer now. This is a demo, not an operational alert.", refs: ["rules.RED-TRAIN-BREATHING", "guide.escalation"] },
    ],
    YELLOW: [
      { text: "Repeat the flagged readings under the same conditions: same time of day, posture and device.", refs: ["guide.measurement-guide"] },
      { text: "Review recent trends and symptoms, and consider crew medical review according to mission procedures.", refs: ["rules.result", "guide.escalation"] },
    ],
    INSUFFICIENT_DATA: [
      { text: "Re-enter or remeasure the fields listed above, then run the assessment again. No status is given until then.", refs: ["rules.result", "guide.measurement-guide"] },
    ],
    GREEN: [
      { text: "Continue routine monitoring. GREEN means no flags under demo rules and does not establish medical safety.", refs: ["rules.result"] },
    ],
  }[a.status];

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
    escalationPathway: { text: ESCALATION_TEXT, refs: ["guide.escalation"] },
  };
}
