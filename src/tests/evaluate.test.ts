// T01-T04, T06, T07 (file 10 §13). Scenarios carry no status label; all go through the same engine (FR-08).
import { describe, expect, it } from "vitest";
import baselines from "../data/baselines.json";
import scenarios from "../data/scenarios.json";
import { evaluate } from "../lib/evaluate";
import { validate } from "../lib/validate";
import type { Baseline, HealthRecord } from "../types/health";

const base = baselines[0] as Baseline;
const scn = (id: string) => structuredClone(scenarios.find((s) => s.id === id)!.record) as HealthRecord;

describe("evaluate", () => {
  it("T01 normal -> GREEN", () => expect(evaluate(scn("normal"), base).status).toBe("GREEN"));

  it("T02 concerning -> YELLOW with factors", () => {
    const r = evaluate(scn("concerning"), base);
    expect(r.status).toBe("YELLOW");
    expect(r.triggeredRules.map((t) => t.ruleId)).toEqual(
      expect.arrayContaining(["DEV_sleepHours", "DEV_fatigueScore", "SYM_dizziness"]),
    );
  });

  it("T03 high-risk -> RED", () => expect(evaluate(scn("high-risk"), base).status).toBe("RED"));

  it("T04 missing BP -> INSUFFICIENT_DATA", () => {
    const rec = scn("normal");
    delete rec.measurements.systolicMmHg;
    const r = evaluate(rec, base);
    expect(r.status).toBe("INSUFFICIENT_DATA");
    expect(r.missingFields).toContain("systolicMmHg");
  });

  it("T04 no baseline -> INSUFFICIENT_DATA", () =>
    expect(evaluate(scn("normal"), undefined).status).toBe("INSUFFICIENT_DATA"));

  it("T07 severe symptom with normal vitals -> RED", () => {
    const rec = scn("normal");
    rec.symptomsAnswer = "reported";
    rec.symptoms = [{ type: "headache", severity: "severe", onset: "now" }];
    expect(evaluate(rec, base).status).toBe("RED");
  });

  it("T07 red-flag symptom with missing vitals still -> RED", () => {
    const rec = scn("high-risk");
    rec.measurements = {};
    const r = evaluate(rec, base);
    expect(r.status).toBe("RED");
    expect(r.missingFields.length).toBeGreaterThan(0);
  });

  it("blank record does not throw and is not GREEN", () => {
    const r = evaluate({ ...scn("normal"), measurements: {}, symptomsAnswer: undefined }, base);
    expect(r.status).toBe("INSUFFICIENT_DATA");
  });
});

describe("validate", () => {
  it("T06 negative sleep is an error", () => expect(validate({ sleepHours: -1 }).sleepHours).toBeDefined());
  it("T06 systolic below diastolic is an error", () =>
    expect(validate({ systolicMmHg: 70, diastolicMmHg: 80 }).systolicMmHg).toBeDefined());
});
