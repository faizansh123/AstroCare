# AstroCare Technical Build Reference

Status (14 November 2026): **built** on branch `v2-rebuild`. This file describes the code as it is. Scope comes from the master spec (`07`), decisions (`11`, D1 to D24) and the architecture (`12`). Safety rules from file 10 and `CLAUDE.md` apply throughout. The earlier v1 build plan (z-score baselines, `evaluate.ts`, 4 screens, Day 1 / Day 2 schedule) is retired and was removed from this file.

## 1. Run it

| Command | What it does |
|---|---|
| `npm run dev` | App on Vite, plus `POST /api/explain` served by the same code Vercel runs (`server/explain.ts`) |
| `npm test` | Vitest: rules, boundaries, safety, hazard links, mission log export, AI response check, proxy (Gemini mocked) |
| `npm run build` | Type-check and production build |

`GEMINI_API_KEY` (and optional `GEMINI_MODEL`, default `gemini-3.5-flash-lite`) go in `.env`, server side only. Without a key the app shows the offline explanation.

## 2. Pipeline (file 12 §1)

Form → validate (`lib/validate.ts`) → rules engine (`lib/rules.ts`) → hazard links (`lib/hazards.ts`) → proxy (`server/explain.ts`) → Gemini → response check (`lib/aiGuard.ts`, runs in the proxy and again in the browser) → display → mission log (`lib/store.ts`).

The status is final once the rules engine returns it. Nothing after it (hazard links, environment context, Gemini) can change it.

## 3. Repository layout

```
src/data/       rules.json (all thresholds, rules version), baseline.json, mission.json, scenarios.ts (6 demo
                scenarios), catalog.ts (field IDs, labels, units), guidance.json, research.json, hazards.json,
                history.json (fictional trend points)
src/lib/        validate, deltas, rules, hazards, explainTemplate (offline explanation), aiGuard, apiClient, store
src/prompts/    explain.v4.ts (fixed system prompt, user prompt builder, Gemini response schema)
src/components/ one file per screen (07 §6) plus Explanation, HazardCard, StatusBadge, charts, ui
src/tests/      rules.test.ts, ai.test.ts
server/         explain.ts (Gemini proxy core: validation, rate limit, timeout + one retry, response check)
api/            explain.ts (Vercel function wrapper)
public/         logo-mark.png (cropped from reference/AstroCare_Logo.png)
```

## 4. Rules engine (07 §7)

Order: validate → training trigger (RED) → missing, invalid, conflicting or stale required data (INSUFFICIENT DATA) → YELLOW rules → GREEN. Rule IDs (reason codes): `RED-TRAIN-BREATHING`, `YEL-HR`, `YEL-SLEEP`, `YEL-FATIGUE`, `YEL-MOOD`, `YEL-SYMPTOMS`, `YEL-HEMOGLOBIN`, `CTX-CO2`, `DATA-MISSING`, `DATA-INVALID`, `DATA-STALE`. Thresholds live only in `src/data/rules.json` (version `demo-rules-2.0.0`). Plausibility ranges there are typo catchers, not clinical limits.

## 5. Spaceflight hazard links (D24)

For every assessment, `lib/hazards.ts` lists NASA's five hazards (space radiation, isolation and confinement, distance from Earth, gravity, closed or hostile environment). For each one it shows the reported symptoms that **may be related** to it, why (from `src/data/hazards.json`), and the readings that support the link or are missing. Levels: `none`, `possible`, `possible-with-context` (a supporting environment reading or self-report is present). Vitals alone never create a link. The links never change the status. The symptom-to-hazard table is a **draft pending clinical review**.

## 6. Explanation (07 §8, 12 §5)

Gemini fills the F06 contract plus `spaceHazards` (exactly 5 notes, one per hazard). The response check rejects the reply, and the offline template is shown, if any of these hold:

- the status differs from the rules,
- an item cites a ref that does not exist (field, fired rule, guidance or hazard ID),
- a number does not appear in the inputs, deltas or thresholds,
- the text contains dose, medication, diagnosis, reassurance or causal wording ("caused", "due to", "because of" and similar).

Gemini rejects `maxItems` in the response schema (400, tested 14 Nov 2026), so list limits are enforced by the zod schema instead. Google can return 503 under load; the proxy retries once, then the app falls back.

## 7. Tests (07 §11)

Delta math (HR 72→92 = +20 / +27.8 %, BP components separate, Hb 145→137 = -8 / -5.5 %, zero-baseline guard, glucose mg/dL conversion), the demo scenarios, every boundary in 07 §11, safety tests (symptoms always shown, RED never suppressed, invalid and stale data, unanswered symptoms), hazard links, mission log export/import, and the AI response check (including "the offline template passes its own check in every scenario"). The proxy tests never call the real API.

## 8. Not done or not verified

- Vercel deploy not tested (Node ESM resolution of the JSON and extensionless imports used by `server/`)
- PWA offline caching not built (D17: stretch)
- Visual match to the mockup reviewed by eye only
- Keyboard-only pass and contrast check not formally run
- Clinical review of rule wording, guidance, hazard links and the Gemini prompt (Nabeeha)
- Norsk 2015 numbers not verified against the paper (D20)
