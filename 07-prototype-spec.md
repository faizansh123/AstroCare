# AstroCare Master Spec v2

This is the **single build spec**. It merges the features doc (file 15), the clickable prototype and mockups (file 14), the SRS (file 10), and the architecture plan (file 12), using the decisions in file 11 (D1 to D25). If anything here conflicts with an older file, this file wins.

All data is simulated. Thresholds are illustrative demonstration rules, not validated flight medicine. The app is not diagnostic and not an operational flight-medical system.

## 1. Product

**AstroCare** is a mission-aware astronaut health monitoring and decision-support prototype. It compares **Earth (preflight) baselines** with **simulated in-flight** vitals, labs, self-assessment, and cabin environment, applies transparent rules to give a GREEN / YELLOW / RED / INSUFFICIENT DATA review category, and uses **Gemini** to write a grounded explanation. It keeps a timestamped assessment history and a separately labelled panel of published research.

Tagline: Monitor. Support. Explore healthier.

Value in one line: it shows **what changed, when it changed, and what context merits review**, then hands the astronaut or medical team a clear next step.

## 2. Users

Astronaut (primary), crew medical officer, ground flight surgeon, research/operations analyst.

## 3. Evidence and honesty policy

- Personal values are **simulated** and labelled so everywhere
- Published studies appear **only** in the NASA Research panel, labelled with cohort size and source, never mixed into the personal baseline
- No live ISS, NASA, wearable, dosimeter, or lab feed is claimed
- No diagnosis, no drug dosing, no emergency treatment, no validated risk score
- GREEN never says "safe": it says "No flags under demo rules"
- No on-screen "Not for clinical use" banner (D30). Demo nature shown through "illustrative/demo" labels on thresholds and simulated-data labels

## 4. Features

| ID | Feature | Priority | Notes for the build |
|---|---|---|---|
| F01 | Mission dashboard | P0 | Overall status card, indicator cards with baseline and delta, survey completion, environment snapshot, latest log, last-sync and data-age badge |
| F02 | Earth vs space vital signs | P0 | HR, SBP, DBP, temperature, respiratory rate and SpO2 (display only, D26), sleep, mood. Absolute and % change, baseline timestamp, BP components separate |
| F03 | SpaceLab biomarkers | P0 | Hemoglobin, WBC, glucose, calcium. Specimen time, units, baseline, delta, data-quality status |
| F04 | Daily self-assessment | P0 | 4-step stepper. Symptoms (incl. headache, dizziness, nausea, breathing difficulty) with severity, fatigue, mood, sleep, notes |
| F05 | Assessment (traffic light) | P0 | Rules engine, 4 states, rules-fired list, missing-data handling |
| F06 | AI explanation | P0 | Gemini, F06 output contract, template fallback |
| F07 | Environment | P0 | CO2, cabin temperature, humidity, light cycle, mission phase, radiation only if entered. Context only |
| F08 | Body map | P1 | Brain/head, heart, lungs, blood/immune, bones, sleep/mood. Shows related values and a no-causation note |
| F09 | Health trends | P0 | Time series with Earth baseline line, mission-day axis, annotations from log events, filters |
| F10 | Guidance library | P1 | Sections: For You Now, Health and Prevention, Spaceflight Hazards, Measurement Guide. **D28:** written by Gemini from the inputs and rules result, labelled AI-generated and not clinically reviewed. The hand-written library (with sources, one review status for the whole file) is only the offline fallback. The escalation reminder stays fixed |
| F11 | ~~Mission log~~ | - | **Removed** (D25) |
| F12 | Research provenance | P0 | NASA Research screen: study, cohort size, units, timepoints, data origin, "published" vs "simulated" labels |

Scope warning: ten P0 features is a lot. If time runs short, cut in this order: F09 filters and annotations, F03 data-quality detail, F07 light cycle and radiation. Never cut F05, F06 fallback, INSUFFICIENT DATA, or the provenance labels.

## 5. Data dictionary

