# AstroCare: Complete Features, Technical Requirements, and User Flows

Source: "Mission-aware astronaut health monitoring, Product Requirements, Technical Architecture & User Flows", v1.0, 14 November 2026, hackathon design specification. This is the **feature scope** of the project. Condensed faithfully, nothing added except notes marked **[Note]**.

## Executive summary

AstroCare is a research-informed astronaut wellness and health-trend prototype. It unifies preflight Earth baselines, simulated in-flight vital signs, laboratory biomarkers, daily self-assessments, space-environment context, body-system visualization, longitudinal trends, an evidence-based guidance library, and a timestamped mission log. A transparent rules engine generates illustrative GREEN / YELLOW / RED review categories and an AI-style explanation grounded in the inputs and their provenance. It is not a diagnostic or operational flight-medical system.

## 1. Goals, boundaries, evidence policy

- Primary goal: help crew and medical support understand **what changed, when it changed, and what contextual factors merit review**
- Target users: astronaut, crew medical officer, ground flight surgeon, research/operations analyst
- MVP uses simulated personal measurements and explicit Earth baseline values. Published astronaut studies appear only in a **separate reference panel**
- No live ISS, NASA, wearable, dosimeter, or laboratory feed is claimed unless a real integration is implemented
- No autonomous diagnosis, drug dosing, emergency treatment, or validated clinical risk score

## 2. Feature inventory

| ID | Feature | Scope | Priority |
|---|---|---|---|
| F01 | Mission dashboard | At-a-glance status, last-sync, current vitals, survey completion, environmental snapshot, latest log | P0 |
| F02 | Earth vs space vital-sign comparison | HR, systolic/diastolic BP, body temperature, sleep duration, mood score. Absolute and percentage changes. Baseline timestamp | P0 |
| F03 | SpaceLab biomarkers | Hemoglobin, WBC, glucose, calcium. Specimen time, units, baseline, trend, data-quality status | P0 |
| F04 | Daily self-assessment | Symptoms, sleep, mood, fatigue, headache, dizziness, nausea, breathing concerns. Severity and free-text notes | P0 |
| F05 | GREEN / YELLOW / RED assessment | Illustrative transparent flags from vitals, self-report, lab trends, environment. Uncertainty and missing-data handling | P0 |
| F06 | AI-style explanation | Structured natural-language rationale citing which measurements and context triggered each flag. No fabricated cause or diagnosis | P0 |
| F07 | Environment | Cabin CO2, temperature, humidity, light cycle, radiation when available, microgravity, mission phase | P0 |
| F08 | Interactive body map | Select brain/head, heart, lungs, blood/immune, bones, sleep/mood to inspect relevant symptoms, trends, context | P1 |
| F09 | Health trends | Time series, Earth baseline reference, changes over mission days, annotations and filters | P0 |
| F10 | Guidance library | Research-informed educational cards, sources, when-to-escalate reminders, reviewed content and version | P1 |
| F11 | Mission log | Chronological audit of measurements, assessments, symptoms, environment, crew notes. Export | P0 |
| F12 | Research provenance | Study citations, cohort sizes, units, timepoints, data origin, simulated-versus-published labels | P0 |

## 3. Data dictionary and baseline logic

| Signal | Earth baseline | In-flight input | Display / quality |
|---|---|---|---|
| HR | Resting preflight HR, bpm | bpm + timestamp | Absolute delta, % delta, sample source |
| Blood pressure | SBP/DBP, mmHg | SBP/DBP, posture, time | Compare components separately |
| Body temperature | deg C, measurement site | deg C + site | Same site preferred |
| Sleep | Average preflight hours | Hours, preceding night | Subjective or actigraphy source |
| Mood | Preflight 1-10 score | 1-10 self-reported | Same scale and wording |
| Labs | Analyte-specific baseline | Value + units + specimen time | Do not compare incompatible units |
| Environment | Mission-specific reference | CO2 %, cabin deg C, RH %, radiation if measured | Context only, not assumed causal |

**Formula:** absolute change = current - baseline. Percentage change = (current - baseline) / baseline x 100, only when baseline is nonzero and units and timeframes are comparable. For BP, calculate systolic and diastolic separately. Never interpret population research averages as an individual baseline.

## 4. Assessment engine and traffic-light semantics

| Status | Prototype meaning | Example behavior |
|---|---|---|
| GREEN | No demo rules triggered and sufficient demo inputs | Show monitoring summary, never claim medically safe |
| YELLOW | One or more nonurgent demo review flags | Prompt repeat/check reading, assess context, consider crew medical review |
| RED | A deliberately triggered demo escalation scenario | Prompt to follow approved crew medical procedures. Not a validated emergency threshold |
| INSUFFICIENT DATA | Missing, invalid, or conflicting input | Request data verification, do not force GREEN |

