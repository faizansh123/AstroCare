# Architecture Plan: Form to Gemini to Display

Status: plan only, no code yet. This records the flow the team chose and what it means for the SRS.

## 1. The chosen flow

1. Astronaut fills in a **form** (measurements, symptoms, context)
2. App validates the input and packages it as structured data
3. App sends it to the **Gemini API**
4. Gemini returns a structured response
5. App **displays** the result (status, explanation, guidance, report)

## 2. Stack (decided)

- React
- Tailwind CSS
- TypeScript everywhere (UI, data types, API layer)
- Gemini API for the AI step

## 3. What changes versus the SRS (file 10)

The SRS assumed a local rules engine and no AI diagnosis. Using Gemini is allowed, but these SRS rules still apply and shape the design:

| SRS rule | Impact on the Gemini flow |
|---|---|
| NFR-09: no secrets in the frontend | The Gemini API key must **not** live in the React app. Calls go through a small server-side proxy (for example a serverless function on Vercel, which the SRS already lists for deployment) |
| NFR-04 / FR-11: offline-first | Gemini needs a network. Core flow must still work without it (see fallback below) |
| Explainable, deterministic status (FR-05, NFR-03) | A language model is not deterministic. The Green/Yellow/Red/Insufficient Data **status should still come from a transparent rules step**, and Gemini explains and guides around it |
| No diagnosis, no invented medication or doses (FR-06) | Gemini's prompt and output validation must forbid diagnosis, drugs, and doses |
| Insufficient Data and symptom override | Enforced by the rules step before and after the model call, not left to the model |
| NFR-05 privacy | Fictional data only. Do not send real personal health data to an external API |

## 4. Recommended shape of the pipeline

Form (React + TS) -> validation and unit normalization -> **rules step (local, deterministic)** -> proxy -> **Gemini** -> response validation -> display

- **Rules step:** computes baseline deviations and the status. Fast, works offline, always available, and gives the AI a trustworthy starting point.
- **Gemini step:** receives the structured record plus the rules result, and returns: plain-language explanation, what drove the flags, suggested next steps, measurement tips, and a draft medical-event summary.
- **Response validation:** the reply must be structured JSON matching a TypeScript type (schema-checked). If it does not match, discard it and show the rules-only result.
- **Display:** status badge and numbers come from the rules step. AI text is shown in a clearly labelled "AI-generated explanation" area with the disclaimer.

If the team prefers Gemini to decide the status itself, that is possible but weaker: non-deterministic, harder to test, harder to defend to judges. Recommendation is rules decide, Gemini explains. Team decision needed (see section 8).

## 5. Gemini integration notes

- Use structured output (JSON with a response schema) so the reply is machine-readable. Confirm exact parameter names and the current model in Google's Gemini API docs when building; I have not verified them.
- Choose a fast, low-cost model, since this is a short request per check-in. Confirm model name and free-tier limits in the docs at build time.
- Keep the system prompt fixed and versioned. It should state: not a diagnosis, never give medication or doses, always include "follow approved mission procedures", never lower the rules status, say "insufficient data" instead of guessing, and treat mood sensitively.
- Pass only what is needed: measurements, baselines, deviations, symptoms, context, rules result. No names or real identifiers.
- Add a timeout, one retry, and rate limiting on the proxy.

## 6. Fallback and failure behavior

| Situation | Behavior |
|---|---|
| No network or API error | Show rules-only result with built-in guidance text. Banner: "AI explanation unavailable" |
| Invalid or off-schema AI reply | Discard, show rules-only result |
| AI text contradicts the rules status | Ignore AI wording, keep rules status, log the mismatch |
| Slow response | Show the rules result immediately, load the AI explanation in when it arrives |
| Demo day outage | Cached example responses for the three scenarios, plus the recorded backup demo |

This also keeps the demo safe if Wi-Fi fails at the event.

## 7. Planned structure (names only, to be built later)

- `src/types/`: shared TypeScript types for the form record, rules result, and AI response
- `src/components/`: form steps, dashboard, results, guidance, trends
- `src/lib/`: validation, unit normalization, rules, API client
- `api/` (serverless proxy): holds the key, calls Gemini, returns the validated reply
- `src/data/`: scenarios, baselines, guidance fallback text

## 8. Decisions needed from the team

1. **Who decides status:** local rules (recommended) or Gemini?
2. **Proxy host:** Vercel serverless function (matches the SRS) or something else?
3. **Offline:** is "works without AI, rules-only" acceptable, or must the whole thing work with no network?
4. **Which Gemini model and who owns the API key and billing?**
5. **What exactly should Gemini produce:** explanation only, or explanation plus guidance plus draft report?

## 9. Suggested ownership (proposed, to confirm)

| Person | Area |
|---|---|
| Bruno | React and Tailwind UI, form, display, deployment |
| Subomi | TypeScript types, rules step, API client, proxy |
| Nabeeha | Prompt wording and safety rules, guidance review, test cases, what Gemini may and may not say |

## 10. Build order (when coding starts)

1. Freeze TypeScript types for the form record and the AI response
2. Form with validation
3. Rules step and the three scenarios
4. Proxy plus Gemini call with schema-checked reply
5. Results display with AI explanation area and fallback
6. Report export, trends, polish
7. Test the failure cases and rehearse with Wi-Fi off

## 11. Risks of this flow

| Risk | Mitigation |
|---|---|
| Model gives unsafe or overconfident advice | Fixed safety prompt, output validation, rules status wins, visible disclaimer, Nabeeha reviews sample outputs |
| API key leaks | Key only in the server proxy, never in the client or the repo |
| Network failure during demo | Rules-only fallback, cached responses, recorded demo |
| Inconsistent answers for the same input | Rules decide status; low temperature; cache demo responses |
| Judges ask "isn't this just a chatbot?" | Show the rules step, baseline logic, Insufficient Data, and symptom override. The AI is the explainer, not the decider |
| Cost or rate limits | Short requests, one call per check-in, proxy rate limit |
