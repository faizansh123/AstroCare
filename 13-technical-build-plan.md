# AstroCare Technical Build Plan

Status: plan, no code yet. Derived from the SRS (file 10), the architecture plan (file 12) and the reconciliation (file 11). Each section names the doc it comes from. Where a team decision was still open, this plan takes the option the docs recommend and marks it **[Default, confirm]**.

## 1. What we are building

A browser app where an astronaut does a daily check: profile, then measurements, then symptoms, then context, then review. A **local deterministic rules engine** turns the check into GREEN / YELLOW / RED / INSUFFICIENT_DATA, with baseline deltas and the rules that fired. **Gemini**, called through a server proxy, adds a plain-language explanation, next steps and a draft report around that result. The app works rules-only when there's no network. (file 10 Exec decision, file 12 §1, §4)

```
Form (React+TS)
  -> validate + normalize units          src/lib/validate.ts, normalize.ts
  -> rules engine (local, pure)          src/lib/evaluate.ts   => AssessmentResult (status is final)
  -> render result immediately
  -> POST /api/explain (proxy)           api/explain.ts        => Gemini, structured JSON
  -> validate AI reply (zod + safety)    src/lib/aiGuard.ts
  -> show in "AI-generated explanation" panel, or fallback guidance (guidance.json)
  -> persist locally + export report     src/lib/storage.ts, report.ts
```

## 2. Decisions taken by this plan

| # | Decision | Choice | Source |
|---|---|---|---|
| D1 | Who decides status | Local rules. Gemini explains only | file 12 §4, §8.1 |
| D2 | Proxy host | Vercel serverless function `api/explain.ts` | file 12 §8.2, file 10 §10 |
| D3 | Offline | Rules-only flow must work offline. The AI is optional. PWA caching is P1 | file 12 §8.3, file 11 §1.7 **[Default, confirm]** |
| D4 | Gemini model | A fast Flash-tier model, read from an env var. Check the exact name and limits in the Google docs at build time | file 12 §5 **[Default, confirm]** |
| D5 | Gemini output | Explanation, contributing factors, next steps, measurement tips, draft report summary | file 12 §4 **[Default, confirm]** |
| D6 | Indicators (MVP) | HR, systolic and diastolic BP, temperature, sleep, fatigue, mood, symptoms, optional glucose. SpO2 and HRV are optional simulated fields (P1) | file 11 §1.3 **[Default, confirm]** |
| D7 | Guaranteed innovation pillar | Delay-aware escalation and handoff | file 11 §3, §6.3 |

## 3. Stack

React 18 + Vite + TypeScript (strict), Tailwind CSS, Recharts (trends), Zod (runtime schemas shared by client and proxy), Vitest + React Testing Library (tests), `@google/genai` in the proxy only, `vite-plugin-pwa` (P1), localStorage (history and Mission Log). Deployed on Vercel, with a local `vite build && vite preview` as the offline demo build. (file 10 §10, file 12 §2)

## 4. Repository layout

```
api/
  explain.ts              Vercel function: holds GEMINI_API_KEY, rate limit, timeout + 1 retry, schema check
src/
  types/                  health.ts, assessment.ts, ai.ts, guidance.ts (zod schemas + inferred TS types)
  data/
    baselines.json        per-astronaut simulated baseline
    scenarios.json        normal / concerning / high-risk fixtures (FR-08)
    rules.json            illustrative demo thresholds, versioned (engineVersion)
    guidance.json         GuidanceEntry[] with sourceUrl + reviewStatus (FR-06)
    sources.json          FR-14 evidence register
    ai-cache/             cached Gemini replies for the 3 scenarios (demo-day fallback)
  lib/
    validate.ts normalize.ts evaluate.ts report.ts storage.ts apiClient.ts aiGuard.ts commDelay.ts
  components/
    Dashboard/ AssessmentForm/ Results/ Guidance/ TrendChart/ MissionLog/ About/ shared/StatusBadge
  prompts/
    explain.v1.ts         fixed, versioned system prompt
  tests/                  T01-T10 + unit tests
```

