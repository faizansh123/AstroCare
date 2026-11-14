# Demo Script and Pitch Checklist

## 90 second story [Suggested]

1. **Problem (15s):** On long missions, ground medical help is delayed and astronauts must catch their own health changes. One reading rarely shows it, several small drifts do.
2. **Green (15s):** Dashboard with personal baselines, everything stable.
3. **Drift (20s):** Run the scenario forward. Sleep drops, HRV falls, fatigue rises, resting HR creeps up. Status turns Yellow and the app says exactly which indicators and why.
4. **Assessment (20s):** Guided self-assessment launches, astronaut reports symptoms, gets an action pathway.
5. **Red and report (20s):** Condition worsens, status turns Red, escalation pathway appears, medical-event report is generated for the flight surgeon.
6. **Close:** Data -> Baseline -> Trend -> Assessment -> Action -> Reassessment -> Communication. Decision support, not diagnosis.

## Pre-demo checklist [Team risk mitigations]

- [ ] Offline build tested end to end
- [ ] Recorded backup demo and screenshots ready
- [ ] No last-minute nonessential changes
- [ ] Green -> Yellow -> Red scenario passes every acceptance criterion
- [ ] Every threshold labelled experimental on screen
- [ ] Simulated data clearly labelled as simulated

## Charter success criteria check

- [ ] Functioning app demonstrated
- [ ] Simulated indicators processed (5+)
- [ ] Personal-baseline comparison shown
- [ ] Green -> Yellow -> Red progression
- [ ] Yellow launches guided assessment
- [ ] Red gives escalation pathway
- [ ] Medical report generated
- [ ] Judges can follow problem, solution, workflow
- [ ] No claim of clinical validation or flight readiness

## Anticipated judge questions

- *Where do thresholds come from?* Experimental placeholders based on personal-baseline deviation, to be validated by aerospace medicine.
- *Why personal baseline instead of normal ranges?* Spaceflight shifts physiology, so deviation from the individual is more meaningful.
- *Real data?* Not available, so simulated; the data shape is designed to accept real wearable feeds later.
- *Does it replace the flight surgeon?* No, it supports the astronaut and hands off structured information.
