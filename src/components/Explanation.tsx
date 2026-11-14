// F06 explanation (file 07 §8). Shows the checked Gemini reply when one passes the response check, otherwise the
// built-in template ("Offline explanation"). The template appears immediately; Gemini text swaps in if it arrives
// and validates (file 12 §6). Refs are still checked by the response check but not shown on screen (owner request).
import { templateExplanation } from "../lib/explainTemplate";
import type { AiState } from "../appTypes";
import type { AiItem, Assessment, Snapshot } from "../types/health";
import { Icon, type IconName } from "./ui";

export function ExplanationSection({ title, icon, items }: { title: string; icon: IconName; items: AiItem[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="flex items-center gap-2 text-[14px] font-semibold text-fg"><Icon name={icon} className="h-4 w-4 text-fg-3" />{title}</h3>
      <ul className="mt-1 divide-y divide-white/[0.06]">
        {items.map((it, i) => (
          <li key={i} className="py-2.5">
            <p className="text-[14px] leading-relaxed text-fg-2">{it.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const disclosure = "cursor-pointer list-none text-[14px] font-medium text-accent [&::-webkit-details-marker]:hidden";

// Audit #25 splits presentation only; both regions retain the same source selection and refs.
export function Explanation({ assessment, snapshot, ai, part = "all" }: {
  assessment: Assessment; snapshot: Snapshot; ai: AiState; part?: "all" | "actions" | "evidence";
}) {
  const fromAi = ai.outcome?.ai ?? null;
  const shown = fromAi ?? templateExplanation(assessment, snapshot);
  return (
    <div className="card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold">{part === "actions" ? "Verification and escalation" : "Explanation"}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip bg-card-2 font-medium text-fg-2"><Icon name={fromAi ? "sparkles" : ai.loading ? "refresh" : "info"} className="h-3.5 w-3.5" />{fromAi ? "Gemini explanation" : ai.loading ? "Offline explanation · checking Gemini…" : "Offline explanation"}</span>
          <details className="text-[13px] text-fg-3">
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
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
          <ExplanationSection title="Recommended verification" icon="check" items={shown.recommendedVerification} />
          <ExplanationSection title="Escalation pathway" icon="shield" items={[shown.escalationPathway]} />
        </div>
      )}
      {part !== "actions" && <div className="space-y-5">
        {/* Native, uncontrolled disclosures retain their open state when Gemini replaces the template. */}
        <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-4">
          {shown.observedEvidence.length > 0 && <details>
            <summary className={disclosure}>Observed evidence · supporting explanation ({shown.observedEvidence.length})</summary>
            <div className="mt-3"><ExplanationSection title="Observed evidence" icon="target" items={shown.observedEvidence} /></div>
          </details>}
          {shown.baselineComparison.length > 0 && <details>
            <summary className={disclosure}>Earth baseline comparison · supporting explanation ({shown.baselineComparison.length})</summary>
            <div className="mt-3"><ExplanationSection title="Earth baseline comparison" icon="heart" items={shown.baselineComparison} /></div>
          </details>}
        </div>
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
          <ExplanationSection title="Possible contextual factors (not causes)" icon="orbit" items={shown.contextualFactors} />
          <ExplanationSection title="Missing or uncertain information" icon="help" items={shown.missingOrUncertain} />
        </div>
      </div>}
      {part !== "actions" && <p className="mini mt-4">
        The status comes from the local rules and is never changed by this text. Gemini text is shown only if every sentence cites a known input
        or approved guidance source, every number matches the inputs, and it contains no diagnosis, medication or causal claim. Otherwise the built-in
        rule-grounded text is shown.
      </p>}
    </div>
  );
}
