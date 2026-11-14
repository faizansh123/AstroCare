import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Ctx } from "../appTypes";
import baselineJson from "../data/baseline.json";
import { SCENARIOS } from "../data/scenarios";
import { assess } from "../lib/rules";
import { templateExplanation } from "../lib/explainTemplate";
import type { Baseline } from "../types/health";
import { ExplanationSection } from "../components/Explanation";
import { AssessmentScreen } from "../components/AssessmentScreen";

function context(id: string): Ctx {
  const now = Date.parse("2026-11-14T12:00:00Z");
  const snapshot = SCENARIOS.find((s) => s.id === id)!.build(now);
  const baseline = baselineJson as Baseline;
  const assessment = assess(snapshot, baseline, now);
  return {
    now, snapshot, assessedSnapshot: snapshot, baseline, assessment, live: assessment,
    ai: { loading: false, outcome: null }, history: [], updateSnapshot() {},
    runAssessment() {}, loadScenario() {}, go() {},
  };
}

// Escape text exactly as React does, so these checks also cover the original wording.
const escaped = (text: string) => renderToStaticMarkup(<span>{text}</span>).slice(6, -7);

// Track nested native disclosures so source details do not truncate evidence/hazard assertions.
function detailsIn(html: string) {
  const result: { attrs: string; summary: string; body: string; start: number; end: number }[] = [];
  const stack: { start: number; bodyStart: number; attrs: string }[] = [];
  for (const token of html.matchAll(/<details([^>]*)>|<\/details>/g)) {
    if (token[0].startsWith("<details")) stack.push({ start: token.index!, bodyStart: token.index! + token[0].length, attrs: token[1] });
    else {
      const entry = stack.pop()!;
      const content = html.slice(entry.bodyStart, token.index);
      const summary = content.match(/^<summary[^>]*>([\s\S]*?)<\/summary>/)!;
      result.push({ ...entry, summary: summary[1], body: content.slice(summary[0].length), end: token.index! + token[0].length });
    }
  }
  return result;
}
function initialView(html: string) {
  const outer = detailsIn(html).filter((d, _, all) => !all.some((parent) => parent.start < d.start && parent.end > d.end));
  for (const d of outer.sort((a, b) => b.start - a.start)) html = html.slice(0, d.start) + d.summary + html.slice(d.end);
  return html;
}

describe("Assessment #26 content preservation", () => {
  it.each(["normal", "small-changes", "breathing", "missing-bp"])("retains complete template output and hazard context for %s", (id) => {
    const ctx = context(id);
    const a = ctx.assessment!;
    const template = templateExplanation(a, ctx.assessedSnapshot!);
    const html = renderToStaticMarkup(<AssessmentScreen ctx={ctx} />);
    for (const item of [...template.observedEvidence, ...template.baselineComparison,
      ...template.contextualFactors, ...template.missingOrUncertain,
      ...template.recommendedVerification, template.escalationPathway, ...template.spaceHazards]) {
      expect(html).toContain(escaped(item.text));
    }
    expect(detailsIn(html).filter((d) => d.summary.startsWith("Supporting detail"))).toHaveLength(5);
    expect(html).toContain("Offline explanation");
    expect(html).toContain("NASA: Five Hazards");
    expect(html).toContain("not a diagnosis or a proven cause");
    for (const h of a.hazards) {
      expect(html).toContain(escaped(h.name));
      for (const text of [...h.why, h.supporting.join(" ")]) expect(html).toContain(escaped(text));
    }
    for (const limitation of a.limitations) expect(html).toContain(escaped(limitation));
    const headings = ["Verification and escalation", "View guidance", "Assessment summary",
      "Observed evidence", "Earth baseline comparison", "Possible contextual factors (not causes)",
      "Missing or uncertain information", "Possible spaceflight factors", "Limitations"];
    const positions = headings.map((heading) => html.indexOf(heading));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).not.toContain("Spaceflight hazards: possible factors (not causes)");
  });

  it.each([false, true])("discloses full evidence and citations without repeating prose initially (Gemini=%s)", (gemini) => {
    const ctx = context("small-changes");
    const explanation = templateExplanation(ctx.assessment!, ctx.assessedSnapshot!);
    explanation.observedEvidence = [{ text: "Unique supporting evidence wording.", refs: ["rules.result"] }];
    explanation.baselineComparison = [{ text: "Unique baseline supporting wording.", refs: ["vitals.hr"] }];
    if (gemini) ctx.ai = { loading: false, outcome: { ai: explanation } };
    const shown = gemini ? explanation : templateExplanation(ctx.assessment!, ctx.assessedSnapshot!);
    const html = renderToStaticMarkup(<AssessmentScreen ctx={ctx} />);
    const disclosures = detailsIn(html);
    const initial = initialView(html);
    for (const [label, items] of [
      ["Observed evidence", shown.observedEvidence],
      ["Earth baseline comparison", shown.baselineComparison],
    ] as const) {
      const disclosure = disclosures.find((d) => d.summary.startsWith(label))!;
      expect(disclosure).toBeDefined();
      expect(disclosure.attrs).not.toMatch(/\bopen\b/);
      expect(disclosure.summary).toContain(`(${items.length})`);
      for (const item of items) {
        expect(disclosure.body).toContain(escaped(item.text));
        expect(disclosure.body).not.toContain(">Sources<");
      }
    }
    if (gemini) {
      expect(initial).not.toContain("Unique supporting evidence wording.");
      expect(initial).not.toContain("Unique baseline supporting wording.");
    }
    for (const item of [...shown.contextualFactors, ...shown.missingOrUncertain,
      ...shown.recommendedVerification, shown.escalationPathway]) expect(initial).toContain(escaped(item.text));
    for (const delta of ctx.assessment!.deltas) expect(initial).toContain(escaped(delta.label));
    for (const rule of ctx.assessment!.rulesFired) expect(initial).toContain(escaped(rule.text));
    for (const limitation of ctx.assessment!.limitations) expect(initial).toContain(escaped(limitation));
  });

  it("keeps reordered Gemini statements with their referenced hazard and retains unmatched statements", () => {
    const ctx = context("small-changes");
    const ai = templateExplanation(ctx.assessment!, ctx.assessedSnapshot!);
    ai.spaceHazards = ai.spaceHazards.reverse();
    ai.spaceHazards[0] = { text: "Additional hazard context.", refs: ["env.phase"] };
    ctx.ai = { loading: false, outcome: { ai } };
    const html = renderToStaticMarkup(<AssessmentScreen ctx={ctx} />);
    expect(html).toContain("Gemini explanation · passed response check");
    for (const item of ai.spaceHazards) {
      expect(html).toContain(escaped(item.text));
      const hazardRef = item.refs.find((r) => r.startsWith("hazard."));
      if (hazardRef) {
        const name = ctx.assessment!.hazards.find((h) => `hazard.${h.id}` === hazardRef)!.name;
        const row = detailsIn(html).find((d) => d.summary.startsWith("Supporting detail") && d.summary.includes(escaped(name)))!.body;
        expect(row).toContain(escaped(item.text));
        expect(row).not.toContain(">Sources<"); // hazard statements show no Sources disclosure
      }
    }
    expect(html).toContain("additional hazard statements (not causes)");
    expect(html).not.toContain("hazard-links-0.1");
  });
});

