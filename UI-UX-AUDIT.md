# AstroCare visual design and usability audit

**Reviewed:** 14 November 2026. **Scope:** the current React application, its shared styles, all 11 screen components, and the supplied four-screen visual reference. This is an audit and proposed repair backlog; the application has not been redesigned or changed.

## Main finding

The interface has a consistent palette, but insufficient hierarchy. Too many things look equally important: profile information, current status, secondary snapshots, explanations, provenance, and demo controls. Repeated blue boxes, small text, and repeated actions make the interface feel crowded even where there is unused space inside individual cards.

The strongest improvement would be to organize each screen around **what changed and what to do next**, then make evidence, editing, context, and provenance progressively easier to explore. A new color scheme alone would not solve this.

The intended direction is a calm mission dashboard with a clear status and next action, readable measurements, quieter supporting information, and restrained space imagery. This follows file 15 §1 and F01–F12, file 14 §§5–5a, and file 07 §§1, 6, 10.

## Evidence and boundaries

- Read `README.md` first, then files 07, 10, 11, 12, 13, 14, and 15 for scope, safety, architecture, and visual requirements.
- Inspected the actual supplied `reference/AstroCare_UI_Mockups.png`, rather than judging only from its written description.
- Built the app successfully with `npm run build` and inspected local browser screenshots. Captures are in [audit/screenshots](audit/screenshots/).
- Screenshot-only review pages were generated inside ignored `dist/` to open the existing screen components. They use the production application and automatically select its navigation buttons. They are not application changes or deployable review deliverables. Assessment capture uses the local template fallback.
- **Visual** findings refer to screenshots. **Code** findings refer to implementation inspection. **Verify** means a suspected problem needs interaction or assistive-technology testing before it can be called a confirmed runtime defect.
- Desktop/tablet responsiveness is an existing requirement (file 15 §8; file 07 §10). Phone findings are additional design recommendations, not a claim that the current spec requires a complete phone product.
- This is not a formal WCAG certification, a clinical review, an external-source fact check, or an exhaustive test of every state. No clinical rules or claims were added.

### Rendered screen coverage

Fourteen screenshots were captured and visually inspected. Screen dimensions below describe the browser viewport; image files are full-page captures.

| Screen/state | Viewport widths | Screenshot |
|---|---|---|
| Dashboard, default YELLOW preview | 1440, 768, 390 | [Desktop](audit/screenshots/dashboard-1440.png), [tablet](audit/screenshots/dashboard-768.png), [phone](audit/screenshots/dashboard-390.png) |
| Vital Signs | 1440 | [Comparison and editors](audit/screenshots/vitals-1440.png) |
| SpaceLab, hemoglobin selected | 1440 | [Laboratory screen](audit/screenshots/spacelab-1440.png) |
| Environment, default values | 1440 | [Environment screen](audit/screenshots/environment-1440.png) |
| Self-Assessment, Step 1 | 1440, 390 | [Desktop](audit/screenshots/self-assessment-1440.png), [phone](audit/screenshots/self-assessment-390.png) |
| Assessment, generated YELLOW with offline explanation | 1440 | [Full results](audit/screenshots/assessment-1440.png) |
| Body Map, heart selected | 390 | [Phone](audit/screenshots/bodymap-390.png) |
| Health Trends, heart rate selected | 1440 | [Chart and readings](audit/screenshots/trends-1440.png) |
| Guidance, For You Now | 1024 | [Intermediate layout](audit/screenshots/guidance-1024.png) |
| NASA Research | 1440 | [Published/personal comparison](audit/screenshots/research-1440.png) |
| Mission Log, empty | 390 | [Phone empty state](audit/screenshots/log-390.png) |

Notable scale: the default dashboard capture is 1,218px tall on desktop and 2,960px on a phone. The default generated assessment is 3,517px tall on desktop, with “View guidance” at the bottom. Length alone is not a failure; the problem is the placement of the next action and the repeated content before it.

### How the requested design guidance applies

The review uses the requested guidance on equal edges, visual hierarchy, coherent surfaces, restrained motion, readable text, responsive layout, and interaction feedback. AstroCare's project requirements take precedence over generic website recipes.

