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
- Retrieve actual screenshot content with `mcp__refero__refero_get_screen_content` before implementation.
- Absorb Airbnb's spacing and hierarchy, not just high-level structure.
- Customize Tasky-owned values: color, typography, copy, icons where needed, content model, i18n, and product rules.
- Keep Phase 1 boundaries: no instant booking, map-first browsing, payment protection, escrow/deposits, provider ranking, superhost-style tiers, or unsupported guarantee language.
- Do not add one-off regression tests for incidental findings. Strengthen scenario/spec-backed behavioral tests or technical invariant tests only.
- Run a Maestro QA pass after each runtime slice and inspect screenshots against the selected Refero references.

## Reference Selection Protocol

For every slice:

1. Read the relevant `SCR-*` screen specs and linked `REQ-P1`/`NFR`, `JRN`, and `SCN` refs.
2. Run at least two Refero searches:
   - `mcp__refero__refero_search_screens` with an Airbnb-specific query for the screen pattern.
   - `mcp__refero__refero_search_flows` when the slice is a multi-step journey.
3. Review returned results and shortlist 2-4 candidates.
4. Retrieve the actual screenshots for shortlisted candidates with `mcp__refero__refero_get_screen_content`.
5. Choose one primary Airbnb reference and optional secondary references.
6. Record a slice absorption note:
   - Refero query strings.
   - Selected screen or flow IDs.
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

## Implementation Rules

- Before code changes, paste or record the selected Refero reference IDs in the slice notes.
- Prefer adapting existing mobile primitives, but change draft primitives/tokens when the reference exposes better spacing or hierarchy.
- Keep implementation screen-family compliant: screen composition, `use<Screen>Screen` orchestration, pure model helpers, semantic sections, shared primitives/components.
- All user-visible copy goes through `apps/mobile/src/locales/{en,mn}/translation.json`.
- Tests must cover stable scenario/spec behavior, not one-off bug observations.

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
