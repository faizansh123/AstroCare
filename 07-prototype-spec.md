# AstroCare Prototype Spec

> **Superseded in part.** The Requirements and Technical Design (`10-requirements-and-technical-design.md`) and `11-reconciliation.md` take priority where they conflict with this file (four status states including Insufficient Data, symptom override, no hazard inference, no status softening from context).

Legend: **[Team]** comes from the lab documents. **[Suggested]** is my proposal to close gaps against the NASA challenge brief. Keep, change, or drop any suggestion.

All thresholds below are **experimental placeholders**, not clinically validated. The app must say so on screen.

## 1. Product in one line [Team]

Turns an astronaut's health indicators into personal trends, a Green/Yellow/Red status, a guided assessment, and a medical-event report, so the astronaut knows when health is changing, why, and what to do next.

## 2. Users [Team]

- Primary: astronaut / crew member
- Secondary: crew medical officer, flight surgeon, Mission Control (receive the report)

## 3. Indicators

| Indicator | Source | Why it matters in spaceflight | Status |
|---|---|---|---|
| Resting heart rate | Simulated | Cardiovascular adaptation, stress, deconditioning | [Team] |
| HRV | Simulated | Autonomic stress and recovery | [Team] |
| SpO2 | Simulated | Closed-environment air quality, respiratory issues | [Team] |
| Sleep and recovery (hours, quality) | Simulated | Circadian disruption, isolation | [Team] |
| Exercise performance | Simulated | Bone and muscle loss countermeasure, deconditioning | [Team] |
| Self-reported fatigue / mood | Astronaut input | Behavioral health, isolation and confinement | [Team] |
| Blood pressure | Simulated | Named in the challenge brief | [Suggested] |
| Body temperature | Simulated | Named in the challenge brief | [Suggested] |
| Blood glucose (mg/dL) | Simulated | Named in the challenge brief, nutrition | [Suggested] |

Charter requires at least 5 indicators. Core six are enough for the MVP. Adding BP, temperature, and glucose costs little in simulated data and maps directly to the brief's wording.

## 4. Data model [Suggested]

```json
{
  "astronaut": { "id": "A1", "name": "Cdr. Demo", "environment": "Lunar base" },
  "baseline": {
    "restingHR": { "mean": 60, "sd": 4 },
    "hrv":       { "mean": 70, "sd": 8 },
    "spo2":      { "mean": 98, "sd": 0.7 },
    "sleepHrs":  { "mean": 7.2, "sd": 0.6 },
    "exercise":  { "mean": 100, "sd": 6 },
    "fatigue":   { "mean": 2, "sd": 0.8 }
  },
  "readings": [
    { "day": 1, "restingHR": 61, "hrv": 69, "spo2": 98, "sleepHrs": 7.1, "exercise": 101, "fatigue": 2 }
  ],
  "symptoms": []
}
```

The team flagged data consistency as the main integration blocker, so freeze this shape first and have dashboard, baseline, and status code all read it.

## 5. Baseline and status logic [Suggested, to be agreed by Nabeeha as clinical lead]

1. For each indicator, compute deviation from personal baseline in standard deviations (z-score), signed so that "worse" is positive (for example HR up, HRV down, SpO2 down, sleep down, exercise down, fatigue up).
2. Flag an indicator as **drifting** at |z| >= 1.5 and **concerning** at |z| >= 2.5.
3. Look at the trend too: a 3-day rolling mean moving the wrong way counts toward drift.
4. Overall status:
   - **Green (Stable):** no demo rules fired and required fields present. Say "No flags under demo rules", not "medically cleared"
   - **Yellow (Monitor):** two or more drifting, or one concerning
   - **Red (Action Required):** seeded urgent scenario, or a red-flag symptom, or other configurable escalation rule (illustrative, thresholds unvalidated)
   - **Insufficient Data:** missing, stale, implausible, or contradictory inputs. Ask for remeasurement, never default to Green
   - Symptoms always show and never get suppressed by normal vitals
