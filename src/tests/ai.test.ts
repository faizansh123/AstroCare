// AI guard + proxy tests (file 13 §10). Gemini is always mocked; no test calls the real API.
import { beforeEach, describe, expect, it, vi } from "vitest";
import baselines from "../data/baselines.json";
import scenarios from "../data/scenarios.json";
import { evaluate } from "../lib/evaluate";
import { guardAiReply } from "../lib/aiGuard";
import { buildUserPrompt } from "../prompts/explain.v1";
import { explain, resetRateLimit, type GenerateFn } from "../../server/explain";
import type { AiExplanation, Baseline, HealthRecord } from "../types/health";

const base = baselines[0] as Baseline;
const scn = (id: string) => structuredClone(scenarios.find((s) => s.id === id)!.record) as HealthRecord;

const goodReply = (status: AiExplanation["statusEcho"]): AiExplanation => ({
  statusEcho: status,
  explanation: "Your readings show shorter sleep and higher fatigue than your baseline.",
  contributingFactors: ["Sleep 5 h vs baseline 7 h."],
  nextSteps: ["Recheck in 12 hours.", "Follow approved mission procedures and contact the designated medical authority if you are concerned or your symptoms change."],
  measurementTips: ["Measure heart rate after 5 minutes of rest."],
  reportSummary: "Mission day 43. Status YELLOW. Sleep and fatigue deviations. Mild dizziness reported.",
});

describe("aiGuard", () => {
  it("accepts a safe reply that echoes the status", () => expect(guardAiReply(goodReply("YELLOW"), "YELLOW").ok).toBe(true));
  it("discards a mismatched statusEcho (AI can't soften RED)", () => expect(guardAiReply(goodReply("YELLOW"), "RED").ok).toBe(false));
  it("discards an off-schema reply", () => expect(guardAiReply({ explanation: "hi" }, "GREEN").ok).toBe(false));
  it.each([
    ["dose", "Take 200 mg now."],
    ["drug", "Consider ibuprofen."],
    ["medication word", "Ask about a sleeping pill."],
    ["diagnosis", "You have dehydration."],
    ["reassurance", "This is nothing to worry about."],
    ["clearance", "You are medically cleared."],
  ])("discards %s text", (_, text) => {
    const r = goodReply("YELLOW");
    r.nextSteps = [text];
    expect(guardAiReply(r, "YELLOW").ok).toBe(false);
  });
  it("allows mg/dL glucose units and mmHg", () => {
    const r = goodReply("YELLOW");
    r.contributingFactors = ["Glucose 110 mg/dL.", "Systolic 145 mmHg vs 120 mmHg."];
    expect(guardAiReply(r, "YELLOW").ok).toBe(true);
  });
});

describe("prompt", () => {
  it("strips record and astronaut IDs", () => {
    const rec = scn("concerning");
    const p = buildUserPrompt({ record: rec, result: evaluate(rec, base) });
    expect(p).not.toContain("AC-01");
    expect(p).not.toContain("scn-concerning");
    expect(p).toContain('statusEcho must be "YELLOW"');
  });
});

describe("explain proxy", () => {
  beforeEach(() => resetRateLimit());
  const body = () => { const rec = scn("concerning"); return { record: rec, result: evaluate(rec, base) }; };

  it("returns ai: null without a key", async () => {
    const out = await explain(body(), {});
    expect(out.body.ai).toBeNull();
    expect(out.body.reason).toMatch(/not configured/);
  });

  it("rejects an invalid request", async () => {
    const out = await explain({ record: {} }, { generate: vi.fn() });
    expect(out.httpStatus).toBe(400);
  });

  it("returns a validated reply", async () => {
    const generate: GenerateFn = vi.fn(async () => JSON.stringify(goodReply("YELLOW")));
    const out = await explain(body(), { generate });
    expect(out.body.ai?.statusEcho).toBe("YELLOW");
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("retries once after an error, then succeeds", async () => {
    const generate = vi.fn<GenerateFn>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(JSON.stringify(goodReply("YELLOW")));
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
    const generate = vi.fn<GenerateFn>()
      .mockResolvedValueOnce("not json")
      .mockResolvedValueOnce(JSON.stringify(goodReply("GREEN")));
    const out = await explain(body(), { generate });
    expect(out.body.ai).toBeNull();
    expect(out.body.reason).toMatch(/disagreed/);
  });

  it("rate limits per IP", async () => {
    const generate: GenerateFn = async () => JSON.stringify(goodReply("YELLOW"));
    for (let i = 0; i < 10; i++) await explain(body(), { generate, ip: "1.2.3.4" });
    const out = await explain(body(), { generate, ip: "1.2.3.4" });
    expect(out.httpStatus).toBe(429);
  });
});
