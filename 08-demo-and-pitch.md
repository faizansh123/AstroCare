# Demo Script and Pitch Checklist (v2)

> Updated 14 November 2026 to follow `07-prototype-spec.md` and the user flows in `15-features-requirements-user-flows.md`. The old story (HRV, Green to Yellow to Red with a medical-event report) is replaced. All data is simulated and labelled.

## The four demo scenarios

| # | Scenario | Input | Expected result |
|---|---|---|---|
| 1 | Normal | Default values near baseline | GREEN, "No flags under demo rules" |
| 2 | Several small changes | HR 96 (+24 vs 72), sleep 5.0 h, dizziness | YELLOW with reasons YEL-HR, YEL-SLEEP, YEL-SYMPTOMS |
| 3 | Severe breathing difficulty | Symptom: severe breathing difficulty | RED (training-scenario trigger), "seek help regardless of color" |
| 4 | Missing blood pressure | BP left blank | INSUFFICIENT DATA, never GREEN |

Fictional crew member (suggested): Cdr. Alex Morgan, Lunar Orbit mission (fictional), Day 142. Use the canonical values in `14-ui-design-and-prototype-reference.md`.

## 90 second story (Flows A, B, C)

1. **Problem (15s):** Ground help is delayed on long missions. Astronauts need to see small changes against their own Earth baseline.
2. **Flow A, dashboard (15s):** Baseline vs in-flight, trends, SpaceLab biomarkers, environment as context only.
3. **Flow B, self-assessment (30s):** Four steps (symptoms and feelings, measurements, lifestyle and environment, review). Submit. Rules produce the status and reason codes. Gemini explains it in plain language with cited evidence. Show scenario 2 then 3, then 4 briefly.
4. **Flow C, history and research (15s):** Open a previous assessment from the history, then the NASA research panel with citations and simulated/published labels.
5. **Close (15s):** Rules decide, AI explains, never diagnoses. Missing data is shown, not hidden. Offline fallback works.

## Pre-demo checklist

- [ ] All four scenarios pass the acceptance tests
- [ ] Gemini failure tested: "Offline explanation" fallback shows
- [ ] API key only in serverless environment, not in repo or client
- [ ] Cached or recorded backup for the Gemini step
- [ ] Every screen shows "Simulation / Not for clinical use"
- [ ] Rules labelled illustrative, rules version visible
- [ ] Fictional mission and crew name on every screen, same values as prototype
- [ ] Simulated vs published labels visible; Norsk 2015 numbers verified by Nabeeha
- [ ] Recorded backup video and screenshots ready
- [ ] No last-minute nonessential changes
- [ ] Submission items checked on the event page (video, code link, project page)

## Charter success criteria check (v2)

- [ ] Working React app demonstrated
- [ ] Four statuses and reason codes shown
- [ ] Earth baseline comparison (absolute and % change)
- [ ] Gemini explanation with evidence refs and fallback
- [ ] Context-only environment, no causal claims
- [ ] No claim of clinical validation or flight readiness

## Anticipated judge questions

- *Does the AI decide status?* No. Deterministic rules do. Gemini only explains, and its output is checked against the rules result.
- *Where do thresholds come from?* Illustrative placeholders in one config file, to be validated by aerospace medicine.
- *Why Earth baseline instead of population ranges?* Spaceflight shifts physiology, so change from the individual is more meaningful.
- *Real data?* Personal data is simulated and labelled. Published findings appear only in the research panel with sources.
- *What if Gemini or the network fails?* Rules and a template explanation still work.
- *Does it replace the flight surgeon?* No, it supports the astronaut and gives structured information to medical staff.
- *How does it relate to NASA work?* It follows the spirit of NASA's Clinical Decision Support work and Earth-independent medical operations (see file 09).
