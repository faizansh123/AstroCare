# AstroCare: NASA Space Apps 2026

Astronaut Health Monitoring and Decision-Support prototype. Team: Nabeeha Tabassum (PM, Clinical and Health Lead), Bruno Gomes Silva (frontend, dashboard), Subomi Otusanya (data, rules).

**Status (14 November 2026): v2 built** (branch `v2-rebuild`). The app in `src/` implements the master spec (`07`): 11 screens, local rules engine (`src/data/rules.json`), spaceflight hazard links (D24), and a Gemini explanation behind the proxy (`server/explain.ts`) with an offline template fallback. Run `npm run dev`, test with `npm test`. How the code is laid out: `13-technical-build-plan.md`.

## Summary

AstroCare lets an astronaut compare simulated in-flight values with their Earth baseline, complete a four-step self-assessment, and get a status (GREEN, YELLOW, RED, INSUFFICIENT DATA) from deterministic illustrative rules. Gemini then explains the result in plain language with cited evidence, with an offline template fallback. For each reported symptom, it shows which of NASA's five spaceflight hazards (space radiation, isolation and confinement, distance from Earth, gravity, closed or hostile environment) it may be related to, never as a proven cause. Environment and hazards are context only and never change the status. Everything is saved to a mission log. Decision support, not diagnosis.

## Flow

Form -> validate -> rules engine -> hazard links -> serverless proxy -> Gemini -> response check -> display -> mission log.
Stack: React, Vite, Tailwind, TypeScript, Recharts, localStorage, Vercel.

## Source of truth order

1. `15` features doc, `14` clickable prototype and mockups
2. `10` SRS (engineering, safety, tests)
3. `12` architecture plan
4. Project history docs `02` to `06`
5. `09` stretch ideas

Conflicts and decisions: `11-reconciliation.md`. Build from `07-prototype-spec.md`.

## Files

| File | Holds |
|---|---|
| `CLAUDE.md` | Rules for coding sessions |
| `01-challenge-brief.md` | NASA challenge text |
| `02-project-charter.md` | Charter with v2 amendments |
| `03-stakeholders.md` | Stakeholders, grid fixed, v2 additions |
| `04-iteration-plan.md` | v2 backlog plus Lab 4 record |
| `05-standups.md` | Historical stand-ups |
| `06-risk-register.md` | Risks incl. v2 risks 7 to 16 |
| `07-prototype-spec.md` | Master spec v2 |
| `08-demo-and-pitch.md` | Four demo scenarios, checklist |
| `09-gaps-and-innovation.md` | Gaps, NASA anchors, innovation |
| `10-requirements-and-technical-design.md` | SRS |
| `11-reconciliation.md` | Decisions D1 to D24, open decisions |
| `12-architecture-plan.md` | Architecture and API contract |
| `13-technical-build-plan.md` | Build reference: how to run, code layout, what is not done |
| `15-features-requirements-user-flows.md` | Features F01 to F12, flows |
| `14-ui-design-and-prototype-reference.md` | Screens, demo values, design tokens |
| `UI-UX-AUDIT.md` | Visual/usability review, 38 prioritized findings, screenshot evidence, and proposed repair order (14 November 2026) |
| `reference/` | Clickable HTML prototype, UI mockups, logo |