| Signal | Earth baseline (demo) | In-flight input | Rules / display |
|---|---|---|---|
| Heart rate | 72 bpm | bpm, time | delta, %, YELLOW if +20 bpm or more |
| Systolic BP | 120 mmHg | mmHg, posture, time | delta, % (display only) |
| Diastolic BP | 80 mmHg | mmHg | delta, % (display only) |
| Body temperature | 36.7 C | C, site | delta (display only) |
| Sleep | 8 h | hours, preceding night | delta, YELLOW if under 6 h |
| Mood | 8 / 10 | 1-10, 10 is best | delta, YELLOW if 4 or lower |
| Fatigue | n/a | 0-10 | YELLOW if 7 or higher |
| Symptoms | n/a | list + severity + notes | YELLOW if 2 or more. Training trigger gives RED |
| Hemoglobin | 145 g/L | g/L, specimen time | delta, %, YELLOW if 10% or more |
| WBC | 6.2 x10^9/L | value, time | delta, % (display only) |
| Glucose | 4.8 mmol/L | mmol/L (mg/dL converts x18) | delta, % (display only) |
| Calcium | 2.35 mmol/L | mmol/L | delta, % (display only) |
| Cabin CO2 | reference 0.45 % | % | context sentence at 0.5% or higher |
| Cabin temperature | mission reference | C | context |
| Humidity | mission reference | % | context |

**Formulas:** absolute change = current - baseline. % change = (current - baseline) / baseline x 100, only if baseline is nonzero and units and timeframe are comparable. Never use published group averages as the individual baseline. Reject incompatible units.

## 6. Navigation (11 screens, 4 groups)

| Group | Screens |
|---|---|
| Monitor | Dashboard (F01), Vital Signs (F02), SpaceLab (F03), Environment (F07) |
| Assess | Self-Assessment (F04), Assessment (F05, F06) |
| Understand | Body Map (F08), Health Trends (F09), Guidance Library (F10), NASA Research (F12) |

Self-assessment stepper: **1 Symptoms and feelings** (sleep, fatigue, mood, symptoms, optional "Any other symptoms?" free text, D27) -> **2 Measurements** (HR, SBP, DBP, temperature, optional respiratory rate and SpO2, D26) -> **3 Lifestyle and environment** (cabin CO2, temperature, humidity, notes) -> **4 Review** (shows missing or invalid fields, then Calculate).