Do **not** apply marketing-page requirements such as full-screen heroes, one viewport per section, decorative animation moments, or photo-heavy content to this working dashboard. Do not remove graph labels, simulation labels, citations, uncertainty, or escalation reminders to achieve a cleaner screenshot. The in-flight lavender series is explicitly specified in file 14 §5a; it is not a defect merely because a generic style guide discourages violet. No random palette or hero replacement is proposed.

The local design search could not run because the installed Python command was unavailable and the Python launcher found no installation. Recommendations use the supplied guidance and its local quick reference, plus project evidence; none are presented as database search results. Marketing-site gate/checker and performance-script passes are not claimed for this audit.

## What already works

- The navy/teal palette, Inter typography, and left navigation establish a recognizable system.
- Status banners use text and icons as well as color. Preserve this.
- Values, units, baselines, and deltas are already present in many useful places.
- The app visibly identifies the simulation, separates research from personal data, and includes uncertainty and escalation messaging.
- There is a skip link, shared focus styling, reduced-motion support, and a textual readings table on Trends.
- The four navigation groups match the chosen 11-screen structure. The problem is presentation and behavior, not simply the number of features.

Sources: file 14 §§5–5a; file 11 D12; file 07 §§3, 6–10.

## Prioritized findings

**P1:** address first because it affects reading, task completion, or understanding of status. **P2:** significant visual/usability improvement. **P3:** finishing work. These are audit priorities, not clinical risk categories.

### Shared shell and visual system

| ID | Priority / evidence | What is wrong and why | Recommended fix | Location / requirement |
|---|---|---|---|---|
| 01 | P1 · Visual + code | White small text on the primary `#2d8fbb` button background has approximately **3.65:1** contrast. The same color is used for selected controls. Bold 14px text still needs the normal-text target. | Darken the action background or choose a tested foreground/background pair. Test default, hover, selected, and focus states separately. Keep teal as a restrained accent. | `src/index.css` `.btn-primary`, `.seg`; `tailwind.config.js`; file 10 NFR-06; file 07 §10. |
| 02 | P2 · Visual | Almost every block has the same navy fill, border, large radius, and heading treatment. A small snapshot looks as important as a task panel. | Define distinct roles: one prominent status/task surface, standard work panels, and quieter supporting rows. Use spacing and dividers instead of putting every paragraph in another box. | `src/index.css` `.card`, `.well`; `src/components/ui.tsx` `Card`; file 14 §5. |
| 03 | P2 · Visual + code | Body text starts at 15px, while much of the interface uses 11–13px labels and helper text. Provenance chips go down to 10.5px. The result requires constant close reading. | Create a small documented type scale. Proposed starting point: 16px body, 14px supporting copy, 12px metadata only. Increase key result headings and avoid making safety instructions metadata-sized. | `src/index.css`, `ui.tsx`, `Explanation.tsx`, `App.tsx`; file 10 §9 and NFR-06. Values are design proposals. |
| 04 | P2 · Visual | The simulation strip, mission pill, freshness pill, status pill, online pill, page title, and subtitle create multiple competing header rows. On a phone these consume substantial vertical space before the work begins. | Keep the visible safety strip. Simplify the remaining header into mission identity and data freshness, with less pill decoration. Distinguish browser connectivity from data freshness: “Online” does not mean the measurements are synced. | `src/App.tsx`; file 15 F01 and §8; file 11 D17. |
| 05 | P1 · Code | Header status always comes from `live`, while Assessment displays the saved result. After editing values, two legitimate but different statuses can appear without the header identifying its basis. | Explicitly label “Current inputs preview” versus “Assessment at [time]”. Keep the changed-input warning beside the saved result. Test by running an assessment and then editing a triggering input. | `App.tsx`, `AssessmentScreen.tsx`; file 07 §7; file 15 §5. |
| 06 | P2 · Visual | The current screen is largely a set of blue rectangles. The mockup uses a clearer focal area and recognizable mission imagery, which the build largely loses. | Restore a restrained mission visual or approved fictional crew illustration within a compact identity area. Keep data backgrounds quiet and avoid imagery behind essential text. Do not copy unsafe mockup labels or advice. | Dashboard and shell; file 14 §5 and supplied mockup. Asset choice remains a design proposal. |
| 07 | P2 · Code / verify | Navigation changes React state without a URL or history entry and only scrolls the window. Browser Back, refresh, direct linking, and keyboard focus do not track the selected screen. | Add a documented screen URL/history scheme; update page title and move focus to the new screen heading after navigation. Test Back and refresh. Keep all 11 destinations and four groups. | `App.tsx` `go`, `screen`; file 11 D12; file 07 §§6, 10; file 15 §8. Routing mechanism is not specified and needs a documented decision. |
| 08 | P1 · Visual on phone/tablet | Below 1024px all 11 navigation items become one horizontal strip; groups disappear. Only the first few items are visible, with no clear menu affordance for the rest. | Use a clearly labelled menu/drawer preserving the four groups. Show the current destination. Support keyboard navigation, close behavior, and focus return. Do not simply delete destinations. | `App.tsx` sidebar breakpoint; file 07 §6; file 15 §8. |
| 09 | P2 · Code | Control heights vary widely: shared buttons/inputs 42px, segmented options 40px, number fields 36px, severity options 32px, and log actions 34–36px. | Normalize control sizes by role. Aim for comfortable 44px touch areas on compact devices; enlarge label click areas for checkboxes. This is a usability target, not a blanket claim that every smaller web control violates WCAG. | `index.css`, `ui.tsx`, `SelfAssessment.tsx`, `MissionLog.tsx`; file 10 §9. |
| 10 | P2 · Visual + code | User-facing copy includes implementation references such as “D14, file 11”, internal rule IDs, model/version details, and localStorage terminology. This adds noise to ordinary tasks. | Keep provenance and rule versions available, but present plain labels first. Put technical diagnostics in an accessible details area. Preserve simulation, illustrative-rule, storage, and review-status disclosures. | `src/data/mission.json`, `SpaceLab.tsx`, `Explanation.tsx`, `MissionLog.tsx`; file 07 §§3, 7–10. |

