# AstroCare: NASA Space Apps 2026

Astronaut Health Monitoring & Decision-Support System.
Team: Nabeeha Tabassum (PM / Clinical & Health Lead), Bruno Gomes Silva (Team Lead, dashboard), Subomi Otusanya (Team Lead, baseline and data).

## One-paragraph summary

AstroCare is a browser-based prototype that helps astronauts on long-duration missions notice when their health is drifting, understand why, and know what to do next. It uses simulated data, compares it against each astronaut's personal baseline across several indicators, classifies status as Green (Stable), Yellow (Monitor) or Red (Action Required), runs a guided self-assessment, and generates a mission medical-event report. It is decision support, not diagnosis.

## Core idea

Health Data -> Personal Baseline -> Trend Recognition -> Assessment -> Action -> Reassessment -> Communication

## Files

| File | What it holds |
|---|---|
| `01-challenge-brief.md` | The official NASA Space Apps challenge text, background, objectives, considerations |
| `02-project-charter.md` | Lab 2: purpose, scope, deliverables, requirements, constraints, success criteria |
| `03-stakeholders.md` | Lab 3: stakeholder table, power/interest grid, analysis |
| `04-iteration-plan.md` | Lab 4: user stories, DoR/DoD, US3 acceptance criteria, MoSCoW/WSJF/RICE |
| `05-standups.md` | Lab 5: three stand-up records and team reflections |
| `06-risk-register.md` | Lab 7: risk register, sponsor update, monitoring approach |
| `07-prototype-spec.md` | Build-ready spec that ties the team's plan to the challenge (includes my suggested additions, clearly marked) |
| `08-demo-and-pitch.md` | Demo script and judging-criteria checklist |
| `10-requirements-and-technical-design.md` | The SRS: functional and non-functional requirements, data contracts, tests, stack, Day 1/Day 2 plan. **Build from this** |
| `11-reconciliation.md` | Where the SRS, lab docs, and innovation ideas disagree, decisions to make, and how the innovation pillars fit safely |
| `12-architecture-plan.md` | Chosen flow (form, Gemini API, display), stack (React, Tailwind, TypeScript), plan only |
| `13-technical-build-plan.md` | Technical build plan derived from 10, 11 and 12: contracts, rules engine, Gemini proxy and guard, screens, tests, Day 1/Day 2 schedule |
| `09-gaps-and-innovation.md` | Gap analysis, data strategy, NASA benefit, differentiation, and the iterated innovation thesis |

## Running the baseline app

```
npm install
npm run dev     # http://localhost:5173
npm test        # T01-T04, T06, T07 on the rules engine
```

Current state: single-page start form, then the local rules engine, then the results view. The Gemini proxy (`api/explain.ts`) is a stub that returns `{ ai: null }` until `GEMINI_API_KEY` is set server-side (see `.env.example`), so the app runs rules-only (file 12 §6).

## Quick facts

- Type: hackathon prototype, interactive browser app, simulated data only
- Indicators in the charter: resting heart rate, HRV, SpO2, sleep and recovery, exercise performance, self-reported fatigue
- MVP: dashboard, baseline comparison, G/Y/R status, guided assessment, medical-event report
- Won't have this round: advanced AI assistant, real wearable integration
- Charter date: September 22, 2026
