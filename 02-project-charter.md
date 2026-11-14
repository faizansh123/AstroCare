# Lab 2: Project Charter

**Project:** Astronaut Health Monitoring & Decision-Support System (AstroCare)
**Type:** Health Technology / Software / Human Space Exploration
**Event:** 2026 NASA Space Apps Challenge
**Status:** Hackathon prototype
**Project Manager / Clinical & Health Lead:** Nabeeha Tabassum
**Sponsor / Team Leads:** Bruno Gomes Silva, Subomi Otusanya
**Date:** September 22, 2026

## 1. Purpose and justification

Long missions expose astronauts to altered gravity, radiation, isolation, confinement, disrupted sleep, cardiovascular changes, musculoskeletal deterioration, immune changes, and other stressors. Farther from Earth, communication delays and limited access to clinicians mean astronauts must take more responsibility for recognizing and responding to changes in their own health. The project shows how software could support greater astronaut autonomy in monitoring and responding to health changes.

## 2. Problem statement

Astronauts may experience gradual physiological and behavioral changes that are hard to recognize from individual measurements alone. Raw measurements say what the numbers are, but not whether several small changes together mean a meaningful deviation from that astronaut's normal.

## 3. Project summary

A health-monitoring and decision-support prototype for the 2026 NASA Space Apps Challenge. It simulates these indicators in an astronaut-centred dashboard:

- Resting heart rate
- Heart-rate variability (HRV)
- Oxygen saturation (SpO2)
- Sleep and recovery
- Exercise performance
- Self-reported fatigue

It compares current readings to the astronaut's personal baseline, flags meaningful changes across multiple indicators, and classifies status as **Green (Stable)**, **Yellow (Monitor)** or **Red (Action Required)**. It also provides a guided self-assessment, a recommended next-action pathway, reassessment, and an automatically generated mission medical-event report. The primary deliverable is a functional prototype plus a scenario-based demo and presentation.

## 4. SMART objectives

| # | Objective | Success criteria |
|---|---|---|
| 1 | Functional prototype by the submission deadline that displays at least five simulated indicators and compares them with a personal baseline | At least five indicators processed and displayed in the final demo |
| 2 | Trend-detection and decision-support workflow that identifies simulated deterioration and moves through Green, Yellow, Red | Full Green -> Yellow -> Red scenario runs successfully in testing |
| 3 | Interactive guided assessment and reporting workflow that gives next-action guidance and generates a medical-event report | Guided assessment produces an action pathway and report in the final demo |

## 5. Scope

| In scope | Out of scope |
|---|---|
| Astronaut health dashboard | Clinical diagnosis |
| Individual astronaut health profile | Real astronaut health records |
| Simulated health data | Replacing physicians, flight surgeons, or crew medical officers |
| Personal baseline comparison | Production deployment aboard a spacecraft |
| Resting heart-rate monitoring | Developing physical sensors or wearables |
| HRV monitoring | Autonomous medication administration |
| Sleep/recovery monitoring | Validated aerospace treatment protocols |
| SpO2 monitoring | |
| Exercise-performance monitoring | |
| Self-reported fatigue | |
| Multi-variable trend detection | |
| Green-Yellow-Red classification | |
| Guided symptom/self-assessment workflow | |
| Recommended next-action pathway | |
| Health deterioration simulation | |

## 6. High-level deliverables

| Deliverable | Description |
|---|---|
| Functional prototype | Interactive browser-based health-monitoring application |
| Astronaut health dashboard | Consolidated view of indicators and overall status |
| Trend-detection and alert system | Logic that identifies deviations from personal baseline |
| Guided assessment and decision-support workflow | Structured response pathway after a concerning trend |
| Hackathon demonstration and presentation | Scenario-based demo of the whole workflow |

## 7. High-level requirements

- Simple astronaut-centred interface
- Compare measurements with the astronaut's established baseline
- Evaluate multiple indicators, not just one
- Clearly distinguish Stable, Monitor, and Action Required
- Explain why an alert was generated
- Let astronaut-reported symptoms contribute to the assessment
- Provide structured next steps after an alert

## 8. Key stakeholders

