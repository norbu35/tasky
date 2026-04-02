# TASK-002: Add source-aware booking confirmation for rebook and phase-gated instant match

**Status:** todo
**Priority:** high

## Description

The current booking confirmation contract only supports selected-applicant acceptance via
`POST /tasks/{id}/applications/{applicationId}/accept`. That is correct for `REQ-BOOK-03`,
but it leaves `REQ-BOOK-07` rebook and `REQ-BOOK-08` instant match without a valid way to
reach the shared booking-confirmation surface. Implement a source-aware confirmation model
that preserves the existing applicant path, adds a booking-intent contract for rebook, and
keeps instant match explicitly Phase 3-gated until backend support and QA-authored scenarios exist.

## Done When
- `docs/API.yaml` defines a non-application booking-intent contract for confirmation sources beyond applicant acceptance
- `pnpm sdk:generate` is run and generated SDK changes are committed
- Rebook flow reaches the booking-confirmation surface with a real backend-backed intent instead of fake `applicationId` params
- `acceptApplication` remains unchanged for the applicant-confirmation path
- Instant-match confirmation remains deferred unless Phase 3 activation and QA-authored booking scenarios are available
- Mobile and web confirmation screens branch by source without regressing the existing applicant flow
