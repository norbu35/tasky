# Maestro Screenshot Baselines

**Device:** iPhone 15 Pro
**OS:** iOS 17.4
**Simulator:** Xcode 16

All baselines captured on this device/OS combination.
Regenerate baselines when changing device or OS version.

## Phase Coverage

### Phase 0+1 (Foundation)
No baselines needed — only primitives and templates changed, not screen layouts.

### Phase 2 (Screen Migration)
Before migrating each Wave batch, capture screenshots for:
- All screens in the batch
- Any screens that import components from the batch

## Relevant Maestro Flows by Wave

### Wave 1 (Tasks 18-24)
Map the following screens to their Maestro flows:

| Screen | Route | Maestro Flow |
|--------|-------|-------------|
| wallet/payout | (tasker)/wallet/payout | JRN-TASK-06-wallet-management |
| verification/consent | (tasker)/verification/consent | JRN-TASK-01-consent-and-verification |
| tasks/new/success | (customer)/tasks/new/success | JRN-CUST-01-post-a-task |
| auth/index | (auth)/index | JRN-SHARED-01-first-launch-&-onboarding, auth-onboarding |
| role-select | (auth)/role-select | JRN-SHARED-01-first-launch-&-onboarding |
| tabs/index | (tabs)/index | smoke-tab-navigation |
| onboarding | onboarding | JRN-SHARED-01-first-launch-&-onboarding, auth-onboarding |
| otp | (auth)/otp | JRN-SHARED-02-phase-2-otp-migration, JRN-SHARED-03-phase-2-otp-login-new-user |
| tasks/new/category | (customer)/tasks/new/category | JRN-CUST-01-post-a-task, customer-task-creation |
| legal/terms | (shared)/legal/terms | SCR-INFRA-004-terms-of-service |
| bookings/confirmed | (customer)/bookings/confirmed | JRN-CUST-02-review-applicants-&-confirm-booking-phase-0-1 |
| tasks/[taskId]/applicants | (customer)/tasks/[taskId]/applicants | JRN-CUST-02-review-applicants-&-confirm-booking-phase-0-1 |
| help | (shared)/help | - |
| bookings/[bookingId]/reschedule | (customer)/bookings/[bookingId]/reschedule | JRN-CUST-04-reschedule-confirmed-booking-phase-0-1 |
| disputes/[disputeId]/index | (customer)/disputes/[disputeId]/index | JRN-CUST-06-raise-&-track-dispute |

## Naming Conventions

Per `docs/quality/mobile-maestro-authoring-rules.md`:

- Journey flows: `JRN-<ID>-<slug>.yaml` (e.g., `JRN-CUST-01-post-a-task.yaml`)
- Screen smoke/state flows: `SCR-<ID>-<state-or-purpose>.yaml` (e.g., `SCR-INFRA-004-terms-of-service.yaml`)
- Shared helpers: `_support/<name>.yaml`

## Authority References

When in doubt, consult:
- Flow authority: `docs/design/journey-catalog.yaml`
- Screen specs: `docs/design/screen-specs/SCR-*.yaml`
- State matrix: `docs/design/state-matrix.yaml`
- Screen inventory (synchronized summary only): `docs/design/screen-inventory.yaml`
