# Web Phase 1 Parity Design

**Date:** 2026-03-26
**Source of truth:** [PRD](/home/norbu/projects/tasky/docs/PRD.md), [mobile UI replacement Figma realignment plan](/home/norbu/projects/tasky/docs/plans/2026-03-26-mobile-ui-replacement-figma-realignment-plan.md), [screen inventory](/home/norbu/projects/tasky/docs/design/screen-inventory.yaml)

## Goal

Supplement the existing web application so it fully supports Phase `0-1` / Phase 1 product scope, using the completed mobile app and live mobile design system as the adaptive UI source of truth rather than inventing a separate web product model.

## Problem

The mobile app now covers the full Phase `0-1` experience, while the web app only covers a narrower subset of flows. This creates operational and product gaps:

- some Phase `0-1` customer and tasker flows are web-missing or web-partial
- web state coverage is inconsistent for review enforcement, disputes, recovery flows, and account restriction flows
- parity risk increases because mobile now represents the most complete user-facing execution of the Phase `0-1` product

The objective is not to clone phone layouts onto desktop. The objective is to make web semantically equivalent to Phase `0-1` mobile behavior, with adaptive layouts that respect web usage patterns and the repo’s existing Radix + Tailwind design system constraints.

## Scope

### In Scope

- bring the web app to Phase `0-1` feature parity for customer, tasker, and shared operational surfaces
- use mobile/Figma state models, copy, and journey sequencing as the parity baseline
- adapt layouts responsively for mobile web, tablet, and desktop
- preserve Phase `0-1` business behavior:
  - Facebook-only auth
  - direct settlement
  - manual verification
  - application-based matching
  - no live Phase 2/3 payment rails or OTP-primary behavior
- add missing route coverage, component states, and tests

### Out of Scope

- enabling Phase 2/3 behavior on web
- creating a separate web-only IA that diverges from mobile journeys
- redesigning the shared design system from scratch
- B2B/business surfaces
- feature-flag infrastructure for later phases beyond what is strictly needed to preserve Phase `0-1` behavior

## Product Principles

1. **Parity over novelty**
   Web must match the same user-visible product contract as mobile for Phase `0-1`.
2. **Adaptive, not duplicated**
   Mobile screens provide the information architecture and state model. Web layouts may reorganize panes, density, and navigation for larger screens.
3. **State completeness over happy-path polish**
   Every major route needs loading, empty, error, blocked, and restricted states where the mobile/spec baseline defines them.
4. **Operational realism**
   Phase `0-1` web must support real support and recovery flows, not just task posting and browsing.
5. **Design-system discipline**
   Web additions must use existing Radix + Tailwind primitives and established `apps/web/src/components/ui/` patterns.

## Current Web Reality

The current web app already has a foundation:

- auth shell
- customer dashboard and customer task pages
- tasker feed and tasker tasks
- profile
- verification
- messaging/notifications
- booking confirmation/safety
- restricted account surfaces

But it does not yet represent the full Phase `0-1` surface area covered by mobile/design inventory. Relative to the `66` Phase `0-1` screens in the design inventory, web currently appears to be:

- partially covered for shared/account/auth
- partially covered for customer task and booking operations
- partially covered for tasker verification and jobs
- missing many recovery, review, dispute, and state-rich operational screens

## Parity Baseline

The parity source should be established in this order for every missing or partial web surface:

1. mobile/Figma-backed screen inventory and specs
2. current mobile implementation behavior
3. existing web routing and layout patterns

The web app should not reinterpret business rules if mobile already implements them correctly.

## Adaptive Web Design Model

Each mobile screen should map into one of three adaptive web forms:

### 1. Full-page route

Use when the screen is a distinct task or system state:

- auth
- verification flows
- account restrictions
- infra/legal/help
- full-screen wizards on mobile

### 2. Responsive detail page with side panels

Use when desktop benefits from simultaneous context:

- task detail + action panel
- booking detail + action rail
- tasker profile + reviews
- chat detail + conversation list split view

### 3. Dialog / sheet / inline panel adaptation

Use when mobile uses a sheet but web benefits from modal or side-panel interaction:

- confirm completion
- cancel/no-show confirmation
- review reminder / hard lock
- lead unlock–style future patterns if needed for hidden later-phase shells

## Required Web Coverage by Phase 0-1 Domain

### A. Shared / Auth / Operational Surfaces

Web must support:

- splash/auth entry behavior consistent with Phase `0-1`
- login with Facebook-only framing
- inbox list and chat detail
- profile, edit profile, settings, delete account
- notifications center
- review form, reminder, hard-lock enforcement surfaces
- suspended and banned account states
- network error, session expired, app update messaging
- terms, privacy, help

### B. Customer Surfaces

Web must support:

- my tasks list
- task-post wizard:
  - category
  - intake
  - photos
  - location
  - schedule/budget
  - review/submit
  - success
