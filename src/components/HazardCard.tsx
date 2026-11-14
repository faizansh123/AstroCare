// Possible spaceflight factors for reported symptoms (D24). One row per NASA hazard. Wording is always "may be
// related to"; the card states that it is not a cause or diagnosis and never changes the status. Level is shown
// with an icon and text, never colour alone.
import hazards from "../data/hazards.json";
import type { Ctx } from "../appTypes";
import { templateExplanation } from "../lib/explainTemplate";
import { ExplanationSection } from "./Explanation";
import { Card, Icon } from "./ui";

const LEVEL = {
  "possible-with-context": { text: "May be related · supporting reading present", icon: "alert" as const, cls: "bg-warn-bg text-warn-fg" },
  possible: { text: "May be related", icon: "info" as const, cls: "bg-card-2 text-accent" },
  none: { text: "No reported symptom linked", icon: "check" as const, cls: "bg-card-2 text-fg-3" },
};

export function HazardCard({ ctx }: { ctx: Ctx }) {
  const a = ctx.assessment;
  const snapshot = ctx.assessedSnapshot;
  if (!a || !snapshot) return null;
  const fromAi = ctx.ai.outcome?.ai ?? null;
  const shown = fromAi ?? templateExplanation(a, snapshot);
  const sourceLabel = fromAi ? "Gemini explanation" : "Offline explanation";
  // Match by an explicit hazard reference, never by array position or generated wording.
  // Keep items without a matching hazard reference visible rather than dropping F06 content.
  const unmatched = shown.spaceHazards.filter((item) =>
    !a.hazards.some((h) => item.refs.includes(`hazard.${h.id}`)));

  const any = a.hazards.some((h) => h.level !== "none");
  return (
    <Card title="Possible spaceflight factors"
      aside={<a className="inline-flex min-h-[32px] items-center gap-1 text-[13px] text-accent hover:underline" href={hazards.source.url} target="_blank" rel="noopener noreferrer">NASA: Five Hazards<Icon name="external" className="h-3 w-3" /></a>}>
      <p className="-mt-2 mb-3 text-[14px] text-fg-3">
        {any ? "Your reported symptoms may be related to the spaceflight hazards below. " : "No reported symptom is linked to a spaceflight hazard. "}
        These are possible factors to consider, not a diagnosis or a proven cause, and they never change your status.
      </p>
      <ul className="divide-y divide-white/[0.06]">
        {a.hazards.map((h) => {
          const l = LEVEL[h.level];
          return (
            <li key={h.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={`font-medium ${h.level === "none" ? "text-fg-2" : "text-fg"}`}>{h.name}</p>
                <span className={`chip ${l.cls}`}><Icon name={l.icon} className="h-3.5 w-3.5" />{l.text}</span>
              </div>
              <p className="mt-0.5 text-[14px] text-fg-3">{h.symptoms.length ? h.symptoms.join(", ") : h.summary}</p>
              <details className="mt-1">
                <summary className="cursor-pointer text-[13px] font-medium text-accent">Supporting detail<span className="sr-only">: {h.name}</span></summary>
                <div className="mt-2 space-y-3 rounded-xl bg-card-2/60 p-3">
                  <p className="text-xs font-semibold text-fg-3">Deterministic symptom/context links</p>
                  {h.symptoms.length > 0 && (
                    <ul className="space-y-1 text-[13px] text-fg-2">{h.why.map((w) => <li key={w}>{w}</li>)}</ul>
                  )}
                  <p className="mini">{h.supporting.join(" ")}</p>
                  <ExplanationSection title={sourceLabel} icon="sparkles"
                    items={shown.spaceHazards.filter((item) => item.refs.includes(`hazard.${h.id}`))} />
                </div>
              </details>
            </li>
          );
        })}
      </ul>
      {unmatched.length > 0 && <div className="mt-4">
        <ExplanationSection title={`${sourceLabel}: additional hazard statements (not causes)`} icon="orbit" items={unmatched} />
      </div>}
    </Card>
  );
}
