// AI response check + proxy tests (file 07 §11 safety tests, file 12 §6). Gemini is always mocked.
import { beforeEach, describe, expect, it, vi } from "vitest";
import baselineJson from "../data/baseline.json";
import { SCENARIOS } from "../data/scenarios";
import { guardAiReply } from "../lib/aiGuard";
import { templateExplanation } from "../lib/explainTemplate";
import { assess } from "../lib/rules";
import { buildUserPrompt } from "../prompts/explain.v5";
import { explain, resetRateLimit, type GenerateFn } from "../../server/explain";
import type { AiExplanation, Baseline } from "../types/health";

const B = baselineJson as Baseline;
const NOW = Date.now();
const ctx = (id: string) => { const s = SCENARIOS.find((x) => x.id === id)!.build(NOW); return { s, a: assess(s, B, NOW) }; };

const reply = (status: AiExplanation["statusEcho"] = "YELLOW"): AiExplanation => ({
  statusEcho: status,
  observedEvidence: [{ text: "Your heart rate is 96 bpm, 24 bpm above your Earth baseline of 72 bpm.", refs: ["rules.YEL-HR", "vitals.hr"] }],
  baselineComparison: [{ text: "Sleep went from 8 h to 5 h, a change of -3 h (-37.5%).", refs: ["vitals.sleep"] }],
  contextualFactors: [{ text: "Cabin CO2 was 0.45%. This is context only.", refs: ["env.co2Pct"] }],
  missingOrUncertain: [{ text: "All values are simulated.", refs: ["rules.result"] }],
  recommendedVerification: [{ text: "Repeat the heart rate reading in the same posture.", refs: ["guide.measurement-guide"] }],
  spaceHazards: [
    { text: "Radiation exposure: no radiation reading was entered, so exposure is worth checking against mission records.", refs: ["env.radiationMGy"] },
    { text: "Cabin air: cabin CO2 was 0.45%, which is worth checking alongside how you feel.", refs: ["env.co2Pct"] },
    { text: "Bone and muscle health: no lab values were given, so this is worth checking at the next specimen.", refs: ["labs.calcium"] },
  ],
  escalationPathway: { text: "Follow approved crew medical procedures and contact the crew medical officer if you feel unwell.", refs: ["guide.escalation"] },
});

describe("AI response check", () => {
  const { s, a } = ctx("small-changes");
  it("accepts a grounded reply", () => expect(guardAiReply(reply(), a, s)).toEqual({ ok: true, ai: reply() }));
  it("status never changes because of AI text", () => expect(guardAiReply(reply("GREEN"), a, s).ok).toBe(false));
  it("discards an unknown field reference", () => {
    const r = reply(); r.observedEvidence[0].refs = ["vitals.hrv"];
    expect(guardAiReply(r, a, s)).toMatchObject({ ok: false, reason: expect.stringMatching(/unknown reference/) });
  });
  it("discards a rule ref that did not fire", () => {
    const r = reply(); r.observedEvidence[0].refs = ["rules.YEL-MOOD"];
    expect(guardAiReply(r, a, s).ok).toBe(false);
  });
  it("discards an invented number", () => {
    const r = reply(); r.baselineComparison[0].text = "Your oxygen saturation was 91%.";
    expect(guardAiReply(r, a, s)).toMatchObject({ ok: false, reason: expect.stringMatching(/number/) });
  });
  it("discards an item without refs", () => {
    const r = reply(); r.contextualFactors[0].refs = [];
    expect(guardAiReply(r, a, s).ok).toBe(false);
  });
  it.each([
    ["dose", "Take 200 mg now."],
    ["drug", "Consider ibuprofen."],
    ["diagnosis", "You have anemia."],
    ["reassurance", "This is nothing to worry about."],
    ["clearance", "You are medically cleared."],
    ["causal claim", "The CO2 caused your headache."],
    ["causal claim 2", "Dizziness is due to the cabin air."],
  ])("discards %s", (_, text) => {
    const r = reply(); r.contextualFactors[0].text = text;
    expect(guardAiReply(r, a, s).ok).toBe(false);
  });
  it("the template fallback passes its own check for every scenario", () => {
    for (const sc of SCENARIOS) {
      const { s: ss, a: aa } = ctx(sc.id);
      const g = guardAiReply(templateExplanation(aa, ss), aa, ss);
      expect(g, `${sc.id}: ${!g.ok ? g.reason : ""}`).toMatchObject({ ok: true });
    }
  });
});