- task detail and cancellation
- applicants list and applicant timeout/decline states where applicable
- tasker public profile
- booking confirmation and booking confirmed
- bookings list/detail/timeline/reschedule
- customer no-show / cancel flows
- rebook
- dispute raise and dispute status
- no-applicant rescue

### C. Tasker Surfaces

Web must support:

- browse feed
- task detail
- verification gate
- consent
- upload
- pending / approved / rejected / submitted verification states
- application sent success
- my jobs list
- booking detail
- no-show
- cancel
- stats
- privacy policy

## Information Architecture Recommendation

Keep the current top-level web role structure, but normalize route organization around the same core domains as mobile:

- shared/auth
- customer tasks/bookings/disputes
- tasker feed/jobs/verification/profile
- shared operational utilities

Desktop can remain dashboard-oriented, but route boundaries should map to the same domain objects as mobile:

- `task`
- `booking`
- `dispute`
- `conversation`
- `profile`
- `verification`

This minimizes mental drift between clients and reduces future test and contract divergence.

## Component Strategy

### Reuse

Prefer extending existing web primitives and layouts:

- `AdminLayout`
- `ScreenFrame`
- `Header`
- `DesktopSidebar`
- `BottomNavBar`
- current page-level shells

### Add

Introduce web analogs for the most reused mobile patterns:

- adaptive feed list shell
- detail-page shell with sticky action footer/rail
- responsive wizard shell
- status card / state panel components
- review enforcement dialog/sheet components
- booking timeline component
- task/booking summary cards with shared status badge semantics

### Do Not Do

- do not create one-off bespoke pages for each state if a reusable shell can express the same pattern
- do not mirror phone-only spacing/density on desktop
- do not create a second competing token system

## Data and Behavior Strategy

The web app should continue using the shared API SDK/contracts and the same underlying product rules as mobile.

For Phase `0-1` parity:

- auth stays Facebook-first
- OTP screens are not part of active web Phase `0-1` behavior
- direct settlement messaging remains visible where appropriate
- no escrow/wallet/credit runtime dependency should leak into core Phase `0-1` flows
- review and restriction logic should match mobile enforcement states

If mobile currently contains richer state handling than web, web should conform to mobile rather than inventing alternative logic.

## Testing Strategy

### 1. Parity Matrix

Create a web Phase `0-1` parity matrix from the mobile/design inventory:

- `exists and aligned`
- `exists but partial`
- `missing`
- `intentionally web-adapted`

This matrix becomes the authoritative rollout tracker.

### 2. Route-Level Tests

Every newly added or heavily revised route should have:

- loading state coverage
- empty state coverage
- error state coverage
- role/restriction guard coverage
- primary CTA/navigation coverage

### 3. Integration Tests

At minimum, web needs journey coverage for:

- auth entry + restricted access
- customer post-task to applicant review
- customer booking management
- tasker verification to browse/apply/jobs
- messaging
- review enforcement

### 4. Accessibility

Any changed web flow must include:

- keyboard navigation verification
- focus management for dialogs/sheets
- contrast and semantic structure checks

## Delivery Strategy

Implement in vertical slices, not by visual section alone.

Recommended sequence:

1. build parity matrix and route gap inventory
2. close shared/auth/operational gaps
3. close customer Phase `0-1` gaps
4. close tasker Phase `0-1` gaps
5. run full web regression + accessibility + smoke checks

This keeps the web app demoable at each stage and reduces the risk of broad unfinished UI sprawl.

## Risks

### Risk 1: Mobile-to-web over-literal copying

Mitigation:

- explicitly treat mobile as semantic source, not layout source
- require adaptive review of each page on desktop/tablet/mobile web

### Risk 2: Hidden business-rule drift

Mitigation:

- use mobile implementation plus spec as behavioral baseline
- add parity matrix review before implementation starts

### Risk 3: Route sprawl without reusable shells

Mitigation:

- build shared responsive page shells first
- add page-specific code only after shell choice is settled

### Risk 4: Partial parity claimed too early

Mitigation:

- define done as parity-matrix closure plus tests, not just page count

## Success Criteria

This work is complete when:

- all Phase `0-1` web-required surfaces are classified and implemented or explicitly marked as already aligned
- web customer, tasker, and shared flows match Phase `0-1` mobile/spec behavior
- responsive layouts work on mobile web, tablet, and desktop
- web tests and smoke coverage are expanded to cover the supplemented flows
- the app can truthfully be described as Phase `0-1` capable on both mobile and web, not mobile-only

## Recommended Plan Shape

The implementation plan should be split into these workstreams:

1. parity matrix and route inventory
2. shared/auth/operational supplementation
3. customer supplementation
4. tasker supplementation
5. responsive shell refinement and final regression

That keeps the work reviewable, parallelizable, and aligned with the existing repo structure.
