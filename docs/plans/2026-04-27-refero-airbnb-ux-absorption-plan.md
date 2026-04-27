# Refero Airbnb UX Absorption Plan

**Date:** 2026-04-27
**Status:** Execution plan
**Scope:** Mobile proof-surface subset in `apps/mobile/**`, governed by Tasky PRD, journey, screen-spec, and scenario contracts.

## Goal

Absorb Airbnb's professional mobile UX patterns available through Refero into Tasky's equivalent mobile surfaces while preserving Tasky's product rules, i18n, data model, and Phase 1 constraints.

This plan intentionally stays scoped to the proof-surface subset. The purpose is to validate the Refero-to-Tasky absorption workflow, QA loop, and implementation discipline before committing to a full-app Airbnb-derived pass.

## Framing

Airbnb is no longer a loose structural reference for this sprint. Airbnb Refero screenshots and flows are the primary UX reference for interaction anatomy, spacing rhythm, layout hierarchy, density, sheet behavior, card composition, selection states, and QA comparison.

Tasky customizes the values that should remain product-owned or brand-owned: colors, typography, copy, icons where brand-specific, data fields, locale strings, product constraints, and trust claims. The current Tasky design system is a draft and may bend to the stronger reference where the reference improves usability.

Tasky screen specs remain the product contract. If a Refero/Airbnb pattern conflicts with Tasky's PRD, rollout phase, scenario, or screen spec, the spec wins unless the spec is intentionally updated and validated first.

## Non-Negotiables

- Treat this as a proof-surface experiment, not a claim that the whole mobile app is Airbnb-derived.
- Keep the selected proof surfaces internally coherent. Adjacent non-proof surfaces may temporarily retain the draft Tasky design until a later app-wide pass is approved.
- Use Refero before implementing each slice. Do not infer Airbnb UX from memory.
- Search broadly, then select the correct Airbnb screenshots for the Tasky slice. A wide result set is expected; selection is part of the work.
- Retrieve and inspect actual Airbnb screenshot content before implementation. Prefer `mcp__refero__refero_get_screen_content` for the Tasky-equivalent screen/state.
- If the exact Tasky-equivalent Airbnb screen cannot be found or fetched from Refero, continue searching by component and interaction anatomy, then use the closest fetched Airbnb screenshot reference that can still guide spacing, hierarchy, state, and CTA behavior.
- Do not implement UI, write UI tests, or change runtime components from Refero metadata, thumbnail URLs, search-result descriptions, web search, memory, or general Airbnb knowledge alone. Those inputs may help shortlist candidates only.
- Description-only implementation is a last resort that requires explicit user approval for that slice.
- Absorb Airbnb's spacing and hierarchy, not just high-level structure.
- Customize Tasky-owned values: color, typography, copy, icons where needed, content model, i18n, and product rules.
- Keep Phase 1 boundaries: no instant booking, map-first browsing, payment protection, escrow/deposits, provider ranking, superhost-style tiers, or unsupported guarantee language.
- Do not add one-off regression tests for incidental findings. Strengthen scenario/spec-backed behavioral tests or technical invariant tests only.
- Run a Maestro QA pass after each runtime slice and inspect screenshots against the selected Refero references.
- Remove code that is directly superseded by a slice during that slice; do not defer obvious stale imports, selectors, props, helpers, or replaced components.

## Reference Selection Protocol

Use the installed `refero-design` skill as the research method for this plan, not as a higher-level contract. Its useful contribution is the research-first loop: form a brief, search from multiple angles, deep-dive the strongest references, extract structure and craft, then implement and compare. Tasky PRD, rollout phase, screen specs, i18n, mobile architecture, and this plan override any generic skill advice.

Scale the skill to this proof-surface sprint:

