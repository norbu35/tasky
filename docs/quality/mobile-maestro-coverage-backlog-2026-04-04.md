# Mobile Maestro Coverage Backlog (2026-04-04)

**Last updated:** 2026-04-05 — implementation status column added from repomix static analysis.
See `docs/quality/mobile-implementation-status-2026-04-05.md` for full per-screen audit.

## Purpose

Define the complete Maestro coverage backlog using the repaired authority chain:
- flow authority: `docs/design/journey-catalog.yaml`
- screen route/state authority: `docs/design/screen-specs/SCR-*.yaml`
- required state checklist: `docs/design/state-matrix.yaml`
- synchronized summary only: `docs/design/screen-inventory.yaml`

## Layer A: Journey flows

**Status legend:**
- `flow` column: `started` = flow file exists; `missing` = stub only or absent
- `impl` column: `✅ ready` = all screens implemented; `⚠️ partial` = some screens have TODOs; `❌ blocked` = key screens missing from codebase

| Journey | Actor | Entry | Exit | Happy path flow | Alternate path coverage | impl |
|---|---|---|---|---|---|---|
| `JRN-SHARED-01` | customer, tasker | `SCR-SHARED-001` | `SCR-CUST-001`, `SCR-TASK-001` | started | missing | ✅ ready |
| `JRN-SHARED-02` | customer, tasker | `SCR-SHARED-004` | previous screen | missing | missing | ⚠️ partial — otp-migration.tsx has TODOs |
| `JRN-SHARED-03` | customer, tasker | `SCR-SHARED-002` | `SCR-SHARED-005` | missing | missing | ✅ ready |
| `JRN-SHARED-04` | customer, tasker | `SCR-SHARED-010` | `SCR-SHARED-011` | missing | missing | ⚠️ partial — inbox screens have TODOs |
| `JRN-SHARED-05` | customer, tasker | `SCR-SHARED-012` | `SCR-SHARED-012` | missing | missing | ⚠️ partial — profile/edit.tsx has TODOs |
| `JRN-SHARED-06` | customer, tasker | `SCR-SHARED-014` | `SCR-SHARED-014`, `SCR-SHARED-015`, `SCR-TASK-003` | missing | missing | ⚠️ partial — profile/delete.tsx has TODOs |
| `JRN-SHARED-07` | customer, tasker | `SCR-SHARED-017` | `SCR-SHARED-017` | missing | missing | ✅ ready — delegate to ReviewForm component |
| `JRN-CUST-01` | customer | `SCR-CUST-001` | `SCR-CUST-008` | missing | missing | ⚠️ partial — category/intake/location/schedule have TODOs; happy path likely works |
| `JRN-CUST-02` | customer | `SCR-CUST-009` | `SCR-CUST-015` | missing | missing | ✅ ready |
| `JRN-CUST-03` | customer | `SCR-CUST-016` | `SCR-SHARED-017`, `SCR-CUST-023` | missing | missing | ✅ ready — LeadUnlockSheet exists |
| `JRN-CUST-04` | customer | `SCR-CUST-020` | `SCR-CUST-017` | missing | missing | ✅ ready |
| `JRN-CUST-05` | customer | `SCR-CUST-021` | `SCR-CUST-017`, `SCR-CUST-025` | missing | missing | ✅ ready |
| `JRN-CUST-06` | customer | `SCR-CUST-024` | `SCR-CUST-025` | missing | missing | ⚠️ partial — dispute.tsx has TODOs |
| `JRN-CUST-07` | customer | `SCR-CUST-026` | `SCR-CUST-009` | missing | missing | ✅ ready — TaskCancelSheet in features/ |
| `JRN-CUST-08` | customer | `SCR-CUST-027` | `SCR-CUST-015`, `SCR-CUST-009` | missing | missing | ✅ ready — instant-match.tsx implemented |
| `JRN-CUST-09` | customer | `SCR-CUST-028` | `SCR-CUST-029` | missing | missing | ❌ blocked — SCR-P2-004 (task boost) file does not exist |
| `JRN-TASK-01` | tasker | `SCR-TASK-001` | `SCR-TASK-011` | missing | missing | ⚠️ partial — tasker feed has TODOs |
| `JRN-TASK-02` | tasker | `SCR-TASK-003` | `SCR-TASK-010`, `SCR-TASK-007`, `SCR-TASK-008`, `SCR-TASK-009` | missing | missing | ⚠️ partial — upload.tsx has TODOs; end states functional |
| `JRN-TASK-03` | tasker | `SCR-TASK-012` | `SCR-SHARED-017` | missing | missing | ✅ ready — LeadUnlockSheet in features/bookings |
| `JRN-TASK-04` | tasker | `SCR-TASK-014` | `SCR-TASK-013` | missing | missing | ✅ ready |
| `JRN-TASK-05` | tasker | `SCR-TASK-015` | `SCR-TASK-012`, `SCR-SHARED-020` | missing | missing | ✅ ready — credits/index + pay implemented |
| `JRN-TASK-06` | tasker | `SCR-TASK-017` | `SCR-TASK-013`, `SCR-P2-001` | missing | missing | ⚠️ partial — wallet/payout.tsx has TODOs |
| `JRN-TASK-07` | tasker | `SCR-TASK-019` | `SCR-SHARED-013` | missing | missing | ✅ ready — subscription.tsx implemented |
| `JRN-TASK-08` | tasker | `SCR-P3-005` | `SCR-TASK-013`, `SCR-TASK-001` | missing | missing | ⚠️ partial — profile/polish.tsx has TODOs |
| `JRN-B2B-01` | customer | `SCR-B2B-001` | `SCR-B2B-006` | missing | missing | ❌ blocked — no B2B screens in codebase |
| `JRN-B2B-02` | customer | `SCR-B2B-001` | `SCR-B2B-002`, `SCR-B2B-003`, `SCR-B2B-004` | missing | missing | ❌ blocked — no B2B screens in codebase |
| `JRN-B2B-03` | customer | `SCR-B2B-005` | `SCR-CUST-008` | missing | missing | ❌ blocked — no B2B screens in codebase |
| `JRN-B2B-04` | customer | `SCR-B2B-007` | `SCR-B2B-001` | missing | missing | ❌ blocked — no B2B screens in codebase |
| `JRN-INFRA-01` | customer, tasker | `SCR-INFRA-001` | previous screen | missing | missing | ⚠️ partial — screens exist but missing SCR testIDs; add before authoring |
| `JRN-INFRA-02` | customer, tasker | `SCR-INFRA-002` | app store / app blocked | missing | missing | ✅ ready |