describe("AI guidance (D28)", () => {
  const guide = (first = "Repeat the heart rate reading in the same posture tomorrow morning.") => ({
    forYouNow: [{ text: first, refs: ["rules.YEL-HR", "vitals.hr"] }],
    prevention: [{ text: "Keep a consistent sleep window as the mission plan allows.", refs: ["vitals.sleep"] }],
    measurement: [{ text: "Measure at the same time of day and with the same device.", refs: ["vitals.hr"] }],
  });
  it("accepts grounded guidance", () => {
    const { s, a } = ctx("small-changes");
    expect(guardAiReply({ ...reply(), guidance: guide() }, a, s).ok).toBe(true);
  });
  it("still accepts an older reply without guidance", () => {
    const { s, a } = ctx("small-changes");
    expect(guardAiReply(reply(), a, s).ok).toBe(true);
  });
  it.each([
    ["medication", "Take a sleep medication tonight."],
    ["invented number", "Aim for 12 hours of sleep."],
    ["outside citation", "Studies show this works, see www.example.org."],
    ["diagnosis", "You have insomnia."],
  ])("discards guidance with %s", (_, text) => {
    const { s, a } = ctx("small-changes");
    expect(guardAiReply({ ...reply(), guidance: guide(text) }, a, s).ok).toBe(false);
  });
  it("RED guidance must lead with the protocol", () => {
    const { s, a } = ctx("breathing");
    expect(a.status).toBe("RED");
    const base = templateExplanation(a, s);
    expect(guardAiReply({ ...base, guidance: { ...guide("Rest and recheck later."), forYouNow: [{ text: "Rest and recheck later.", refs: ["rules.result"] }] } }, a, s).ok).toBe(false);
    expect(guardAiReply({ ...base, guidance: { ...guide(), forYouNow: [{ text: "Follow the approved crew emergency protocol and contact the medical officer now.", refs: ["rules.result"] }] } }, a, s).ok).toBe(true);
  });
});

describe("prompt", () => {
  it("sends no names or identifiers and pins the status", () => {
    const { s, a } = ctx("small-changes");
    const p = buildUserPrompt({ snapshot: s, assessment: a });
    expect(p).not.toMatch(/Alex|Morgan|AM-01/);
    expect(p).toContain('statusEcho must be "YELLOW"');
    expect(p).not.toContain("APPROVED_GUIDANCE"); // D28: the hand-written library is not sent to the model
    expect(p).not.toContain("guide.");
  });
});

describe("explain proxy", () => {
  beforeEach(() => resetRateLimit());
  const body = () => { const { s, a } = ctx("small-changes"); return { snapshot: s, assessment: a }; };

  it("returns ai: null without a key", async () => {
    const out = await explain(body(), {});
    expect(out.body.ai).toBeNull();
    expect(out.body.reason).toMatch(/not configured/);
  });
  it("rejects an invalid request", async () => {
    expect((await explain({ snapshot: {} }, { generate: vi.fn() })).httpStatus).toBe(400);
  });
  it("returns a validated reply", async () => {
    const generate: GenerateFn = vi.fn(async () => JSON.stringify(reply()));
    const out = await explain(body(), { generate });
    expect(out.body.ai?.statusEcho).toBe("YELLOW");
    expect(generate).toHaveBeenCalledTimes(1);
  });
  it("retries once after an error, then succeeds", async () => {
    const generate = vi.fn<GenerateFn>().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(JSON.stringify(reply()));
    const out = await explain(body(), { generate });
    expect(out.body.ai).not.toBeNull();
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it("times out, retries once, then falls back", async () => {
    const generate: GenerateFn = vi.fn(() => new Promise<string>(() => {}));
    const out = await explain(body(), { generate, timeoutMs: 20 });
    expect(out.body.ai).toBeNull();
    expect(out.body.reason).toBe("AI timed out");
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it("discards non-JSON and status-mismatched replies", async () => {
    const generate = vi.fn<GenerateFn>().mockResolvedValueOnce("not json").mockResolvedValueOnce(JSON.stringify(reply("GREEN")));
    const out = await explain(body(), { generate });
    expect(out.body.ai).toBeNull();
    expect(out.body.reason).toMatch(/different status/);
  });
  it("rate limits per IP", async () => {
    const generate: GenerateFn = async () => JSON.stringify(reply());
    for (let i = 0; i < 10; i++) await explain(body(), { generate, ip: "1.2.3.4" });
    expect((await explain(body(), { generate, ip: "1.2.3.4" })).httpStatus).toBe(429);
  });
});
