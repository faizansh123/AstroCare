# Gaps, Differentiation, and Innovation Ideas

> **Status after the v2 plan (see `11-reconciliation.md` D21):** the new docs replace the adaptation-aware baseline with an Earth-vs-space comparison plus a separately labelled published-research panel. Hazard context is now the environment screen and mission log (context only, never changes status). Delay-aware escalation is a P2 stretch. The data-strategy section below still applies: label everything simulated, build scenarios from cited trends, and verify published numbers before judging.

> **Correction (see `11-reconciliation.md`):** earlier wording about context or adaptation "reducing false alarms" or "softening alerts" is unsafe under the SRS. Context only annotates, and status follows the more conservative comparison. The text below has been updated accordingly.

Goal: fix the weak spots in the current plan (data, space relevance, NASA benefit, what is different) and pick a sharper, more innovative thesis. Ideas are iterated in rounds: propose, attack, improve.

## 1. Honest gap analysis of the current plan

| Gap | Why it hurts with judges | Severity |
|---|---|---|
| Data is "simulated" with no grounding | Reads as made-up numbers. Judges will ask where the thresholds and curves come from | High |
| Baseline is a static personal average | In space the body is adapting, so a pre-flight baseline is misleading for weeks. Nothing in the plan says why this needs to be a space tool | High |
| Nothing space-specific beyond the label | A terrestrial wellness app with a NASA logo. The five HRP hazards, comm delay, and closed habitat are not used by the logic | High |
| No clear statement of NASA benefit | Charter says "supports autonomy" but does not tie to a named NASA need | Medium |
| Differentiation vs wearables and dashboards is implied, not argued | "Interprets, not just displays" is good but needs concrete mechanisms | Medium |
| Only physiology, little behavioral health or crew context | Isolation and confinement is a core hazard | Medium |
| Thresholds unvalidated (already a known risk) | Fine for a prototype if labelled, but better if grounded in published ranges | Medium |

## 2. What NASA already says it needs (anchor your pitch here)

Verified from NASA technical reports:

- NASA's Exploration Medical Capability (ExMC) element is developing a **Clinical Decision Support System (CDSS)**, a software tool to augment the crew's knowledge and help with decisions and health management, for missions where crew must act independently.
- The rationale: communication with ground is delayed or non-existent for significant parts of deep-space missions, so the crew must respond autonomously to unplanned health situations. Reports also cite **skill erosion** and **limited crew time** as problems the tool must handle.
- NASA's own framework splits capability into **prevention, diagnosis, treatment**, with prevention including crew preventive health monitoring and performance monitoring. AstroCare fits the **prevention and early-detection slice** of that framework.
- Recent real-world precedent: an ISS National Lab demo on Axiom-4 tested an Oura ring plus **edge computing** so crew could judge task readiness from sleep and HRV **without connecting to the ground**.
- NASA's Human Research Program has publicly sought wearables for sleep and heart data that give raw, non-proprietary output, beat-by-beat heart rate, and one-minute resolution.
- Artemis II was the first crew beyond low Earth orbit to join NASA's Spaceflight Standard Measures study, wore wrist devices tracking sleep and wellbeing, and carried six radiation sensors plus a pocket monitor per crew member.

Sources are listed at the end. Use these in the pitch: "AstroCare is a lightweight working slice of the CDSS concept NASA is already specifying."

## 3. Data strategy (fixing the biggest gap)

Be upfront: real astronaut vitals are restricted. NASA's open repository (OSDR) hosts mostly omics and non-human data, with identifiable astronaut data access-controlled; the Inspiration4 civilian crew dataset (3-day mission) is the first open commercial astronaut set. Check the challenge Resources tab for anything extra. So use a three-tier plan:

**Tier 1: Literature-grounded synthetic generator (core of the demo)**
Do not invent curves. Parameterize the simulator from published spaceflight findings, and cite each one on screen:
- Crew sleep less in flight than before and after (ISS wearable studies)
- Core body temperature rises higher and faster during exercise in space and stays elevated at rest (ESA Thermo-Mini)
- Early in-flight cardiovascular and fluid-shift adaptation, then plateau (pull exact ranges from NASA HRP evidence reports; fill in numbers from papers, do not guess)
Label it: "Synthetic data generated from published spaceflight trends."

