# Reconciliation v2: One Plan From All Sources

The project now has several sources that partly disagree. This file settles each disagreement so the build follows **one plan**. Where a row says "Decision", the master spec (`07-prototype-spec.md`) already reflects it.

## Source of truth order

1. **Feature scope and behavior:** `15-features-requirements-user-flows.md` (features F01-F12), the clickable prototype, and the visual mockups (`14-ui-design-and-prototype-reference.md`)
2. **Engineering, safety, and test requirements:** `10-requirements-and-technical-design.md` (SRS), wherever it does not contradict source 1
3. **Technology and AI flow:** `12-architecture-plan.md` (React, Tailwind, TypeScript, Gemini)
4. **Project history:** charter, stakeholder, iteration, stand-up, and risk docs (updated in this pass where the plan changed)
5. **Stretch ideas:** `09-gaps-and-innovation.md`

## Decisions

| # | Topic | Sources say | Decision |
|---|---|---|---|
| D1 | Baseline | Features doc and prototype: **Earth (preflight) baseline**, absolute and % change. SRS and my earlier spec: personal baseline with standard deviations | Use the **Earth baseline** with absolute and % deltas. Drop z-scores and SD. "Earth vs space" is the core framing |
| D2 | Indicators | Charter v1: resting HR, HRV, SpO2, sleep, exercise, fatigue. SRS: HR, BP, temp, sleep, fatigue, mood, optional glucose. Features doc: vitals + labs + environment | **Vitals:** HR, SBP, DBP, body temperature, sleep, mood. **Survey:** fatigue, symptoms, notes. **Labs:** hemoglobin, WBC, glucose, calcium. **Environment:** CO2, cabin temperature, humidity, light cycle, mission phase, radiation only if available. **Dropped:** HRV, SpO2, exercise performance |
| D3 | Status states | Charter: 3. SRS and features doc: 4 | **4 states:** GREEN, YELLOW, RED, INSUFFICIENT DATA |
| D4 | What RED means | Features doc: only a deliberately triggered **training scenario**. SRS: urgent demo case or protocol trigger. My earlier spec: absolute vital thresholds | RED = **training scenario trigger only**. Default trigger: severe breathing difficulty. The trigger list is configurable. No absolute-vital RED rules |
| D5 | YELLOW rules | Prototype: HR +20 bpm or more, sleep under 6 h, fatigue 7 or more, mood 4 or less, 2 or more symptoms, hemoglobin change of 10% or more | Use exactly these, in a configurable rules file, labelled illustrative |
| D6 | Symptoms vs numbers | SRS: symptoms are never suppressed by normal vitals | Keep. Symptoms always display, "seek help regardless of color" is always shown, and a selected training trigger forces RED even if every number is normal |
| D7 | Environment | Features doc: context only, never assumed causal. Prototype: CO2 at or above 0.5% adds a context sentence | Context text only. Environment and log events **never change the status** and never state a cause |
| D8 | AI | Features doc: rules decide, "AI-style explanation" explains. Team flow: form to **Gemini** to display | Rules decide status. **Gemini writes the explanation** under the F06 output contract. The prototype's rule-grounded template text is the **fallback** when Gemini is unavailable or invalid |
| D9 | Mood input | Prototype: 1-10 slider. Mockup: 5 labelled buttons. SRS: categorical | Store **1-10** (needed for baseline deltas and "same scale and wording"). UI: slider with labelled anchors (very low to very good) |
| D10 | Fatigue input | Prototype: 0-10. Mockup: None / Mild / Moderate / High | Store **0-10**. Show band label beside it: 0-1 None, 2-4 Mild, 5-6 Moderate, 7-10 High. The YELLOW rule fires at 7 (High) |
| D11 | Sleep input | Prototype: hours. Mockup: hour bins | Store **hours** (decimal). Quick-pick chips may fill the field, but the number is what is saved |
| D12 | Navigation | Prototype: 10 screens. Mockup: 6 items | **11 items in 4 groups**, see the master spec section 6. Mockup visual design, prototype behavior |
| D13 | Self-assessment steps | Mockup: Symptoms, Measurements, Lifestyle, Review | Use the 4-step stepper: (1) Symptoms and feelings, (2) Measurements, (3) Lifestyle and environment, (4) Review |
| D14 | Identity and mission | Prototype: ISS, Day 124, astronaut A-01. Mockup: Artemis III, lunar orbit, Day 142, Commander Alex Morgan | One fictional crew member and **fictional mission** on every screen. Suggested: "Cdr. Alex Morgan (fictional), Lunar Orbit mission (fictional), Day 142". Avoid a real mission name next to invented data |
| D15 | Baseline display | Prototype: single values. Mockup: ranges | Single baseline value is canonical. A range label is a display choice only |
| D16 | Persistence | SRS: localStorage or IndexedDB. Features doc: localStorage only plus JSON export/import | **localStorage + JSON export/import** |
| D17 | Offline | SRS: tested PWA or call it future work. Features doc: offline-capable architecture desired, visible last-sync and stale-data indicators | Everything except the Gemini explanation works offline. Build last-sync and stale-data indicators. PWA caching is a stretch goal and not claimed unless tested |
| D18 | Stack | SRS: React, Vite, Tailwind, Recharts, Vercel. Team: React, Tailwind, TypeScript, Gemini | **React + Vite + Tailwind + TypeScript**, Recharts for charts, Vercel (static app plus one serverless function that holds the Gemini key) |
| D19 | Schedule | Lab 4: 2-week iteration. SRS: Day 1 and Day 2. Features doc: Sprints 1-4 | Use **Sprints 1-4 as the build order**. Team maps them onto the real hackathon time available |
| D20 | Research panel | Prototype lists Norsk 2015 means. Features doc: verify before judging | Keep a clearly separate panel. Numbers are **unverified** until someone checks the original tables |
| D21 | My earlier innovation ideas | Adaptation-aware baseline, hazard context, delay-aware escalation | **Adaptation baseline:** dropped as an engine, its job is covered by the Earth-vs-space comparison plus the published reference panel. **Hazard context:** covered by F07 environment, context only (mission log removed, D25). **Delay-aware escalation:** kept only as a P2 stretch (not in the new docs) |
| D22 | Required fields for a valid assessment | SRS: missing field gives Insufficient Data. Not specified which | **Required:** HR, SBP, DBP, temperature, sleep, mood, fatigue, and a symptom answer (none or listed). **Optional:** labs, environment. Missing or invalid required field gives INSUFFICIENT DATA |
| D23 | Labs and units | Features doc: do not compare incompatible units | Block or convert with a visible conversion. Glucose in mmol/L is canonical, mg/dL converts at x18 |
| D24 | Spaceflight hazards and symptoms | Team request (14 Nov 2026): analyse whether a reported symptom could be related to NASA's five hazards. Files 15 §5 and 07 §7 forbid stating a cause | Every assessment lists the five NASA hazards (space radiation, isolation and confinement, distance from Earth, gravity, closed or hostile environment) with the reported symptoms that **may be related** to each, why, and the supporting or missing readings (`src/data/hazards.json`, `src/lib/hazards.ts`). Gemini explains them in `spaceHazards` (5 notes). Wording is "may be related to" only, never "caused by". Vitals alone never create a link. Links never change the status. The symptom-to-hazard table is a draft pending clinical review |
| D25 | Mission log (F11) | Files 15 and 14 list a P0 mission log with crew notes and JSON export | **Removed** (project owner request, 14 Nov 2026). No log screen, no log storage, no "record to log" buttons, no event markers on trends. Assessment history (with inputs and the explanation shown) and saved check-ins still keep the timestamped record. Environment stays context only |
| D26 | Respiratory rate and SpO2 | D2 dropped SpO2; respiratory rate was never listed | **Added back as display-only vitals** (project owner request, 14 Nov 2026). Shown on the dashboard tiles (in place of sleep and mood), in Vital Signs, in the check-in Measurements step and in Health Trends. **Optional**, not required by D22. **No rules thresholds and no plausibility checks**, so they never fire a rule, never set the status and never show a review flag. Values are simulated. Sleep and mood stay required inputs and stay in Health Trends. Any threshold needs team and clinical sign-off first |
| D27 | Breathing symptom wording and other symptoms | Prototype label "Severe breathing difficulty" | **Relabelled "Difficulty breathing / shortness of breath"** (project owner request, 14 Nov 2026). It stays the training trigger, so selecting it gives RED at **any** severity (D6; escalation is never lowered). Internal ID `severe_breathing_difficulty` unchanged. **Added an optional "Any other symptoms?" free-text field** (`survey.otherSymptoms`, max 300). It is always shown in the results next to the ticked symptoms (D6) but the rules engine does not read it, so it never sets or changes the status. The UI tells the user to tick a listed symptom if one fits |
| D28 | Who writes the Guidance page (F10) | Files 15 and 07: a guidance library of reviewed, sourced educational cards; Gemini receives approved guidance snippets | **Gemini writes the guidance** (project owner request, 14 Nov 2026: the hand-written cards are not trusted). The prompt (`explain.v5`) asks for a `guidance` section (`forYouNow` 1-5, `prevention` up to 4, `measurement` up to 3) and no longer sends the guidance library. The Guidance page shows that AI text on every tab, labelled "AI-generated, not clinically reviewed". The same response check applies (refs, numbers, no medication, dose, diagnosis or causal wording), plus: no outside citations or "proven" claims, and on RED the first step must be the approved protocol. **Kept fixed and local:** the status, the list of fired rules, and the escalation reminder at the end of the actions. `guidance.json` is now only the offline fallback when Gemini is unavailable or rejected |
| D29 | "Training" wording on screen | Files 15 §F (RED "only for explicitly selected training scenarios"), 14 and 07: RED is labelled "training scenario" | **No mention of training anywhere in the UI or AI text** (project owner request, 15 Nov 2026). RED reads **"Red: escalate now"** with the approved-protocol escalation text. Behaviour is unchanged: the configured trigger (breathing difficulty) still forces RED at any severity (D4, D6, D27). The demo nature stays visible through the "Not for clinical use · Illustrative rules" banner and "illustrative/demo" labels. Internal names (`trainingTriggers`, `RED-TRAIN-BREATHING`) are unchanged and never shown |

