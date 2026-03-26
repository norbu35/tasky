# Web Phase 1 Parity Design

**Date:** 2026-03-26
**Primary sources:** [PRD](/home/norbu/projects/tasky/docs/PRD.md), [screen inventory](/home/norbu/projects/tasky/docs/design/screen-inventory.yaml), [web parity matrix](/home/norbu/projects/tasky/docs/plans/2026-03-26-web-phase-1-parity-matrix.md), [mobile Phase 1 realignment plan](/home/norbu/projects/tasky/docs/plans/2026-03-26-mobile-ui-replacement-figma-realignment-plan.md)

## Goal

Bring the web client to full **Phase `0-1` / Phase 1 product parity** with the mobile client, using the mobile app and mobile-derived design inventory as the semantic source of truth while adapting layout and interaction density for responsive web.

## Why This Exists

The mobile app now represents the most complete implementation of Phase `0-1` behavior. The web app has a working foundation, but its user journeys are narrower, its state coverage is uneven, and several shared/customer/tasker routes are either missing or collapsed into generic pages. That leaves the project with role-dependent operational gaps and inconsistent supportability across platforms.

This work is not a redesign of the product. It is a **contract-parity supplement**: web must express the same role journeys, states, and guardrails as mobile for Phase `0-1`, while remaining adaptive and web-native.

## Product Contract

### In Scope

- shared/auth/account/infra/legal flows required for Phase `0-1`
- customer task posting, task management, applicants, bookings, disputes, and rescue flows
- tasker browse, verification, application, jobs, stats, and privacy flows
- route/state coverage for loading, empty, error, restricted, and recovery scenarios defined by the mobile/spec baseline
- responsive web adaptation for mobile web, tablet, and desktop
- route guards and navigation updates required to expose the new Phase `0-1` surfaces
- test coverage proving the new web journeys work through the real app shell

### Out of Scope

- enabling live Phase `2` / `3+` business behavior on web
- introducing a separate web-only product model or divergent IA
- rebuilding the web design system
- B2B/business surfaces
- OTP-primary auth, credits, wallet, escrow, DAN fast-path verification, referrals, subscriptions, and instant match as active user-facing web behavior

## Phase 1 Behavioral Invariants

These are non-negotiable for web until a later phase explicitly changes them:

- auth remains Facebook-first
- OTP remains disabled as an active Phase `0-1` path
- direct settlement remains the customer/tasker payment message
- manual verification remains the active verification model
- application-based matching remains the core supply-demand flow
- review enforcement and restricted-account handling must align with mobile semantics

## Current Web Reality

The web app now has two layers of implementation state:

### Legacy foundation already present before parity work

- `LandingPage`
- `AuthPage`
- `ProfilePage`
- `CustomerDashboardPage`
- `CustomerTaskPage`
- `CustomerTaskDetailsPage`
- `BookingConfirmationPage`
- `BookingSafetyPage`
- `MessagingNotificationsPage`
- `TaskerFeedPage`
- `TaskerTasksPage`
- `VerificationPage`
- `RestrictedAccountPage`

### New parity work already present on this branch

- reusable parity shells under `apps/web/src/components/parity/`
- shared baseline pages under `apps/web/src/pages/shared/`
- customer baseline pages under `apps/web/src/pages/customer/`
- focused tests:
  - `apps/web/tests/unit/parity-shells.test.tsx`
  - `apps/web/tests/integration/shared-parity.test.tsx`
  - `apps/web/tests/integration/customer-phase1.test.tsx`

The [parity matrix](/home/norbu/projects/tasky/docs/plans/2026-03-26-web-phase-1-parity-matrix.md) is the authoritative gap inventory. The main conclusions are:

- shared/auth/account surfaces are only partially represented
- customer posting and booking operations exist, but too many screens are collapsed into a few generic pages
- tasker browse exists, but detail/jobs/stats/privacy parity is still missing
- several recovery and operational surfaces do not exist at all

## Source-of-Truth Order

For every web supplement decision, resolve ambiguity in this order:

1. Phase `0-1` product contract from the PRD
2. mobile/design inventory and screen semantics
3. current mobile behavior if the web behavior is unclear
4. current web implementation patterns

Web should adapt layout, not reinterpret product rules that mobile already established.

## Adaptive Web Strategy

### Principle

Web must be **adaptive, not duplicated**. Mobile screen boundaries define domain semantics and state expectations. Web may reorganize those into split panes, denser cards, sticky side rails, or modal/dialog patterns where that improves desktop usability without changing the journey contract.

### Allowed Web Adaptations

- list/detail split view for inbox and some dashboard-like flows
- sticky action rail on booking/task detail pages
- dialogs for confirmation and reminder flows that are sheets on mobile
- denser summary cards, grids, and tables where mobile uses vertically stacked cards
- browser-native permission prompts may replace mobile permission-primer screens, but the web UX must still provide contextual explanation when a route depends on camera, location, or notifications access

