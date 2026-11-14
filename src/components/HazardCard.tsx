// Possible spaceflight factors for reported symptoms (D24). One row per NASA hazard. Wording is always "may be
// related to"; the card states that it is not a cause or diagnosis and never changes the status. Level is shown
// with an icon and text, never colour alone.
import hazards from "../data/hazards.json";
import type { Ctx } from "../appTypes";
import { Card, Icon } from "./ui";

const LEVEL = {
  "possible-with-context": { text: "May be related · supporting reading present", icon: "alert" as const, cls: "text-warn-fg" },
  possible: { text: "May be related", icon: "info" as const, cls: "text-accent" },
  none: { text: "No reported symptom linked", icon: "check" as const, cls: "text-fg-3" },
};

export function HazardCard({ ctx }: { ctx: Ctx }) {
  const a = ctx.assessment;
  if (!a) return null;
  const any = a.hazards.some((h) => h.level !== "none");
  return (
    <Card title="Possible spaceflight factors" icon="rocket"
      aside={<a className="inline-flex items-center gap-1 text-xs text-accent-2 hover:underline" href={hazards.source.url} target="_blank" rel="noopener noreferrer">NASA: Five Hazards<Icon name="external" className="h-3 w-3" /></a>}>
      <p className="callout mb-4">
        {any ? "Your reported symptoms may be related to the spaceflight hazards below. " : "No reported symptom is linked to a spaceflight hazard. "}
        These are possible factors to consider, not a diagnosis or a proven cause, and they never change your status.
      </p>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {a.hazards.map((h) => {
          const l = LEVEL[h.level];
          return (
            <li key={h.id} className={`well ${h.level === "none" ? "opacity-80" : "ring-1 ring-edge-strong"}`}>
              <p className="font-semibold text-fg">{h.name}</p>
              <p className={`mt-0.5 flex items-center gap-1.5 text-xs font-semibold ${l.cls}`}><Icon name={l.icon} className="h-3.5 w-3.5" />{l.text}</p>
              {h.symptoms.length > 0 && (
                <ul className="mt-2 space-y-1 text-[13px] text-fg-2">{h.why.map((w) => <li key={w}>{w}</li>)}</ul>
              )}
              <p className="mini mt-2">{h.supporting.join(" ")}</p>
              {h.symptoms.length === 0 && <p className="mini mt-1">{h.summary}</p>}
            </li>
          );
        })}
      </ul>
      <p className="mini mt-3">{hazards.version} · {hazards.reviewStatus}</p>
    </Card>
  );
}
