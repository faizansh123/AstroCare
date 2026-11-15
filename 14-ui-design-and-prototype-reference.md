# UI Design and Clickable Prototype Reference

Two visual references exist. They are **the look and the behavior the React build must match**.

- `reference/AstroCare_Clickable_Interactive_Prototype.html`: single-file clickable demo (plain HTML/JS, simulated data, offline). This is the reference for **behavior, data values, and rules**
- `reference/AstroCare_UI_Mockups.png`: four-screen mockup (Dashboard, Self-Assessment, Results, Guidance). This is the reference for **visual design**
- `reference/AstroCare_Logo.png`: brand logo. Tagline: "Monitor, Support, Explore Healthier"

## 1. Clickable prototype: screens

| Screen | What it does |
|---|---|
| Mission Overview | 4 KPI cards (HR, BP, body temp, sleep and mood), integrated status badge, Earth baseline comparison summary, SpaceLab snapshot, mission environment snapshot |
| Vital Signs and Earth Baseline | Earth vs in-flight bars for HR, SBP, DBP, temperature, sleep, mood with % change. Sliders edit in-flight values. Separate panel of published research (Norsk 2015, n=8) |
| SpaceLab Biomarkers | Select hemoglobin, WBC, glucose, or calcium. Earth baseline vs in-flight sample, delta and %, slider, context note. Labelled SIMULATED |
| Daily Self-Assessment | Fatigue 0-10 and mood 1-10 sliders, symptom checkboxes, notes. "Save Check-In and Run Assessment" |
| Space Environment | Cabin CO2, temperature, humidity sliders plus microgravity card. Callout that environment is context, not causation |
| Health Assessment | Badge GREEN / YELLOW / RED. "AI-style explanation (rule-grounded)" with observed evidence, Earth baseline, SpaceLab, environmental context, suggested follow-up |
| Body Map | SVG figure with clickable Brain, Heart, Lungs, Blood, Bones. Each shows related current values and a no-causation note |
| Trends | 5-point line chart per metric (HR, SBP, temp, sleep, mood), baseline and change summary. Historical points are fictional |
| Guidance Library | 4 cards (cardiovascular adaptation, spaceflight hazards, sleep and mood, laboratory/immune research) with source links |

## 2. Canonical demo values (from the prototype)

| Item | Earth baseline | Default in-flight |
|---|---|---|
| Heart rate | 72 bpm | 88 |
| Systolic BP | 120 mmHg | 116 |
| Diastolic BP | 80 mmHg | 74 |
| Body temperature | 36.7 C | 36.8 |
| Sleep | 8 h | 5.5 |
| Mood (1-10, 10 best) | 8 | 6 |
| Fatigue (0-10) | n/a | 6 |
| Hemoglobin | 145 g/L | 137 |
| WBC | 6.2 x10^9/L | 5.8 |
| Glucose | 4.8 mmol/L | 5.1 |
| Calcium | 2.35 mmol/L | 2.29 |
| Cabin CO2 | n/a | 0.45 % |
| Cabin temperature | n/a | 24 C |
| Humidity | n/a | 38 % |
| Default symptoms | n/a | Fatigue |

Symptom options in the prototype: Fatigue, Headache, Dizziness, Nausea, Difficulty concentrating, Severe breathing difficulty.

## 3. Rules implemented in the prototype (to be reproduced and made configurable)

| Rule | Result |
|---|---|
| Severe breathing difficulty selected | RED, "Red: escalate now", follow approved crew emergency/medical protocol (no "training" wording, D29) |
| HR is 20 or more bpm above Earth baseline | YELLOW reason |
| Sleep under 6 hours | YELLOW reason |
| Fatigue 7/10 or higher | YELLOW reason |
| Mood 4/10 or lower | YELLOW reason |
| 2 or more symptoms reported | YELLOW reason |
| Hemoglobin differs from baseline by 10 percent or more | YELLOW reason |
| Cabin CO2 0.5 % or higher | Adds a context sentence only, no causation, status unchanged |
| Otherwise | GREEN, "does not establish medical safety" |

