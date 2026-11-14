# AstroCare: NASA Space Apps 2026

Astronaut Health Monitoring and Decision-Support prototype. Team: Nabeeha Tabassum (PM, Clinical and Health Lead), Bruno Gomes Silva (frontend, dashboard), Subomi Otusanya (data, rules).

**Status (14 November 2026): plan v2, React build in progress.** The app in `src/` implements the master spec (`07`): 11 screens, local rules engine (`src/data/rules.json`), Gemini explanation behind the proxy (`server/explain.ts`) with the offline template fallback. Run `npm run dev`, test with `npm test`.

## Summary

AstroCare lets an astronaut compare simulated in-flight values with their Earth baseline, complete a four-step self-assessment, and get a status (GREEN, YELLOW, RED, INSUFFICIENT DATA) from deterministic illustrative rules. Gemini then explains the result in plain language with cited evidence, with an offline template fallback. Environment is context only. Everything is saved to a mission log. Decision support, not diagnosis.

## Flow

Form -> validate -> rules engine -> serverless proxy -> Gemini -> response check -> display -> mission log.
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
| `CLAUDE.md` | Rules for coding sessions (kept as in the repo) |
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
| `11-reconciliation.md` | Decisions D1 to D23, open decisions |
| `12-architecture-plan.md` | Architecture and API contract |
| `15-features-requirements-user-flows.md` | Features F01 to F12, flows |
| `14-ui-design-and-prototype-reference.md` | Screens, demo values, design tokens |
| `reference/` | Clickable HTML prototype, UI mockups, logo |