| Stakeholder | Role / interest |
|---|---|
| Project team | Designs, builds, tests, presents |
| Astronauts / crew | Primary proposed users |
| Crew medical / flight medical personnel | Potential users of health-event info needing review or escalation |
| NASA / mission stakeholders | Interested in tech supporting crew health and autonomy |
| NASA Space Apps judges | Evaluate the submission |
| Instructor / sponsor | Reviews charter, academic oversight |

## 9. Roles and responsibilities

| Role | Responsibilities |
|---|---|
| Nabeeha Tabassum, PM / Clinical & Health Lead | Scope, milestones, communication, deliverables; clinical perspective; health indicators and guided assessment workflow; ensure the prototype is presented as decision support, not diagnosis |
| Bruno Gomes Silva, Team Lead | Planning, development, testing, completion of assigned deliverables (specific function to be finalized) |
| Subomi Otusanya, Team Lead | Same as above (specific function to be finalized) |
| Additional team members | Software development, UI/UX, research/data, testing, documentation, presentation |
| All members | Testing, progress review, raising issues, final presentation, meeting deadlines |

## 10. Timeline and milestones

1. **Project definition and charter approval:** problem, scope, objectives, responsibilities, requirements confirmed
2. **Prototype design:** dashboard, user workflow, data structure, interface design
3. **Prototype development:** core monitoring app and decision-support functions
4. **Testing and refinement:** Green -> Yellow -> Red scenario tested; technical and usability issues fixed
5. **Final demonstration and presentation:** finished prototype, scenario demo, hackathon presentation

## 11. Constraints

| Category | Constraint |
|---|---|
| Time | Must finish within the Space Apps hackathon timeframe |
| Budget | Team's agreed hackathon budget, mostly free/open-source tools |
| Data | No real astronaut records; simulated or permitted public data |
| Clinical | Cannot clinically validate aerospace thresholds or treatment protocols |
| Technology | Limited to the team's hardware, software, and expertise |
| Scope | Proof of concept, not an operational medical device |

## 12. High-level risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Scope creep | High | High | Freeze MVP around dashboard, trend detection, assessment, reporting |
| Limited access to astronaut health data | High | Medium | Use clearly labelled simulated datasets |
| Clinical recommendations lack validation | Medium | High | Present as prototype decision support; require future aerospace-medical validation |
| Technical failure during demo | Medium | High | Tested offline version and recorded backup demo |
| False or incorrect alerts | Medium | High | Transparent baseline logic; thresholds labelled experimental |

## 13. Assumptions

- Simulated data is enough to demonstrate the workflow.
- The team has the computers, software, and tools needed.
- Any future operational version would involve qualified aerospace medicine and engineering professionals to validate thresholds, protocols, and integrations.

## 14. Success criteria

- A functioning application is demonstrated
- It processes simulated astronaut health indicators
- It demonstrates personal-baseline comparison
- A simulated deterioration moves logically Green -> Yellow -> Red
- A Yellow alert launches a structured astronaut assessment
- A Red condition generates an escalation pathway
- A mission medical report can be generated automatically
- Judges can understand the problem, solution, and user workflow
- Presented without claiming clinical validation or readiness for operational spaceflight

## 15. Strategic alignment and expected value

Aligns with the human exploration and software challenge area by exploring how health technology can support crew autonomy on long missions. The value is not just collecting data, it is making health information understandable and actionable by connecting: Health Data, Personal Baseline, Trend Recognition, Assessment, Action, Reassessment, Communication.

## 16. Vision

For astronauts on long-duration missions who need greater autonomy in monitoring their health, AstroCare is an astronaut-centered monitoring and decision-support platform that turns physiological and behavioral indicators into personalized trends, guided assessments, and actionable next steps. Unlike conventional dashboards that mostly show raw measurements, it helps astronauts understand **when** their health is changing, **why** the system is concerned, and **what to do next**.

## 17. Authorization

Approved by Nabeeha Tabassum (PM), Bruno Gomes Silva (Project Lead), and Subomi Otusanya (Project Lead) on September 22, 2026. Additional team member and instructor signatures were still blank.