Prototype gaps closed in the React build: INSUFFICIENT DATA state, input validation, data-age and last-sync display, saved trend history. (Mission log removed, D25.)

## 4. Published research panel (as written in the prototype)

Norsk et al. (2015), 8 astronauts, published group means, not the simulated astronaut: systolic BP Earth 129 to ISS 121 mmHg, diastolic 85 to 76 mmHg, heart rate 64 to 63 bpm. Link: https://pmc.ncbi.nlm.nih.gov/articles/PMC4324706/. The features doc says reference values must be **verified against the original tables** before being used in the judged presentation. Not yet verified.

## 5. UI mockup (visual design)

Dark space theme, glass-like cards, deep navy backgrounds with Earth/Moon/station imagery, teal and blue accents, status colors green / amber / red.

- **Shell:** left sidebar with logo and nav (Dashboard, Self-Assessment, Body Map, Health Trends, Guidance Library; Mission Log removed, D25). Top bar with mission name, mission day, and "System Online" indicator
- **Dashboard:** crew profile card (name, mission, duration), large "Overall Health Status" card (green "Stable" with check), row of key indicator cards (Heart Rate, Blood Pressure, Body Temp, Sleep, Mood) each with value, baseline, and sparkline
- **Daily Self-Assessment:** 4-step stepper (Symptoms, Measurements, Lifestyle, Review). Segmented button groups for sleep, fatigue, mood. Symptom checkboxes. "Next: Enter Measurements" button
- **Results:** large amber "Yellow, Monitor" banner. "Assessment Summary" table (metric, value, delta with arrow). "What Changed?" list. 7-day heart rate trend chart. "Back to Assessment" and "View Guidance" buttons
- **Guidance:** left menu (For You Now, Health and Prevention, Spaceflight Hazards, Measurement Guide), right "Recommended Actions" checklist and a "Why this matters" info box

The mockup numbers (for example HR 96, +24) are illustrative and are **not** canonical. Use the section 2 values and the acceptance tests in file 15.

## 5a. Design tokens

### Current: v3 visual refresh (macOS-style dark), 14 November 2026

Requested by the project owner on 14 November 2026: the navy prototype palette is replaced by a neutral macOS-style dark appearance to reduce clutter (follows UI-UX-AUDIT main finding and items 02-04, 08, 11-16, 25-27, 32). Layout and behaviour changes are visual only: no feature, rule, threshold or safety wording was removed. The code source of truth is `tailwind.config.js` and `src/index.css`.

| Token | Value |
|---|---|
| Page background | #000000 |
| Sidebar | #161618, translucent with backdrop blur. On desktop it collapses to a 68px icon rail via a toggle button; icons keep a tooltip and a screen-reader label, and the choice is remembered in the browser |
| Card / inset / raised | #1c1c1e / #2c2c2e / #3a3a3c, hairline border #2a2a2d |
| Text | #f5f5f7, secondary #d1d1d6, muted #98989f (4.9:1 on #2c2c2e) |
| Accent (text, icons, links) | #409cff |
| Primary button | #0071e3, hover #0062c4, white label 4.7:1; pill shape, 44px tall |
| Selected segment | #636366 with white label |
| Green status | #30d158 on #132a1b |
| Yellow status | #ffd60a on #2e2810 |
| Red status | #ff6961 on #331817 |
| Insufficient data | #d1d1d6 on #2a2a2e |
| Earth baseline / in-flight series | #aeaeb2 (dashed on charts) / #409cff; second series (diastolic) #63e6e2 |
| Font | -apple-system / SF Pro on Apple devices, Inter elsewhere |

Layout decisions in v3: the dashboard leads with status and one next action, then five indicator tiles that switch one large trend chart, then a short "Today" list; demo scenarios sit in a collapsed panel. Card headings carry no icons. Guidance sections use a segmented control. Screens have hash URLs (`#/vitals`) so Back and refresh work. On phones and tablets the navigation is a grouped menu. The in-flight series is no longer lavender (supersedes the space-bar colour below). Not yet done: the mockup's small trend chart on the Results screen (UI-UX-AUDIT #38).

