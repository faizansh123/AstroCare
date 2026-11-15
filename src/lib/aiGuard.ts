// AI response check (file 12 §4 and §6, file 07 §8). Runs in the proxy AND again on the client.
// Any failure discards the whole reply and the UI shows the template explanation instead.
//  1. Schema (F06 output contract)            4. Every number quoted must exist in the inputs, deltas or rules
//  2. statusEcho equals the rules status       5. No dose, medication, diagnosis, reassurance or causal wording
//  3. Every item cites only known refs
// The banned-pattern list is a DRAFT pending Nabeeha's safety review (file 07 §13).
import guidance from "../data/guidance.json" with { type: "json" };
import rules from "../data/rules.json" with { type: "json" };
import { FIELD_REFS } from "../data/catalog.js";
import { AiExplanationSchema, type AiExplanation, type AiItem, type Assessment, type Snapshot } from "../types/health.js";

export type GuardResult = { ok: true; ai: AiExplanation } | { ok: false; reason: string };

const DOSE = /\b\d+(?:[.,]\d+)?\s?(?:mg(?!\s?\/\s?dl)|mcg|µg|ug|ml|g\/day|units?|iu|tablets?|pills?|capsules?|drops?)\b/i;
const MEDICATION_WORDS = /\b(?:dose|dosage|dosing|tablet|pill|capsule|prescri(?:be|bed|ption)|medication|medicine|antibiotic|opioid|painkiller|sedative|supplement)s?\b/i;
const DRUG_NAMES = /\b(?:ibuprofen|acetaminophen|paracetamol|aspirin|naproxen|tylenol|advil|promethazine|scopolamine|meclizine|melatonin|zolpidem|ambien|modafinil|epinephrine|adrenaline|nitroglycerin|atropine|diphenhydramine|benadryl|loratadine|cetirizine|omeprazole|ondansetron|dexamethasone|prednisone|morphine|codeine|tramadol|lorazepam|diazepam|sertraline|fluoxetine|metoprolol|propranolol|potassium iodide|oxygen therapy)\b/i;
const DIAGNOSIS_OR_REASSURANCE = /\b(?:you have|you've got|you've developed|diagnos(?:is|ed) (?:is|as|with)|you are (?:diagnosed|healthy|fine|cleared|safe)|medically cleared|safe to|nothing to worry|no need to (?:worry|escalate|contact|seek)|not (?:urgent|serious)|can wait)\b/i;
// Labs and symptoms must never be turned into a named condition (file 07 §7).
const CONDITIONS = /\b(?:anemi\w*|anaemi\w*|infection|osteopor\w*|bone loss is|diabet\w*|hypoxi\w*|hypercapni\w*|arrhythmi\w*|hypertensi\w*|hypotensi\w*|depressi\w*|insomnia|concussion|stroke)\b/i;
// Environment is context only. Never say it caused anything (file 15 §5).
const CAUSAL = /\b(?:caused|causing|causes|due to|because of|as a result of|led to|leads to|resulting from|responsible for|triggered by|is the cause|the cause of|explains your|explained by)\b/i;

const BANNED: [RegExp, string][] = [
  [DOSE, "dose amount"],
  [MEDICATION_WORDS, "medication wording"],
  [DRUG_NAMES, "drug or treatment name"],
  [DIAGNOSIS_OR_REASSURANCE, "diagnosis or false-reassurance wording"],
  [CONDITIONS, "named condition"],
  [CAUSAL, "causal claim"],
];

export const GUIDANCE_IDS = guidance.articles.map((a) => a.id);

export function items(ai: AiExplanation): AiItem[] {
  return [...ai.observedEvidence, ...ai.baselineComparison, ...ai.contextualFactors, ...ai.missingOrUncertain,
    ...ai.recommendedVerification, ...ai.spaceHazards, ai.escalationPathway,
    ...(ai.guidance ? [...ai.guidance.forYouNow, ...ai.guidance.prevention, ...ai.guidance.measurement] : [])];
}

export function allowedRefs(a: Assessment): Set<string> {
  return new Set([
    ...Object.keys(FIELD_REFS),
    ...[...a.rulesFired, ...a.context].map((h) => `rules.${h.id}`),
    ...a.dataIssues.map((i) => `rules.${i.id}`),
    ...GUIDANCE_IDS.map((id) => `guide.${id}`),
    ...(a.hazards ?? []).map((h) => `hazard.${h.id}`),
  ]);
}

