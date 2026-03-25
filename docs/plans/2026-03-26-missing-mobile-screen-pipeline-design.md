# Missing Mobile Screen Pipeline Design

**Date:** 2026-03-26
**Scope:** `docs/design/*`, `docs/design/prompts/*`, `scripts/generate-prompts.js`

## Goal

Extend the existing Stitch prompt-generation pipeline so the repository can carry and generate the missing near-term mobile screens that are required for the planned mobile build through Phase 3.

## Approved Scope

Include:

- Phase 1 AI Profile Polish
- Phase 2 promoted listing / urgent boost purchase flow
- Phase 2 B2B business-account management surfaces
- Phase 3 B2B subscription billing surfaces
- Grandfathered discount disclosure in paid checkout

Exclude for now:

- Phase 4 Tasky Plus customer subscription screens
- Phase 4 Family Plan customer subscription screens
- Phase 4 favorites / household service history surfaces

## Design

The current pipeline is spec-first: authored screen specs under `docs/design/screen-specs/` are the canonical input, and `scripts/generate-prompts.js` renders Stitch prompt YAMLs plus the prompt manifest from those specs.

To close the agreed gaps, the repository needs three coordinated changes:

1. Add the missing screen specs and supporting navigation/state artifacts.
2. Extend the generation pipeline so the new screen family is grouped correctly in the prompt manifest.
3. Update the design docs to reflect the larger prompt pack and the new scope boundary.

## Screen Grouping

The current system groups screens by role and phase:

- `SCR-SHARED-*`
- `SCR-INFRA-*`
- `SCR-CUST-*`
- `SCR-TASK-*`
- `SCR-P2-*`
- `SCR-P3-*`

For the new business-account and B2B billing surfaces, add a dedicated:

- `SCR-B2B-*`

This keeps business-owner flows separate from the normal customer posting flow and avoids overloading `SCR-CUST-*` with specialized account-management screens.

## New Screen Set

Planned additions:

- `SCR-TASK-019` — AI Profile Polish
- `SCR-CUST-028` — Task Boost Options
- `SCR-CUST-029` — Task Boost Payment
- `SCR-B2B-001` — Business Accounts List
- `SCR-B2B-002` — Business Account Editor
- `SCR-B2B-003` — Business Location Editor
- `SCR-B2B-004` — Business Members
- `SCR-B2B-005` — Post Task as Business
- `SCR-B2B-006` — Business Tasks
- `SCR-B2B-007` — Business Subscription Billing

Grandfathered discount disclosure is modeled as an added state within the paid checkout screen rather than as a standalone screen.

## Supporting Artifacts

The following files must remain aligned:

- `docs/design/screen-inventory.yaml`
- `docs/design/journey-catalog.yaml`
- `docs/design/screen-graph.yaml`
- `docs/design/state-matrix.yaml`
- `docs/design/screen-specs/SCR-*.yaml`
- `docs/design/prompts/generation-tracker.md`
- `docs/design/prompts/README.md`
- `docs/design/evaluation-report.md`

## Generator Change

`scripts/generate-prompts.js` already generates prompts from all screen specs automatically. It only needs a small change to add `SCR-B2B-*` into `generation_order`.

No inverse “spec generation” step will be introduced. Specs remain hand-authored canonical documents.

## Risks

- `docs/API.yaml` is still ahead/behind implementation in some later-phase areas; screen specs must stay within the current PRD/API boundary and avoid inventing unsupported runtime behavior.
- The manual tracker should not imply Stitch designs already exist for the new screens; they should enter as not started unless actually generated.
- New B2B screens must not imply a separate booking lifecycle; they reuse the standard task/booking path.

## Success Criteria

- New near-term missing screens exist as authored screen specs.
- Prompt files and manifest generate successfully for the new screens.
- Inventory, graph, journeys, and state matrix reference the same new screen IDs.
- Docs clearly distinguish the expanded prompt pack from the still-excluded Phase 4 surfaces.