## Still open (team to decide)

1. **Rules for BP, temperature, glucose, WBC, calcium:** the prototype only displays them as deltas. Add configurable rules, or keep display-only? (Default: display-only.)
2. **Radiation display:** built as an optional manual field, shown only if entered, labelled as context, not live telemetry. Confirm.
3. **Mission identity** (D14) and final navigation grouping (D12).
4. **Who verifies the Norsk 2015 numbers** against the original paper (suggest Nabeeha).
5. **Gemini:** key owner and billing. (Built with `gemini-3.5-flash-lite`; Gemini receives the hazard links; since D28 it no longer receives the guidance snippets and writes the guidance itself.)
6. **Stale-data threshold:** built with a 24-hour placeholder in `rules.json`. Confirm.
8. **Clinical review of the hazard links (D24)** and the Gemini prompt `explain.v5`.
7. **Submission requirements** (video, code link, project page): not in any source yet.

## What this changes in earlier files

| File | Change made |
|---|---|
| 02 charter | v2 amendment block, new indicators, scope, deliverables, success criteria |
| 03 stakeholders | Added research/operations analyst and AI service provider, fixed grid mismatch |
| 04 iteration plan | Added v2 backlog from F01-F12 |
| 05 stand-ups | Historical note only |
| 06 risk register | Added risks for Gemini, causality, invented labs, plan drift |
| 07 spec | Fully rewritten as master spec v2 |
| 08 demo | Rewritten around Flows A, B, C |
| 09 innovation | Status banner added, ideas mapped to decisions |
| 10 SRS | Banner added, kept as engineering and safety source |
| 12 architecture | Updated pipeline and AI contract |