## 5. Data contracts (freeze first; file 10 §11, file 12 §10.1)

```ts
type Source = "simulated" | "manual";
type Status = "GREEN" | "YELLOW" | "RED" | "INSUFFICIENT_DATA";

interface HealthRecord {
  recordId: string; astronautId: string; missionDay: number; recordedAt: string; // ISO
  source: Source;
  environment: "spacecraft" | "station" | "rover" | "lunar_base" | "mars_base";
  measurements: {
    heartRateBpm?: number; systolicMmHg?: number; diastolicMmHg?: number;
    temperatureC?: number; sleepHours?: number; fatigueScore?: number;   // 0-10
    mood?: "good" | "ok" | "low" | "prefer_not_to_say";
    glucose?: { value: number; unit: "mg/dL" | "mmol/L" };
    spo2Pct?: number; hrvMs?: number;                                     // optional P1
  };
  symptoms: { type: SymptomType; severity: "mild" | "moderate" | "severe"; onset: string; note?: string }[];
  symptomsAnswer: "reported" | "none" | "unknown";
  context: { activity?: string; posture?: string; notes?: string };
}

interface AssessmentResult {
  recordId: string; status: Status;
  deviations: { field: string; baseline: number; current: number; delta: number; unit: string; flagged: boolean }[];
  triggeredRules: { ruleId: string; level: "YELLOW" | "RED"; explanation: string }[];
  guidanceIds: string[]; missingFields: string[]; evaluatedAt: string;
  engineVersion: string; disclaimer: string;
}

interface AiExplanation {            // what Gemini must return (response schema)
  explanation: string; contributingFactors: string[]; nextSteps: string[];
  measurementTips: string[]; reportSummary: string; statusEcho: Status;
}

interface GuidanceEntry { id; topic; hazard; bodyText; actions: string[]; escalationText; sourceUrl; reviewStatus: "draft" | "reviewed" | "illustrative" }
interface MissionEvent { id; missionDay; type: "radiation_shelter" | "co2_alert" | "eva" | "missed_exercise" | "other"; note? } // P1, annotate only
```

The Zod schemas in `src/types` are the single source of truth. The proxy imports the same schemas.

## 6. Rules engine (`evaluate.ts`), a pure function `(record, baseline, rules) => AssessmentResult`

Evaluation order, which is safety-critical (file 10 §7, file 11 §1):

1. **Validate** (FR-02, T06). Reject implausible values such as negative sleep, sleep over 24, fatigue outside 0-10, systolic not above diastolic, or values outside physiologic plausibility ranges in `rules.json`. Invalid input returns field errors and **no calculation**.
2. **Normalize** (T05). Convert glucose mmol/L to mg/dL (×18.016) and display both values.
3. **Red-flag symptoms** (T07). Configured red-flag symptoms, or any `severe` symptom, give **RED**, even when vitals are normal or fields are missing. Missing fields are still listed.
4. **Insufficient data** (T04). Required fields missing (HR, BP, temperature, sleep, fatigue), no baseline, a record older than the staleness limit, or `symptomsAnswer` not given all give **INSUFFICIENT_DATA**, with `missingFields`. Never Green.
5. **Deviation rules**. Compute `delta = current - baseline` for each field and apply the illustrative thresholds from `rules.json`. Example starting values for Nabeeha to review: HR +15 bpm, systolic ±20 mmHg, temperature +1.0 °C, sleep −1.5 h, fatigue +3, mood "low", any moderate symptom. One or more hits give **YELLOW**. Configured critical thresholds, or N or more concurrent deviations, give **RED** (an illustrative protocol trigger).
6. **Otherwise GREEN**, labelled "No flags under demo rules".
7. Attach `guidanceIds` by rule, the `engineVersion` and the disclaimer.

