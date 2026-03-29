# Design: Booking Enforcement Gaps + Workflow Hardening

**Date:** 2026-03-29
**Branch:** agent/test-reform-infrastructure
**PRD refs:** REQ-BOOK-04, REQ-BOOK-03
**Scenarios addressed:** SCN-BOOK-004, SCN-BOOK-007

---

## Problem

Two enforcement gaps exist in the booking domain where the PRD requires a side-effect to be enforced but it is only recorded (or not tested at the right boundary):

1. **SCN-BOOK-004 (REQ-BOOK-04):** A second late customer cancellation within 28 days writes a `CUSTOMER_LATE_CANCEL_PENALTY` incident row but never revokes Instant Match access. The test only asserts on the `incidentDao.insert(...)` invocation — it does not verify the enforcement action.

2. **SCN-BOOK-007 (REQ-BOOK-03):** Booking creation without liability disclaimer acceptance is not rejected. The test asserts only that a freshly-created booking has `liabilityDisclaimerAccepted() == false`; it never attempts a creation-without-disclaimer and never asserts rejection.

**Root cause:** Both tests were written to describe current code behaviour rather than derived from the scenario spec. Invocation-only assertions pass even when enforcement is absent. PIT mutation testing that would surface weak assertions runs only in the nightly `gateFull`, not on PR merge.

---

## Approach

Fix both gaps (production code + tests), then add a mechanical gate so the same failure mode cannot reach `main` undetected.

---

## Section 1: Production Code Changes

### SCN-BOOK-004 — Instant Match revocation

**Schema (new Flyway migration):**

```sql
ALTER TABLE user_profiles
  ADD COLUMN instant_match_revoked_until TIMESTAMPTZ NULL;
```

`NULL` means unrestricted. A future timestamp means Instant Match is blocked until that point (self-expiring — no background job required).

**`AuthService` additions:**

```java
// Revoke Instant Match access for the given duration from now.
public void revokeInstantMatch(String userId, Duration duration) {
    Instant revokedUntil = Instant.now().plus(duration);
    profileDao.setInstantMatchRevokedUntil(userId, revokedUntil);
}

// Returns true if the user may use Instant Match right now.
public boolean isInstantMatchAllowed(String userId) {
    return profileDao.findByUserId(userId)
        .map(p -> p.instantMatchRevokedUntil() == null
               || Instant.now().isAfter(p.instantMatchRevokedUntil()))
        .orElse(true);
}
```

**`BookingService.cancelBooking` change:**

After inserting the `CUSTOMER_LATE_CANCEL_PENALTY` incident, call:

```java
authService.revokeInstantMatch(userId, Duration.ofDays(30));
```

The incident write and the revocation share the existing `@Transactional` boundary — both succeed or both roll back.

**Matching flow (out of scope for this task):**

The matching flow must call `authService.isInstantMatchAllowed(customerId)` before offering Instant Match to a customer. A `// TODO: check isInstantMatchAllowed before offering Instant Match (SCN-BOOK-004)` comment is added at the relevant call site to track this.

---

### SCN-BOOK-007 — Disclaimer enforcement at the acceptance boundary

`BookingService.createBooking` is kept as a flexible primitive (used in test scaffolding with `liabilityDisclaimerAccepted = false` by design). The guard lives at the HTTP entry point for "customer confirms applicant" — the task application acceptance service (to be located during implementation; expected in the `task` domain).

That service receives `liabilityDisclaimerAccepted` from the HTTP request. If `false`, it returns `DISCLAIMER_REQUIRED` before calling `createBooking`. No new return type is added to `BookingService`.

---

## Section 2: Test Corrections

### SCN-BOOK-004

The existing `verify(incidentDao).insert(... "CUSTOMER_LATE_CANCEL_PENALTY" ...)` assertion is retained and a second assertion is added:

```java
verify(authService).revokeInstantMatch(eq("customer-1"), eq(Duration.ofDays(30)));
```

Both assertions must be present — the recording and the enforcement are independently covered. PIT will generate a mutant removing `revokeInstantMatch`; that mutant now dies on the new assertion.

### SCN-BOOK-007

The current test in `BookingScenarioTests` that asserts only on construction state is deleted. A replacement test is written in the test class for the task application acceptance service (same domain-unit test constraints: no Spring annotations, mock only external boundaries). The replacement test:

1. Sets up a booking request with `liabilityDisclaimerAccepted = false`
2. Calls the acceptance entry point
3. Asserts the result carries `DISCLAIMER_REQUIRED` and no booking is persisted

---

## Section 3: Workflow Hardening

### Move PIT to the Regression gate

`build.gradle.kts` currently runs `pitest` only under `gateFull`. Change: add a scoped PIT task to `gateRegression` targeting `mn.tasky.booking.*` and `mn.tasky.auth.*`. The kill floor is set to the current baseline kill rate (read from the last `gateFull` report) rounded down to the nearest 5%, with a hard minimum of 60%. This avoids blocking PRs on an unreachable floor while still catching regressions. The target is 80% once all High-tier scenarios in both packages are covered. Full-module mutation stays in `gateFull` unchanged.

`scripts/check-gates.sh` gains a booking/auth floor entry for `gateRegression`.

**Rationale:** Both weak tests in this incident would have failed mutation testing. A mutant removing `authService.revokeInstantMatch(...)` survives the old verify-only assertion but dies on the corrected one. Running PIT on every PR merge in the affected packages catches this class of gap mechanically, without relying on reviewer attention.

### AGENTS.md rule addition

New entry under **Backend Testing Rules / MUST NOT**:

> Never assert only on a mock invocation for a 'Then' clause that describes enforcement or state change — also assert on the observable effect (the downstream call, state, or error) that the clause requires. Invocation proves the code ran; the effect proves it did the right thing.

This rule explains *why* the mutation gate exists. The gate enforces it mechanically; the rule makes the intent legible to future agents.

---

## Sequence of Deliverables

1. Flyway migration — `instant_match_revoked_until` column
2. `ProfileDao.setInstantMatchRevokedUntil` + `UserProfileState` field
3. `AuthService.revokeInstantMatch` + `AuthService.isInstantMatchAllowed`
4. `BookingService.cancelBooking` — call `revokeInstantMatch` after penalty insert
5. SCN-BOOK-004 test — add `revokeInstantMatch` assertion
6. SCN-BOOK-007 — locate acceptance service, add disclaimer guard, move/rewrite test
7. `build.gradle.kts` + `check-gates.sh` — scoped PIT on `gateRegression`
8. AGENTS.md — add MUST NOT rule

All eight deliverables ship in one PR on this branch.