Demo rules are intentionally illustrative and configurable, not validated flight medicine.

- **Yellow examples:** heart-rate increase of 20 bpm or more from the fictional personal baseline, sleep under 6 hours, severe fatigue, or multiple symptoms
- **Red:** only for explicitly selected training scenarios (for example reported severe breathing difficulty), with visible "simulation only" messaging
- **Environment:** CO2 and radiation may contribute context but cannot independently establish the cause of a symptom
- **Labs:** contribute baseline deviations and review notes. They do not diagnose anemia, infection, metabolic disease, or bone loss

## 5. AI explanation design

- **Inputs:** latest validated measurements, baseline deltas, symptoms, environment, data age, lab results, mission phase, guidance snippets
- Use **deterministic rules for the status**. Use a constrained explanation template or retrieval-augmented LLM to **explain** the rules, not to override status
- **Required output:** status, observed evidence, baseline comparison, possible contextual factors, missing/uncertain information, recommended verification and escalation pathway
- **Safety:** never assert CO2 caused headache, never invent values or citations, never provide unapproved treatment
- **Explainability:** each sentence must map to an input field or a reviewed source. Show provenance and time

## 6. User journeys

**Flow A: Daily astronaut check-in**

1. Open dashboard, confirm mission and latest data (freshness, data quality)
2. Review Earth baseline vs current vitals, correct invalid readings (HR, BP, temperature, sleep, mood deltas)
3. Complete self-assessment, save symptoms, mood, sleep (fatigue, symptoms, mood, notes)
4. Review SpaceLab results, select body-map region if relevant (biomarkers, cabin conditions, body map)
5. Inspect environment, run integrated assessment
6. See GREEN / YELLOW / RED with evidence and uncertainty, open guidance, save mission log

**Flow B: Crew medical review**

1. Open flagged assessment, inspect timestamp and data quality
2. Compare vitals and labs to the individual Earth baseline and prior days
3. Review symptom timeline, environmental context, body-map findings
4. Document follow-up or escalation under approved protocols, append to mission log

**Flow C: Research context**

1. Open NASA Research, choose a study, view published group means and sample size
2. Compare study trend with the separately labeled simulated personal trend
3. Open the original citation. Avoid mixing cohorts or inferring personal clinical thresholds

## 7. System architecture

Browser UI (React/TypeScript or standalone HTML demo) -> typed application state -> baseline comparison calculator -> assessment rules -> explanation formatter -> mission log.

Optional future backend: FastAPI or Node API -> PostgreSQL or time-series storage -> ingestion adapters (wearables, environment, lab system) -> source registry and audit events. For the hackathon, local-only browser storage and sample JSON are sufficient. Do not claim encrypted clinical storage.

## 8. Technical requirements

| Area | Specification |
|---|---|
| Frontend | Responsive desktop/tablet. Keyboard-accessible tabs, labels, color + text statuses, accessible contrast |
| State and models | Typed entities: Astronaut, Mission, Baseline, Observation, LabResult, SymptomSurvey, EnvironmentSample, Assessment, GuidanceArticle, LogEvent |
| Validation | Units, allowed ranges, timestamps, missingness, provenance. Reject invalid or non-comparable samples |
| Computation | Pure functions for deltas, rule evaluations, assessment explanations. No LLM determining emergency status |
| Persistence | Hackathon: browser localStorage only, optional export/import JSON. Production: authenticated server storage |
| Security | Production requires role-based access, encryption, audit, retention policies, privacy review, threat modeling |
| Availability | Offline-capable architecture desired. Visible last-sync and stale-data indicators |
| Testing | Unit tests for delta math and rule boundaries. UI tests for navigation. Scenario tests for green/yellow/red/missing data |
| Performance | Dashboard navigation and local calculations respond instantly on ordinary laptops |
| Integrations | Future wearable, crew medical records, radiation and cabin telemetry via documented authenticated APIs |

## 9. Suggested data model

- Observation {id, astronautId, type, value, unit, measuredAt, source, quality}
- Baseline {type, value, unit, period, source}
- LabResult {analyte, value, unit, collectedAt, specimen, source}
- Survey {mood, fatigue, sleepHours, symptoms[], notes, submittedAt}
- EnvironmentSample {co2Pct, cabinTempC, humidityPct, radiationDose, observedAt, source}
- Assessment {status, rulesTriggered[], explanation[], confidenceCaveats[], createdAt}
- MissionLogEvent {type, payloadRef, author, createdAt}