Stepper display (UI-UX-AUDIT #18): track visits independently of the current step. A visited input step is complete only when its fields have no issues from existing validation (including required answers and measurement age). Show current, visited, complete and needs-attention labels; only complete input steps receive checkmarks. Optional environment fields may remain empty. Review is a visited/current state, not a saved-completion claim. Navigation focuses the new step heading; review issue links open the owning step and focus its field or remeasurement control where available. Issues outside this form identify the relevant screen. Free navigation and existing submission eligibility, including permitted INSUFFICIENT DATA and RED-trigger behavior, are unchanged.

Assessment layout (UI-UX-AUDIT #25): show status, reported symptoms, the always-visible escalation reminder, existing F06 verification/escalation sections and navigation actions before detailed readings. Follow with readings and naturally sized reason codes, sequential F06 explanation with citations/source labels, one overview of all five hazards, and limitations. Preserve RED protocol instructions, every F06 section, provenance and the existing automatic template/Gemini selection and updates. This changes presentation only.

Assessment evidence layout (UI-UX-AUDIT #26): observed evidence, baseline comparison, contextual factors, and missing/uncertain information appear sequentially. One compact hazard overview replaces the separate hazard panels and repeated F06 hazard section. Each hazard keeps its name, relationship level (text/icon), and symptom summary visible; a native keyboard-accessible “Supporting detail” disclosure retains its deterministic rationale/readings and explicitly referenced F06 hazard statements with unchanged citations. Statements without a matching hazard reference remain visible within the overview. Deterministic links and Gemini/offline explanation are labelled separately. Stable hazard keys and uncontrolled disclosures preserve open state during Gemini updates. All medical wording, safety disclaimers, NASA link, review/version provenance, limitations and source selection remain intact.

Assessment evidence disclosure (remaining audit #26): the readings table and reason-code list remain the initial structured comparison and rule summary. Observed-evidence and Earth-baseline-comparison explanation statements are retained verbatim, with every citation, inside separate initially closed native details/summary disclosures labelled with their section and item count. Context, missing/uncertain information, safety wording and limitations remain visible. Uncontrolled disclosures preserve open state during automatic Gemini updates. The #25 top result/actions, compact five-hazard overview, source badges, citation rendering and AI behavior are unchanged; this does not implement #27.

Explanation provenance presentation (audit #27): each statement retains all source labels and reference IDs in a native, initially closed “Sources” disclosure with a section/statement accessible name. Visible source state is concise (Gemini, offline, or offline while checking Gemini). “Explanation details” retains response-check status, model, prompt version when supplied, and fallback reason. Medical wording, safety information, grounding checks, automatic source selection/updates, #25 ordering, #26 evidence disclosures and compact hazard design are unchanged. This supersedes the earlier source-badge/citation presentation only; #28 is not implemented.

Visual design: follow the mockup (dark space theme, tokens in file 14). Behavior: follow the clickable prototype.

## 7. Assessment engine (all rules in one configurable file)

Evaluation order:

1. Validate inputs (units, ranges, timestamps). Invalid or conflicting values are excluded and reported
2. Check **training triggers** (default: severe breathing difficulty). If selected: **RED**, even if every number looks normal
3. Check required inputs and data age. Missing, invalid, conflicting, or stale: **INSUFFICIENT DATA**
4. Evaluate YELLOW rules
5. Otherwise **GREEN**

| Rule ID | Trigger | Result |
|---|---|---|
| RED-TRAIN-BREATHING | Severe breathing difficulty selected | RED, "simulation only", follow approved crew medical procedures |
| YEL-HR | HR change of +20 bpm or more | YELLOW reason |
| YEL-SLEEP | Sleep under 6 h | YELLOW reason |
| YEL-FATIGUE | Fatigue 7 or higher | YELLOW reason |
| YEL-MOOD | Mood 4 or lower | YELLOW reason |
| YEL-SYMPTOMS | 2 or more symptoms | YELLOW reason |
| YEL-HEMOGLOBIN | Hemoglobin change of 10% or more | YELLOW reason |
| CTX-CO2 | CO2 0.5% or higher | Context sentence only |
| DATA-MISSING / DATA-INVALID / DATA-STALE | Required input missing, invalid or conflicting, or older than the stale limit | INSUFFICIENT DATA |

Rules for the rules:

- Environment and log events are **context only**. They never change the status and never claim a cause
- Spaceflight hazard links (D24) show which of NASA's five hazards a reported symptom **may be related to**. Context only, never a cause, never change the status
- Labs add deltas and review notes. They never diagnose anemia, infection, metabolic disease, or bone loss
- Symptoms are always shown. "Seek help regardless of color" is always shown
- Every result lists: readings, baselines, deltas, rules fired, timestamp, rules version, limitations
- Status is computed by pure functions. **No LLM decides the status**

## 8. AI explanation (Gemini)

Pipeline: form -> validate and normalize -> **rules engine** -> serverless proxy -> **Gemini** -> response check -> display. Details in file 12.

**Input to Gemini:** validated measurements, baseline deltas, symptoms, environment, lab results, data age, mission phase, the rules result (status and rules fired), and the hazard links (D24). Since D28 the guidance library is not sent.

**Output contract (F06):** status (copied from rules, never changed), observed evidence, baseline comparison, possible contextual factors, missing or uncertain information, recommended verification, escalation pathway, and spaceflight hazards (D24: one note for each of NASA's five hazards saying which reported symptoms may be related to it; never a cause, never changes the status), and guidance (D28: `forYouNow`, `prevention`, `measurement` for the Guidance page; no outside citations; on RED the first step is the approved protocol).

**Safety:** never say CO2 caused a headache, never invent values or citations, never give unapproved treatment, never override the status. **Every sentence must reference an input field, a fired rule or a hazard link**, and the app checks this before showing it.

**Fallback:** if Gemini is offline, slow, or returns something invalid, show the built-in rule-grounded explanation text (the prototype's template) with the label "Offline explanation".

## 9. Typed entities (TypeScript)

Astronaut, Mission, Baseline, Observation, LabResult, SymptomSurvey, EnvironmentSample, Assessment, GuidanceArticle, LogEvent, plus RulesConfig and AiExplanation. Field lists are in file 15 section 9. Add `source: "simulated" | "published"` and `quality` to every observation.

## 10. Non-functional

| Area | Requirement |
|---|---|
| Accessibility | Keyboard navigation, visible focus, status = color + text + icon, readable contrast, descriptive errors |
| Responsive | Desktop and tablet |
| Persistence | localStorage (snapshot, check-ins, assessment history). Do not claim encrypted clinical storage |
| Offline | All but the AI explanation. Last-sync and stale-data indicators |
| Privacy | Fictional data only. No real health data to Gemini. No secrets in the frontend |
| Reliability | Deterministic outputs for identical inputs. No crash on blank or invalid input |
| Performance | Local calculations instant on a normal laptop |
| Transparency | Simulation label, sources panel, rules version visible |
| Security | Sanitize displayed free text. API key only in the serverless function |

## 11. Acceptance tests

**Scenario tests (from the features doc):**

| Scenario | Expected |
|---|---|
| HR 72 -> 92 | +20 bpm, +27.8%, YELLOW reason |
| BP 120/80 -> 116/74 | -4 / -6 mmHg, shown separately, no flag |
| Sleep 8 -> 5.5 h | -2.5 h, YELLOW reason |
| CO2 raised + headache | Context mentioned, no causal claim |
| Hemoglobin 145 -> 137 g/L | -8 g/L, -5.5%, no flag, "trend not diagnosis" |
| Severe breathing difficulty | RED ("Red: escalate now"), protocol text, no "training" wording (D29) |
| Required field missing | INSUFFICIENT DATA |
| Headache with CO₂ 0.6% (D24) | Closed environment and gravity listed as possible factors, no causal wording, status unchanged |

**Boundary tests:** HR +19 vs +20, sleep 6.0 vs 5.9, fatigue 6 vs 7, mood 5 vs 4, symptoms 1 vs 2, hemoglobin -9.9% vs -10%, CO2 0.49 vs 0.50, zero baseline guard.

**Safety tests (from the SRS):** symptom with normal vitals still shows and guides, invalid input blocks calculation, incompatible units rejected, stale data gives INSUFFICIENT DATA, AI output with an unknown field reference is discarded, AI failure shows the fallback, status never changes because of AI text.

**Other:** keyboard-only navigation, export matches screen, offline run of the non-AI flow, mockup visual match.

**Demo scenarios to build:** (1) Normal day -> GREEN, (2) several small changes (HR +24, sleep 5.0, dizziness) -> YELLOW, (3) severe breathing difficulty -> RED, (4) missing blood pressure -> INSUFFICIENT DATA.

## 12. Build order (sprints)

| Sprint | Work |
|---|---|
| 1 | Shell and navigation, TypeScript types, baseline and vitals, Earth-vs-space comparison and chart, simulated-data labels |
| 2 | SpaceLab, self-assessment stepper, environment, body map |
| 3 | Rules engine and tests, Gemini proxy and explanation with fallback, guidance library |
| 4 | Scenario testing, accessibility, research panel and citations, demo storytelling, pitch rehearsal |

## 13. Ownership (proposed, to confirm)

| Person | Area |
|---|---|
| Bruno | React and Tailwind UI, shell, dashboard, forms, deployment |
| Subomi | TypeScript types, rules engine, tests, data, API client and serverless proxy |
| Nabeeha | Rules wording, guidance review, Gemini safety prompt and output review, research verification, acceptance tests, presentation |

## 14. Open decisions

See file 11, section "Still open".
