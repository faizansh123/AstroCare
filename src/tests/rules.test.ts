// Acceptance, boundary and safety tests (file 07 §11, file 15 §10). Scenarios carry no status label: every one
// goes through the same rules engine.
import { describe, expect, it } from "vitest";
import baselineJson from "../data/baseline.json";
import { SCENARIOS, defaultSnapshot } from "../data/scenarios";
import { absDelta, pctDelta } from "../lib/deltas";
import { assess } from "../lib/rules";
import type { Baseline, Snapshot } from "../types/health";

const B = baselineJson as Baseline;
const NOW = Date.parse("2026-11-14T12:00:00Z");
const scn = (id: string) => SCENARIOS.find((s) => s.id === id)!.build(NOW);
const run = (s: Snapshot) => assess(s, B, NOW);
const ids = (s: Snapshot) => run(s).rulesFired.map((h) => h.id);
const delta = (s: Snapshot, ref: string) => run(s).deltas.find((d) => d.ref === ref)!;

describe("delta math (file 15 §3)", () => {
  it("HR 72 -> 92: +20 bpm, +27.8%, review flag", () => {
    const s = scn("normal"); s.vitals.hr = 92;
    expect(delta(s, "vitals.hr")).toMatchObject({ abs: 20, pct: 27.8 });
    expect(ids(s)).toContain("YEL-HR");
  });
  it("BP 120/80 -> 116/74: -4 / -6 mmHg, separate, no flag", () => {
    const s = scn("normal"); s.vitals.sbp = 116; s.vitals.dbp = 74;
    expect(delta(s, "vitals.sbp").abs).toBe(-4);
    expect(delta(s, "vitals.dbp").abs).toBe(-6);
    expect(run(s).status).toBe("GREEN");
  });
  it("Sleep 8 -> 5.5 h: -2.5 h, sleep review", () => {
    const s = scn("normal"); s.vitals.sleep = 5.5;
    expect(delta(s, "vitals.sleep").abs).toBe(-2.5);
    expect(ids(s)).toContain("YEL-SLEEP");
  });
  it("Hemoglobin 145 -> 137 g/L: -8 g/L, -5.5%, no flag", () => {
    const s = scn("normal"); s.labs.hemoglobin = 137;
    expect(delta(s, "labs.hemoglobin")).toMatchObject({ abs: -8, pct: -5.5 });
    expect(ids(s)).not.toContain("YEL-HEMOGLOBIN");
  });
  it("zero baseline guard gives no percentage", () => {
    expect(pctDelta(5, 0)).toBeNull();
    expect(absDelta(5, 0)).toBe(5);
  });
  it("glucose in mg/dL converts at /18 before comparison", () => {
    const s = scn("normal"); s.labs.glucose = 90; s.labs.glucoseUnit = "mg/dL";
    expect(delta(s, "labs.glucose").current).toBe(5);
  });
});

describe("demo scenarios (file 07 §11)", () => {
  it("normal day -> GREEN", () => expect(run(scn("normal")).status).toBe("GREEN"));
  it("HR +24, sleep 5.0, dizziness -> YELLOW with reason codes", () => {
    const a = run(scn("small-changes"));
    expect(a.status).toBe("YELLOW");
    expect(a.rulesFired.map((h) => h.id)).toEqual(expect.arrayContaining(["YEL-HR", "YEL-SLEEP"]));
    expect(a.symptoms).toContain("Dizziness (mild)");
  });
  it("severe breathing difficulty -> RED even with normal vitals", () => {
    const a = run(scn("breathing"));
    expect(a.status).toBe("RED");
    expect(a.rulesFired[0].id).toBe("RED-TRAIN-BREATHING");
  });
  it("missing blood pressure -> INSUFFICIENT_DATA, never GREEN", () => {
    const a = run(scn("missing-bp"));
    expect(a.status).toBe("INSUFFICIENT_DATA");
    expect(a.dataIssues.map((i) => i.field)).toEqual(expect.arrayContaining(["vitals.sbp", "vitals.dbp"]));
  });
  it("stale readings -> INSUFFICIENT_DATA", () => {
    const a = run(scn("stale"));
    expect(a.status).toBe("INSUFFICIENT_DATA");
    expect(a.dataIssues[0].id).toBe("DATA-STALE");
  });
  it("CO2 raised + headache: context mentioned, status unchanged, no causal wording", () => {
    const s = scn("co2-headache");
    const a = run(s);
    expect(a.status).toBe("GREEN");
    expect(a.context.map((h) => h.id)).toContain("CTX-CO2");
    expect(a.context[0].text).not.toMatch(/caused|due to|because of/i);
    expect(a.symptoms).toContain("Headache (mild)");
    const lowCo2 = structuredClone(s); lowCo2.env.co2Pct = 0.3;
    expect(run(lowCo2).status).toBe(a.status); // environment never changes the status
  });
  it("prototype defaults -> YELLOW (sleep 5.5 h)", () => expect(run(defaultSnapshot(NOW)).status).toBe("YELLOW"));
});