### Dashboard

| ID | Priority / evidence | What is wrong and why | Recommended fix | Location / requirement |
|---|---|---|---|---|
| 11 | P1 · Visual | The large crew profile precedes the status in the mobile reading order. In the 390px capture the status and check-in action are below the initial viewport; key measurements follow even later. | Put status and the next daily action first, then current indicators. Reduce identity to a compact supporting block. Keep mission context accessible. | `Dashboard.tsx` top grid; [phone capture](audit/screenshots/dashboard-390.png); file 15 F01; file 10 FR-07. |
| 12 | P2 · Visual | The profile stretches to match its neighboring content and leaves large empty areas. The status card carries several paragraphs and two actions. The pair feels simultaneously sparse and crowded. | Use a compact profile and a status area sized to its content. Separate the status statement, reason summary, and next action without stretching the profile to fill the row. | `Dashboard.tsx`; [desktop capture](audit/screenshots/dashboard-1440.png); file 14 §5. |
| 13 | P2 · Visual | “Start daily check-in” and “Open self-assessment” duplicate one task. A header badge, status panel, navigation, snapshots, and demo actions all compete for attention. | Keep one dominant check-in action. Present other destinations as quieter links or row actions. Retain completion state without another equally prominent button. | `Dashboard.tsx`; file 15 F01 and Flow A. |
| 14 | P2 · Visual | The four supporting snapshot cards have different content lengths, header wrapping, and button positions. Their bottoms align, but their internal rhythm does not. | Use a consistent heading/data/action structure; align actions when cards share a row. Allow content-driven stacking at narrower widths rather than compressing four cards. | `Dashboard.tsx` snapshot grid; file 14 §5. |
| 15 | P2 · Visual | Five KPI cards become two columns with a lone Mood card on phones. Narrow cards make combined BP and mood labels crowded. All sparklines have similar visual prominence even when only one rule is flagged. | Test a compact single-column measurement list on phones or a deliberate full-width final item. Preserve baseline/delta labels and identify flagged measurements with text/icon emphasis. Avoid presenting a numerical change alone as a concern. | `Dashboard.tsx` KPI grid; file 15 F01–F02; file 07 §7. |
| 16 | P2 · Visual | The full demo-scenario bank is always displayed as another large dashboard panel. On phones it becomes a long stack of controls. | Keep FR-08 scenarios available through a compact “Demo scenarios” disclosure with clear loaded-scenario feedback. Distinguish this demonstration tool from the astronaut's daily task. | `Dashboard.tsx`, `AssessmentScreen.tsx`; file 10 FR-08; file 07 §11. |

