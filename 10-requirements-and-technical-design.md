# AstroCare Requirements and Technical Design (SRS)

> **Status:** kept as the engineering, safety, and test source. Where it conflicts with the features doc (file 15), the prototype, or the mockups, follow `07-prototype-spec.md` and `11-reconciliation.md`. Main differences: the v2 plan uses an **Earth (preflight) baseline** with absolute and % deltas (not personal z-scores), adds **SpaceLab, environment, NASA Research, mission log**, makes **RED a training-scenario trigger only**, and uses **Gemini** for the explanation with rules deciding the status.

Source: "Astronaut Health Assessment & Guidance System, Software Requirements Specification and Technical Design", v1.0, 14 November 2026. Hackathon prototype, simulated data. Roles are proposed, not confirmed. Details are proposals, not NASA requirements or verified clinical standards.

## Executive decision

Build a browser-based, offline-capable proof of concept where an astronaut enters measurements and symptoms, compares them with a personal baseline, gets transparent Green/Yellow/Red prototype flags, reads context-specific educational guidance, and creates a structured medical-event summary. One complete demonstrable workflow, not a clinically unvalidated AI diagnosis.

## 1. Basis

Built from the challenge brief, objectives, considerations, and the listed NASA/CSA resource links. Thresholds and clinical relationships must be checked against primary sources and cited before being presented as validated.

## 2. Users, scope, boundaries

| User | Need |
|---|---|
| Astronaut / crew member | Fast daily check, symptom recording, understandable explanations, accessible guidance |
| Crew medical officer | Review concerning findings and structured event summaries |
| Flight surgeon / ground support | Receive interpretable reports when comms permit |
| Mission ops / researcher | Understand intended use, data provenance, limitations; no default access to private health details |

- **In scope:** manual or simulated vitals and symptoms, individual baselines, trends, transparent rules, guidance library, local storage, export, dashboard, optional body map
- **Out of scope:** diagnosis, autonomous prescribing, validated clinical triage, real sensor integration, actual radiation dosimetry, telemedicine comms, EMR integration, crew deployment

## 3. Mission environment and human factors

| Constraint | Design implication |
|---|---|
| Variable gravity / microgravity | Do not transplant Earth norms without qualification; label baselines as mission and context dependent |
| Radiation exposure | Education and optional exposure-context field; never claim vitals measure dose |
| Isolation / confinement | Sleep, fatigue, mood, non-stigmatizing check-ins; do not overinterpret mood |
| Distance from Earth | Work without live internet; queue/export summaries; distinguish onboard vs ground escalation |
| Closed habitat | Allow environment context and symptom notes; do not infer atmospheric hazards from personal vitals |
| Limited time and equipment | Short forms, large controls, clear units, measurement instructions, explicit missing-data states |
| High consequence of false reassurance | Show uncertainty, missing data, trend context, and a prominent instruction to follow approved mission procedures |

## 4. Hazard to indicator analysis

| NASA hazard | Relevance | Candidate data | Interpretation limit |
|---|---|---|---|
| Space radiation | Exposure may add health risk over time | Exposure record/context, symptom note | HR, mood, SpO2 cannot quantify dose or diagnose radiation injury |
| Isolation and confinement | Sleep, fatigue, mood, behavioral well-being | Sleep hours, fatigue 0-10, mood check-in | Self-report is subjective; no psychiatric diagnosis |
| Distance from Earth | Comm delay and autonomy demands | Event timestamp, status, report queue | Not a biological indicator; drives workflow and offline design |
| Gravity fields | Cardiovascular adaptation, musculoskeletal change | HR, BP, symptoms, optional activity | No inference of bone loss from these readings |
| Hostile / closed environments | Environmental stressors may affect health | Temperature, symptoms, environment notes | Personal measurements alone cannot detect cabin contamination |

Other risks named in the challenge: immune changes, inadequate nutrition, cardiovascular events. Candidate extensions: temperature/symptom diary, nutrition intake, optional blood glucose. Not validated diagnostic pathways.

## 5. Health data model

| Field | Unit / type | Input | Guardrail |
|---|---|---|---|
| Heart rate | bpm | Manual or scenario | Note rest/activity and time |
| Blood pressure | mmHg sys/dia | Manual or scenario | Record posture and device |
| Body temperature | deg C | Manual or scenario | Site/method matters |
| Blood glucose (optional) | mg/dL or mmol/L | Manual | Only with appropriate device; show conversion clearly |
| Sleep duration | hours/24 h | Self-report | Not a sleep-disorder diagnosis |
| Fatigue | 0-10 ordinal | Self-report | Subjective, trend |
| Mood | categorical + notes | Self-report | Privacy sensitive |
| Symptoms | multi-select + free text | Guided form | Allow severity and onset |
| Context | mission day, location, activity, timestamp | Profile/form | Distinguish simulated from actual |

