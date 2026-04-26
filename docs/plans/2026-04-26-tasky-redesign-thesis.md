# Tasky Web and Mobile Redesign Thesis

**Date:** 2026-04-26
**Status:** Approved design thesis for Refero research and proof-screen exploration

## Related artifacts

- Execution plan: `docs/plans/2026-04-26-tasky-redesign-refero-proof-plan.md`
- Refero reference matrix: `docs/plans/2026-04-26-tasky-redesign-reference-matrix.md`
- Proof-screen contract: `docs/plans/2026-04-26-tasky-redesign-proof-screen-contract.md`
- Runtime handoff: `docs/plans/2026-04-26-tasky-redesign-runtime-handoff.md`

## Source of truth chain

This thesis is derived from:

1. `docs/PRD.md`
2. `docs/STRATEGY.md`
3. `docs/ROLLOUT_PHASES.md`
4. `docs/design/DESIGN_SYSTEM.md`
5. `docs/architecture/shared-frontend.md`
6. `docs/architecture/web.md`
7. `docs/architecture/mobile.md`

This document does not replace the active design system. It records the approved redesign direction that should be
tested through Refero research and proof screens before any canonical design-system or implementation changes are made.

## Product feel

Tasky's redesign thesis is **Warm Marketplace With Operational Spine**.

Tasky should feel like a modern neighborly service marketplace for Ulaanbaatar: warm enough for domestic work,
structured enough to feel safe, and efficient enough that both customers and taskers feel momentum. It should not feel
like Facebook/classifieds, a generic SaaS dashboard, a hustle-heavy gig app, or a cold compliance product.

The core design tension is resolved by role:

- Customers get guided simplicity: structured posting, clear next steps, and reassuring decision points.
- Taskers get operational density: scannable feeds, compact task metadata, and clear apply/job status.
- Shared surfaces use a middle ground: profile, chat, booking, reviews, settings, and lifecycle states should feel
  consistent across roles.

Trust should be **process-backed and contextual**, not a tiered status system. Since all taskers must be verified before
applying, `Verified tasker` is an eligibility cue, not a ranking ladder. The deeper trust language comes from structured
intake, approximate-before-confirmed location, booking timelines, platform-mediated contact, review obligations, dispute
evidence, and moderation visibility.

## Design-system implications

The redesign should start as a directional system, then become stricter after it survives the first proof screens.

### Color

Use a warm neutral base with restrained marketplace accents. Trust, status, danger, verification, and pricing need
semantic roles. Avoid a one-note blue or purple SaaS look, and avoid overly playful gig-app colors.

### Typography

Prioritize readable, compact hierarchy. Cyrillic readability matters, so letter spacing should remain zero. Customer
flows can use a more generous section rhythm; tasker flows need compact metadata without shrinking below accessible
sizes.

### Density

Define explicit density modes:

- `guided` for posting, onboarding, verification, dispute, and review flows
- `balanced` for profile, booking detail, chat, and settings
- `operational` for task feed, applications, tasker jobs, and admin-like lists

### Surfaces

Cards should be purposeful, not decorative. Use cards for task rows, applicant rows, profile/review blocks, modals,
sheets, and repeated items. Avoid nested cards and dashboard sprawl.

### Trust components

Create or formalize reusable patterns for:

- verified badge
- booking timeline
- address privacy row
- review summary
- evidence prompt
- dispute status
- cancellation/no-show warning
- "what happens next" success state

### Platform parity

Web and mobile should share tokens and semantics, but not identical layouts. Web can use split panes and sticky
summaries. Mobile should use native sheets, sticky CTAs, and role-aware tab/screen structure.

## Tasky trust cues

Trust cues must not imply unsupported verification levels or payment protection. For Phase 1, trust cues fall into five
families:

| Cue family     | User question                          | Examples                                                                                                        |
| -------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Eligibility    | Is this person allowed to participate? | `Verified tasker`, verification pending/rejected states, "Only verified taskers can apply" helper copy          |
| Process trust  | Is the flow controlled?                | Structured task fields, approximate location before booking, exact address after confirmation, booking timeline |
| Reputation     | What does prior behavior show?         | Completed jobs, review threshold states, role-specific review dimensions, neutral low-review states             |
| Accountability | Can bad behavior be traced?            | Platform-mediated contact, review debt, cancellation/no-show status, admin-reviewable lifecycle events          |
| Recourse       | What can I do if something goes wrong? | Dispute entry points, evidence upload, serious complaint handling, moderation language                          |

