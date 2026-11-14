# AstroCare: working rules for Claude

## Always read and refer to the docs

Before planning, coding, reviewing, or answering any question about AstroCare:

1. Read `README.md`, then the doc files relevant to the task. When unsure, read all of them.
2. Base every decision on what the docs say. Cite the source in plans, PRs, and answers (for example "FR-05, file 10" or "section 6, file 12").
3. If the docs don't cover something, say so and ask. Don't invent requirements, thresholds, or clinical claims.
4. If code and docs disagree, flag it. Don't quietly pick one.
5. When a decision changes scope or design, update the docs in the same change.

## Which doc wins when they conflict

1. `15-features-requirements-user-flows.md` and `14-ui-design-and-prototype-reference.md` (clickable prototype and mockups): feature scope and behaviour.
2. `10-requirements-and-technical-design.md`: the SRS. Engineering, safety and test requirements, wherever it does not contradict source 1.
3. `12-architecture-plan.md`: the chosen architecture (React + Tailwind + TypeScript, Gemini behind a server proxy).
4. `11-reconciliation.md`: the decisions (D1 to D24) that settle conflicts between the sources. `07-prototype-spec.md` is the master spec built from them, and is what the code follows.
5. `13-technical-build-plan.md`: the build reference. It describes the code and must stay consistent with 07, 11 and 12.
6. `02`-`06`: project history. `09`: stretch ideas. `01` and `08`: challenge brief, demo and pitch.

## Non-negotiable safety rules (from files 10, 11, 12)

- Decision support only. No diagnosis, no medication, no doses.
- Status is one of GREEN / YELLOW / RED / INSUFFICIENT_DATA and comes from the **local, deterministic rules engine**. Gemini never sets or lowers the status.
- Missing, stale, implausible or contradictory data gives INSUFFICIENT_DATA. It never defaults to Green.
- Symptom override: a concerning symptom is always shown, and escalation is never suppressed because the vitals look normal.
- Context (environment, Mission Log events) only annotates or raises concern. It never lowers a status and never silently changes thresholds.
- Spaceflight hazards (D24): a reported symptom may be shown as possibly related to one of NASA's five hazards. Never say a hazard caused a symptom, never create a hazard link from vitals alone, and hazard links never change the status.
- Green reads "No flags under demo rules", never "medically cleared".
- Every threshold is labelled experimental or illustrative. The data is labelled simulated. "Not for clinical use" is visible on screen.
- Use fictional data only. The Gemini API key lives only in the server proxy, never in client code or the repo.
- Never use colour alone for status. Always pair it with a text label or icon.
