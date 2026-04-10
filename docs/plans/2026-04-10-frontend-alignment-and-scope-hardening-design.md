# Frontend Alignment And Scope Hardening Design

**Date:** 2026-04-10
**Status:** approved for execution

## Goal

Bring the web and mobile applications into product truth before final rollout by:

- aligning active user-facing surfaces to the Phase 1 launch baseline
- removing deferred capabilities from active route trees and navigation
- preserving only substantial future UI in quarantined `future/` modules
- polishing launch-live web and mobile journeys to match the PRD and screen specs
- ensuring frontend verification only blocks on launch-live behavior

## Problem Statement

Tasky’s frontend surface area no longer cleanly reflects product scope.

- The mobile Expo Router tree still exposes many deferred screens directly under `apps/mobile/src/app`.
- The web route tree still contains future-facing and admin-latent surfaces that can overstate current capability.
- Some derived frontend audits are stale relative to the actual route trees.
- Mobile especially still contains partial implementations, TODO markers, and uneven UI polish across launch-critical flows.

This creates three concrete risks:

1. scope risk: the app appears to support deferred capabilities that are not part of the launch promise
2. implementation risk: teams may spend polish effort on shells instead of Phase 1 journeys
3. verification risk: tests can keep covering screens that should no longer be reachable

The finishing program must therefore classify frontend surfaces first, tighten active scope second, and only then spend time polishing what remains launch-live.

## Evidence Snapshot

Current route trees confirm the mismatch:

- Mobile currently exposes deferred or likely deferred routes for business accounts, credits, referrals, subscription, wallet, escrow, boost, instant match, OTP auth, DAN verification, and AI profile polish directly under `apps/mobile/src/app`.
- Web currently exposes tasker verification flows and admin latent surfaces such as lead pricing and payouts through `apps/web/src/router/AppRoutes.tsx`.
- The launch baseline in [launch-baseline-2026-04.md](/Users/norov/workspace/projects/tasky/docs/quality/launch-baseline-2026-04.md) excludes monetization, B2B, referrals, subscription, instant match, DAN verification, and OTP auth from the initial rollout.
- The mobile implementation status audit under `docs/quality/` is useful context, but it is derived and already stale in at least one area, so it cannot be treated as ground truth for current route exposure.

## Frontend Source Of Truth

When frontend sources disagree during this program, use this order:

1. `docs/PRD.md`
2. `docs/quality/launch-baseline-2026-04.md`
3. `docs/API.yaml`
4. `docs/design/journey-catalog.yaml`
5. `docs/design/screen-specs/SCR-*.yaml`
6. `docs/ARCHITECTURE.md`
7. active runtime route trees in `apps/web/src/router/` and `apps/mobile/src/app/`
8. derived audits under `docs/quality/`

`AGENTS.md` and the prior mobile design-refresh exclusion list are implementation context, not product truth. They can identify likely deferred areas, but they do not override the PRD or launch baseline.

## Classification Model

Every frontend surface must be placed in one of five buckets:

- **launch-live**
  - part of the active launch promise
  - must remain reachable
  - must be polished and verified
- **implemented-gated-backend-only**
  - backed by meaningful runtime capability, but not exposed in launch clients
  - client entrypoints should be removed from active apps
  - backend flag posture remains the activation control
- **deferred-substantial**
  - not launch-live, but contains enough reusable UI or flow work to preserve
  - move out of active routes/pages into `src/future/`
- **deferred-shell**
  - low-confidence placeholder or incomplete shell
  - remove from active code and rely on git history/docs if needed later
- **delete**
  - duplicate, obsolete, or misleading surface with no reuse value

## Action Rules By Classification

### Launch-live

- Keep in active route registration and navigation.
- Bring copy, layout, state handling, and data wiring up to PRD/spec parity.
- Keep or strengthen release-blocking verification.

### Implemented-gated-backend-only

- Remove client navigation and direct route registration.
- Keep backend capability gated and documented in the capability matrix.
- Preserve client code only if it is substantial and plausibly reusable soon; otherwise remove it.

### Deferred-substantial

- Move code outside active discovery paths:
  - `apps/mobile/src/future/<capability>/...`
  - `apps/web/src/future/<capability>/...`
- Remove all route registration, links, tabs, and deep-link affordances.
- Remove blocking tests tied to active exposure.

### Deferred-shell

- Delete from active route trees and supporting tests.
- Keep the intent in screen specs, Figma, and git history.

### Delete

- Remove entirely and clean up imports, routes, tests, and documentation references.

## Platform-Specific Constraints

### Mobile

Expo Router discovers any screen under `apps/mobile/src/app`. A deferred surface is not truly disabled until it leaves that tree. Hiding it in a menu is not enough.

### Web

A deferred page is not truly disabled until it leaves `AppRoutes.tsx` and any navigation or CTA that reaches it. If preserved for later work, it should also leave `apps/web/src/pages/` and move under `apps/web/src/future/` to reduce discoverability and accidental reuse.

## Program Principles

### 1. Route visibility is a product claim

If a screen is reachable, users and maintainers will treat it as supported. Reachability must match launch truth.

### 2. Feature flags are not a storage strategy for speculative UI

Flags are for near-activatable capabilities with real backend/runtime support. They are not the right place to park placeholder shells in the active frontend tree.

### 3. Quarantine beats silent drift

If future code is worth keeping, isolate it deliberately. If it is not worth keeping, remove it.

### 4. Polish follows scope tightening

Do not polish screens until the active surface area is ratified. Otherwise effort gets spent on non-launch work.

### 5. Verification must follow the active product

Deleted or quarantined surfaces must stop influencing release confidence. Launch-live flows must gain proportionally stronger proof.

## Chosen Approach

Use five ordered tranches.

### Tranche order

1. build a frontend truth matrix from PRD, launch baseline, route trees, and screen specs
2. harden active scope by quarantining substantial deferred UI and deleting thin shells
3. align and polish launch-live web flows
4. align and polish launch-live mobile flows
5. realign tests, docs, and release gates to the hardened frontend scope

## Expected Outputs

- a maintained frontend alignment matrix
- a quarantine/delete manifest for deferred screens
- a reduced active web route tree and mobile Expo Router tree
- polished launch-live customer, tasker, shared, and admin experiences
- updated frontend verification that blocks on launch-live behavior only

## Risks And Mitigations

### Risk: accidental removal of launch-required verification or trust/safety surfaces

Mitigation:

- classify before cutting
- require PRD and screen-spec evidence for each removed route

### Risk: future code rots in quarantine

Mitigation:

- quarantine only substantial code
- document the retained capability and owning screen IDs in the alignment matrix

### Risk: web and mobile drift apart after scope tightening

Mitigation:

- keep one shared matrix for both clients
- verify parity at the journey level, not only screen-by-screen

### Risk: test suites continue to encode removed routes

Mitigation:

- make verification alignment its own tranche
- explicitly delete or demote tests for cut surfaces in the same change window

## Success Criteria

This program is successful when:

- every active web and mobile route is classified and justified
- deferred capabilities no longer appear in normal app navigation or route entrypoints
- launch-live flows across both apps are aligned with the PRD and launch baseline
- mobile UI quality is consistent across launch-critical journeys
- frontend tests and smoke flows reflect only the hardened launch scope