5. Always output the **explanation**: which indicators and symptoms drove the status (this is AC5).

Why multi-indicator: the charter's problem statement is that several small changes together mean more than any single reading.

## 6. Screens and flow

1. **Dashboard [Team]:** big status badge (G/Y/R), tiles for each indicator with sparkline, baseline band, and color
2. **Trend charts [Suggested, from brief]:** time series per indicator with the baseline range shaded
3. **Body map [Suggested, from brief]:** clickable human figure (heart, lungs, brain, bones/muscle, etc.) showing the linked indicator, plain-language explanation, and risk caused by the spaceflight hazard
4. **Why this alert [Team, AC5]:** list of contributing indicators and symptoms
5. **Guided self-assessment [Team]:** launches on Yellow or Red. Symptom checklist, simple instructions for how to take each measurement, outputs an action pathway
6. **Action pathway [Team]:** Yellow gives self-care steps plus scheduled reassessment. Red gives escalation steps: contact crew medical officer / flight surgeon, notify Mission Control
7. **Reassessment [Team]:** re-measure after the actions and update status
8. **Medical-event report [Team]:** auto-generated summary (see below)
9. **Scenario simulator [Team]:** controls to play the Green -> Yellow -> Red deterioration for the demo

## 7. Medical-event report contents [Suggested]

- Astronaut, mission day, environment
- Status and time it changed
- Indicators with baseline, current value, deviation
- Reported symptoms
- Actions taken and reassessment result
- Recommended escalation
- Footer: "Prototype decision support. Thresholds experimental, not clinically validated."

## 8. Closing gaps against the challenge brief [Suggested]

| Brief asks | How AstroCare answers |
|---|---|
| Which measurements can be performed in space? | "How to measure" help text on each tile (wearable, pulse oximeter, cuff, thermometer, glucometer, questionnaire) |
| Why is an exam needed? | Short "why this matters" per indicator tied to a hazard |
| How do hazards affect indicators? | Body map and tile info map each of the five NASA HRP hazards to indicators |
| When to involve crew or ground? | Yellow = crew self-management and monitoring, Red = escalate to flight surgeon |
| How to prevent critical conditions? | Action pathway with preventive steps (sleep, exercise countermeasures, hydration/nutrition, rest) |
| Different environments | Environment selector (spacecraft, station, rover, lunar/Mars base) that changes context text |
| Routine prompts | Daily check-in reminder to log measurements and fatigue |
| Gamification | Streaks for daily check-ins and exercise adherence, mission health score |
| Color coding | G/Y/R on everything |
| Beginner friendly | Plain-language explanations, no jargon |

Hazard to indicator mapping (for the explanations):

| NASA HRP hazard | Indicators it touches |
|---|---|
| Space radiation | Fatigue, immune-related symptoms, temperature |
| Isolation and confinement | Mood/fatigue, sleep, HRV |
| Distance from Earth | Why autonomy matters, delayed contact with ground |
| Gravity fields | Resting HR, BP, exercise performance, bone/muscle |
| Hostile closed environment | SpO2, sleep, temperature, nutrition and glucose |

Check these against NASA HRP pages before the final pitch and cite them.

## 9. Tech suggestion [Suggested]

Single-page browser app (the charter requires browser-based and an offline demo build). Plain HTML/JS or React plus a chart library, with a local JSON dataset, no backend. Easy to keep offline for the demo and to screen-record as backup.

## 10. MVP build order [Team priorities, order suggested]

1. Data shape plus simulated dataset for three scenarios (Green, Yellow, Red)
2. Dashboard (US1)
3. Baseline comparison (US2)
4. Status logic with explanation (US3)
5. Guided assessment and action pathway (US4)
6. Medical-event report (US5)
7. Scenario testing (T1), UI polish (T2)
8. Stretch: body map, gamification, environment selector

## 11. Guardrails [Team]

- Decision support, not diagnosis
- Simulated data only, labelled as such
- Thresholds experimental, future aerospace-medicine validation required
- No autonomous medication advice
- No advanced AI assistant or real wearable integration this round
