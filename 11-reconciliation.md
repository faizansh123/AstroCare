# Reconciliation: SRS vs Earlier Docs vs Innovation Ideas

The new SRS (file 10) is more conservative and more build-ready than the lab docs and my first spec. This file lists where they disagree, what I recommend, and how the innovation ideas fit without breaking the SRS safety rules. **Where files conflict, treat file 10 (SRS) as the authority for the build**, then this file, then 07 and 09.

## 1. Conflicts and recommended decisions

| # | Topic | Charter / labs | SRS (file 10) | Recommendation |
|---|---|---|---|---|
| 1 | Status states | 3 states: Green, Yellow, Red | 4 states: adds **Insufficient Data** | Use 4 states. It is the safest answer to "false reassurance" and a good demo moment (T04) |
| 2 | Green meaning | "Stable" | "No flags under demo rules", never "medically cleared" | Use the SRS wording on screen. Keep "Stable" only as a short label |
| 3 | Indicators | Resting HR, HRV, SpO2, sleep/recovery, exercise, fatigue | HR, BP, temperature, sleep, fatigue, mood, symptoms, optional glucose | Build the SRS set for the MVP (matches the NASA brief wording and what an astronaut can actually enter). Keep SpO2 and HRV as **optional simulated fields** if time allows, so the charter's "5+ indicators" and wearable story still hold. SRS alone already gives 6+ |
| 4 | Data source | Simulated, wearable-style | Manual entry plus fictional scenarios, no real sensors | Manual plus scenarios for MVP. My "upload your own CSV" idea becomes a P2 stretch, tagged `source: "manual"` |
| 5 | Red trigger | Defined deterioration conditions | Predefined urgent case or protocol trigger only | Red = seeded urgent scenario or red-flag symptom. My earlier "SpO2 below 92" and z-score cutoffs stay only as **configurable illustrative rules in JSON**, labelled demo rules |
| 6 | Symptoms vs vitals | Symptoms feed assessment | Symptom override: escalation never suppressed when vitals look normal (T07) | Adopt T07 exactly |
| 7 | Offline | "Tested offline version" | PWA caching must be implemented and tested, or called future work | Decide now (open question in SRS). If no one owns it by end of Day 1, call it future work and demo from a local build |
| 8 | Timeline | 2-week iteration (Lab 4) | 2-day hackathon plan (Day 1 / Day 2) | Both are fine. Lab docs are the course framing, SRS Day 1 / Day 2 is the build plan |
| 9 | Roles | Nabeeha PM and clinical, Bruno and Subomi team leads | Bruno frontend, Subomi data and rules, Nabeeha clinical and presentation | Matches Lab 5 responsibilities. Confirm as a team |
| 10 | Tech | "Browser-based" | React, Vite, Tailwind, Recharts, localStorage/IndexedDB, Vercel | Use SRS stack. All three of you already work in React |

## 2. Corrections to my earlier files (09 and 07)

Two things I said in the innovation file are **unsafe under the SRS** and are corrected here:

1. **"Hazard context can soften alerts / fewer false alarms."** Wrong direction. The SRS flags high consequence of false reassurance. **Context may annotate or raise concern, never lower a status.** Its benefit is a better explanation, not fewer alerts.
2. **"Adaptation-aware baseline reduces false alerts."** Same issue. Corrected design: show **two comparisons side by side**, personal baseline and "typical early-adaptation range for this mission day". Status is driven by the **more conservative** of the two. The adaptation range only changes the *message* inside Yellow, for example "consistent with expected early adaptation, recheck in 24 h" versus "unexpected for this mission day, notify crew medical officer".

Also from the SRS: switching environment must **not silently change thresholds** (FR-01), and hazards must **not be inferred from vitals** (radiation, cabin air, bone loss). So context events (radiation shelter, CO2 alarm, EVA) are **entered by the user or scripted in a Mission Log**, never detected.

## 3. How the three innovation pillars fit into the SRS

| Pillar | SRS hook | What to build | Priority | Safe wording |
|---|---|---|---|---|
| Adaptation-aware comparison | FR-04 baseline comparison; SRS section 3 "label baselines as mission and context dependent" | Second column in Results: "Typical range for mission day N (illustrative, cited)". Conservative status rule above | P1 | "Illustrative adaptation range, not validated" |
| Hazard context (Mission Log) | Context field in HealthRecord; nav item "Mission Log"; UC-02 hazard context | `events[]` entered by user: radiation shelter, high CO2 alert, EVA, missed exercise. Shown next to the trend and in the report. Never changes status | P1 | "Logged context. Does not lower any flag" |
| Delay-aware escalation | UC-03; SRS "distinguish onboard vs ground escalation"; "queue/export summaries" | On Red: input or select one-way comm delay, show "earliest ground reply", list onboard steps from approved protocol text, generate handoff packet (FR-10) | P1 | "Follow approved mission procedures. Illustrative delay calculator" |

If time is short, build **only the third**. It is the cheapest (extends FR-10 and UC-03) and the most visibly space-specific.

## 4. How this answers your gap questions, SRS-safe

- **Data:** keep SRS fictional scenarios, but build each scenario curve from a cited published trend (sleep reduction in flight, temperature response). Put the citation in the About/Sources panel (FR-14). One "validation vs public data" slide is a bonus.
- **Space relevance:** SRS hazard table plus the three pillars above.
- **NASA benefit:** fills SRS open question 1 (which NASA material do we cite). Suggested citations to add to FR-14:
  - NASA Exploration Medical Capability, Clinical Decision Support System Concept of Operations (HRP-48033): https://ntrs.nasa.gov/citations/20220017856
  - NASA HRP hazards page (already in SRS): https://www.nasa.gov/hrp/hazards/
  - ISS National Lab Axiom-4 wearable plus edge computing demo: https://issnationallab.org/?p=48894
  - Claim to make: "AstroCare is a small prototype of the prevention and early-detection layer of NASA's planned crew clinical decision support."
- **Difference:** transparent rules plus Insufficient Data plus symptom override plus delay-aware handoff, all offline. See table in file 09 (ignore the "fewer false alarms" row, replaced by "better explained alerts").

## 5. Recommended build scope

1. **P0 (SRS):** profile, measurements, symptoms, baseline deltas, 4-state engine with rules shown, guidance, 3 scenarios, sources panel
2. **P1 in this order:** (a) report export and delay-aware escalation, (b) Mission Log context, (c) trends chart, (d) dual baseline column, (e) PWA offline
3. **P2:** body map, reminders, CSV import, environment switch

## 6. Decisions the team must make today

1. MVP indicator set: SRS set only, or SRS plus simulated SpO2 and HRV?
2. Offline: tested PWA or future work?
3. Which one innovation pillar is guaranteed (my pick: delay-aware escalation)?
4. Who owns guidance wording review and source for each guidance entry (Nabeeha)?
5. Submission requirements (video length, code link, project page): not in any doc yet, check the event page
