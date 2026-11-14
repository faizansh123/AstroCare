# Lab 7: Risk Analysis

Scale: Low = 1, Medium = 2, High = 3. Score = Probability x Impact. 1-2 Low, 3-4 Medium, 6-9 High priority.

## 1. Risk register

| # | Risk | Prob. | Impact | Score | Mitigation | Owner |
|---|---|---|---|---|---|---|
| 1 | Scope creep beyond the agreed MVP threatens schedule and core deliverables | High | High | 9 High | Prioritized backlog; freeze iteration/MVP scope; team agreement for big changes; defer nonessentials | Nabeeha (PM) |
| 2 | False or incorrect health-status alerts from baseline/status logic | Medium | High | 6 High | Transparent rules; test G/Y/R scenarios against acceptance criteria; peer-review logic; label thresholds experimental | Nabeeha (Clinical Lead) |
| 3 | Integration failure between simulated data, baseline, dashboard, and status logic | Medium | High | 6 High | Agree data structure early; test incrementally; integration test before demo; track blockers in stand-ups | Bruno and Subomi |
| 4 | Limited access to real astronaut data reduces realism and validation | High | Medium | 6 High | Clearly labelled simulated or permitted public data; document assumptions; design G/Y/R scenarios without claiming clinical validity | Subomi |
| 5 | Thresholds or recommendations read as medically validated when they are not | Medium | High | 6 High | Present strictly as decision-support proof of concept; no diagnosis or treatment claims; label thresholds experimental; require future aerospace-medicine validation | Nabeeha |
| 6 | Technical or demo failure | Medium | High | 6 High | Test full demo in advance; stable demo build; screenshots or recorded backup; no last-minute nonessential changes | Bruno |

## 2. Sponsor update: top two risks

**Subject:** AstroCare, Priority Risk Update

The two risks needing the closest attention are scope creep and false or incorrect health-status alerts.

- **Scope creep** (High/High): extra features could cut into completing and testing the core workflow. Response: hold the agreed iteration scope, prioritize dashboard, baseline comparison, status logic, and core testing, defer nonessentials unless a scope change is formally agreed.
- **Incorrect status alerts**: could reduce confidence in the demo and misrepresent the reliability of the concept. Response: transparent rules, multiple simulated scenarios tested against acceptance criteria, peer review of status logic, all thresholds labelled experimental.

Both are reviewed at stand-ups, and owners escalate any significant change.

## 3. Reflections (summary)

- **Nabeeha:** Hardest part is communicating health uncertainty without sounding unreliable. Good risk communication is transparent about limits and shows the control plan.
- **Bruno:** Hardest part is explaining technical risks in plain language. Describe what may happen, the project impact, and the action being taken.
- **Subomi:** Hardest part is raising a risk before it is certain. Better to state what is known, what is uncertain, the impact, and what to monitor.

## 4. Monitoring approach

The register is a living document. Owners watch their risks during the iteration, raise changes in probability, impact, blockers, or mitigation effectiveness at stand-ups or reviews, add new risks as found, and reassess as the prototype develops.
