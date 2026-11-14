// AI safety guard (file 13 §7). Runs in the proxy AND again on the client (second line of defence).
// Any failure discards the whole reply; the UI then shows the rules-only result (file 12 §6).
// Banned-pattern list is a DRAFT pending Nabeeha's review (file 13 §11).
import { AiExplanationSchema, type AiExplanation, type Status } from "../types/health";

export type GuardResult = { ok: true; ai: AiExplanation } | { ok: false; reason: string };

// Dose amounts, e.g. "200 mg", "5ml", "2 units". Excludes mg/dL (a glucose unit, not a dose).
const DOSE = /\b\d+(?:[.,]\d+)?\s?(?:mg(?!\s?\/\s?dl)|mcg|µg|ug|ml|g\/day|units?|iu|tablets?|pills?|capsules?|drops?)\b/i;
const MEDICATION_WORDS = /\b(?:dose|dosage|tablet|pill|capsule|prescri(?:be|ption)|medication|medicine|antibiotic|opioid|painkiller|sedative|sleeping pill)s?\b/i;
const DRUG_NAMES = /\b(?:ibuprofen|acetaminophen|paracetamol|aspirin|naproxen|tylenol|advil|promethazine|scopolamine|meclizine|melatonin|zolpidem|ambien|modafinil|caffeine pill|epinephrine|adrenaline|nitroglycerin|atropine|diphenhydramine|benadryl|loratadine|cetirizine|omeprazole|ondansetron|dexamethasone|prednisone|morphine|codeine|tramadol|lorazepam|diazepam|sertraline|fluoxetine|metoprolol|propranolol|potassium iodide)\b/i;
// Diagnosis and false-reassurance phrasing (file 13 §7, file 10 §7).
const DIAGNOSIS_OR_REASSURANCE = /\b(?:you have|you've got|you've developed|diagnos(?:is|ed) (?:is|as|with)|you are (?:diagnosed|healthy|fine|cleared)|medically cleared|nothing to worry|no need to (?:worry|escalate|contact|seek)|not (?:urgent|serious)|can wait)\b/i;

const BANNED: [RegExp, string][] = [
  [DOSE, "dose amount"],
  [MEDICATION_WORDS, "medication wording"],
  [DRUG_NAMES, "drug name"],
  [DIAGNOSIS_OR_REASSURANCE, "diagnosis or false-reassurance wording"],
];

export function allText(ai: AiExplanation): string {
  return [ai.explanation, ...ai.contributingFactors, ...ai.nextSteps, ...ai.measurementTips, ai.reportSummary].join("\n");
}

export function guardAiReply(raw: unknown, rulesStatus: Status): GuardResult {
  const parsed = AiExplanationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "AI reply did not match the expected format" };
  const ai = parsed.data;
  if (ai.statusEcho !== rulesStatus) {
    console.warn(`[aiGuard] statusEcho mismatch: rules=${rulesStatus} ai=${ai.statusEcho}`);
    return { ok: false, reason: "AI reply disagreed with the rules status" };
  }
  if (!ai.explanation.trim() || ai.nextSteps.length === 0) return { ok: false, reason: "AI reply was incomplete" };
  const text = allText(ai);
  for (const [re, label] of BANNED) {
    const hit = text.match(re);
    if (hit) {
      console.warn(`[aiGuard] blocked ${label}: "${hit[0]}"`);
      return { ok: false, reason: `AI reply blocked by safety filter (${label})` };
    }
  }
  return { ok: true, ai };
}
