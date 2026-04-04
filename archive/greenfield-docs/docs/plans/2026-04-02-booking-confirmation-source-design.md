# Booking Confirmation Source Design
**Date:** 2026-04-02
**Status:** Proposed

## Goal

Make `SCR-CUST-023` rebook and `SCR-CUST-027` instant match reach the same customer-facing confirmation surface as `SCR-CUST-014` without routing invalid payloads through `acceptApplication`.

## Current Findings

- `POST /tasks/{id}/applications/{applicationId}/accept` is the only implemented booking-confirmation contract.
- That contract is correct for selected-applicant confirmation and already has scenario coverage (`SCN-BOOK-007`, `SCN-BOOK-008`).
- `POST /bookings/{id}/rebook` creates a new `Task` and returns only that `Task`.
- `/tasks/{id}/instant-match` is still marked deferred in `docs/API.yaml` and Phase 3+ in `docs/PRD.md`.
- The mobile refresh screens for rebook and instant match exist, but the exact confirm handoff is currently constrained by missing backend support.
- Backend testing rules block new backend tests unless QA-authored scenarios exist in `tests/scenarios/`.

## Constraints

- Do not destabilize the current applicant-acceptance path.
- Do not fake `applicationId` or silently coerce unsupported flows into `acceptApplication`.
- Keep instant match phase-gated to Phase 3+.
- Preserve API-first workflow: `docs/API.yaml` first, then SDK generation, then backend/frontend changes.
- Respect backend scenario rules: no new backend tests without authored scenarios.

## Options Considered

### Option 1: Overload `acceptApplication`

Allow `acceptApplication` to accept nullable `applicationId` plus a mode flag for rebook or instant match.

Why not:
- corrupts the semantics of a stable endpoint
- weakens validation and idempotency guarantees
- increases regression risk on the already-working application flow

### Option 2: Separate confirmation screens per source

Create dedicated rebook-confirm and instant-match-confirm screens and dedicated backend endpoints.

Why not:
- duplicates UI and tests
- drifts visual parity for `SCR-CUST-014`
- creates more routing and translation surface than necessary

### Option 3: Hybrid source-aware confirmation

Keep `acceptApplication` exactly as-is for applicant confirmation. Add a new booking-intent contract only for non-application sources (`REBOOK`, `INSTANT_MATCH`). Keep one confirmation UI that submits to different mutations by source.

Recommendation: use this option.

## Recommended Design

### Source Model

The booking confirmation screen accepts a `source` param:

- `application`
- `rebook`
- `instant_match`

Behavior:

- `application`: use the existing `acceptApplication` mutation
- `rebook`: use a new booking-intent confirmation contract
- `instant_match`: use the same booking-intent confirmation contract, but only when the Phase 3 instant-match source is available

### New Backend Contract

Introduce a new intent resource for non-application confirmation only.

Proposed shapes:

- `POST /tasks/{id}/booking-intents`
  - `source: REBOOK | INSTANT_MATCH`
  - `original_booking_id` required for `REBOOK`
  - `offer_id` required for `INSTANT_MATCH`
  - returns a `BookingIntent`
- `GET /booking-intents/{id}`
  - optional readback for refresh/re-entry
- `POST /booking-intents/{id}/confirm`
  - requires `liability_disclaimer_accepted=true`
  - creates the booking and transitions the task appropriately

`BookingIntent` should contain:

- `id`
- `source`
- `task_id`
- `tasker_id`
- task summary snapshot for the confirm UI
- tasker summary snapshot for the confirm UI
- `expires_at` when applicable
- `status`

### Rebook Flow

Keep the current `POST /bookings/{id}/rebook` endpoint for task creation.

New sequence:

1. customer taps rebook
2. app calls `POST /bookings/{id}/rebook`
3. app receives new `task_id`
4. app calls `POST /tasks/{task_id}/booking-intents` with `source=REBOOK` and `original_booking_id`
5. app navigates to `SCR-CUST-014` with `source=rebook` and `bookingIntentId`
6. confirm screen calls `POST /booking-intents/{id}/confirm`

Why this is surgical:

- no breaking change to the existing rebook endpoint
- original booking remains the source of tasker identity and validation
- confirmation path stays explicit and auditable

### Instant Match Flow

Keep this Phase 3+ only.

New sequence once instant match exists:

1. instant-match engine creates or selects an offer candidate
2. when customer reaches confirmable matched state, app calls `POST /tasks/{taskId}/booking-intents` with `source=INSTANT_MATCH` and `offer_id`
3. app navigates to `SCR-CUST-014` with `source=instant_match` and `bookingIntentId`
4. confirm screen calls `POST /booking-intents/{id}/confirm`

This reuses the same UI as rebook, but the backend keeps source-specific validation.

## Backend Rules

### Rebook intent validation

- original booking must exist
- original booking must be `COMPLETED`
- caller must be the original customer
- new task must belong to the caller
- original booking must identify the rebooked tasker

### Instant-match intent validation

- endpoint remains phase-gated until Phase 3+ activation
- task must be eligible for instant match
- referenced offer must exist, be active, and belong to the task
- confirm window expiry must be enforced

### Confirmation validation

- liability disclaimer acceptance required
- intent must be active and not expired
- confirm must be idempotent
- repeat confirmation returns the existing booking

## Testing Implications

Existing scenario coverage is sufficient for the applicant path only.

Before backend implementation, QA-authored scenarios must exist for:

- rebook intent creation and confirmation
- expired or invalid rebook intent rejection
- instant-match intent confirmation and expiry behavior

Until those scenarios exist, backend implementation should not be landed.

## Recommended Delivery Order

1. Add design and implementation docs
2. Add task tracking entries
3. Obtain QA-authored booking scenarios for rebook and instant-match confirmation
4. Update `docs/API.yaml` and regenerate SDK
5. Implement rebook intent flow end-to-end
6. Implement instant-match intent flow only when Phase 3 activation is in scope
