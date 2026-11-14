# AstroCare: working rules for Claude

## Always read and refer to the docs

Before planning, coding, reviewing, or answering any question about AstroCare:

1. Read `README.md`, then the doc files relevant to the task. When unsure, read all of them.
2. Base every decision on what the docs say. Cite the source in plans, PRs, and answers (for example "FR-05, file 10" or "section 6, file 12").
3. If the docs don't cover something, say so and ask. Don't invent requirements, thresholds, or clinical claims.
4. If code and docs disagree, flag it. Don't quietly pick one.
5. When a decision changes scope or design, update the docs in the same change.

## Which doc wins when they conflict

1. `10-requirements-and-technical-design.md`: the SRS. It is the authority for requirements, safety rules, data contracts, and tests.
2. `12-architecture-plan.md`: the chosen architecture (React + Tailwind + TypeScript, Gemini behind a server proxy). It adds to the SRS and doesn't override its safety rules.
3. `11-reconciliation.md`: the conflict resolutions and the innovation pillars, made SRS-safe.
4. `13-technical-build-plan.md`: the build plan. It is derived from 10, 11 and 12 and must stay consistent with them.
5. `07-prototype-spec.md` and `09-gaps-and-innovation.md`: superseded wherever they conflict with the files above.
6. `01`-`06` and `08`: the challenge brief, lab docs and demo. Use them for context, the course framing and the pitch.

## Non-negotiable safety rules (from files 10, 11, 12)

- Decision support only. No diagnosis, no medication, no doses.
- Status is one of GREEN / YELLOW / RED / INSUFFICIENT_DATA and comes from the **local, deterministic rules engine**. Gemini never sets or lowers the status.
- Missing, stale, implausible or contradictory data gives INSUFFICIENT_DATA. It never defaults to Green.
- Symptom override: a concerning symptom is always shown, and escalation is never suppressed because the vitals look normal.
- Context (environment, Mission Log events) only annotates or raises concern. It never lowers a status and never silently changes thresholds. Hazards are never inferred from vitals.
- Green reads "No flags under demo rules", never "medically cleared".
- Every threshold is labelled experimental or illustrative. The data is labelled simulated. "Not for clinical use" is visible on screen.
- Use fictional data only. The Gemini API key lives only in the server proxy, never in client code or the repo.
- Never use colour alone for status. Always pair it with a text label or icon.