### Forms, vitals, laboratories, and environment

| ID | Priority / evidence | What is wrong and why | Recommended fix | Location / requirement |
|---|---|---|---|---|
| 17 | P1 · Visual + code | Step 1 repeats a question, quick picks, precise numeric input, slider, nested surface, and helper text for sleep, fatigue, and mood before reaching symptoms. The stepper divides the workflow but the first step remains very long. | Keep the required four-step structure and exact stored scales. Simplify each question to quick choices plus a compact exact-value control; reveal the extra adjustment control when useful. Do not move required symptoms into hidden optional content. | `SelfAssessment.tsx`, `ui.tsx` `MeasureField`; file 11 D9–D13; file 10 NFR-01. |
| 18 | P1 · Code / verify | A step gets a completion checkmark whenever its index is less than the current index, regardless of whether it is answered or valid. Any step button can jump forward. | Use separate states for current, visited, complete, and needs attention. A checkmark should mean completion. Provide an error summary linking to fields and focus the new step heading. Preserve the ability to produce INSUFFICIENT DATA where the spec permits it. | `SelfAssessment.tsx` stepper/review; file 07 §§6–7, 10. |
| 19 | P2 · Code / verify | The wizard draft exists only in the mounted component. Leaving the screen discards unsaved edits without a visible draft/saved distinction. | Make unsaved state explicit and agree whether to retain drafts or warn before leaving. This is a workflow decision missing from the docs, not an existing requirement to invent silently. | `SelfAssessment.tsx` local `d`; `App.tsx` conditional rendering; file 15 Flow A. |
| 20 | P2 · Visual | Vitals puts a large comparison table before all editing controls. Users must scroll down to change data, then back up to see its impact. The adjacent research card stretches far beyond its content. | Bring editing closer to its corresponding measurement or provide a clear review/edit mode. Let the separate research panel use its natural height. Preserve all six measures and separate BP components. | `VitalSigns.tsx`; [capture](audit/screenshots/vitals-1440.png); file 15 F02, F12; file 14 §1. |
| 21 | P2 · Visual + code | Numeric labels beside comparison bars wrap awkwardly: values and units split across lines. The bars claim a percentage of the row before the label and gap are accounted for. Each pair is normalized independently. | Reserve a stable label column and make the bar track flexible. State that lengths compare the two readings within each metric; do not imply a common scale across unlike units. | `charts.tsx` `EarthSpaceBars`; `VitalSigns.tsx`; file 15 §3. |
| 22 | P2 · Visual + code | SpaceLab repeats the selected result in the selector cards, two large wells, the change row, and its editor. Environment similarly repeats summary values and editors with extensive explanatory copy. | Preserve an at-a-glance summary, then one coherent detail/edit area. Use one short context statement and accessible supporting details instead of repeated paragraphs. Keep specimen time, units, quality, and the no-causation message. | `SpaceLab.tsx`, `Environment.tsx`; file 15 F03, F07; file 11 D7, D23. |
| 23 | P2 · Code / verify | SpaceLab declares ARIA tabs but implements no arrow-key focus management, roving tab stop, or associated tabpanel. It looks like a selector but promises tab behavior. | Implement the complete tab pattern or use ordinary selection buttons with pressed state. Verify keyboard operation and announced selection. | `SpaceLab.tsx`; file 07 §10; file 15 §8. |
| 24 | P2 · Code / verify | `MeasureField` associates an error with the number box, but not the paired slider. Hints are not linked through `aria-describedby`. Missing numbers still show the slider at its minimum, differentiated mainly by opacity. | Associate both controls with help/error text and display an explicit “Not measured” state. Keep the exact numeric alternative to dragging. Test long labels and narrow widths. | `ui.tsx` `MeasureField`; file 07 §§7, 10. |

### Assessment and explanation