### Disallowed Adaptations

- hiding a required mobile state because “desktop users do not need it”
- merging unrelated flows into one page if that obscures route semantics
- inventing new business steps or shortcuts not present in Phase `0-1`
- shipping later-phase surfaces as active navigation targets

## Required Route Families

### Shared / Auth / Operational

Web must expose or clearly adapt:

- auth entry
- onboarding and role intent only if needed to preserve Phase `0-1` web conversion behavior; otherwise these remain intentionally web-adapted into landing/auth
- inbox list
- chat detail
- notifications center
- profile
- edit profile
- settings
- delete account
- review form
- review reminder
- review hard lock
- suspended
- banned
- network error
- app update
- session expired
- help
- terms
- privacy

### Customer

Web must expose or clearly adapt:

- tasks list
- posting flow:
  - category
  - intake
  - photos
  - location
  - schedule/budget
  - review/submit
  - success
- task detail
- cancel confirmation
- applicants
- tasker public profile
- booking confirmation
- booking confirmed
- bookings list
- booking detail
- timeline
- reschedule
- no-show flag
- no-show reminder
- cancel
- rebook
- dispute raise
- dispute status
- no-applicant rescue

### Tasker

Web must expose or clearly adapt:

- browse feed
- task detail
- application sent
- verification gate
- consent
- upload
- pending
- approved
- rejected
- submitted
- jobs list
- booking detail
- no-show
- cancel
- stats
- privacy
- AI profile polish

## Page Architecture

### Reusable Layout Units

The web supplement should use a small set of reusable page shells:

- feed shell
- detail shell
- wizard shell
- state panel
- timeline list
- action rail

These shells should remain layout-oriented and domain-agnostic.

### Domain Page Rules

- Each page should own one domain responsibility.
- Shared pages should not depend on customer/tasker-specific business state beyond guard context.
- Customer and tasker pages should compose reusable shells rather than recreating page structure ad hoc.
- Existing large pages may be kept temporarily if they still provide correct behavior, but new behavior should land in focused files and gradually pull responsibility out of overloaded legacy pages.

## Navigation And Guard Expectations

- unauthenticated access to protected customer/tasker routes redirects to `/auth`
- restricted users route to the correct restricted-state surface
- customer and tasker primary nav must expose the correct Phase `0-1` entries only
- later-phase or follow-on routes must not be discoverable through primary Phase `0-1` navigation
- route boundaries should map to domain objects:
  - task
  - booking
  - dispute
  - conversation
  - profile
  - verification

## Data And API Rules

- continue using the shared web API client and existing `AppContext`
- do not introduce a competing fetch/state layer for parity work
- do not add contract-breaking behavior on the client side
- if a web route needs state that existing endpoints already provide, adapt through the current API client first
- if a true API gap appears, stop and surface it explicitly instead of faking later-phase behavior

## Testing Contract

### Required Layers

- focused integration tests for each new route family
- updates to existing auth, guard, messaging, task, booking, and safety tests where route behavior changes
- unit coverage for reusable parity shells
- final broad web regression covering the changed slices

### State Coverage Requirements

Every major supplemented route family must prove:

- loading state
- empty state
- error state
- happy path
- role/restriction guard behavior where applicable

### Accessibility Expectations

For touched routes:

- headings must remain queryable and unique enough for screen-reader/test use
- dialogs must have accessible naming
- core actions must remain keyboard reachable

## Delivery Strategy

Implementation should proceed in these vertical slices:

1. parity matrix and reusable shells
2. shared/auth/operational pages
3. customer posting/task management
4. customer bookings/disputes/rescue
5. tasker browse/application/verification
6. tasker jobs/stats/privacy
7. navigation/guard integration
8. responsive/copy/a11y polish
9. full regression and smoke verification

This ordering keeps the most cross-cutting web primitives and operational surfaces in place before deeper customer/tasker expansion.

## Current Branch State

At the time of this spec revision:

- parity matrix is complete
- parity shells are implemented and tested
- shared baseline pages are implemented and their focused parity test is green
- customer baseline pages are implemented and their focused parity test is green
- the next major work is integration:
  - route wiring
  - page exports
  - locale/copy consolidation
  - broader regressions
  - remaining customer booking and tasker slices

That means the implementation plan must continue from the actual branch state rather than planning as if the web parity work were greenfield.

## Acceptance Criteria

This spec is complete when:

- web covers every Phase `0-1` route family required by the parity matrix, either as aligned or intentionally web-adapted
- no critical Phase `0-1` journey depends on mobile-only behavior
- later-phase behavior is not accidentally activated on web
- route and state coverage are verified with focused tests plus a broader web regression
- web remains within current design system and API-client constraints