**v3.1 (project owner request, 14 November 2026):** the sidebar no longer lists Vital Signs, SpaceLab, Environment or NASA Research. The screens still exist. SpaceLab and Environment open from the dashboard "Today" list; all four open by URL (`#/vitals`, `#/spacelab`, `#/environment`, `#/research`). The dashboard no longer has the large status banner or the trend chart. It shows the indicator tiles, the body map, and the "Today" list. Overall status (F01) stays visible on every screen as the header status chip. The Self-Assessment Review step no longer shows a status preview; the status appears after saving, on the Assessment screen. **Docs to reconcile:** file 07 §6 still describes 11 sidebar items in 4 groups, and file 07 §4 / F01 describe the status card on the dashboard.

**v3.2 (project owner request, 14 November 2026):** the Assessment screen is renamed **Assessment Review**. Every run is saved (last 50, this browser only, in `astrocare.v2.assessments`) with the inputs it used and the explanation that was shown. A "Previous assessments" list, newest first, lets the user open any earlier result; a banner says when a previous one is shown, with "Back to latest". Past records keep the status the rules gave at the time and are never re-run, so the status cannot change after the fact. After a reload the screen shows the latest saved assessment instead of the empty state. Supports file 15 §10 workflow 2 ("record crew notes and assessment history"). The screen URL stays `#/assessment`. **Docs to reconcile:** file 07 §6 still names the screen "Assessment".

**v3.3 (project owner request, 14 November 2026):** the dashboard indicator tiles are Heart rate, Blood pressure, Body temp, Respiratory rate and SpO₂. Sleep and Mood are no longer tiles but stay in Health Trends, which now has all eight vitals. Respiratory rate and SpO₂ are display only (D26). The sidebar no longer lists Body Map; the body map stays on the dashboard and opens by URL (`#/bodymap`). The symptom "Severe breathing difficulty" is relabelled **"Difficulty breathing / shortness of breath"** and is still the training trigger (RED at any severity, D27). Under the symptom list, a free-text box **"Any other symptoms?"** (optional, 300 characters) is shown on the Review step and with the results (D27).

### Original prototype tokens (history)

| Token | Value |
|---|---|
| Page background | #071322 |
| Sidebar | #0a1c30 |
| Card | #10263c, border #25445d |
| Text | #e8f3ff, muted #96aec7 |
| Accent (teal) | #4be0d6 / #54d4e4 |
| Button (accepted audit 01 override) | #246f91; primary hover #216584 (prototype originally #2d8fbb) |
| Green badge | bg #12483b, text #81f1bf |
| Yellow badge | bg #54401a, text #ffd581 |
| Red badge | bg #5a2334, text #ffacb4 |
| Earth bar | #4daee7, space bar #b69bff |
| Font | Inter, system-ui, Segoe UI |

Status must never rely on color alone: always pair color with text and an icon.

Accepted accessibility adjustment (UI-UX-AUDIT item 01): the shared action background is darkened for white normal-size labels, and primary buttons use an explicit hover background instead of a brightness filter. Selected controls inherit the action token. Guidance retains its 80% action background and 80% white supporting text; check their composited contrast against the dark page surfaces, rather than treating them as opaque colors. Secondary action and status tokens are unchanged. Preserve and verify the existing visible focus outline.

## 6. Differences between the two references (resolved in file 11)

| Topic | HTML prototype | Mockup |
|---|---|---|
| Navigation | 10 screens | 6 sidebar items |
| Mood input | 1-10 slider | 5 labelled options |
| Fatigue input | 0-10 slider | None / Mild / Moderate / High |
| Sleep input | 0.5 h slider | bins (8+, 6-7, 4-5, under 4) |
| Mission | ISS, Day 124, astronaut A-01 | Artemis III, lunar orbit, Day 142, Commander Alex Morgan |
| Baseline display | single value | typical range (for example 70-76) |