| ID | Priority / evidence | What is wrong and why | Recommended fix | Location / requirement |
|---|---|---|---|---|
| 25 | P1 · Visual + code | Results stack status, symptoms, escalation, every delta, reason codes, five hazard panels, a multi-section explanation, limitations, and final navigation. The next step is separated from the result by a long evidence wall. The reason-code panel also stretches into a large mostly empty box. | Put status, reported concerns, and next verification/escalation action together at the top. Follow with changes, evidence, context, and provenance in a clear reading order. Avoid stretching sparse content to match the full readings table. Keep RED instructions and required symptoms visible. | `AssessmentScreen.tsx`; file 14 §5; file 15 F05–F06; file 11 D6, D24. |
| 26 | P2 · Visual + code | Hazard context is rendered once in five hazard panels and again in the explanation. Baseline differences and rule reasons are also repeated in several formats. The unequal explanation columns leave a large empty lower-left area. | Organize one readable hazard overview with all five entries, then link each explanation statement to supporting detail. Use a balanced reading structure rather than two independent long stacks. Reduce duplicate wording while preserving the complete F06 output and sentence-level provenance. | `HazardCard.tsx`, `Explanation.tsx`; file 11 D24; file 12 §5. |
| 27 | P2 · Code | Every explanatory sentence receives tiny colored reference chips, while the explanation header can contain a long technical validation/model message. Evidence competes with the statement it supports. | Use readable “Based on…” summaries or accessible per-statement source disclosure. Show concise explanation-source state and put diagnostics behind details. Do not remove or weaken grounding checks. | `Explanation.tsx`; file 12 §§4–6; file 15 §5. |
| 28 | P1 · Code / verify | Swapping the immediate template for later Gemini text can change a large two-column region while the person is reading. A render-time replacement does not preserve reading position by design. | Keep the explanation source/status clear, announce completion politely, and test for disruptive jumps. Consider an explicit update control or stable section layout; document any change to the automatic swap behavior in file 12 §6. | `Explanation.tsx`, `App.tsx`; file 12 §6. Runtime layout-shift magnitude was not measured. |
| 29 | P2 · Code / verify | The results summary requires a 420px table; Vitals requires 560px. Phone users must scroll sideways within content to compare related values. | Keep desktop tables, but provide a narrow-screen measurement layout that keeps label, baseline, current value, and delta together. Preserve source and units. Avoid page-level horizontal overflow. | `AssessmentScreen.tsx`, `VitalSigns.tsx`; file 15 F02, F05; phone enhancement. |

### Body map, trends, guidance, research, and log

| ID | Priority / evidence | What is wrong and why | Recommended fix | Location / requirement |
|---|---|---|---|---|
| 30 | P2 · Code / verify | Body-map pill labels use absolute percentage positions over a generic figure. Positioning and short labels are fragile at narrow widths and with enlarged text. Several independent blocks explain the same selected region. | Keep the figure, selected region, and related readings visually connected. Test all six regions with long labels and larger text. Offer an ordinary region list as an equivalent control; do not imply diagnostic localization. | `BodyMap.tsx`; file 15 F08; file 07 §4. |
| 31 | P2 · Code | Trends has several legend entries and repeated summary numbers, but log annotations say only “log”. The picture does not explain what an event was without a separate investigation. | Keep the accessible readings table and provenance markers. Add an understandable annotation key or event detail alongside the chart. Give the latest value/delta a concise summary near the chart and include units in its visible heading. | `Trends.tsx`, `charts.tsx`; file 15 F09; file 10 FR-09. |
| 32 | P2 · Code + visual at 1024px | Guidance adds a 280px secondary navigation column inside the application shell, reducing the main content width. At narrower sizes its four large choices become another horizontal strip. | At the intermediate breakpoint, move categories above the content or into a labelled selector. Keep recommended actions dominant, and articles/source details secondary. | `Guidance.tsx`; file 14 §5; file 15 F10. |
| 33 | P2 · Code | Guidance checkbox progress is component-local and keyed by array index. Leaving the screen resets it, and changed recommendations can reuse the same position. | Decide whether this is temporary tracking or persisted progress, state that behavior plainly, and key actions by stable IDs. Do not let a checked escalation reminder imply a clinical concern is resolved. | `Guidance.tsx` `done`; file 15 F10. Persistence semantics need a documented decision. |
| 34 | P2 · Code | Research has a prominent callout, several badges, two comparison panels, citation metadata, and another source panel. Its hierarchy makes the verification state compete with both datasets. | Give the verification notice one clear location, use matched comparison structures, and preserve explicit Published versus Simulated labels, cohort, units, and timepoints. Never make unverified values appear validated through visual polish. | `Research.tsx`; file 15 F12 and §1; file 11 D20. |
| 35 | P2 · Code | Mission Log combines writing, filters, import/export, dense metadata, and clearing controls in a few large panels. The note field's label is screen-reader-only. Routine add-note actions lack local confirmation. | Use a visible note label, separate entry creation from history tools, style the event list as a readable timeline, and add concise save feedback. Keep clear-log secondary with its confirmation. | `MissionLog.tsx`; file 15 F11; file 10 NFR-06. |
| 36 | P3 · Code | Repeated source/version/review sentences, technical event types, and long footer disclaimers add cumulative reading weight across every screen. | Edit repetition into a consistent disclosure pattern: concise visible essentials, readable supporting details, and traceable sources. Keep source review status close to educational content. | `App.tsx`, `Guidance.tsx`, `Research.tsx`, `MissionLog.tsx`; file 07 §§3, 10. |