Each measurement needs a "How to measure" help link, units, date/time, source (manual/simulated), missing-value handling, and a warning not to fabricate values. Record consent and limit exposure of mood/symptom data in shared demo screenshots.

## 6. Functional requirements

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-01 | Mission and astronaut profile: fictional astronaut, mission day, environment (spacecraft, station, rover, lunar/Mars base) | MVP | Profile visible; switching context does not silently alter medical thresholds |
| FR-02 | Measurement entry: HR, BP, temp, sleep, fatigue, mood, optional glucose; validate ranges, units, missing | MVP | Clear messages on invalid or incomplete; no fabricated readings |
| FR-03 | Guided self-assessment: dizziness, headache, unusual fatigue, sleep problems, muscle weakness, other; allow none/unknown | MVP | Can complete, revise, review before submit |
| FR-04 | Personal baseline comparison: predefined simulated baseline, current minus baseline with direction and units | MVP | Differences match values; missing baseline explicit |
| FR-05 | Explainable status engine: documented configurable rules produce Green, Yellow, Red, or Insufficient Data; show which rules fired | MVP | Deterministic; tests cover each status and missing data |
| FR-06 | Health guidance: recheck, sleep hygiene, hydration/nutrition per approved plan, symptom documentation, escalation per mission protocols | MVP | Every action has provenance or is labelled illustrative; no invented medication or doses |
| FR-07 | Dashboard: indicators, status, baseline comparison, trend highlights, next action, color plus text/icon | MVP | Laptop/tablet; never color alone |
| FR-08 | Scenario simulator: normal, concerning, high-risk fictional cases; user-editable inputs | MVP | All cases go through the same engine, no hardcoded labels |
| FR-09 | Trends and history: timestamped measurements, simple charts over mission days | Should | Marked simulated, units shown, missing points not joined misleadingly |
| FR-10 | Medical-event report: printable/exportable summary | Should | Matches on-screen assessment; disclaimer and source label |
| FR-11 | Offline-first persistence: local data, no external API for assessment | Should | Core flow works after disconnect once loaded; local-storage limits stated |
| FR-12 | Body map: clickable regions with education | Could | No region claims diagnostic certainty |
| FR-13 | Reminders and gamification | Could | Dismissible; no rewards for suppressing symptoms |
| FR-14 | Evidence and attribution: Sources/About panel listing NASA/CSA references, sourced facts vs assumptions | MVP | At least one NASA resource meaningfully used and cited |

## 7. Decision support logic and safety

The engine is a software demonstration, not a medical classifier. Thresholds must be reviewed against space-medicine guidance before any clinical interpretation. Never infer "healthy" from unflagged readings.

- **Green:** no demo rules fired and minimum fields present. Label "No flags under demo rules", not "medically cleared"
- **Yellow:** one or more concerning changes under illustrative rules. Show measurement context, recheck instructions, follow-up guidance
- **Red:** predefined urgent demo case or protocol-specified escalation trigger. Advise following approved mission emergency procedures and contacting the designated medical authority
- **Insufficient Data:** missing, stale, implausible, or contradictory inputs. Prompt remeasurement, never default to Green
- **Explainability:** each result lists source readings, baseline values, triggering rules, timestamp, limitations
- **Override:** crew can record symptoms and seek help regardless of color; escalation is never suppressed because metrics look normal

## 8. Use cases

| Use case | Basic flow | Exception |
|---|---|---|
| UC-01 Daily check | Profile, enter metrics, answer symptoms, review, calculate, guidance | Missing data: request recheck, symptoms still recorded |
| UC-02 Investigate change | Open flagged metric, see baseline/trend, measurement help, hazard context | Unclear source: show provenance/uncertainty |
| UC-03 Escalation | View Red scenario, review reasons, follow protocol, export report | No connectivity: save locally, queue manual handoff |
| UC-04 Education | Pick hazard/body region, read explanation, see what can and cannot be measured | Unsupported link: state evidence limitation |

## 9. UX and information architecture