Constraints: no reference to environment or Mission Log inside the status logic (FR-01, file 11 §2). Scenarios contain only input data, never a status label (FR-08). The function is deterministic and never throws on blank input (NFR-03).

P1 dual comparison (file 11 §3): add an "illustrative adaptation range for mission day N" column. The status follows the more conservative comparison. The adaptation range only changes the wording of the Yellow message.

## 7. Gemini proxy and AI guard (file 12 §3-§6)

**`api/explain.ts`**
- Accept `{ record (no names), baseline, result }` and validate it with Zod. Reject the request if invalid.
- Call Gemini with the fixed system prompt `explain.v1`, JSON output constrained by the `AiExplanation` schema, low temperature, a timeout of about 8 s and one retry.
- Rate limit per IP with a simple in-memory counter (good enough for a demo).
- Validate the reply with Zod before returning it. On failure, return `{ ai: null, reason }`.
- `GEMINI_API_KEY` and `GEMINI_MODEL` live in Vercel env vars and a local `.env` that is git-ignored. Nothing is ever prefixed `VITE_`.

**System prompt `explain.v1`** (wording owned by Nabeeha): not a diagnosis. Never name medications or doses. Always include "follow approved mission procedures and contact the designated medical authority". The rules status is final: repeat it in `statusEcho` and never soften it. Say "insufficient data" rather than guess. Use respectful wording about mood. Don't infer radiation, cabin-air or bone-loss problems from vitals.

**`aiGuard.ts`** (client side, a second line of defence)
- Discard the reply if `statusEcho !== result.status`, and log the mismatch.
- Discard it if the text matches a banned-pattern list: dose units (`\d+\s?(mg|mcg|ml|units)`), a drug-name list, or phrases such as "you have", "diagnosis is" or "medically cleared".
- If the reply is discarded, show `guidance.json` fallback text with the banner "AI explanation unavailable".

**Failure matrix**: offline or API error, off-schema reply, contradiction, a slow reply, and demo-day outage are all covered. The rules result renders first and the AI panel loads in when ready. `ai-cache/` serves the three scenario replies when the `?demo=cached` flag is set.

## 8. Screens (file 10 §9, FR-07)

Nav: Dashboard | Self-Assessment | Results | Guidance | Trends | Mission Log | About/Sources. A persistent banner reads "Simulation. Not for clinical use. Rules are illustrative."

- **Dashboard**: fictional profile, mission day, environment, indicator cards with baseline delta, latest status badge (colour, icon and text), "Start Check", and the scenario picker.
- **Self-Assessment**: four-step stepper (symptoms, measurements, context, review). Every field shows units, a "How to measure" help, and the source tag.
- **Results**: status, rules that fired, a deviations table, missing fields, the AI explanation panel (labelled), and "View Guidance".
- **Guidance**: next steps from `guidance.json` with provenance, escalation text and report export. On RED, the **delay-aware escalation** panel appears: enter or select a one-way delay, see "earliest ground reply = 2 × delay", read the onboard steps from approved protocol text, and generate the handoff packet (SBAR-style report).
- **Trends** (P1): Recharts line per indicator with a shaded baseline band. Gaps are not joined. Data is marked simulated.
- **Mission Log** (P1): add and list events. They appear next to trends and in the report as "Logged context. Does not lower any flag."
- **About/Sources** (FR-14): `sources.json`, rules version, which facts are sourced and which are assumptions.

Accessibility (NFR-06): native form controls, visible focus rings, `aria-live` on the status, contrast checked, large targets, and no animation in RED.

## 9. Report (FR-10, file 07 §7)

`report.ts` builds the report from the same `AssessmentResult` that is on screen: astronaut, mission day, environment, status and timestamp, deviations, symptoms, rules fired, actions, Mission Log context, comm delay, the AI summary (if any, labelled) and the disclaimer footer. Export as print-to-PDF (a print stylesheet) and as JSON. Free text is escaped when rendered (NFR-09).