describe("Assessment #27 provenance presentation", () => {
  it.each(["loading", "success", "fallback", "offline"])("preserves content and diagnostics in %s state", (state) => {
    const ctx = context("small-changes");
    const explanation = templateExplanation(ctx.assessment!, ctx.assessedSnapshot!);
    ctx.ai = state === "loading" ? { loading: true, outcome: null }
      : state === "offline" ? { loading: false, outcome: null }
      : { loading: false, outcome: { ai: state === "success" ? explanation : null,
        model: "test-model", promptVersion: "test-prompt", ...(state === "fallback" ? { reason: "Test validation failure" } : {}) } };
    const html = renderToStaticMarkup(<AssessmentScreen ctx={ctx} />);
    const initial = initialView(html);
    expect(initial).toContain(state === "success" ? "Gemini explanation" : "Offline explanation");
    if (state === "loading") expect(initial).toContain("checking Gemini");
    for (const diagnostic of ["test-model", "test-prompt", "Test validation failure", "passed response check"]) expect(initial).not.toContain(diagnostic);
    const diagnostics = detailsIn(html).filter((d) => d.summary === "Explanation details");
    expect(diagnostics).toHaveLength(2);
    for (const d of diagnostics) {
      expect(d.attrs).not.toMatch(/\bopen\b/);
      if (state === "success" || state === "fallback") {
        expect(d.body).toContain("test-model");
        expect(d.body).toContain("test-prompt");
        expect(d.body).toContain(state === "success" ? "passed response check" : "Test validation failure");
      }
    }
    // No statement shows a Sources disclosure.
    for (const item of explanation.spaceHazards) expect(html).toContain(escaped(item.text));
    for (const item of [...explanation.observedEvidence, ...explanation.baselineComparison,
      ...explanation.contextualFactors, ...explanation.missingOrUncertain,
      ...explanation.recommendedVerification, explanation.escalationPathway]) {
      expect(html).toContain(escaped(item.text));
      // Statements are shown without a Sources disclosure or raw ref codes.
      const statement = renderToStaticMarkup(<ExplanationSection title="Evidence" icon="target" items={[item]} />);
      expect(detailsIn(statement)).toHaveLength(0);
      for (const ref of item.refs) expect(statement).not.toContain(`(${escaped(ref)})`);
    }
  });
});

describe("Assessment summary groups", () => {
  it("splits the summary into vital signs, sleep and mood, and labs, and keeps every measure", () => {
    const ctx = context("normal");
    const html = renderToStaticMarkup(<AssessmentScreen ctx={ctx} />);
    const vitals = html.indexOf("Vital signs"), sleep = html.indexOf("Sleep and mood"), labs = html.indexOf("Blood labs (SpaceLab)");
    expect(vitals).toBeGreaterThan(-1);
    expect(sleep).toBeGreaterThan(vitals);
    expect(labs).toBeGreaterThan(sleep);
    expect(html).not.toContain("Other measures");
    for (const d of ctx.assessment!.deltas) expect(html).toContain(escaped(d.label));
  });
});

describe("Assessment Review history", () => {
  it("lists previous assessments newest first and shows the latest saved one after a reload", () => {
    const older = context("normal"), newer = context("breathing");
    const ctx = context("normal");
    ctx.assessment = null; ctx.assessedSnapshot = null; // as after a page reload
    ctx.history = [
      { id: "as-1", assessment: { ...older.assessment!, createdAt: "2026-11-13T09:00:00Z" }, snapshot: older.assessedSnapshot! },
      { id: "as-2", assessment: { ...newer.assessment!, createdAt: "2026-11-14T09:00:00Z" }, snapshot: newer.assessedSnapshot! },
    ];
    const html = renderToStaticMarkup(<AssessmentScreen ctx={ctx} />);
    expect(html).toContain("Previous assessments");
    expect(html).not.toContain("No assessment yet");
    const list = html.slice(html.indexOf('id="hist-h"'));
    expect(list.indexOf("2026-11-14T09:00:00Z")).toBeLessThan(list.indexOf("2026-11-13T09:00:00Z"));
    expect(list).toContain("Viewing");
    for (const l of newer.assessment!.limitations) expect(html).toContain(escaped(l));
  });
});
