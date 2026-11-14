// F10 Guidance library (file 07 §4): For You Now, Health and Prevention, Spaceflight Hazards, Measurement Guide.
// Each entry has a source and review status. "For You Now" is driven only by rules that fired (mockup, file 14 §5).
import { useState } from "react";
import guidance from "../data/guidance.json";
import { templateExplanation } from "../lib/explainTemplate";
import type { Ctx } from "../appTypes";
import { StatusChip } from "./StatusBadge";
import { Card, Icon, type IconName } from "./ui";

type Section = "for-you-now" | "health-prevention" | "spaceflight-hazards" | "measurement-guide";
const SECTIONS: { id: Section; title: string; sub: string; icon: IconName }[] = [
  { id: "for-you-now", title: "For You Now", sub: "Address the flagged changes", icon: "target" },
  { id: "health-prevention", title: "Health & Prevention", sub: "Long-term strategies in space", icon: "shield" },
  { id: "spaceflight-hazards", title: "Spaceflight Hazards", sub: "How space affects your health", icon: "rocket" },
  { id: "measurement-guide", title: "Measurement Guide", sub: "How to take comparable readings", icon: "book" },
];

// Which articles explain which reason codes.
const RULE_ARTICLES: Record<string, string[]> = {
  "RED-TRAIN-BREATHING": ["escalation"],
  "YEL-HR": ["cardio-adaptation", "measurement-guide"],
  "YEL-SLEEP": ["sleep-mood"], "YEL-FATIGUE": ["sleep-mood"], "YEL-MOOD": ["sleep-mood"],
  "YEL-SYMPTOMS": ["escalation"],
  "YEL-HEMOGLOBIN": ["lab-immune"],
  "CTX-CO2": ["environment-context"],
};

type Article = (typeof guidance.articles)[number];

function ArticleCard({ a }: { a: Article }) {
  return (
    <article className="well">
      <h3 className="font-semibold text-fg">{a.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-fg-2">{a.summary}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-3">
        {a.source.url
          ? <a className="inline-flex items-center gap-1 text-accent-2 underline-offset-2 hover:underline" href={a.source.url} target="_blank" rel="noopener noreferrer">{a.source.label}<Icon name="external" className="h-3 w-3" /></a>
          : <span>{a.source.label}</span>}
        <span>· {guidance.version} · {guidance.reviewStatus}</span>
      </p>
    </article>
  );
}

export function Guidance({ ctx }: { ctx: Ctx }) {
  const [sec, setSec] = useState<Section>("for-you-now");
  const [done, setDone] = useState<Record<number, boolean>>({});
  const a = ctx.assessment ?? ctx.live;
  const s = ctx.assessedSnapshot ?? ctx.snapshot;
  const actions = templateExplanation(a, s).recommendedVerification;
  const byId = Object.fromEntries(guidance.articles.map((x) => [x.id, x]));
  const related = [...new Set([...a.rulesFired, ...a.context].flatMap((h) => RULE_ARTICLES[h.id] ?? []))];
  if (a.dataIssues.length) related.push("measurement-guide");
  if (!related.includes("escalation")) related.push("escalation");

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <nav aria-label="Guidance sections" className="flex gap-2 overflow-x-auto lg:flex-col">
        {SECTIONS.map((x) => (
          <button key={x.id} type="button" onClick={() => setSec(x.id)} aria-current={sec === x.id ? "true" : undefined}
            className={`flex min-w-[220px] items-center gap-3 rounded-xl border p-3 text-left transition-colors lg:min-w-0 ${
              sec === x.id ? "border-accent/70 bg-action/80 text-white" : "border-edge bg-card hover:border-accent/40"}`}>
            <Icon name={x.icon} className="h-6 w-6 shrink-0" />
            <span><span className="block font-semibold">{x.title}</span><span className={`block text-xs ${sec === x.id ? "text-white/80" : "text-fg-3"}`}>{x.sub}</span></span>
          </button>
        ))}
      </nav>

      <div className="space-y-5">
        <p className="callout">{guidance.label}</p>
        {sec === "for-you-now" ? (
          <>
            <Card title="Recommended actions" icon="check" aside={<StatusChip status={a.status} />}>
              <p className="mini mb-3">{ctx.assessment ? "From your last assessment." : "From the live rules preview (no assessment run yet)."} Checkboxes are for your own tracking only.</p>
              <ul className="space-y-2">
                {[...actions, { text: "If you feel unwell, a symptom is new or getting worse, or you are concerned, follow approved crew medical procedures and contact the crew medical officer, whatever colour AstroCare shows.", refs: [] }].map((x, i) => (
                  <li key={i}>
                    <label className="flex gap-3 rounded-lg bg-card-2 px-3 py-2 text-sm">
                      <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#46c9c2]" checked={!!done[i]} onChange={(e) => setDone({ ...done, [i]: e.target.checked })} />
                      <span className={done[i] ? "text-fg-3 line-through" : "text-fg-2"}>{x.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Why this matters" icon="info">
              {[...a.rulesFired, ...a.context].length > 0 && (
                <ul className="mb-3 space-y-1 text-sm text-fg-2">
                  {[...a.rulesFired, ...a.context].map((h) => <li key={h.id}><span className="font-mono text-xs text-fg-3">{h.id}</span> {h.text}</li>)}
                </ul>
              )}
              <div className="grid gap-3 md:grid-cols-2">{related.map((id) => byId[id] && <ArticleCard key={id} a={byId[id]} />)}</div>
            </Card>
          </>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {guidance.articles.filter((x) => x.section === sec).map((x) => <ArticleCard key={x.id} a={x} />)}
          </div>
        )}
      </div>
    </div>
  );
}
