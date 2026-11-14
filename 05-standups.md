# Lab 5: Daily Stand-Ups and Team Reflection

> **Historical record.** These stand-ups covered the original Lab 4 iteration (dashboard, baseline comparison, status). The plan has since expanded to the v2 feature set (see `07-prototype-spec.md`). The working agreements at the bottom still apply to the new sprints. Suggested next stand-up topics: confirm the open decisions in `11-reconciliation.md`, assign the v2 backlog owners, and agree the shared TypeScript types first, since integration was the repeated blocker.

Project: AstroCare. Iteration: 2 weeks. Meetings: 15 minutes or less, on WhatsApp Call. Attendance was marked "(confirm attendance)" in the source doc.

## Stand-up 1: Initial planning and task coordination (15 min)

- Reviewed the iteration goal: foundational health-monitoring workflow
- Three priority features: Dashboard (US1), Baseline comparison (US2), G/Y/R status (US3)
- Roles: Nabeeha on clinical requirements and status criteria, Bruno on dashboard, Subomi on baseline comparison
- Simulated data will cover heart rate, oxygen saturation, sleep, fatigue
- Need consistent simulated data and baseline values before building and testing status logic

**Blocker:** status criteria and simulated baseline values need clarifying.

**Actions:** Nabeeha reviews status and acceptance criteria. Bruno starts the dashboard. Subomi defines the baseline comparison approach.

## Stand-up 2: Development progress and coordination (12 min)

- Reviewed progress on dashboard, baseline comparison, status classification
- Discussed how the dashboard shows simulated indicators and how baseline comparison spots changes
- Clarified US3 acceptance criteria: assign and display G/Y/R
- Confirmed guided self-assessment is a separate story (US4), not in this iteration's committed scope
- Discussed dependencies between dashboard, baseline, and status

**Blockers:** integration between simulated data, baseline comparison, and status logic; status criteria must be clear and testable first.

**Actions:** Nabeeha finalizes US3 acceptance criteria. Bruno continues dashboard and data integration. Subomi tests baseline logic and coordinates data needs.

## Stand-up 3: Testing, integration, iteration progress (10 min)

- Reviewed remaining work to meet the iteration goal
- Plan to test the full flow: display indicators, compare to baseline, determine G/Y/R
- Reviewed acceptance criteria for consistent, understandable results
- Test different simulated scenarios to check the system responds to changing readings
- Prepare the demo, prioritize essentials over extras

**Blockers:** full-workflow testing depends on integrating dashboard, baseline, and status; leftover integration issues must be fixed before the final demo.

**Actions:** Nabeeha checks status results against acceptance criteria. Bruno fixes dashboard and integration issues. Subomi tests baseline comparisons and status scenarios. Everyone reviews the core workflow against the Definition of Done.

## Reflections (summary)

**Nabeeha:** Stand-ups improved communication and surfaced dependencies. Hard parts: coordinating dependent tasks, keeping discussion short. Helped hold a realistic scope. Next time: use the three standard questions, cap at 15 minutes, move deep technical talk to after, record blockers with owners.

**Bruno:** Stand-ups showed dependencies and blockers and helped prioritize. The dashboard depends on baseline and status output. Hard parts: coordination, brevity. Next time: more structure (progress, next steps, blockers), side discussions with only the relevant people.

**Subomi:** Baseline work cannot be done in isolation; it needs consistent simulated data and feeds the status feature. Stand-ups caught scope and integration issues early (for example US4 being out of this iteration). Next time: brief updates on completed work, planned work, blockers.

## Working agreements that came out of this

- Standard three questions: done, next, blocked
- 15 minutes max, detail afterward with relevant people only
- Blockers always have an owner
- Agree on the shared data structure early (this was the repeated integration pain point)
