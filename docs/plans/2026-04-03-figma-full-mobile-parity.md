# Tranche Plan: Full Mobile Figma Parity (All Screens)

**Status:** planned
**Priority:** critical
**Depends on:** none

## Description
Align every mobile screen implementation in `apps/mobile` to the canonical Figma file `IljfnTQPkq7vpkmK1NN1NC` using the screen inventory and route map (`docs/design/screen-inventory.yaml`, `docs/design/screen-specs/*.yaml`, archive refresh mapping). Work is split into vertical tranches by user-facing journey and shared infrastructure so each tranche can ship in one PR with design verification evidence and regression tests. This plan treats visual hierarchy, spacing, typography, component states, and interaction parity as first-class acceptance criteria.

## Tranches

### Tranche: Shared Foundation + Global Shell Parity
**Status:** planned
**Priority:** critical
**Depends on:** none

#### Scope
- Normalize app shell parity: safe areas, headers, modal presentations, bottom nav, FAB placement/behavior.
- Align core templates/components used by many screens (`DetailTemplate`, `FormWizardTemplate`, `FeedListTemplate`, shared cards/buttons/chips).
- Ensure route-level modal vs push behavior matches Figma navigation intent.

#### Done When
- Shell behavior matches Figma for top/bottom bars across iOS devices (including dynamic island cutout devices).
- Post-task flow opens as one modal container, inner steps are non-modal pushes.
- Shared template spacing/typography tokens are updated and validated on at least 6 representative screens.
- Tests updated for shell/navigation behaviors.

---

### Tranche: Customer Task Posting Journey (SCR-CUST-002..008)
**Status:** in_progress
**Priority:** critical
**Depends on:** Shared Foundation + Global Shell Parity

#### Scope
- Category, Intake, Photo, Location, Schedule/Budget, Review/Submit, Success.
- Match all Figma states and edit-back affordances.
- Ensure payload and state-carry across steps remain contract-safe.

#### Done When
- Each screen matches mapped Figma node style/layout and required states.
- Review screen has section-specific edit routing and image-preview parity.
- Submit success/error states match screen-spec behavior.
- Existing task-posting tests pass; gaps covered with additional tests.

---

### Tranche: Customer Core Task + Booking Flows (SCR-CUST-001, 009..027)
**Status:** planned
**Priority:** high
**Depends on:** Customer Task Posting Journey

#### Scope
- My Tasks, Task Detail, Applicants, Tasker Profile, Booking confirmation/success/list/detail, timeline, reschedule, disputes, rebook, instant match.
- Include embedded sheets/components that map to spec states.

#### Done When
- All route screens listed in inventory for these IDs are Figma-aligned.
- Major embedded sheet states match spec (cancel/no-show/confirm completion/rescue).
- Navigation continuity between task and booking flows matches screen graph.
- Relevant customer-flow tests pass and are expanded for changed states.

---

### Tranche: Shared/Auth/Infra Screens (SCR-SHARED-001..021, SCR-INFRA-001..005)
**Status:** planned
**Priority:** high
**Depends on:** Shared Foundation + Global Shell Parity

#### Scope
- Auth, onboarding, permissions, shared profile/inbox/review/legal/help, infra states.

#### Done When
- Each shared/infra route has parity with mapped Figma node and required interaction states.
- Accessibility and localization rendering remain valid after visual updates.
- Shared screen tests updated and passing.

---

### Tranche: Tasker Screens (SCR-TASK-001..019, excluding deferred where applicable)
**Status:** planned
**Priority:** high
**Depends on:** Shared Foundation + Global Shell Parity

#### Scope
- Task feed/detail, jobs, stats, privacy, verification screens included in active scope.

#### Done When
- Active tasker screens match mapped Figma nodes and expected states.
- Deferred screens remain explicitly excluded with no accidental regressions.
- Tasker test suites updated and passing.

---

### Tranche: Full Regression + Handoff
**Status:** planned
**Priority:** critical
**Depends on:** all prior tranches

#### Scope
- End-to-end visual/behavior audit pass across all aligned screens.
- Consolidate changelog, verification artifacts, and parity checklist.

#### Done When
- `pnpm --filter @tasky/mobile typecheck` passes.
- Mobile unit test suites pass for touched domains.
- A parity checklist exists mapping each active SCR-ID to implementation file and verification evidence.
- `CHANGELOG.md` updated with summarized parity completion.

## Verification Requirements
- Per-tranche: run targeted mobile test suites for touched screens.
- Cross-tranche: rerun route/navigation tests affected by shell/layout changes.
- Manual simulator verification for gesture behavior, modal dismissal, and safe-area conformance.

## Dependencies and Risks
- Major shared-template changes can cascade into unrelated screen regressions.
- Some generated Figma references contain desktop-like artifacts; use screen specs and route matrix as source of truth when conflicts occur.
- Embedded component states (sheets/toasts) require per-feature test coverage to avoid behavior drift.