- Before each slice, write a compact slice brief from the relevant `SCR-*` contract: screen type, user goal, primary action, friction/objection to remove, Tasky constraints, and Airbnb pattern being absorbed.
- Search by literal screen facts and components, not vague intent. Use query tracks for exact Airbnb screen, Airbnb flow, and fallback component anatomy.
- Keep Refero calls serialized and respect `429` `Retry-After` responses. Do not run broad parallel Refero probing.
- For this proof subset, deep-dive 2-4 shortlisted references per materially changed screen. Reserve the skill's heavier 50+ result / 5-10 deep-dive target for a later full-app absorption pass.
- Use flow results to understand journey logic and transition rhythm. Use full screenshot results for visual implementation decisions.
- Capture the skill's three useful lenses in the slice note: structure, visual craft, and flow/friction. Do not copy generic persuasion, conversion, or trust claims that Tasky does not support.
- Build a short adaptation table for each slice: Refero source, observed anatomy, why it works, Tasky adaptation, and rejected Airbnb semantics.
- Treat `get_design_guidance` as secondary synthesis only. It cannot replace an inspected screenshot reference for runtime UI changes.
- Prefer the current Refero MCP tool names exposed by the running harness. If the harness exposes the skill's `refero_*_tool` names, use those. If it exposes `mcp__refero__*` aliases, use the equivalent search, flow, screen, and guidance tools. Do not pass unsupported search parameters such as `limit` or `num_results`; paginate or refine queries instead.
- After implementation, run the side-by-side quality check from the skill against the selected references, focused on polish, clarity, and usability, then run the plan's Maestro/verification gates.

For every slice:

1. Read the relevant `SCR-*` screen specs and linked `REQ-P1`/`NFR`, `JRN`, and `SCN` refs.
2. Run at least two Refero searches:
   - `mcp__refero__refero_search_screens` with an Airbnb-specific query for the screen pattern.
   - `mcp__refero__refero_search_flows` when the slice is a multi-step journey.
3. Review returned results and shortlist 2-4 candidates.
4. Retrieve the actual screenshots for shortlisted candidates with `mcp__refero__refero_get_screen_content`.
5. Inspect the retrieved screenshot content and choose one primary Airbnb reference and optional secondary references using this hierarchy:
   - **Best:** exact Tasky-equivalent Airbnb screen/state.
   - **Acceptable fallback:** Airbnb screenshot from a different flow that matches the component or interaction anatomy closely enough to guide the implementation.
   - **Last resort:** description-only implementation, only after explicit user approval for the slice.
   - If the Tasky slice changes multiple materially different screens, repeat this per changed Tasky screen.
   - A "sufficient" screenshot reference means the retrieved image can credibly guide spacing, layout, hierarchy, interaction state, and CTA behavior for the Tasky screen or component being changed.
   - If the exact match is unavailable, record what was searched, why it was rejected or unavailable, and why the alternate Airbnb screenshot is sufficient.
   - If no sufficient screenshot can be fetched and inspected, stop the slice and report the blocker before requesting approval for any description-only fallback.
6. Record a slice absorption note:
   - Refero query strings.
   - Selected screen or flow IDs.
   - Confirmation that `refero_get_screen_content` returned usable screenshot content for each primary reference.
   - If using an alternate component/anatomy reference, why the exact semantic screen was unavailable and why the alternate screenshot is sufficient.
   - Adopted anatomy: spacing, layout, hierarchy, interaction states, CTA behavior.
   - Customized values: colors, typography, copy, data, Tasky rules.
   - Rejected Airbnb semantics.
7. Only then implement runtime UI.

## Slice Plan

### Slice 0: Replace Sprint Framing

**Files:**

- Modify: `docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md`
- Modify: `docs/plans/2026-04-26-tasky-redesign-reference-matrix.md`
- Modify as needed: `docs/design/screen-specs/SCR-*.yaml`

**Work:**

- Replace "Airbnb structural reference only" wording with "Refero Airbnb UX absorption."
- Explicitly state that spacing, density, interaction anatomy, and layout rhythm are adopted unless they conflict with Tasky specs.
- Preserve rejections for Airbnb product semantics that Tasky does not support.
- Add a required per-slice reference-selection artifact before runtime work.

**Verification:**

- `python3 tooling/scripts/governance/validate-screen-spec-traceability.py`
- `pnpm repo:docs:check`

### Slice 1: Customer Posting

**Specs:** `SCR-CUST-002` through `SCR-CUST-008`

**Refero search intent:**

- Airbnb mobile guided creation, booking date picker, guest/date selection sheets, review-before-confirm, sticky CTA.

**Absorb:**

- Step rhythm, spacing, full-screen or sheet hierarchy, date/calendar picker anatomy, bottom CTA positioning, review rows, edit affordances, selected-state treatment.

**Customize:**

- Task category/intake/photo/location/schedule/pricing/review data, Tasky copy, MNT pricing, quote-vs-budget rules, i18n, Tasky tokens.

**QA:**

- Maestro posting flow plus screenshots for category, schedule/date picker, review, and success.
- Manual comparison against selected Refero screenshots before moving on.

**Restart requirement:**