## Layer B: Screen/state coverage

Journey coverage is not sufficient for complete mobile UI validation.
Additional Maestro smoke/state flows are required for:
- screens absent from any `JRN-*`
- required loading/error/empty states that a happy path never hits
- modal and blocker surfaces with no standalone journey ownership

`impl` column reflects 2026-04-05 static analysis — see `docs/quality/mobile-implementation-status-2026-04-05.md`.

## Uncovered screens

The following screens are not referenced by the current journey catalog and require explicit screen/state Maestro planning.

### Shared utility screen

#### `SCR-SHARED-016` — Notification Center `impl: ✅`
- required states: `loading_initial`, `empty`, `populated`, `loading_refresh`, `error_network`
- journey-backed: no
- needs: screen smoke + empty/populated/error coverage

### Infrastructure / policy screens

#### `SCR-INFRA-001` — Network Error `impl: ⚠️ missing SCR testID`
- **Blocker:** add `testID="SCR-INFRA-001"` before authoring flow

#### `SCR-INFRA-002` — App Update `impl: ⚠️ missing SCR testID`
- **Blocker:** add `testID="SCR-INFRA-002"` before authoring flow

#### `SCR-INFRA-003` — Session Expired `impl: ⚠️ missing SCR testID`
- **Blocker:** add `testID="SCR-INFRA-003"` before authoring flow

#### `SCR-INFRA-004` — Terms of Service `impl: ✅`
- required states: `loading`, `loaded`, `error_network`
- journey-backed: no
- needs: screen smoke + loading/error coverage

#### `SCR-INFRA-005` — Help & Support / FAQ `impl: ⚠️ has TODOs`
- required states: `loading`, `loaded`, `error_network`
- journey-backed: no
- needs: screen smoke + loading/error coverage; check TODOs first

#### `SCR-TASK-018` — Privacy Policy `impl: ✅`
- required states: `loading`, `loaded`
- journey-backed: no
- needs: screen smoke + loaded state coverage

### Tasker utility screen

#### `SCR-TASK-016` — Tasker Stats Dashboard `impl: ✅`
- required states: `loading_initial`, `loaded`, `error_network`
- journey-backed: no
- needs: screen smoke + loading/error coverage

### B2B surfaces `impl: ❌ not implemented — defer all`

#### `SCR-B2B-001` — Business Accounts
- **Deferred:** no B2B screens exist in codebase

#### `SCR-B2B-002` — Business Account Editor
- **Deferred:** no B2B screens exist in codebase

#### `SCR-B2B-003` — Business Location Editor
- **Deferred:** no B2B screens exist in codebase

#### `SCR-B2B-004` — Business Members
- **Deferred:** no B2B screens exist in codebase

#### `SCR-B2B-005` — Post Task as Business
- **Deferred:** no B2B screens exist in codebase

#### `SCR-B2B-006` — Business Tasks
- **Deferred:** no B2B screens exist in codebase

#### `SCR-B2B-007` — Business Subscription Billing
- **Deferred:** no B2B screens exist in codebase

### Phase 2 monetization

#### `SCR-P2-001` — Credits — Balance & Purchase `impl: ✅`
- required states: `loading_initial`, `loaded_has_balance`, `loaded_zero_balance`, `pack_selection`, `error_network`
- journey-backed: no
- needs: balance variants + purchase entry coverage

#### `SCR-P2-002` — Credits — QPay Payment `impl: ✅`
- required states: `qr_display`, `deeplink_redirect`, `payment_pending`, `payment_success`, `payment_failed`, `payment_timeout`
- journey-backed: no
- needs: payment lifecycle coverage