Nav: Dashboard | Self-Assessment | Results | Guidance Library | Trends | Mission Log | About/Sources. Four primary screens: Dashboard, Self-Assessment, Results, Guidance. High contrast, large targets, keyboard navigation, text labels beside colors, plain language, no distracting animation in urgent states.

- **Dashboard:** profile, mission context, indicator cards, baseline deltas, latest status, "Start Check"
- **Assessment:** stepper symptoms, measurements, context, review
- **Results:** status, contributing factors, missing data, trends, "View Guidance"
- **Guidance:** next steps, measurement instructions, escalation contacts/protocol references, report export
- **Body map:** post-MVP

## 10. Technical architecture

- **Stack:** React + Vite, Tailwind CSS, JS/TS rules module, local JSON fixtures, Recharts, localStorage or IndexedDB, GitHub, Vercel for online demo
- **Offline:** add a service worker/PWA caching strategy and verify it. A static site alone is not automatically offline-capable
- **Data flow:** form or scenario selector, validation and unit normalization, baseline lookup, pure rules engine, structured AssessmentResult, UI cards/charts/guidance, local persistence and optional export
- **Keep** medical guidance content separate from numeric logic, with source metadata and review status
- **Modules:**

```
src/data/scenarios.json
src/data/guidance.json
src/components/{Dashboard,AssessmentForm,Results,Guidance,TrendChart}
src/lib/{validate,normalize,evaluate,report}
src/tests/*.test.js
```

## 11. Data contracts

```
HealthRecord {
  recordId, astronautId, missionDay, recordedAt,
  source: "simulated" | "manual", environment,
  measurements: { heartRateBpm, systolicMmHg, diastolicMmHg, temperatureC,
                  sleepHours, fatigueScore, mood },
  symptoms: [ { type, severity, onset } ],
  context: { activity, posture, notes }
}

AssessmentResult {
  recordId, status: "GREEN" | "YELLOW" | "RED" | "INSUFFICIENT_DATA",
  deviations: [ { field, baseline, current, delta, unit } ],
  triggeredRules: [ { ruleId, explanation } ],
  guidanceIds: [], missingFields: [], engineVersion, disclaimer
}

GuidanceEntry { id, topic, hazard, bodyText, actions, escalationText, sourceUrl, reviewStatus }
```

## 12. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-01 Usability | Typical check-in in 3 minutes or less in team testing (target) |
| NFR-02 Performance | Result within 1 second on a typical demo laptop |
| NFR-03 Reliability | Deterministic outputs; no crash on blank or invalid values |
| NFR-04 Offline | Core function without network after assets cached |
| NFR-05 Privacy | Fictional profiles; no real patient data; nothing sensitive sent to analytics |
| NFR-06 Accessibility | Keyboard access, visible focus, text status labels, contrast, descriptive errors |
| NFR-07 Transparency | Sources and rules version available; thresholds labelled illustrative, data labelled simulated. The on-screen "Not for clinical use" banner was removed (D30, file 11) |
| NFR-08 Maintainability | Separated components, reusable schemas, documented setup and tests |
| NFR-09 Security | No secrets in frontend; sanitize free-text display; constrain exports |
| NFR-10 Portability | Current Chrome/Edge, common laptop/tablet widths |

## 13. Test and acceptance plan

| Test | Input | Expected |
|---|---|---|
| T01 Normal | Baseline-like readings | Green, no flags under demo rules |
| T02 Concerning | Moderate deviations plus fatigue | Yellow with correct contributing factors |
| T03 High-risk | Predefined urgent scenario | Red with visible protocol escalation |
| T04 Missing | No BP or absent baseline | Insufficient Data, no false reassurance |
| T05 Units | Glucose in mmol/L vs mg/dL | Normalized, or conversion clearly unavailable |
| T06 Invalid | Negative sleep, implausible input | Validation error, no calculation |
| T07 Symptom-only | Concerning symptom, normal vitals | Symptom shown, escalation guidance not suppressed |
| T08 Offline | Disconnect after load | Core demo continues if PWA caching implemented |
| T09 Report | Export | Matches results and timestamps |
| T10 Accessibility | Keyboard only | All primary controls usable with visible focus |

**MVP Definition of Done:** entry, guided assessment, baseline comparison, status, guidance all integrated; three scenarios pass; missing data is safe; source and simulation disclaimers visible; runs locally; demo rehearsed.

## 14. Prioritization and plan