- The schedule/date-time repair must not continue from the previous metadata/thumbnail-based attempt.
- Before changing tests or runtime UI for `SCR-CUST-006`, fetch and inspect usable Airbnb screenshot content for either:
  - an exact Airbnb date/time picker reference for the Tasky scheduling state, or
  - an alternate Airbnb calendar, date picker, bottom-sheet picker, or reservation-edit screenshot whose component anatomy is sufficient for Tasky's scheduling picker.
- If no usable Airbnb screenshot reference can be fetched and inspected, stop and report the blocker before requesting explicit approval for any description-only fallback.

**Slice 1 schedule-picker reference note:**

- Refero candidate search: `Airbnb date picker`.
- Primary screenshot reference: Airbnb iOS screen `5d67c7df-e474-48a3-84da-59fbe56d83ef`, Flow `6391`, `Choose a start date`.
  - `refero_get_screen_content` currently returns an MCP image deserialization error for this screen.
  - Usable full screenshot content was fetched and inspected from the Refero image asset returned by the screen record: `https://images.refero.design/screenshots/2/mobile/40986aa3-f055-40e5-81a6-4dc5a1257a35.jpg`.
- Secondary screenshot reference: Airbnb iOS screen `0d826a93-0ad1-49d8-a5d3-18e68a11f05b`, Flow `6399`, `Change reservation details`.
  - Usable full screenshot content was fetched and inspected from `https://images.refero.design/screenshots/2/mobile/7430b76c-2fea-4cc3-8ac3-fe59859b9509.jpg`.
- Why these are sufficient:
  - Both references show the relevant Airbnb calendar/date-picker component anatomy: large rounded sheet, close affordance, strong title hierarchy, weekday row, dense date grid, selected circular date state, and bottom reset/save action row.
  - Tasky adapts this to one service date plus one service time, rejecting Airbnb range, guest, travel flexibility, and reservation semantics.

**Slice 1 execution and QA note:**

- Replaced the customer posting schedule step's stock native date/time picker path with a Tasky-native `SchedulePickerSheet` that follows the inspected Airbnb calendar-sheet anatomy while keeping Tasky colors, typography, copy, single-date semantics, time slots, MNT budget rules, and i18n.
- Strengthened shared mobile automation invariants discovered during the QA pass:
  - Local native Firebase setup is gated behind available native config so dev builds do not show unrelated LogBox overlays during Maestro runs.
  - `yes_no` intake chip test IDs now use semantic `yes`/`no` values instead of translated labels, preserving locale-independent scenario automation.
  - The customer posting Maestro flow sets a Ulaanbaatar mock location and selects a seeded recent UB location when available so the scenario reflects Tasky's Phase 1 service area without relying on emulator map-coordinate taps.
- Focused verification passed:
  - `pnpm --filter @tasky/mobile test:unit -- ScheduleBudgetScreen.test.tsx`
  - `pnpm --filter @tasky/mobile test:unit -- IntakeFormScreen.test.tsx`
  - `pnpm --filter @tasky/mobile test:unit -- Touchable.test.tsx nativeFirebase.test.ts`
  - `pnpm --filter @tasky/mobile format:check`
  - `maestro check-syntax apps/mobile/maestro/flows/JRN-CUST-01-post-a-task.yaml`
  - `maestro check-syntax apps/mobile/maestro/flows/capture-smoke-all.yaml`
  - `maestro test apps/mobile/maestro/flows/JRN-CUST-01-post-a-task.yaml`
  - `maestro test apps/mobile/maestro/flows/capture-smoke-all.yaml`
- Visual QA artifact captured at `screenshots/SCR-CUST-006-schedule-picker-date.png`.
- Slice stale-reference search found no runtime `DateTimePicker` usage in the posting schedule path. Remaining matches are the installed package, native iOS lockfile entries, and test mocks/assertions.

### Slice 2: Tasker Feed

**Spec:** `SCR-TASK-001`

**Refero search intent:**

- Airbnb mobile search results, filter sheet, active filters, no-results remediation, dense listing cards.

**Absorb:**

- Filter modal anatomy, result-count CTA, chip grouping, card spacing, metadata hierarchy, empty-state remediation.

**Customize:**

- Task metadata: category, location approximation, budget/quote mode, schedule, applications, verification/apply state.

**Reject:**

- Map-first browsing, promoted listings, ranked recommendations, travel listing semantics.

**QA:**

- Maestro tasker-browse flow plus filter-sheet screenshot review.

**Slice 2 tasker-feed reference note:**