## 10. Acceptance tests and scenarios

| Scenario | Expected result |
|---|---|
| Earth HR 72 -> space HR 92 | +20 bpm, +27.8%, demo review flag |
| Earth BP 120/80 -> space 116/74 | -4 / -6 mmHg, components shown separately |
| Sleep 8 -> 5.5 h | -2.5 h, contextual sleep review |
| CO2 increased + headache | Environmental context mentioned, no causal diagnosis |
| Hemoglobin 145 -> 137 g/L | -8 g/L, -5.5%, trend not diagnosis |
| Severe breathing difficulty selected | RED training scenario, approved-protocol escalation text |
| Required field missing | INSUFFICIENT DATA rather than automatic GREEN |
| Export mission log | Chronological records with demo provenance |

## 11. Delivery plan

- **Sprint 1:** shell/navigation, typed baseline/vitals, vitals comparison and chart, sample data labels
- **Sprint 2:** SpaceLab, symptom survey, environment and body map
- **Sprint 3:** assessment rule engine, explanations, guidance library, mission log and export
- **Sprint 4:** scenario testing, accessibility, demo storytelling, research citations, pitch rehearsal

## 12. Risks and mitigations

- **Medical safety:** label all rules illustrative, never replace crew medical protocols
- **Scientific validity:** use actual published cohort data only where independently verified, do not invent astronaut labs
- **Environmental causality:** describe associations and context, not confirmed individual causes
- **Data privacy:** avoid real patient data in the hackathon demo, production needs a full security and privacy design
- **Data integration:** simulated local inputs until an authenticated and documented feed exists

## 13. Research references

- Norsk P, et al. (2015). Fluid shifts, vasodilatation and ambulatory blood pressure reduction during long-duration spaceflight: https://pmc.ncbi.nlm.nih.gov/articles/PMC4324706/
- Cardiac Effects of Long-Duration Space Flight (2023), Journal of the American College of Cardiology: https://www.jacc.org/doi/10.1016/j.jacc.2023.05.058
- NASA Human Research Program, Five Hazards of Human Spaceflight: https://www.nasa.gov/hrp/hazards/
- NASA Open Science Data Repository: https://science.nasa.gov/biological-physical/data/osdr/

Reference values must be verified against original tables before use in a judged research presentation. This document does not claim a NASA-approved clinical algorithm.

## Appendix: diagrams in the source document

(The same diagrams appear in the original upload and in the later project zip. The zip's redrawn versions add the detail below.)

1. **Astronaut Daily Check-in:** 01 Open dashboard (check mission, freshness, data quality) -> 02 Review vitals + Earth baseline (HR, BP, temperature, sleep, mood deltas) -> 03 Complete symptom survey (fatigue, symptoms, mood, notes) -> 04 Review SpaceLab + environment (biomarkers, cabin conditions, body map) -> 05 Generate integrated assessment (GREEN / YELLOW / RED + explainable evidence) -> 06 Read guidance + save mission log (crew follow-up, timestamped history)
2. **Medical Review Workflow:** 01 Open flagged result (review source, timestamps, uncertainty) -> 02 Check individual baselines (vital-sign and lab trends, **not population thresholds**) -> 03 Review symptoms + context (body map, CO2, radiation if available, mission phase) -> 04 Follow approved medical protocols (document response and escalation) -> 05 **Save audit event** (record crew notes and assessment history)
3. **System Data Flow:** Inputs (vital signs, labs, survey, environment) -> Validation + provenance (units, timestamps, source and quality checks) -> Baseline comparator (Earth versus space deltas and longitudinal trends) -> Deterministic rules engine (illustrative status and **reason codes**) -> Explanation formatter (evidence, uncertainty, environmental context) -> User interface + mission log (dashboard, guidance, body map, export)
4. **Example assessment flow:** Vital Signs + Earth Baseline (HR, BP, temperature, sleep, mood) plus Self-Assessment + SpaceLab + Environment (symptoms, biomarkers, cabin conditions) -> Integrated Health Assessment (GREEN / YELLOW / RED, evidence-based explanation of the simulated result) -> Guidance + Mission Log (recommended follow-up and documentation)

**[Note]** Two details to carry into the build: the pipeline has an explicit **validation + provenance** stage before any comparison, and the rules engine outputs **reason codes** (the rule IDs in the master spec). The medical review flow saves an **audit event**, so each log entry should record who or what produced it and when.
