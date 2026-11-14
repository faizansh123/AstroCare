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

function Section({ title, icon, items }: { title: string; icon: IconName; items: AiItem[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-fg"><Icon name={icon} className="h-4 w-4 text-accent-2" />{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg bg-card-2 px-3 py-2">
            <p className="text-[14px] leading-relaxed text-fg-2">{it.text}</p>
            <p className="mt-1 flex flex-wrap gap-1" aria-label="Based on">
              {it.refs.map((r) => (
                <span key={r} className={`rounded px-1.5 py-0.5 text-[10.5px] font-medium ${r.startsWith("guide.") ? "bg-space/15 text-space" : r.startsWith("rules.") ? "bg-warn-bg/60 text-warn-fg" : "bg-earth/15 text-earth"}`}>
                  {refLabel(r)}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Explanation({ assessment, snapshot, ai }: { assessment: Assessment; snapshot: Snapshot; ai: AiState }) {
  const fromAi = ai.outcome?.ai ?? null;
  const shown = fromAi ?? templateExplanation(assessment, snapshot);
  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Icon name="sparkles" className="h-[18px] w-[18px] text-accent-2" />Explanation</h2>
        {fromAi ? (
          <span className="chip border border-accent/40 bg-card-3 text-accent"><Icon name="check" className="h-3.5 w-3.5" />Gemini explanation · passed response check{ai.outcome?.model ? ` · ${ai.outcome.model}` : ""}</span>
        ) : ai.loading ? (
          <span className="chip bg-card-3 text-fg-2"><Icon name="refresh" className="h-3.5 w-3.5" />Offline explanation shown · checking for Gemini…</span>
        ) : (
          <span className="chip bg-card-3 text-fg-2" title={ai.outcome?.reason}><Icon name="info" className="h-3.5 w-3.5" />Offline explanation{ai.outcome?.reason ? ` · ${ai.outcome.reason}` : ""}</span>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Section title="Observed evidence" icon="target" items={shown.observedEvidence} />
          <Section title="Earth baseline comparison" icon="heart" items={shown.baselineComparison} />
        </div>
        <div className="space-y-5">
          <Section title="Possible contextual factors (not causes)" icon="orbit" items={shown.contextualFactors} />
          <Section title="Missing or uncertain information" icon="help" items={shown.missingOrUncertain} />
          <Section title="Space hazards (radiation, cabin air, bone and muscle)" icon="orbit" items={shown.spaceHazards} />
          <Section title="Recommended verification" icon="check" items={shown.recommendedVerification} />
          <Section title="Escalation pathway" icon="shield" items={[shown.escalationPathway]} />
        </div>
      </div>
      <p className="mini mt-4">
        The status above comes from the local rules and is never changed by this text. Gemini text is shown only if every sentence cites a known input
        or approved guidance source, every number matches the inputs, and it contains no diagnosis, medication or causal claim. Otherwise the built-in
        rule-grounded text is shown.
      </p>
    </div>
  );
}