| Tier | Deliverables |
|---|---|
| P0 essential | Profile + editable measurements; symptoms; baseline comparison; status with reasons; educational guidance; 3 scenarios; evidence panel |
| P1 if stable | Trends, medical-event export, offline PWA caching, polished responsive UI |
| P2 stretch | Body map, environment switch, reminders, gamification |
| Excluded | AI diagnosis, drug prescribing, real sensors, radiation detection from vitals, validated triage |

- **Day 1:** freeze data schema and demo rules; research and source mapping; build form, baseline logic, status engine; one end-to-end scenario by evening
- **Day 2:** guidance, test all cases, visuals, report if time, deploy, record backup, rehearse, submit. Reserve final hours for testing and submission, not new features

## 15. Roles and risks

| Owner (proposed) | Deliverables |
|---|---|
| Nabeeha | Clinical and space-health research, hazard mapping, question wording, guidance review, acceptance tests, presentation |
| Bruno | React shell, dashboard, form UX, results, responsive styling, deployment |
| Subomi | Data schema, simulated fixtures, baseline/rules engine, tests, integration |
| All | Review sources, test safety wording, rehearse demo, confirm submission requirements |

| Risk | Mitigation |
|---|---|
| Unvalidated thresholds / false reassurance | Label demo rules; Insufficient Data state; no diagnosis; symptom override |
| Scope creep | Freeze P0; body map and AI are stretch |
| Weak NASA data connection | Trace specific claims and features to NASA HRP resources and cite them |
| Integration delay | Agree JSON contracts early; daily branch integration; shared tests |
| Demo or connectivity failure | Local copy, cached/offline test, prerecorded walkthrough |
| Misleading hazard inference | Show what metrics cannot detect, especially radiation and bone loss |
| Privacy / stigma | Fictional data only; respectful mood language; minimal storage |

## 16. Traceability to the challenge

| Challenge theme | AstroCare response |
|---|---|
| Gather health indicators | FR-02, FR-03 |
| Astronaut self-evaluation | FR-04, FR-05 |
| Guidance on treatments and improvements | FR-06 (educational, protocol-linked, no unvalidated treatment advice) |
| Visual interface | FR-07, FR-09, optional FR-12 |
| Measurements and instructions | FR-02 help and metadata |
| Different environments | FR-01 context field; future environment-aware rules |
| Health risks and five hazards | Section 4 mapping plus FR-14 evidence library |
| Long-duration / remote operations | FR-10 event summary, FR-11 offline-first |

## 17. Demo and pitch

**90-second demo:** (1) show fictional profile and baseline; (2) enter sleep, fatigue, heart-rate changes; (3) complete the dizziness question; (4) submit and show Yellow with exact deviations; (5) open guidance and report; (6) switch to the predefined urgent case and show Red escalation and caveat. State that readings are simulated and rules illustrative.

**Pitch:** "Astronauts may need to notice and communicate changes in their own health far from Earth. AstroCare brings measurements, symptoms, baseline trends and transparent educational guidance into one offline-oriented workflow. It does not diagnose; it helps organize information and demonstrate how self-assessment could support medical decision-making."

## 18. Open questions for the team

- Which exact NASA HRP article, dataset, or research finding will be used directly and cited?
- What devices and mission-approved procedures can the chosen environment plausibly support?
- Who reviews rule wording and assumptions, and what source supports each guidance statement?
- Will the MVP include BP and temperature, or focus on HR, sleep, fatigue, mood?
- Is offline a tested PWA feature or described as future work?
- Does the event require a specific pitch length, video, code link, project page, or other assets?

## 19. Source register

- 2026 NASA Space Apps Challenge, Create Health Monitoring Software for Astronauts on Space Missions (user-provided brief, URL not supplied)
- NASA HRP, 5 Hazards of Human Spaceflight: https://www.nasa.gov/hrp/hazards/
- NASA HRP, Risks of Human Spaceflight: https://www.nasa.gov/hrp/risks/
- NASA, Ongoing HRP Research in Space: https://www.nasa.gov/hrp/ongoing-hrp-research/
- CSA, Monitoring Radiation for Astronaut Health (2026): https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- CSA, Why Do We Conduct Science Experiments in Space?: https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
- NASA Space Apps challenge video: https://www.youtube.com/watch?v=RERG3gEmdC8

**Evidence note:** the supplied links establish framing and candidate sources only. Detailed thresholds, mission protocols, dataset access, and the video contents are not verified. Inspect primary materials and record precise citations before presenting claims as validated.
