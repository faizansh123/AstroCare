# Lab 4: Iteration Planning and Prioritization

**Iteration length:** 2 weeks
**Team:** Nabeeha Tabassum, Bruno Gomes Silva, Subomi Otusanya

**Iteration goal:** Build the foundational AstroCare workflow: an astronaut views simulated health indicators, compares current readings to a personal baseline, and gets an initial Green, Yellow, or Red status.

## 1. Backlog for the iteration (37 SP total)

| ID | Story / task | Owner | Effort |
|---|---|---|---|
| US1 | As an astronaut, I want to view my key health indicators on one dashboard so I can quickly understand my current health status | Bruno / Development | 5 SP |
| US2 | As an astronaut, I want the system to compare my current indicators with my personal baseline so I can recognize meaningful changes | Subomi / Development and Data | 8 SP |
| US3 | As an astronaut, I want a Green, Yellow, or Red status based on changes in my indicators so I know when my health may need attention | Nabeeha / Clinical logic + dev team | 5 SP |
| US4 | As an astronaut receiving a Yellow or Red alert, I want a guided self-assessment so I can report symptoms and find the right next step | Nabeeha / Clinical & Health Lead | 8 SP |
| US5 | As a crew medical professional, I want a structured medical-event report so health information can be reviewed efficiently | Bruno | 5 SP |
| T1 | Test the full Green -> Yellow -> Red scenario and fix major issues | Subomi | 3 SP |
| T2 | Refine UI and prepare final demo workflow | Dev team | 3 SP |

## 2. Definition of Ready

1. Story names the user, need, and value
2. Clear, testable acceptance criteria
3. Requirements and dependencies/data understood
4. Estimated in story points and small enough for the iteration
5. Supporting info (indicator definitions, workflow notes, UI mockups) available

## 3. Definition of Done

1. All required functionality implemented and working
2. Tested against all acceptance criteria, no major unresolved defects
3. Reviewed by at least one other team member
4. Documentation updated
5. Integrated into the AstroCare prototype and ready to demo

## 4. Acceptance criteria for US3 (Green/Yellow/Red status)

- **AC1, Green / Stable:** Given indicators stay within the defined range of the personal baseline, when AstroCare evaluates, then status shows Green - Stable.
- **AC2, Yellow / Monitor:** Given a defined baseline and concerning changes across the indicators used, when AstroCare evaluates, then status shows Yellow - Monitor.
- **AC3, Guided assessment / assignment:** Given an established baseline, when AstroCare evaluates, then it assigns the appropriate Green, Yellow, or Red status per the defined prototype criteria.
- **AC4, Red / Action Required:** Given the simulated deterioration meets the Red conditions, when the system reassesses, then it shows Red - Action Required and presents the escalation pathway.
- **AC5, Explanation:** Given a Yellow or Red status, when the astronaut views the alert, then the system names the indicators or reported symptoms that contributed.

## 5. Prioritization

### MoSCoW

| Item | Priority | Reason |
|---|---|---|
| US1 Dashboard | Must | Core interface |
| US2 Baseline comparison | Must | Makes monitoring personalized |
| US3 G/Y/R status | Must | Says whether changes need attention |
| US4 Guided self-assessment | Must (see note) | Lets the astronaut respond to an alert |
| US5 Medical-event report | Should | Valuable but follows the core workflow |
| T1 Scenario testing | Must | Proves the core workflow works |
| T2 UI refinement | Could | Presentation quality |
| Advanced AI health assistant | Won't (this iteration) | Complexity, not needed for goal |
| Real wearable/device integration | Won't (this iteration) | Prototype uses simulated data |

Note: the original doc labels US4 as Must in the table but Should in the summary text, and stand-up 2 moved US4 out of the committed iteration scope. Decide one status. For the hackathon, the charter makes it required for the demo, so treat it as Must for the final build.

### WSJF (Cost of Delay / Job Size)

| Story | Business value | Time criticality | Risk reduction | CoD | Size | WSJF |
|---|---|---|---|---|---|---|
| US1 Dashboard | 9 | 8 | 4 | 21 | 5 | 4.20 |
| US2 Baseline | 10 | 9 | 8 | 27 | 8 | 3.38 |
| US3 Status | 10 | 10 | 7 | 27 | 5 | 5.40 |
| US4 Assessment | 9 | 8 | 8 | 25 | 8 | 3.13 |
| US5 Report | 7 | 5 | 5 | 17 | 5 | 3.40 |

Ranking: US3, US1, US5, US2, US4.

### RICE (Reach x Impact x Confidence / Effort)

| Story | Reach | Impact | Confidence | Effort | Score |
|---|---|---|---|---|---|
| US1 Dashboard | 5 | 4 | 0.9 | 5 | 3.60 |
| US2 Baseline | 5 | 5 | 0.8 | 8 | 2.50 |
| US3 Status | 5 | 5 | 0.9 | 5 | 4.50 |
| US4 Assessment | 4 | 5 | 0.8 | 8 | 2.00 |
| US5 Report | 3 | 3 | 0.8 | 5 | 1.44 |

Ranking: US3, US1, US2, US4, US5.

### Comparison

| Story | MoSCoW | WSJF rank | RICE rank |
|---|---|---|---|
| US1 Dashboard | Must | 2 | 2 |
| US2 Baseline | Must | 4 | 3 |
| US3 Status | Must | 1 | 1 |
| US4 Assessment | Must | 5 | 4 |
| US5 Report | Should | 3 | 5 |

US3 ranks first in both quantitative methods. Dependencies still matter: status logic needs the data and baseline comparison, so the dashboard and baseline must be built before or alongside US3.

## 6. Planning Poker note

Each member privately picks a Fibonacci estimate, all reveal at once, discuss large gaps, re-estimate until consensus. Record real votes, do not invent them.
