# Lab 3: Stakeholder Analysis

## 1. Stakeholder register

| Stakeholder | Role | Interest | Power | Goals / concerns | Communication |
|---|---|---|---|---|---|
| Nabeeha Tabassum | PM / Clinical & Health Lead | High | High | Deliver within scope and time; workflow understandable and clinically responsible | Frequent updates, meetings, shared workspace, direct messages for urgent issues |
| Bruno Gomes Silva and Subomi Otusanya | Team leads | High | High | Planning, development, testing, successful prototype and presentation | Frequent meetings, shared task board/files, team messaging |
| Additional team members | Dev, UI/UX, research/data, testing, presentation | High | Medium | Finish assigned work, integrate features, resolve issues, contribute to demo | Regular check-ins, shared files/board, messaging |
| Instructor / academic sponsor | Lab 3 sponsor | Medium | High | Meet assignment requirements, show good PM practice | LMS, scheduled class updates, formal submission |
| Astronauts / crew | Primary end users | High | Medium | Clear health info, useful alerts, guided assessments, actionable steps, no information overload | User interviews, demos, usability testing, feedback surveys |
| Crew medical officer / flight surgeon | Clinical reviewer | High | High | Accurate, organized trends and event info; no misleading or unsupported clinical recommendations | Structured medical-event reports, prioritized alerts, concise summaries |
| Mission Control / ground medical support | Operational and medical support | High | High | Awareness of significant crew health events; useful info for review and escalation | Structured reports, priority notifications when comms are available |
| Space Apps organizers / judges | Evaluators | High | High | Functional, relevant, innovative, clearly explained response | Final presentation, live demo, concise documentation |
| Wearable / medical device data providers | Potential tech partners | Medium | Medium | Compatible, reliable, secure data transfer into a future system | Technical requirements, integration specs, API docs |
| Future space agency / mission management | Potential owner / decision authority | Medium | High | Safety, feasibility, mission value, resources, compatibility with operational systems | Executive summaries, milestone reviews, risk/status reports |
| Research / operations analyst | Reviews data provenance, trends, and research context (features doc user) | Medium | Low | Clear simulated-vs-published labels, exportable data, transparent rules and reason codes | Mission log export, research panel, rules documentation |
| Google (Gemini API provider) | Technology dependency for the AI explanation | Low | Medium | Availability, rate limits, terms of use, key security | API documentation, usage dashboard, status page |
| General public / space community | Indirect | Low | Low | Understand the concept and value | Public demo or project summary |

## 2. Power vs. interest grid

Updated 14 November 2026 so the grid matches the ratings in the register above (the original lab grid placed the flight surgeon and Mission Control under low power while the table rated them high).

| | Low interest | High interest |
|---|---|---|
| **High power** | **Keep satisfied:** Instructor / academic sponsor; Future space agency / mission management (medium interest); Aerospace medicine and human performance experts | **Manage closely:** Nabeeha; Bruno and Subomi; Space Apps organizers / judges; Crew medical officer / flight surgeon; Mission Control / ground medical support |
| **Low power** | **Monitor:** General public / space community; Wearable and medical device data providers (medium); Google (Gemini API provider), which is a dependency to watch for availability | **Keep informed:** Additional team members; Astronauts / crew members; Research / operations analyst |

## 3. Analysis

The most critical stakeholders are the PM and team leads, astronauts, medical professionals, Mission Control, and the judges.

- **PM and leads** are responsible for planning, building, testing, and finishing the prototype. Communication: regular meetings, direct messaging, shared workspace.
- **Astronauts** are the primary users, so their needs and feedback make the platform simpler and clearer. Communication: demos, clear dashboard info, feedback meetings.
- **Crew medical officer, flight surgeon, Mission Control** need organized, accurate information via reports, alerts, and project reviews, since they interpret health data and identify needs.
- **Judges** are reached through the final presentation, which must explain the problem, the solution, and the value AstroCare offers.

## 4. v2 additions

- **Research / operations analyst** is a user named in the v2 features doc. They need provenance labels (simulated vs published), exportable logs, and visible rule IDs.
- **Gemini API provider** is a dependency, not a decision maker. Manage it through the fallback design (rules and template explanation work without it) and by keeping the API key server-side.
- **Judges** will see the clickable prototype, the live app, and the pitch. The prototype and app must tell the same story (same fictional astronaut, same numbers).
- The flight surgeon and crew medical officer remain the most important **readers** of the output, which is why the explanation must cite its evidence and never claim a cause.