- Refero candidate searches:
  - `Airbnb mobile search results filter sheet active filters listings`
  - `Filtering places available for booking`
  - `Airbnb no exact matches remove filters mobile`
- Primary flow reference: Airbnb iOS Flow `6389`, `Filtering places available for booking`.
- Primary screenshot reference: Airbnb iOS screen `f30756ae-4022-4a25-97f8-39960a71fcba`.
  - `refero_get_screen_content` returned usable full screenshot content and it was inspected at `/tmp/refero-airbnb-filter-sheet.jpg`.
- Secondary screenshot references:
  - Airbnb iOS screen `1dd8e78b-aa3e-4774-83b8-ad01afa5b822`, inspected at `/tmp/refero-airbnb-search-results-list.jpg`.
  - Airbnb iOS screen `122bdba7-382c-455f-96fd-64ca703542c2`, inspected at `/tmp/refero-airbnb-no-homes-filters.jpg`.
- Adopted anatomy:
  - Large rounded filter sheet with centered title, explicit close affordance, grouped filter section, horizontal pill options, and sticky result-count CTA plus clear action.
  - Search/filter top row with a circular filter button and active-count badge.
  - Active filter summary with removable pill rhythm and clear-all action.
  - No-results remediation remains scenario-backed in unit coverage; the live dev backend was returning unresolved feed loading skeletons during Maestro, so the native QA pass focused on sheet and active-filter controls rather than a brittle empty fixture.
- Customized values:
  - Tasky categories, task count copy, tasker browse i18n, quote-request pricing state, Tasky tokens, trust banner, and Phase 1 list-first feed.
- Rejected Airbnb semantics:
  - Map-first browse toggle, travel listing cards/photos, guest filters, promoted/ranked listings, superhost or preferred-provider claims, and travel-specific availability language.

**Slice 2 execution and QA note:**

- Updated `TaskFeedFilterSheet` and `HomeScreen` to expose the Airbnb-derived sheet rhythm, active-filter badge, removable search/category filter chips, and result-count CTA while preserving Tasky-native components.
- Updated `TaskFeedCard` to render a clear quote-request pricing state when no fixed budget is provided.
- Added stable test IDs to shared `FilterBar` chips and the task-feed search field for scenario automation.
- Fixed the shared `TrustBanner` wrapper revealed by visual QA: background, border, and row layout now live on the same native view, removing the black outlined icon-only banner.
- Updated Tasker browse Maestro flows to use an explicit `appId` plus a second plain launch after clear state; this avoids a Maestro foregrounding failure observed after repeated clear-state runs.
- Focused verification passed:
  - `pnpm --filter @tasky/mobile test:unit -- TaskFeedScreen.test.tsx`
  - `pnpm verify:i18n`
  - `pnpm --filter @tasky/mobile format:check`
  - `pnpm --filter @tasky/mobile typecheck`
  - `pnpm --filter @tasky/mobile lint` (exit 0 with existing warnings)
  - `maestro check-syntax apps/mobile/maestro/flows/tasker-browse.yaml`
  - `maestro check-syntax apps/mobile/maestro/flows/capture-tasker-browse.yaml`
  - `maestro test apps/mobile/maestro/flows/tasker-browse.yaml`
  - `maestro test apps/mobile/maestro/flows/capture-tasker-browse.yaml`
  - `pnpm --filter @tasky/mobile structure:check`
  - `pnpm --filter @tasky/mobile test:e2e:smoke`
- Visual QA artifacts captured:
  - `screenshots/SCR-TASK-001-tasker-browse.png`
  - `screenshots/SCR-TASK-001-tasker-filter-sheet.png`
  - `screenshots/SCR-TASK-001-tasker-active-filters.png`

### Slice 3: Applicant Review

**Specs:** `SCR-CUST-009`, `SCR-CUST-011`, `SCR-CUST-013`

**Refero search intent:**

- Airbnb host/provider comparison, profile preview, booking decision rows, review evidence.

**Absorb:**

- Comparison rhythm, trust evidence placement, profile preview hierarchy, quote/timing/review row spacing.

**Customize:**

- Eligibility, verification, response quality, quote price, timing, completed jobs, thresholded rating rules.

**Reject:**

- Recommended/best-match cues, provider tiers, superhost badges, instant booking.

**QA:**

- Maestro or fixture-backed applicant review flow when data is available; otherwise capture seeded/component state and report fixture gap.

**Slice 3 applicant-review reference note:**