## 10. Tests (file 10 §13)

| Test | How |
|---|---|
| T01 Normal → GREEN, T02 Concerning → YELLOW with correct factors, T03 High-risk → RED | Vitest on `evaluate()` using `scenarios.json` |
| T04 Missing BP / no baseline → INSUFFICIENT_DATA | Vitest |
| T05 Glucose mmol/L ↔ mg/dL | Vitest on `normalize()` |
| T06 Negative sleep, systolic below diastolic → validation error, no result | Vitest on `validate()` |
| T07 Severe symptom with normal vitals → RED, symptom shown | Vitest + RTL |
| T08 Offline after load | Manual: DevTools offline + PWA build |
| T09 Report matches results and timestamps | Vitest on `report()` + manual print |
| T10 Keyboard only | Manual checklist + RTL tab-order test |
| AI guard | Vitest: mismatched `statusEcho`, dose text, and an off-schema reply are each discarded |
| Proxy | Vitest with the Gemini client mocked: timeout, retry, invalid reply |

Every test runs in CI with `npm test` (a GitHub Action on PRs). No test calls the real Gemini API.

## 11. Schedule and ownership (file 10 §14-§15, file 12 §9-§10)

**Day 1**
| Slot | Subomi (data, rules, API) | Bruno (UI) | Nabeeha (clinical, safety) |
|---|---|---|---|
| Morning | Scaffold the repo. Freeze Zod types (§5), baselines and scenarios | App shell, nav, banner, StatusBadge | Review the rules.json thresholds and red-flag symptom list. Start guidance.json and sources.json |
| Afternoon | `validate`, `normalize`, `evaluate` + T01-T07 | Assessment stepper with validation messages | Write the `explain.v1` prompt and the banned-pattern list |
| Evening | **One scenario end to end, rules only** (team checkpoint) | Results screen | Check results against acceptance criteria |

**Day 2**
| Slot | Subomi | Bruno | Nabeeha |
|---|---|---|---|
| Morning | `api/explain` proxy + aiGuard + cached replies | Guidance screen + AI panel + fallback banner | Review sample Gemini outputs for safety |
| Midday | Report + delay-aware escalation logic | Escalation panel, report print view, Dashboard polish | Finish guidance wording and provenance |
| Afternoon (P1 if green) | Trends data, Mission Log, PWA | Trends chart, Mission Log UI | About/Sources, pitch |
| Final hours | **Feature freeze.** Run T01-T10, run with Wi-Fi off, deploy to Vercel, record the backup demo, rehearse (file 08 checklist) | | |

## 12. Priority cut lines (file 11 §5)

- **P0 (must ship):** profile, measurements, symptoms, baseline deltas, four-state engine with rules shown, guidance with fallback, three scenarios, About/Sources, disclaimers.
- **P0.5 (core of the chosen architecture):** Gemini proxy + AI guard + cached replies. If it's broken at the Day 2 midday checkpoint, demo rules-only and present the AI as "in progress".
- **P1, in this order:** report export and delay-aware escalation, Mission Log, trends, dual baseline column, PWA offline.
- **P2:** body map, reminders and gamification, CSV import, environment-aware text, SpO2/HRV.

## 13. Definition of Done (file 04 §3 + file 10 §13)

The P0 flow is integrated. T01-T07 and the AI-guard tests pass. Missing data is handled safely. Disclaimers are visible. No API key appears in the client bundle (grep the `dist/`). It runs locally and on Vercel. Another team member has reviewed it. The docs are updated. The demo has been rehearsed with the network off.

## 14. Still open (needs the team)

1. Confirm D3-D6 above.
2. Who owns the Gemini key and billing (file 12 §8.4)?
3. Which NASA HRP sources are cited for each guidance entry (file 10 §18)?
4. Submission requirements: video length, code link, project page (file 11 §6.5).