### Additional confirmed layout gaps

| ID | Priority / evidence | What is wrong and why | Recommended fix | Location / requirement |
|---|---|---|---|---|
| 37 | P1 · Visual on phone | At 390px the Self-Assessment stepper clips the Review step behind horizontal scrolling. Deep nesting compresses the sleep label into roughly six short lines; some question surfaces extend beyond their parent card's right padding. The form feels broken even where fields remain operable. | Stack field labels above number/unit controls on narrow screens, reduce nested padding, allow fieldsets to shrink, and use a compact step indicator that exposes the current step and total without clipping. Verify all four steps and enlarged text. | `SelfAssessment.tsx` `Question` and stepper; `ui.tsx` `MeasureField`; [capture](audit/screenshots/self-assessment-390.png); file 07 §10; phone enhancement. |
| 38 | P2 · Visual + code | The mockup's results screen includes a small heart-rate trend alongside “What Changed?”. The current Assessment screen has no trend, leaving a sparse reason panel next to a long table. | Restore a compact, correctly labelled existing-history chart or a clearly contextual trend preview with a link to Health Trends. Use available fictional/saved points; do not fabricate seven days to match the mockup. Record the visual-reference gap in the implementation plan. | `AssessmentScreen.tsx`, existing `charts.tsx`; file 14 §5 Results; file 15 F09; file 07 §11 visual-match check. |

## Recommended screen hierarchy

These are proposed layout directions, not approved feature removals.

| Screen | First priority | Supporting content | Detail layer |
|---|---|---|---|
| Dashboard | Current rules-preview status and daily next action | Current readings, completion, freshness | Compact identity, lab/environment snapshots, latest event, demo tools |
| Vital Signs | Earth/current/delta with obvious edit entry | Per-metric comparison and quality | Measurement metadata and separate published reference |
| SpaceLab | Selected analyte, current value, delta, quality | Baseline and specimen time | Adjustment, source notes, unit conversion |
| Environment | Cabin context summary | Editable conditions and observation time | Context explanation and optional radiation |
| Self-Assessment | Current question group and progress | Exact values, relevant hints/errors | Optional notes; review before saving |
| Assessment | Saved status, symptoms, uncertainty, next action | What changed and contributing rules | Full evidence, five hazards, sources, limitations |
| Body Map | Region selection with related readings | Symptoms and context | Rules and baseline details |
| Trends | Metric, chart, latest change | Baseline/provenance legend and event meaning | Accessible readings and history detail |
| Guidance | Current verification/escalation actions | Why they are shown | Educational articles and sources |
| NASA Research | Explicit published/simulated separation | Matched data tables and verification state | Cohort, timepoints, original citations |
| Mission Log | Recent chronological events | Add observation and filter | Import/export and clear-log tools |

Grounding: file 15 F01–F12 and Flows A–C; file 14 §5; file 07 §§4, 6–10. Essential safety statements stay visible even where other detail is disclosed progressively.

## Repair order