- Refero candidate searches:
  - `Airbnb host profile reviews before booking`
  - `Airbnb host profile reviews before booking comparison cards`
- Primary flow reference: Airbnb iOS Flow `6404`, contact-host/profile-review path.
- Primary screenshot reference: Airbnb iOS screen `c53eb45a-3fe2-493e-94fd-17e32b5aa0f6`, inspected at `/tmp/refero-airbnb-about-host-card.jpg`.
- Secondary screenshot references:
  - Airbnb iOS screen `60ca3624-39dc-467e-a6c8-9d80d4edadcc`, inspected at `/tmp/refero-airbnb-host-detail.jpg`.
  - Airbnb iOS screen `525be1bf-115a-4300-9731-950a85d941d2`, inspected at `/tmp/refero-airbnb-reviews-sheet.jpg`.
- Adopted anatomy:
  - Identity-first provider card with large avatar, verified profile copy, compact rating/completed-job proof, section label, divider-separated evidence rows, and a bottom decision row.
  - Accept confirmation uses a rounded bottom sheet, dimmed context, explicit close affordance, selected-provider summary, and full-width primary CTA.
- Customized values:
  - Tasky eligibility, identity verification, response quality, budget/quote evidence, completed jobs, review threshold rules, Tasky tokens, and i18n-backed copy.
- Rejected Airbnb semantics:
  - Recommended or best-match cues, Superhost/provider tier claims, ranking, instant booking, and travel-host semantics.

**Slice 3 execution and QA note:**

- Updated applicant review to render structured comparison signals instead of ranked/recommended cues, and updated customer task detail to derive applicant availability from the live applications query when task-list metadata omits `applicant_count`.
- Updated the accept-confirmation sheet to follow the inspected Airbnb bottom-sheet decision rhythm while keeping Tasky's explicit customer selection flow.
- Strengthened the shared avatar technical invariant so initials remain visible while remote avatar images load or fail; this was discovered during visual QA and protects the reusable primitive rather than encoding a one-off regression.
- Focused verification passed:
  - `pnpm verify:i18n`
  - `pnpm --filter @tasky/mobile test:unit -- ProfileAvatar.test.tsx TaskDetailCustomerScreen.test.tsx ApplicantsListScreen.test.tsx`
  - `pnpm --filter @tasky/mobile typecheck`
  - `pnpm --filter @tasky/mobile lint` (exit 0 with existing warnings)
  - `pnpm --filter @tasky/mobile format:check`
  - `pnpm --filter @tasky/mobile structure:check` (exit 0 with existing warnings)
  - `maestro check-syntax apps/mobile/maestro/flows/requires-fixture/JRN-CUST-02-review-applicants-&-confirm-booking-phase-0-1.yaml`
  - `maestro check-syntax apps/mobile/maestro/flows/requires-fixture/capture-applicant-review.yaml`
  - `maestro test apps/mobile/maestro/flows/_support/login-customer.yaml`
  - `maestro test apps/mobile/maestro/flows/requires-fixture/capture-applicant-review.yaml`
- Visual QA artifacts captured:
  - `screenshots/SCR-CUST-011-applicant-review.png`
  - `screenshots/SCR-CUST-011-applicant-confirm-sheet.png`
- `pnpm --filter @tasky/mobile test:e2e:smoke` was run but is currently blocked before app assertions by Maestro's Android driver `launchApp` timeout (`dadb.forwarding.TcpForwarder.waitFor`). The slice-specific Maestro QA passed by manually foregrounding the installed app with `adb shell monkey -p mn.tasky.mobile` and then running the customer login plus applicant capture flows.
- Slice stale-reference search found no stale runtime applicant selectors or ranking copy. Remaining `recommended` matches are screen-spec/plan guardrails, an unrelated phone-sharing warning string, generated iOS build-script text, and the applicant unit-test fixture that verifies unsupported ranking cues stay suppressed.

### Slice 4: Booking Detail

**Specs:** `SCR-CUST-017`, `SCR-TASK-013`

**Refero search intent:**

- Airbnb trip detail, reservation timeline, support/report reason sheet, cancellation flow.

**Absorb:**

- Timeline-first layout, address visibility hierarchy, policy/support sheet anatomy, destructive-action spacing, sticky next action.

**Customize:**

- Tasky booking states, exact-address reveal rule, direct settlement note, cancellation/no-show/dispute actions.

**Reject:**

- Travel itinerary assumptions, live tracking, refund/protection guarantees, payment rails.

**QA:**

