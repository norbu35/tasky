# Tasky Redesign Proof-Screen Contract

**Date:** 2026-04-26
**Status:** Draft proof-screen contract for review
**Parent thesis:** `docs/plans/2026-04-26-tasky-redesign-thesis.md`
**Reference matrix:** `docs/plans/2026-04-26-tasky-redesign-reference-matrix.md`

## Purpose

This contract translates the approved redesign thesis into five proof-screen briefs. It does not implement runtime UI and does not activate deferred product behavior.

## Shared proof rules

- Use `guided`, `balanced`, and `operational` density deliberately.
- Treat `Verified tasker` as eligibility, not a rank.
- Use contextual trust modules at risk points.
- Preserve approximate location before confirmation and exact address only after confirmation.
- Preserve direct settlement and avoid payment-protection copy.
- Preserve the Phase 1 no-open-ended-pre-booking-chat rule; applicant communication remains structured pricing response plus short structured note.
- Keep review-threshold behavior governed by `docs/PRD.md`; proof screens may show neutral low-review states but must not invent reputation ranking.
- Keep runtime copy implementation i18n-backed when runtime work begins.
- Keep final per-screen copy and traceability owned by active `docs/design/screen-specs/SCR-*.yaml` files before implementation.
- Treat Airbnb as mobile interaction scaffolding only; do not copy Airbnb visual styling, travel-specific copy, guarantee
  framing, instant booking, map-first browsing, provider ranking, or payment protection patterns.

## Proof screens

### 1. Customer task posting

**Specs:** `SCR-CUST-002`, `SCR-CUST-003`, `SCR-CUST-004`, `SCR-CUST-005`, `SCR-CUST-006`, `SCR-CUST-007`, `SCR-CUST-008`
**Density:** `guided`
**Proof scope:** The trust cues are proven across the posting wizard surface, not necessarily rendered on every individual step.
**Primary proof:** A customer can move through structured posting with enough guidance to feel confident, without making the flow feel slow.
**Trust cues:** structured scope, address privacy, pricing mode clarity, deterministic summary, success next steps.
**Web pattern:** stepper or split layout with sticky summary after enough data exists.
**Mobile pattern:** native step flow with sticky bottom CTA and short contextual helper rows.
**Airbnb mobile scaffold:** guided creation rhythm, progressive disclosure, bottom-sheet pickers, review-before-post summary, sticky CTA, and edit-in-place summary rows.
**Rejected Refero pattern:** Do not copy commerce checkout payment/protection language; Tasky Phase 1 ends in direct settlement, not in-platform checkout.

### 2. Tasker task feed

**Specs:** `SCR-TASK-001`
**Density:** `operational`
**Primary proof:** A verified or pending tasker can scan available work quickly and understand price, location, schedule, and eligibility.
**Trust cues:** verified-required apply state, approximate location, no pre-booking chat expectation, clear task freshness/status.
**Web pattern:** dense list with filters and metadata hierarchy.
**Mobile pattern:** compact task cards with filter sheet and stable apply affordance.
**Airbnb mobile scaffold:** filter sheet, active-filter summary, result-count CTA, no-results remediation, and dense Tasky metadata cards.
**Rejected Refero pattern:** Do not copy job-board ranking, promoted listing, or algorithmic recommendation badges; verification is eligibility, not tasker preference.

### 3. Customer task detail / applicant review

**Specs:** `SCR-CUST-009`, `SCR-CUST-011`, `SCR-CUST-013`
**Density:** `balanced`
**Primary proof:** A customer can compare applicants without fake ranking and choose a tasker with process-backed confidence.
**State proof:** Selection is not instant booking; the proof must show pending selected-tasker acceptance, confirmation only after acceptance/recording/liability acknowledgement/locked price, and expiry back to selectable applicants.
**Trust cues:** task detail and applicant list carry structured pricing response, approximate location until booking, and pending-acceptance expiry; public profile contributes verified eligibility, completed jobs, review-threshold state, service categories, and no direct contact before booking.
**Web pattern:** task detail plus applicant comparison pane or sticky applicant summary.
**Mobile pattern:** task detail stack, applicants list, and public profile as focused native screens/sheets.
**Airbnb mobile scaffold:** structured comparison rows using eligibility, verification, response quality, quote, timing, completed jobs, and thresholded review evidence.
**Rejected Refero pattern:** Do not copy dating-style swipe selection, open chat threads, or "best match" ordering; applicants remain customer-reviewed without fake ranking.

### 4. Booking detail

**Specs:** `SCR-CUST-017`, `SCR-TASK-013`
**Density:** `balanced`
**Primary proof:** Both roles can understand booking state, next action, address visibility, contact availability, and recourse.
**Trust cues:** lifecycle timeline, exact address reveal rule, platform-mediated contact, cancellation/no-show warnings, dispute entry.
**Web pattern:** two-column detail with lifecycle rail and action summary.
**Mobile pattern:** timeline-first detail with sticky next action and contextual sheets for risky actions.
**Airbnb mobile scaffold:** timeline-first booking detail, address visibility note, direct-settlement payment note, completion/cancellation actions, and support reason sheets.
**Rejected Refero pattern:** Do not copy travel or delivery live-tracking expectations; the proof should clarify booking state without implying real-time worker tracking.

### 5. Profile / reviews

**Specs:** `SCR-SHARED-012`, `SCR-CUST-013`
**Density:** `balanced`
**Primary proof:** Profiles feel human and trustworthy while respecting early-launch low-review reality.
**Trust cues:** verified eligibility, review threshold, completed jobs, role-specific review dimensions, neutral no-review state.
**Web pattern:** profile hero plus trust/reputation sections.
**Mobile pattern:** avatar hero, trust summary, compact review cards, edit/booking CTA where applicable.
**Airbnb mobile scaffold:** review summary/search/filter scaffolding with aggregate rating hidden behind the Tasky review threshold and a neutral low-review state before then.
**Rejected Refero pattern:** Do not copy creator marketplace badges, level systems, or public performance tiers; low-review launch profiles need neutral trust context.

## Acceptance criteria before runtime implementation

- Each proof surface names target density, trust cues, web pattern, and mobile pattern.
- Each proof surface rejects at least one unsuitable Refero pattern.
- Active screen-spec edits stay aligned with live PRD and journey refs.
- No proof screen adds Phase 2, Phase 3, or Phase 4 product behavior.
- Runtime implementation slices receive a Maestro QA pass after each slice when the Maestro CLI and device target are available; blocked local runs must report the missing dependency.
- `python3 tooling/scripts/governance/validate-screen-spec-traceability.py` passes after screen-spec edits.
- `pnpm repo:docs:check` passes before handoff.