describe("boundaries (file 07 §11)", () => {
  const at = (mut: (s: Snapshot) => void) => { const s = scn("normal"); mut(s); return ids(s); };
  it("HR +19 vs +20", () => {
    expect(at((s) => (s.vitals.hr = 91))).not.toContain("YEL-HR");
    expect(at((s) => (s.vitals.hr = 92))).toContain("YEL-HR");
  });
  it("sleep 6.0 vs 5.9", () => {
    expect(at((s) => (s.vitals.sleep = 6))).not.toContain("YEL-SLEEP");
    expect(at((s) => (s.vitals.sleep = 5.9))).toContain("YEL-SLEEP");
  });
  it("fatigue 6 vs 7", () => {
    expect(at((s) => (s.survey.fatigue = 6))).not.toContain("YEL-FATIGUE");
    expect(at((s) => (s.survey.fatigue = 7))).toContain("YEL-FATIGUE");
  });
  it("mood 5 vs 4", () => {
    expect(at((s) => (s.vitals.mood = 5))).not.toContain("YEL-MOOD");
    expect(at((s) => (s.vitals.mood = 4))).toContain("YEL-MOOD");
  });
  it("symptoms 1 vs 2", () => {
    expect(at((s) => { s.survey.symptomsAnswer = "reported"; s.survey.symptoms = [{ id: "headache" }]; })).not.toContain("YEL-SYMPTOMS");
    expect(at((s) => { s.survey.symptomsAnswer = "reported"; s.survey.symptoms = [{ id: "headache" }, { id: "nausea" }]; })).toContain("YEL-SYMPTOMS");
  });
  it("hemoglobin -9.9% vs -10%", () => {
    expect(at((s) => (s.labs.hemoglobin = 130.65))).not.toContain("YEL-HEMOGLOBIN");
    expect(at((s) => (s.labs.hemoglobin = 130.5))).toContain("YEL-HEMOGLOBIN");
  });
  it("CO2 0.49 vs 0.50", () => {
    const ctx = (v: number) => { const s = scn("normal"); s.env.co2Pct = v; return run(s).context.map((h) => h.id); };
    expect(ctx(0.49)).not.toContain("CTX-CO2");
    expect(ctx(0.5)).toContain("CTX-CO2");
  });
  it("stale limit 24 h", () => {
    const age = (h: number) => { const s = scn("normal"); s.vitals.measuredAt = new Date(NOW - h * 3_600_000).toISOString(); return run(s).status; };
    expect(age(23.9)).toBe("GREEN");
    expect(age(24.1)).toBe("INSUFFICIENT_DATA");
  });
});

describe("safety (file 10, file 07 §11)", () => {
  it("a mild symptom with normal vitals is still shown", () => {
    const s = scn("normal"); s.survey.symptomsAnswer = "reported"; s.survey.symptoms = [{ id: "nausea", severity: "mild" }];
    expect(run(s).symptoms).toEqual(["Nausea (mild)"]);
  });
  it("RED wins over missing data (training trigger is never suppressed)", () => {
    const s = scn("breathing"); delete s.vitals.hr;
    expect(run(s).status).toBe("RED");
  });
  it("implausible input -> INSUFFICIENT_DATA and is not used by a rule", () => {
    const s = scn("normal"); s.vitals.hr = 400;
    const a = run(s);
    expect(a.status).toBe("INSUFFICIENT_DATA");
    expect(a.rulesFired.map((h) => h.id)).not.toContain("YEL-HR");
  });
  it("systolic <= diastolic is a conflict -> INSUFFICIENT_DATA", () => {
    const s = scn("normal"); s.vitals.sbp = 70; s.vitals.dbp = 80;
    expect(run(s).status).toBe("INSUFFICIENT_DATA");
  });
  it("unanswered symptoms question -> INSUFFICIENT_DATA", () => {
    const s = scn("normal"); s.survey.symptomsAnswer = "unanswered";
    expect(run(s).status).toBe("INSUFFICIENT_DATA");
  });
  it("labs are optional", () => {
    const s = scn("normal"); s.labs = { glucoseUnit: "mmol/L", specimen: "Blood (simulated)" };
    expect(run(s).status).toBe("GREEN");
  });
  it("identical inputs give identical outputs", () => expect(run(scn("small-changes"))).toEqual(run(scn("small-changes"))));
});

describe("spaceflight hazard links (D24)", () => {
  const h = (s: Snapshot, id: string) => run(s).hazards.find((x) => x.id === id)!;
  it("always lists the five NASA hazards", () =>
    expect(run(scn("normal")).hazards.map((x) => x.id)).toEqual(["radiation", "isolation", "distance", "gravity", "environment"]));
  it("no symptoms -> nothing linked", () => expect(run(scn("normal")).hazards.every((x) => x.level === "none")).toBe(true));
  it("headache + raised CO2 -> closed environment with supporting reading, gravity possible", () => {
    const s = scn("co2-headache");
    expect(h(s, "environment")).toMatchObject({ level: "possible-with-context", symptoms: ["Headache"] });
    expect(h(s, "gravity").level).toBe("possible");
    expect(h(s, "radiation").level).toBe("none");
  });
  it("never uses causal wording", () => {
    const s = scn("normal"); s.survey.symptomsAnswer = "reported";
    s.survey.symptoms = ["fatigue", "headache", "dizziness", "nausea", "difficulty_concentrating"].map((id) => ({ id: id as never }));
    const text = JSON.stringify(run(s).hazards);
    expect(text).not.toMatch(/caused|due to|because of|triggered by/i);
  });
  it("hazard links never change the status", () => {
    const s = scn("co2-headache"); const before = run(s).status;
    s.env.radiationMGy = 3;
    expect(run(s).status).toBe(before);
  });
});