Do not use trust copy that promises payment hold, payment protection, wallet safety, payout protection, escrow, or other
deferred Phase 3 trust rails.

## Refero research plan

Refero should be used as an evidence engine, not as a source to copy.

### Research lanes

1. Customer posting and booking
   - Search references such as IKEA, West Elm, Fresha, booking forms, appointment confirmation, service selection,
     cancellation, and reschedule flows.
   - Goal: learn guided step structure, sticky summaries, post-action confirmation, and cancellation safety patterns.
2. Tasker feed and application
   - Search job feeds, marketplace task lists, applicant workflows, compact metadata cards, and apply flows.
   - Goal: learn fast scanning, filters, status chips, objective task groupings, and application confirmation.
3. Profiles and reputation
   - Search provider profiles, review summaries, low-review states, verified profiles, and team/provider cards.
   - Goal: learn how to show trust without overstating reputation during early launch.
4. Trust and recourse
   - Search review education, dispute/support flows, evidence upload, cancellation warnings, address privacy, and
     destructive confirmation.
   - Goal: derive contextual trust modules and risk-point UI patterns.
5. Cross-platform parity
   - Compare web and iOS references separately for each surface.
   - Goal: extract the underlying pattern, not the literal layout.

### Initial Refero signals

The first research pass produced useful pattern families:

| Reference family                    | Useful for Tasky                                                    | Cautions                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Fresha service profiles and booking | Service lists, provider profiles, reviews, sticky booking CTAs      | Do not copy deposit/payment flows into Phase 1                                             |
| Airbnb review and filter patterns   | Review explanation, contextual trust, filters, location sensitivity | Avoid "guest favorite" style ranking unless backed by Tasky data                           |
| IKEA and West Elm appointment flows | Booking status, reschedule/cancel confirmation, post-action states  | Keep Tasky direct-settlement and open-application model clear                              |
| GlossGenius operational selectors   | Searchable lists, side drawers, multi-select, sticky confirmation   | Too admin-like for customer-facing surfaces if copied directly                             |
| LinkedIn job-feed mechanics         | Tasker feed scanning, apply momentum, filter-backed task groupings  | Tone is too corporate/social-network-like for Tasky; do not adopt algorithmic task ranking |

### Reference matrix output

The next research artifact should map:

```text
Tasky surface -> Refero examples -> adopted pattern -> rejected pattern -> web implication -> mobile implication -> token/component implication
```

## First screens to prove the system

Do not codify the full design system before testing it on real Tasky surfaces. The first proof set is:

1. Customer task posting
   - Proves guided density, structured intake, pricing mode clarity, and "what happens next."
2. Tasker task feed
   - Proves operational density, filters, task cards, status/price/location metadata, and fast apply momentum.
3. Customer task detail / applicant review
   - Proves contextual trust, verified applicant display, comparison without fake ranking, approximate location, and
     budget/quote clarity.
4. Booking detail
   - Proves lifecycle timeline, exact-address reveal, platform-mediated contact, cancellation/no-show/dispute entry
     points.
5. Profile / reviews
   - Proves verified eligibility, low-review handling, public reputation threshold, and human warmth.

After these screens work, the redesign can become a controlled rollout through tokens, primitives, screen specs,
implementation slices, and verification.

## Non-goals

- Do not change Phase 1 product scope through visual design.
- Do not introduce tasker verification tiers unless the product model changes first.
- Do not expose escrow, wallet, payment protection, payout protection, or paid lead features.
- Do not make Refero examples the source of truth for Tasky behavior.
- Do not implement a broad repaint before proof-screen decisions are reviewed.
- Do not put runtime design artifacts under `docs/design/**`; promote proven intent into the active design system and
  `@tasky/design-tokens` only after validation.

## Next decision points

1. Build the Refero reference matrix for the five research lanes.
2. Select visual directions for the proof screens.
3. Decide which current Tasky screens are redesigned first on web and mobile.
4. Update the relevant `docs/design/screen-specs/SCR-*.yaml` files before implementation.
5. Promote proven system decisions into `docs/design/DESIGN_SYSTEM.md`, `docs/design/component-contract.yaml`, and
   `packages/design-tokens`.