**Tier 2: Real-data sanity check**
Use OSDR / Inspiration4 and published ISS HRV and sleep papers to check that the ranges and effect sizes in the simulator are plausible. Even a one-slide "validation against public data" is a strong credibility signal.

**Tier 3: Bring your own wearable**
Let a judge upload a CSV or enter their own sleep/HR for a day. Shows the data layer is real and swappable. Also covers the brief's "any kind of data input" (keyboard, clicks, camera). Stretch: webcam pulse estimate or photo-based input.

Note the brief says measurements should be doable in space: list for each indicator how it is actually taken on a spacecraft (wearable, pulse oximeter, cuff, thermometer, questionnaire).

## 4. Innovation: ideas iterated

### Round 1: brainstorm (raw)

1. Adaptation-aware baseline
2. Hazard context layer (radiation events, CO2, workload)
3. Comm-delay-aware escalation clock
4. Task readiness ("fit for EVA today?")
5. Closed-loop countermeasure tracking (did the intervention work?)
6. Crew-level view for isolation and team strain
7. Explain-everything mode for skill erosion
8. Digital twin that forecasts the next days
9. Voice or camera input
10. Earth spinoff story (remote and low-resource clinics)

### Round 2: attack each idea

| Idea | Strength | Weakness | Verdict |
|---|---|---|---|
| 1 Adaptation-aware baseline | Directly answers "why is this a space tool". Helps explain alerts (your risk register's false-alert risk); status stays conservative | Needs a plausible adaptation curve model | **Keep, make it the centerpiece** |
| 2 Hazard context layer | Explains drift with logged events and ties each alert to the 5 HRP hazards. Annotates only, must never lower a status (see file 11) | Needs event feed (can be scripted in demo) | **Keep** |
| 3 Comm-delay escalation | Unique to deep space. Turns "Red" into a smart handoff. Maps to ExMC rationale | Slight scope growth | **Keep, cheap to build** |
| 4 Task readiness | Matches the Axiom-4 precedent. Makes data actionable for the mission, not just health | Risk of overclaiming | **Keep as a small feature** |
| 5 Closed-loop countermeasures | Matches your charter's reassessment step. Shows whether advice works | Slow to show in a short demo | **Keep, fast-forward in demo** |
| 6 Crew-level view | Hits isolation and confinement | Privacy, scope | Stretch only, mood trend with consent |
| 7 Explain mode | Matches brief ("do not assume astronauts know everything") and NASA skill-erosion concern | Content writing time | **Keep, low tech** |
| 8 Forecast twin | Wow factor | Easy to overclaim, hard to validate | Drop, replace with simple trend projection |
| 9 Voice/camera | Meets "any input" | Gimmicky without need | Stretch: one camera or voice input only if time |
| 10 Earth spinoff | Judges like it | Not core | One slide |

### Round 3: combine into one thesis

**Thesis: "In space, your normal changes. AstroCare knows the difference between adapting and deteriorating."**

Three pillars:

1. **Adaptation-aware personal baseline.**
   Show two comparisons side by side: the personal baseline and an illustrative typical range for the mission day. Status follows the more conservative one. The adaptation range only changes the message inside Yellow ("consistent with expected early adaptation, recheck" vs "unexpected for this mission day, notify crew medical officer"). Curve shapes are illustrative until aerospace medicine validates them.

2. **Hazard context layer.**
   Every indicator change is annotated with logged context entered by the user: solar particle event shelter, high CO2 alert, heavy workload day, missed exercise, EVA. The explanation reads: "Sleep fell 1.4 h. A radiation shelter event was logged on 2 nights in this period." Each alert maps to one of NASA's five hazards. Context never lowers a status and hazards are never inferred from vitals.

3. **Delay-aware escalation and handoff.**
   Red triggers a triage clock: "One-way comm delay is 12 min. Ground reply earliest in 24 min. Do these 3 steps now while waiting." App produces a store-and-forward report (SBAR style) the flight surgeon can read in 30 seconds. Works fully offline on board. Ties directly to Earth-independent medical operations.

Supporting features: task readiness card, countermeasure loop (prescribe, adhere, re-measure, show effect), explain-everything help, body map, streaks for adherence (not points for points' sake).

### Round 4: stress test the thesis

| Challenge a judge might raise | Answer |
|---|---|
| "Where does the adaptation curve come from?" | Cited published trends plus explicit "experimental, needs aerospace-medicine validation." Curve is a configurable parameter, not hard-coded truth |
| "Is this just Oura plus a dashboard?" | No: Oura-style tools report data and score it against a generic or recent-average baseline, in the cloud. AstroCare is offline, mission-phase and hazard aware, and ends in an action and handoff plan |
| "Why not just call the flight surgeon?" | Comm delay, no evacuation, limited crew time. This is the exact gap NASA's CDSS work targets |
| "Is it safe?" | Decision support only, thresholds labelled experimental, no medication advice, escalates early |
| "What if sensors are wrong?" | Each reading shows a confidence flag. Single-sensor outliers do not trigger Red alone |

## 5. How it benefits NASA (pitch bullets)

- Prototypes the **prevention and early-detection layer** of the Clinical Decision Support System NASA's ExMC element is specifying
- Supports **Earth-independent medical operations**: works offline, edge computed, no ground link required
- **Saves crew time**: one glance dashboard, guided assessment, auto-generated report
- **Saves ground time**: flight surgeons receive a structured, prioritized handoff instead of raw data
- Addresses the **skill erosion** concern by embedding just-in-time explanations
- **Better-explained alerts** through adaptation and hazard context (status stays conservative), which matters when crew attention is scarce
- Spinoff: remote clinics, polar stations, submarines, and any place with delayed medical access

## 6. How it is different (one table for the slide)

| | Raw dashboards | Consumer wearables | NASA CDSS vision | **AstroCare** |
|---|---|---|---|---|
| Shows data | Yes | Yes | Yes | Yes |
| Personal baseline | Sometimes | Recent average | Planned | Yes, adaptation-aware |
| Knows mission phase and hazards | No | No | Planned | Yes |
| Explains why alert fired | No | Weak | Planned | Yes, with context |
| Works offline on board | Varies | Usually cloud | Yes | Yes |
| Accounts for comm delay | No | No | Implied | Yes, triage clock |
| Ends in action plan and report | No | No | Yes | Yes |
| Buildable in a hackathon | n/a | n/a | No (multi-year) | **Yes** |

## 7. Changes to make in the existing docs

- Charter and spec: add "adaptation-aware baseline," "hazard context," and "delay-aware escalation" as the headline differentiators
- Spec data model: add `missionDay`, `phase`, `events[]` (radiation shelter, CO2, EVA, missed exercise), and `commDelayMin`
- Status logic: show the expected range for the mission day next to the personal baseline and follow the more conservative one; events annotate only and never lower a status
- Risk register: add risk "adaptation curve not validated" and "context events scripted not sensed" with mitigation = label clearly
- Pitch: open with "your normal changes in space"

## 8. Open questions for the team

1. Which environment is the hero scenario: Mars transit (largest delay) or lunar base (shorter delay, dust)?
2. Do we go with three pillars, or cut to two (adaptation baseline plus delay-aware escalation) to protect scope?
3. Which real papers will we cite for each synthetic curve? Assign to Nabeeha (clinical) and Subomi (data)
4. Do we include a second input type (camera or voice) to satisfy "any input" more visibly?

## Sources

- NASA ExMC Clinical Decision Support System Concept of Operations: https://ntrs.nasa.gov/citations/20220017856
- NASA CDSS concepts of operation (autonomy, crew KSA): https://ntrs.nasa.gov/citations/20205008737
- CDSS path to functional requirements (skill erosion, crew time): https://ntrs.nasa.gov/api/citations/20210025824/downloads/IWS2022_CDS_PathtoRequirements_03Dec2021_FINAL.pdf
- ExMC Earth-Independent Medical Operations and unified capability framework: https://ntrs.nasa.gov/api/citations/20240001379/downloads/2024%20IWS%20SoSA%20FINAL.pdf
- NASA OSDR overview: https://science.nasa.gov/biological-physical/data/osdr
- Inspiration4 data in OSDR: https://science.nasa.gov/?p=400818
- OSDR astronaut data access and privacy: https://ntrs.nasa.gov/citations/20230014307
- Axiom-4 Oura plus edge computing demo: https://issnationallab.org/?p=48894
- NASA HRP wearable sleep/HR requirements: https://www.yet2.com/active-projects/seeking-high-performance-sleep-and-activity-tracking-wearables/
- ISS wearable studies (temperature, sleep): https://www.spacedaily.com/reports/Wearable_Tech_for_Space_Station_Research_999.html
- Artemis II health research (CNN via KQ2): https://www.kq2.com/?p=148487