- Maestro booking detail/support sheet pass where fixture exists; otherwise document fixture blocker and use unit/screenshot evidence.

**Slice 4 booking-detail reference note:**

- Refero candidate searches:
  - `Airbnb trip details reservation itinerary support cancellation flow`
  - `Airbnb reservation details itinerary cancellation support report issue`
  - `Airbnb trips upcoming reservation detail check in address host message cancellation policy`
  - `Airbnb trip reservation detail your trip host address check-in`
  - `Airbnb timeline history reservation events trip itinerary`
- Exact active Airbnb trip-detail screens were not available in the returned Refero set. The selected alternate Airbnb screenshots are sufficient because they cover the same component anatomy Tasky needs: detail-section stack, action/support hierarchy, reason-sheet structure, privacy/support note, and sticky primary action behavior.
- Primary screenshot reference: Airbnb iOS screen `79ed2536-c72e-43cf-8d25-3eb7f240b7f1`, inspected at `/tmp/refero-airbnb-booking-detail-sections.jpg`.
- Secondary screenshot references:
  - Airbnb iOS screen `9a06d535-ca0e-4467-98ae-231c6956a690`, inspected at `/tmp/refero-airbnb-report-reasons-selected.jpg`.
  - Airbnb iOS screen `fc12b242-328a-41c1-8559-53fabc16e690`, inspected at `/tmp/refero-airbnb-support-chat-card.jpg`.
- Adopted anatomy:
  - Status/timeline-first detail rhythm, divider-separated section stack, exact-address hierarchy, direct payment note placement, action rows, rounded support reason sheet, lock/privacy support note, and sticky primary support action.
- Customized values:
  - Tasky booking states, exact-address reveal after confirmation, direct customer-tasker settlement, no-show/support actions, Tasky tokens, and i18n-backed copy.
- Rejected Airbnb semantics:
  - Travel itinerary assumptions, live check-in/tracking, refund or protection guarantees, payment processing, escrow, and platform payment rails.

**Slice 4 execution and QA note:**

- Updated customer and tasker booking detail surfaces to use the absorbed detail-section rhythm with explicit address visibility, direct-settlement payment notes, timeline/status context, and structured action rows.
- Updated the shared booking support sheet to follow the inspected Airbnb reason-sheet anatomy while keeping Tasky's support/dispute semantics and no payment-protection claims.
- Updated routed booking/job list selectors so Maestro can open active booking/job detail states from the role-aware tabs.
- Focused verification passed:
  - `pnpm verify:i18n`
  - `pnpm --filter @tasky/mobile test:unit -- BookingDetailScreen.test.tsx BookingDetailTasker.test.tsx`
  - `pnpm --filter @tasky/mobile typecheck`
  - `pnpm --filter @tasky/mobile lint` (exit 0 with existing warnings)
  - `pnpm --filter @tasky/mobile format:check`
  - `pnpm --filter @tasky/mobile structure:check` (exit 0 with existing warnings)
  - `maestro check-syntax apps/mobile/maestro/flows/requires-fixture/capture-booking-detail-customer.yaml`
  - `maestro check-syntax apps/mobile/maestro/flows/requires-fixture/capture-booking-detail-tasker.yaml`
  - `maestro test apps/mobile/maestro/flows/_support/login-customer.yaml`
  - `maestro test apps/mobile/maestro/flows/requires-fixture/capture-booking-detail-customer.yaml`
  - `maestro test apps/mobile/maestro/flows/_support/login-tasker.yaml`
  - `maestro test apps/mobile/maestro/flows/requires-fixture/capture-booking-detail-tasker.yaml`
- Visual QA artifacts captured:
  - `screenshots/SCR-CUST-017-booking-detail.png`
  - `screenshots/SCR-CUST-017-booking-detail-summary.png`
  - `screenshots/SCR-CUST-017-no-show-sheet.png`
  - `screenshots/SCR-TASK-013-booking-detail.png`
  - `screenshots/SCR-TASK-013-booking-detail-summary.png`
  - `screenshots/SCR-TASK-013-support-sheet.png`
- Customer fixture state is currently `ASSIGNED`, so customer QA captured the no-show recourse sheet rather than the support/report reason sheet. Tasker QA captured the shared support reason sheet.
- `pnpm --filter @tasky/mobile test:e2e:smoke` was run and failed before app assertions because Maestro could not launch `mn.tasky.mobile` with clear state. Slice-specific Maestro QA passed through direct app foregrounding and role-specific login flows.
- Slice stale-reference search found no new runtime booking-detail copy claiming payment protection, escrow, wallet, refund guarantees, or old generic support prompt copy. Remaining matches are guardrail docs, deferred future-phase escrow/wallet artifacts, and tests that assert unsupported claims are absent.

