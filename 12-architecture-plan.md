# Architecture Plan: Form, Rules, Gemini, Display

Status: plan only, no application code yet. Updated for the v2 plan (files 07, 11, 14, 15).

## 1. The flow

1. Astronaut enters data in **forms** (self-assessment stepper, vitals, SpaceLab, environment)
2. App **validates and normalizes** it (units, ranges, timestamps, missing values)
3. A local **rules engine** computes deltas and the status (GREEN, YELLOW, RED, INSUFFICIENT DATA)
4. The app sends the structured record plus the rules result to a **serverless proxy**, which calls the **Gemini API**
5. Gemini returns a structured explanation. The app **checks it**, then **displays** it
6. Everything is saved to the **mission log** (localStorage), exportable as JSON

## 2. Stack (decided)

- React, Vite, **TypeScript** everywhere
- **Tailwind CSS** (mockup tokens in file 14 go into the Tailwind theme)
- Recharts for charts
- Vercel: static app plus one serverless function for Gemini
- Gemini API for the explanation step
- localStorage plus JSON export/import (no backend database)

## 3. Why the rules decide and Gemini explains

The features doc requires deterministic rules for status and an explanation layer that cannot override them. This also protects the demo: the status is testable, repeatable, and works offline. Gemini adds the readable, evidence-linked rationale (F06).

## 4. How this meets the safety requirements

| Requirement | How |
|---|---|
| No secrets in the frontend | Gemini key lives only in the serverless function environment, never in the repo or client |
| Status not decided by an LLM | Status is computed locally. The Gemini request carries the status, and the response check rejects any reply that states a different status |
| Every sentence grounded | The response schema makes each statement carry `refs`, a list of input field IDs or approved guidance IDs. The app rejects statements whose refs do not exist and checks that any number quoted matches the input |
| No causal claims | Fixed system prompt forbids them (for example "CO2 caused the headache"). Environment is described as context only |
| No invented values, citations, or treatment | Prompt forbids it. Response check drops unknown citations. Guidance comes only from the approved guidance snippets |
| Works without network | Rules, charts, log, and the template explanation all work offline. Only the Gemini text needs a connection |
| Privacy | Fictional data only. Send only what is needed, no names or real identifiers |

## 5. Gemini request and response (contract, not code)

**Request carries:** latest validated measurements, Earth baselines and deltas, symptoms and severity, environment sample, lab results, data age and last-sync, mission phase, the rules result (status, rules fired, missing fields), and approved guidance snippets with IDs.

**Response must contain (F06):**

1. Status (echoed from rules)
2. Observed evidence (list)
3. Baseline comparison (list)
4. Possible contextual factors (list, never causal)
5. Missing or uncertain information (list)
6. Recommended verification (list)
7. Escalation pathway (text, "follow approved crew medical procedures")
8. For every list item: `refs[]`

Use Gemini's structured output (JSON with a response schema). Confirm the current model name, parameter names, and free-tier limits in Google's docs at build time. I have not verified them. Keep the system prompt fixed and versioned.

## 6. Failure behavior

| Situation | Behavior |
|---|---|
| No network or API error | Show the **template explanation** (prototype wording) with the label "Offline explanation" |
| Invalid or off-schema reply | Discard, show template explanation |
| Reply states a different status or an unknown ref | Discard, show template explanation, log the mismatch |
| Slow reply | Show rules result and template text immediately, swap in Gemini text if it arrives and validates |
| Demo day outage | Cached example responses for the four demo scenarios plus the recorded backup demo |

## 7. Planned structure (names only)

```
src/types/        typed entities (Astronaut, Mission, Baseline, Observation, LabResult,
                  SymptomSurvey, EnvironmentSample, Assessment, GuidanceArticle, LogEvent,
                  RulesConfig, AiExplanation)
src/data/         baselines, simulated scenarios, rules config, guidance entries, research panel
src/lib/          validate, normalize, deltas, rules, explainTemplate, aiClient, logStore, exportLog
src/components/   Shell, Dashboard, VitalSigns, SpaceLab, Environment, SelfAssessment (stepper),
                  Assessment, BodyMap, Trends, Guidance, Research, MissionLog
src/tests/        delta math, rule boundaries, scenarios, AI response check
api/              Gemini proxy (serverless function)
```

## 8. Build order

Follows the sprints in the master spec (file 07, section 12). The Gemini proxy and response check land in Sprint 3 with the rules engine, so the fallback exists before the AI does.

## 9. Decisions still needed

1. Gemini model and **who owns the API key and billing**
2. Does Gemini receive approved guidance snippets (retrieval style) or only the inputs? (Default: snippets included, so refs can point to guidance IDs)
3. Hosting: Vercel (matches the SRS) or other
4. Stale-data limit (placeholder 24 h)

## 10. Risks specific to this flow

| Risk | Mitigation |
|---|---|
| Model gives unsafe or overconfident advice | Fixed safety prompt, schema, ref checking, rules status wins, visible disclaimer, Nabeeha reviews sample outputs |
| API key leaks | Key only in serverless env |
| Network fails at the demo | Template fallback, cached responses, recorded demo |
| Inconsistent answers for the same input | Rules decide status, low temperature, cached demo responses |
| Judges ask "is this just a chatbot" | Show rules, Earth baseline deltas, INSUFFICIENT DATA, provenance labels. Gemini is the explainer |
| Cost or rate limits | One short request per assessment, proxy rate limit |