function collectNumbers(v: unknown, out: number[]) {
  if (typeof v === "number" && Number.isFinite(v)) out.push(Math.abs(v));
  else if (Array.isArray(v)) v.forEach((x) => collectNumbers(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => collectNumbers(x, out));
}

/** Every number an explanation may quote: inputs, baselines, deltas, rule thresholds and data age. */
export function allowedNumbers(a: Assessment, s: Snapshot): number[] {
  const out: number[] = [0, 1, 10];
  collectNumbers(s.vitals, out);
  collectNumbers(s.survey.fatigue, out);
  collectNumbers(s.labs, out);
  collectNumbers(s.env, out);
  collectNumbers(s.missionDay, out);
  collectNumbers(a.deltas, out);
  collectNumbers(rules.yellow, out);
  collectNumbers(rules.context, out);
  collectNumbers(rules.plausibility, out);
  collectNumbers(rules.staleLimitHours, out);
  out.push(s.survey.symptoms.length);
  if (s.labs.glucose !== undefined && s.labs.glucoseUnit === "mg/dL") out.push(Math.round((s.labs.glucose / 18) * 100) / 100);
  if (a.dataAgeHours !== null) out.push(a.dataAgeHours, Math.floor(a.dataAgeHours), Math.round(a.dataAgeHours));
  return out;
}

// Unit and scale tokens whose digits are not data (×10⁹/L, CO₂, "/10", rules version).
const NOT_DATA = /×10⁹\/L|x10\^9\/L|10\^9|CO₂|CO2|\/\s?10\b|demo-rules-[\d.]+|\b[01]\s?(?:-|to)\s?10\b/gi;

export function unknownNumbers(text: string, allowed: number[]): string[] {
  const found = text.replace(NOT_DATA, " ").match(/\d+(?:\.\d+)?/g) ?? [];
  return found.filter((n) => !allowed.some((a) => Math.abs(a - Number(n)) < 0.051));
}

export function guardAiReply(raw: unknown, a: Assessment, s: Snapshot): GuardResult {
  const parsed = AiExplanationSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`);
    console.warn(`[aiGuard] schema issue(s): ${issues.join("; ")}`);
    return { ok: false, reason: "Reply did not match the F06 output contract" };
  }
  const ai = parsed.data;
  if (ai.statusEcho !== a.status) {
    console.warn(`[aiGuard] status mismatch: rules=${a.status} ai=${ai.statusEcho}`);
    return { ok: false, reason: "Reply stated a different status from the rules" };
  }
  if (!/procedure|protocol/i.test(ai.escalationPathway.text)) return { ok: false, reason: "Escalation pathway missing approved-procedure wording" };
  // D28: AI guidance must lead with the protocol on RED. It never replaces the fixed escalation reminder in the UI.
  if (a.status === "RED" && ai.guidance && !/procedure|protocol/i.test(ai.guidance.forYouNow[0].text)) {
    return { ok: false, reason: "RED guidance did not lead with the approved protocol" };
  }
  // AI guidance must not claim outside sources (prompt rule 15): it is unreviewed model text.
  if (ai.guidance) {
    const g = [...ai.guidance.forYouNow, ...ai.guidance.prevention, ...ai.guidance.measurement];
    const cite = g.find((x) => /https?:|www\.|\bet al\b|\bstud(?:y|ies) (?:show|found|prove)|\bresearch (?:shows|proves)|\bproven\b/i.test(x.text));
    if (cite) return { ok: false, reason: "AI guidance claimed an outside source or proof" };
  }

  const refs = allowedRefs(a);
  const nums = allowedNumbers(a, s);
  for (const item of items(ai)) {
    const unknown = item.refs.filter((r) => !refs.has(r));
    if (unknown.length) {
      console.warn(`[aiGuard] unknown ref(s): ${unknown.join(", ")}`);
      return { ok: false, reason: `Reply cited an unknown reference (${unknown[0]})` };
    }
    const badNums = unknownNumbers(item.text, nums);
    if (badNums.length) {
      console.warn(`[aiGuard] number(s) not in the inputs: ${badNums.join(", ")}`);
      return { ok: false, reason: `Reply quoted a number not found in the inputs (${badNums[0]})` };
    }
    for (const [re, label] of BANNED) {
      const hit = item.text.match(re);
      if (hit) {
        console.warn(`[aiGuard] blocked ${label}: "${hit[0]}"`);
        return { ok: false, reason: `Reply blocked by the safety check (${label})` };
      }
    }
  }
  return { ok: true, ai };
}
