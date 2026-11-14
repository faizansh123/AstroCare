// F06 explanation (file 07 §8). Shows the checked Gemini reply when one passes the response check, otherwise the
// built-in template ("Offline explanation"). The template appears immediately; Gemini text swaps in if it arrives
// and validates (file 12 §6). Each item shows its provenance (refs).
import guidance from "../data/guidance.json";
import { FIELD_REFS } from "../data/catalog";
import { templateExplanation } from "../lib/explainTemplate";
import type { AiState } from "../appTypes";
import type { AiItem, Assessment, Snapshot } from "../types/health";
import { Icon, type IconName } from "./ui";

const GUIDE_TITLES: Record<string, string> = Object.fromEntries(guidance.articles.map((g) => [`guide.${g.id}`, g.title]));

function refLabel(ref: string) {
  if (ref.startsWith("rules.")) return ref.slice(6) === "result" ? "Rules result" : ref.slice(6);
  return GUIDE_TITLES[ref] ?? FIELD_REFS[ref] ?? ref;
}

export function ExplanationSection({ title, icon, items }: { title: string; icon: IconName; items: AiItem[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-fg"><Icon name={icon} className="h-4 w-4 text-accent-2" />{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg bg-card-2 px-3 py-2">
            <p className="text-[14px] leading-relaxed text-fg-2">{it.text}</p>
            <details className="mt-1">
              <summary className="cursor-pointer text-sm text-fg-3">Sources<span className="sr-only"> for {title}, statement {i + 1}</span></summary>
              <ul className="mt-2 space-y-1 text-sm text-fg-2" aria-label="Based on">
                {it.refs.map((r) => <li key={r}>{refLabel(r)} <span className="text-fg-3">({r})</span></li>)}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Audit #25 splits presentation only; both regions retain the same source selection and refs.
export function Explanation({ assessment, snapshot, ai, part = "all" }: {
  assessment: Assessment; snapshot: Snapshot; ai: AiState; part?: "all" | "actions" | "evidence";
}) {
  const fromAi = ai.outcome?.ai ?? null;
  const shown = fromAi ?? templateExplanation(assessment, snapshot);
  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Icon name="sparkles" className="h-[18px] w-[18px] text-accent-2" />{part === "actions" ? "Verification and escalation" : "Explanation"}</h2>
        <div className="flex flex-wrap items-start gap-3">
          <span className="chip bg-card-3 text-fg-2"><Icon name={fromAi ? "check" : ai.loading ? "refresh" : "info"} className="h-3.5 w-3.5" />{fromAi ? "Gemini explanation" : ai.loading ? "Offline explanation · checking Gemini…" : "Offline explanation"}</span>
          <details className="text-sm text-fg-2">
            <summary className="cursor-pointer">Explanation details</summary>
            <ul className="mt-2 space-y-1">
              <li>{fromAi ? "Gemini explanation · passed response check" : ai.loading ? "Offline explanation shown · checking for Gemini…" : "Offline explanation"}</li>
              {ai.outcome?.model && <li>Model: {ai.outcome.model}</li>}
              {ai.outcome?.promptVersion && <li>Prompt version: {ai.outcome.promptVersion}</li>}
              {ai.outcome?.reason && <li>Reason: {ai.outcome.reason}</li>}
            </ul>
          </details>
        </div>
      </div>
      {part !== "evidence" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <ExplanationSection title="Recommended verification" icon="check" items={shown.recommendedVerification} />
          <ExplanationSection title="Escalation pathway" icon="shield" items={[shown.escalationPathway]} />
        </div>
      )}
      {part !== "actions" && <div className="space-y-5">
        <p className="text-sm text-fg-2">Readings and changes are listed in Assessment summary; contributing rules are listed in What changed? Expand the supporting explanation below for full wording and citations.</p>
        {/* Native, uncontrolled disclosures retain their open state when Gemini replaces the template. */}
        {shown.observedEvidence.length > 0 && <details>
          <summary className="cursor-pointer text-sm font-semibold text-accent-2">Observed evidence · supporting explanation ({shown.observedEvidence.length})</summary>
          <div className="mt-3"><ExplanationSection title="Observed evidence" icon="target" items={shown.observedEvidence} /></div>
        </details>}
        {shown.baselineComparison.length > 0 && <details>
          <summary className="cursor-pointer text-sm font-semibold text-accent-2">Earth baseline comparison · supporting explanation ({shown.baselineComparison.length})</summary>
          <div className="mt-3"><ExplanationSection title="Earth baseline comparison" icon="heart" items={shown.baselineComparison} /></div>
        </details>}
        <ExplanationSection title="Possible contextual factors (not causes)" icon="orbit" items={shown.contextualFactors} />
        <ExplanationSection title="Missing or uncertain information" icon="help" items={shown.missingOrUncertain} />
      </div>}
      {part !== "actions" && <p className="mini mt-4">
        The status above comes from the local rules and is never changed by this text. Gemini text is shown only if every sentence cites a known input
        or approved guidance source, every number matches the inputs, and it contains no diagnosis, medication or causal claim. Otherwise the built-in
        rule-grounded text is shown.
      </p>}
    </div>
  );
}