1. **Readability and status clarity:** fix action contrast, distinguish live preview from saved assessment, normalize essential control sizes, improve error/focus behavior.
2. **Dashboard composition:** reduce the profile, lead with status and action, simplify duplicate actions, repair snapshot alignment, compact demo tools.
3. **Shared system:** agree typography, surface roles, spacing, header treatment, and responsive navigation before polishing individual cards.
4. **Daily workflow:** simplify Step 1, correct stepper completion, bring edits and comparisons together, reduce redundant lab/environment presentations.
5. **Results hierarchy:** put next steps near the result, reduce repeated explanations, keep complete evidence and hazard content accessible, test asynchronous explanation updates.
6. **Secondary screens and finishing:** improve guidance width, log feedback, body-map labels, chart annotations, and restrained mission imagery.

Do not begin with new gradients, more glass effects, new animations, or a different font. Those would leave the main information problem unresolved.

## Acceptance checklist for the repair

The following is a proposed design verification checklist. It does not replace the existing safety/scenario tests in file 07 §11.

- [ ] At 1440×900 and 1024×768, status, freshness, and the primary daily action are easy to find without scanning every card.
- [ ] At 768×1024, all 11 destinations remain discoverable and content is not squeezed by competing navigation columns.
- [ ] Phone enhancement: at 390×844 and 320px wide, prioritize status and the next action; no page overflow, clipped labels, or required sideways table reading.
- [ ] Header clearly says when it is showing current-input preview versus a saved assessment; changing inputs cannot create unexplained conflicting statuses.
- [ ] Normal text meets 4.5:1 contrast and relevant large text/non-text controls meet their applicable targets, including hover/selected/focus states.
- [ ] Proposed 44px compact-device touch areas are checked without mislabelling every smaller web control as an accessibility failure.
- [ ] Keyboard-only navigation covers the menu, stepper, selectors, fields, disclosures, chart alternatives, import, and confirmation controls.
- [ ] New screens/steps receive meaningful focus; errors are associated with the relevant controls; focus is visible and unobscured.
- [ ] Stepper completion reflects answered/valid state rather than position alone; unsaved draft behavior is explicit.
- [ ] Essential content remains readable with enlarged text and at 200% zoom; reduced motion keeps all content visible.
- [ ] Results preserve all four states, symptoms, escalation reminders, missing-data handling, readings/baselines/deltas, rules, time, and limitations.
- [ ] All five hazards and sentence-level sources remain inspectable; context never changes status or implies a proven cause.
- [ ] Simulation and “Not for clinical use” remain visible; GREEN retains “No flags under demo rules”.
- [ ] Published research remains visually and semantically separate from fictional personal values, with unverified status intact.
- [ ] Save/load actions provide clear feedback; import/export and offline fallback still work.
- [ ] Re-run the existing tests and build, then capture the same screen/size set for before/after comparison.

## Documentation decisions to settle before implementation

- **Route/history scheme, wizard draft retention, and guidance checkbox persistence:** not specified in the current docs. Agree behavior and update files 07/13 before implementing those workflow changes.
- **Phone scope:** confirm whether a complete phone experience becomes part of the acceptance criteria; current required coverage is desktop/tablet.
- **Visual assets:** choose approved mission/fictional crew imagery if restoring the mockup's visual identity. Do not invent a real crew association or telemetry integration.
- **References disagree on some content:** the mockup includes “Green–Stable”, different demo values, a shorter sidebar, and example guidance. Follow canonical values and safety wording rather than reproducing those literally (file 14 §§2, 5–6; file 11 D5, D9–D15).
- **Published-panel wording is inconsistent:** file 07 §3 says studies appear “only” in NASA Research, while file 14 §1 explicitly includes a separate research panel on Vital Signs, which the code implements. Keep the datasets separate and clarify this wording when updating the spec; do not silently remove the panel.
- Any accepted scope/design changes should update the governing docs in the same implementation change. This audit records proposals without changing those requirements.

## Verification limits and remaining checks

The production build passed. It reported an approximately 740.30kB minified JavaScript bundle (208.98kB gzip) and a chunk-size warning. This is a performance follow-up, not proof of poor runtime speed; route splitting may help after measuring. No performance score or layout-shift score is claimed.

Full keyboard/screen-reader testing, 200% zoom, 320px overflow, all six body regions, all four assessment statuses, every wizard step at every width, and validated Gemini output were not exhaustively exercised. Code findings marked “verify” should be reproduced during repairs. Clinical guidance, hazard mappings, stale-data policy, and study values remain subject to the existing reviews in file 11 and file 13 §8.