### Slice 5: Profile And Reviews

**Specs:** `SCR-SHARED-012`, `SCR-CUST-013`

**Refero search intent:**

- Airbnb profile reviews, review summary, search/filter reviews, low-review or no-review states.

**Absorb:**

- Profile header spacing, review summary anatomy, search/filter layout, review-card rhythm, anchored sections.

**Customize:**

- Tasky review threshold, verified eligibility, completed jobs, service categories, Tasky copy.

**Reject:**

- Superhost-style badges, percentile labels, ranking, unsupported rating claims.

**QA:**

- Maestro profile/reviews pass plus screenshot comparison for thresholded and sufficient-review states.

**Slice 5 Refero references recorded before implementation:**

- Search queries:
  - `Airbnb profile reviews review summary search filter mobile`
  - `Airbnb profile public rating appears after 3 reviews no reviews yet host profile`
  - `Airbnb searching for reviews profile reviews mobile`
- Selected screenshot references:
  - Airbnb iOS screen `78e5d7cc-580b-4e7f-8953-f2e8d7dba443`, inspected at `/tmp/refero-airbnb-reviews-summary.jpg`.
  - Airbnb iOS screen `8a00585e-243d-428e-b29b-d9d799f9d2f4`, inspected at `/tmp/refero-airbnb-reviews-no-results.jpg`.
  - Airbnb iOS screen `60ca3624-39dc-467e-a6c8-9d80d4edadcc`, inspected at `/tmp/refero-airbnb-low-review-host.jpg`.
  - Airbnb iOS screen `525be1bf-115a-4300-9731-950a85d941d2`, inspected at `/tmp/refero-airbnb-reviews-bottom-sheet.jpg`.
- Adopted anatomy:
  - Profile hero card, verified identity cue, review summary module, review search/filter controls, no-results copy rhythm, and neutral low-review treatment before public aggregate ratings appear.
- Customized values:
  - Tasky profile roles, verified eligibility, completed-job history, no pre-booking direct contact, Tasky locales/tokens, and review-count threshold gating from the screen specs.
- Rejected Airbnb semantics:
  - Superhost-style badges, percentile or ranking claims, travel-history claims, direct pre-booking contact, and aggregate rating display before the minimum public review count is met.

**Slice 5 execution and QA note:**

- Updated customer public tasker profiles and signed-in profile tabs to use the absorbed profile/reviews scaffold while preserving Tasky's public-rating threshold policy.
- Tightened public rating logic to use actual review count instead of completed-job count; completed jobs remain visible as a separate trust signal.
- Removed the pre-booking profile contact CTA and route-seeded public profile snapshots from applicant/task/booking surfaces so customer profile drill-in works without a nonexistent public-profile endpoint call.
- Deleted superseded profile components (`ProfileView`, `TaskerPublicProfile`) and pointed `/profile/[id]` at the canonical `TaskerProfileScreen`.
- Focused verification passed:
  - `pnpm verify:i18n`
  - `pnpm --filter @tasky/mobile test:unit -- TaskerProfileScreen.test.tsx MyProfileScreen.test.tsx ApplicantsListScreen.test.tsx BookingDetailScreen.test.tsx TaskDetailCustomerScreen.test.tsx`
  - `pnpm --filter @tasky/mobile typecheck`
  - `pnpm --filter @tasky/mobile format:check`
  - `pnpm --filter @tasky/mobile lint` (exit 0 with existing warnings)
  - `pnpm --filter @tasky/mobile structure:check` (exit 0 with existing warnings)
  - `maestro check-syntax apps/mobile/maestro/flows/requires-fixture/capture-profile-reviews-customer.yaml`
  - `maestro check-syntax apps/mobile/maestro/flows/requires-fixture/capture-profile-reviews-tasker.yaml`
  - `maestro test apps/mobile/maestro/flows/_support/login-customer.yaml`
  - `maestro test apps/mobile/maestro/flows/requires-fixture/capture-profile-reviews-customer.yaml`
  - `maestro test apps/mobile/maestro/flows/_support/login-tasker.yaml`
  - `maestro test apps/mobile/maestro/flows/requires-fixture/capture-profile-reviews-tasker.yaml`