#### `SCR-P2-003` — Credits — Transaction History `impl: ✅`
- required states: `loading_initial`, `empty`, `populated`, `loading_pagination`, `error_network`
- journey-backed: no
- needs: pagination and empty/history coverage

#### `SCR-P2-004` — Task Boost `impl: ❌ file does not exist`
- **Deferred:** screen not yet implemented

#### `SCR-P2-005` — Referral — My Code & Stats `impl: ✅`
- required states: `loading_initial`, `loaded_with_referrals`, `loaded_no_referrals`, `sharing`, `error_network`
- journey-backed: no
- needs: with/without referral history coverage

### Phase 3 wallet / escrow / subscription

#### `SCR-P3-001` — Wallet — Balance & Payouts `impl: ✅`
- required states: `loading_initial`, `loaded`, `loaded_pending_payout`, `error_network`
- journey-backed: no
- needs: wallet baseline + pending payout coverage

#### `SCR-P3-002` — Wallet — Request Payout `impl: ⚠️ has TODOs`
- required states: `default`, `confirming`, `submitted`, `error_below_minimum`, `error_network`
- journey-backed: no
- needs: happy path only until TODOs resolved

#### `SCR-P3-003` — Escrow — Payment Flow `impl: ✅`
- required states: `opt_in_prompt`, `qpay_payment`, `payment_pending`, `escrowed_confirmation`, `error_payment_failed`
- journey-backed: no
- needs: escrow opt-in/payment lifecycle coverage

#### `SCR-P3-004` — Subscription — Tasker Pro `impl: ✅`
- required states: `loading_initial`, `eligible_view_plans`, `active_standard`, `active_premium`, `ineligible_no_badge`, `cancelled_resubscribe`, `error_network`
- journey-backed: no
- needs: plan eligibility and active plan variants

#### `SCR-P3-005` — Instant Match — Tasker `impl: ✅`
- required states: `match_notification`, `accepting`, `accepted_success`, `declined`, `expired_5min`
- journey-backed: no
- needs: notification modal lifecycle coverage

## Priority order

Priority revised 2026-04-05 based on implementation status audit.
`❌ blocked` journeys are deferred until screens are built.

### P0 — Write flows immediately (all screens ✅ ready)
- `JRN-SHARED-01` onboarding (flow started; complete it)
- `JRN-SHARED-03` OTP login (Phase 2 auth)
- `JRN-CUST-02` review applicants & confirm booking (Phase 0-1)
- `JRN-CUST-04` manage active booking (customer)
- `JRN-CUST-05` rebook tasker
- `JRN-CUST-07` cancel open task
- `JRN-CUST-08` instant match (Phase 3)
- `JRN-TASK-03` lead unlock accept/decline (Phase 2)
- `JRN-TASK-04` manage active booking (tasker)
- `JRN-TASK-05` credit purchase (Phase 2)
- `JRN-TASK-07` Tasker Pro subscription (Phase 3)
- `JRN-INFRA-02` suspended/banned account

### P1 — Write flows after fixing TODOs or scoping to happy path only (⚠️ partial)
- `JRN-SHARED-04` messaging (inbox list + open chat; skip error states)
- `JRN-SHARED-05` profile management (view + settings; skip deep edit validation)
- `JRN-SHARED-06` settings & account (navigation only; skip delete confirmation)
- `JRN-SHARED-07` review submission (happy path via ReviewForm delegate)
- `JRN-CUST-01` post a task (wizard happy path; category→success)
- `JRN-CUST-03` lead unlock confirm (Phase 2 sheet)
- `JRN-CUST-06` raise & track dispute (dispute detail; skip raise-form edge cases)
- `JRN-TASK-01` tasker verification funnel (gate→consent→upload→pending→approved)
- `JRN-TASK-02` browse & apply (feed list + task detail)
- `JRN-TASK-06` wallet & payout (wallet balance; skip payout form TODOs)
- `JRN-TASK-08` AI profile polish (entry screen only)
- `JRN-INFRA-01` error recovery (after SCR testIDs added to infra screens)

### P2 — Screen/state smoke flows for implemented isolated screens
- `SCR-SHARED-016` notification center
- `SCR-INFRA-004` terms of service
- `SCR-INFRA-005` help & FAQ
- `SCR-TASK-016` tasker stats dashboard
- `SCR-TASK-018` privacy policy
- `SCR-P2-001..003` credits balance/payment/history (Phase 2)
- `SCR-P2-005` referrals (Phase 2)
- `SCR-P3-001` wallet balance, `SCR-P3-003` escrow, `SCR-P3-004` subscription (Phase 3)

### Deferred — Do not write flows until screens are implemented (❌ blocked)
- `JRN-CUST-09` task boost — `SCR-P2-004` file does not exist
- `JRN-B2B-01..04` — no B2B screens in codebase
- `JRN-SHARED-02` — otp-migration.tsx has significant TODOs
- `SCR-B2B-001..007` — no B2B screens in codebase
- `SCR-P2-004` low balance alert modal — no dedicated route (component only)