- Visual QA artifacts captured:
  - `screenshots/SCR-SHARED-012-profile-customer.png`
  - `screenshots/SCR-CUST-013-tasker-profile.png`
  - `screenshots/SCR-CUST-013-tasker-profile-low-review.png`
  - `screenshots/SCR-SHARED-012-profile-tasker.png`
- Current seeded public profile has zero fetched reviews, so Maestro correctly skipped the review search/no-results branch and captured the low-review state instead of a rating summary.
- `pnpm --filter @tasky/mobile test:e2e:smoke` was run and failed before app assertions because Maestro could not launch `mn.tasky.mobile` with clear state. Slice-specific Maestro QA passed through direct app foregrounding and role-specific login flows.
- Slice stale-reference search found no remaining runtime `ProfileView`, `TaskerPublicProfile`, `publicProfile`, or missing `/users/{id}` public-profile fetch path. Remaining escrow/wallet/recommended matches are guardrail docs, deferred future-phase flows/locales, and tests asserting unsupported ranking/protection claims stay absent.

## Implementation Rules

- Before code changes, paste or record the selected Refero reference IDs in the slice notes.
- Prefer adapting existing mobile primitives, but change draft primitives/tokens when the reference exposes better spacing or hierarchy.
- Keep implementation screen-family compliant: screen composition, `use<Screen>Screen` orchestration, pure model helpers, semantic sections, shared primitives/components.
- All user-visible copy goes through `apps/mobile/src/locales/{en,mn}/translation.json`.
- Tests must cover stable scenario/spec behavior, not one-off bug observations.

## Dead-Code Discipline

Dead-code cleanup happens in two lanes:

1. **During each absorption slice:** delete code clearly replaced by the slice. This includes stale imports, obsolete props, old testIDs, duplicated view-model helpers, unreachable component branches, and replaced components. Do not leave directly superseded code for a later cleanup pass.
2. **After each slice QA:** run a narrow stale-reference check before starting the next slice. At minimum, use `rg` for removed selectors/component names/product claims, then run the slice's typecheck, lint, structure, unit, i18n, and Maestro QA gates.
3. **After the proof subset:** run a dedicated cleanup pass for cross-cutting leftovers that require broader judgment, including unused dependencies, stale locale keys, dormant-but-accidentally-reachable future-phase flows, obsolete Maestro selectors, old design docs, and ambiguous future-phase code.

Do not mix speculative cleanup into UX absorption. Delete code when it is clearly replaced or unreachable; defer ambiguous dormant Phase 3 or future-phase surfaces to the dedicated cleanup pass and tie decisions back to PRD, rollout phase, and screen-spec contracts.

## Verification Gates

Run after each slice:

```bash
pnpm verify:i18n
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit -- <focused test files>
pnpm --filter @tasky/mobile lint
pnpm --filter @tasky/mobile structure:check
pnpm --filter @tasky/mobile test:e2e:smoke
```

Before implementation in each slice, record the fetched Airbnb screenshot reference in the slice absorption note. Prefer the exact Tasky-equivalent Airbnb screen; if unavailable, record the alternate component/anatomy screenshot and the reason it is sufficient. A description-only fallback requires explicit user approval.

Also run a slice-local stale-reference search before moving to the next slice:

```bash
rg "<removed-selector-or-component-or-claim>" apps/mobile docs/design docs/plans
```

Run after docs/spec updates:

```bash
python3 tooling/scripts/governance/validate-screen-spec-traceability.py
pnpm repo:docs:check
```

## Known Risks

- This subset can create temporary design inconsistency with non-proof surfaces. That is acceptable only because this plan is validating workflow quality before wider adoption.
- Refero search returns many plausible screens. The agent must choose references deliberately and show why non-selected results were rejected.
- Airbnb has product semantics Tasky must not copy. Screen specs and PRD constraints are the guardrail.
- Spacing absorption may require revising draft Tasky primitives. Treat that as acceptable when it improves the mapped screen and remains token-driven.
- Maestro depends on a working emulator, installed app, and backend/dev-auth state. If blocked, report the exact dependency and keep screenshot/unit evidence separate from completed QA.

## Expansion Checkpoint

After Slice 5, review whether the workflow produced measurably better mobile UX without violating Tasky contracts. Only then create a separate full-app absorption plan that covers every non-onboarding mobile surface, including app shell, customer task management, customer booking and recourse, tasker discovery, tasker verification, tasker jobs, communication, settings, notifications, help, legal, and infra states.

General onboarding, auth primers, splash, and permission primers remain outside this proof-surface plan.
