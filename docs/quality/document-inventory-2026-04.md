# Document Inventory (2026-04)

Last updated: 2026-04-09

This inventory is a snapshot of the major live documentation surfaces under `docs/` at the start of the audit program.
It is intentionally opinionated: it separates canonical sources from derived-active operational docs, historical
evidence, generated-local outputs, and delete-candidate detritus.

Authority order:

1. `canonical`
2. `derived-active`
3. `historical`
4. `generated-local`

If a surface is not listed below, classify it by the nearest matching pattern before using it as an authority source.
`delete-candidate` is a separate removal disposition, not an authority class.

## Canonical Surfaces

| Surface | Status | Why it exists | Notes |
|---|---|---|---|
| `docs/PRD.md` | canonical | Product scope, launch commitments, and requirement truth | Primary product authority |
| `docs/ARCHITECTURE.md` | canonical | Technical baseline and architecture contracts | Primary technical authority |
| `docs/API.yaml` | canonical | OpenAPI contract source | API-first source of truth |
| `docs/design/journey-catalog.yaml` | canonical | Journey-level flow authority | Canonical for journey and alternate-path definitions |
| `docs/design/screen-specs/` | canonical | Per-screen route, state, copy, and acceptance authority | `SCR-*.yaml` files are the screen-level contract |
| `docs/design/component-contract.yaml` | canonical | Component usage contract | Authoritative component and variant rules |
| `docs/design/prompts/global-context.yaml` | canonical | Shared prompt context authority | This file explicitly claims canonical design-system context authority |
| `docs/quality/document-taxonomy.md` | canonical | Doc classification policy | Governance source for status labels |
| `docs/quality/source-generated-archive-policy.md` | canonical | Source vs generated vs archive policy | Governance source for reproducibility rules |
| `docs/quality/document-inventory-2026-04.md` | canonical | Current inventory snapshot | This file is the audit control surface |

## Derived-Active Surfaces

| Surface | Status | Why it exists | Notes |
|---|---|---|---|
| `docs/ARCHITECTURE_INDEX.md` | derived-active | Routing table to canonical docs | Non-normative pointer layer |
| `docs/METRICS.md` | derived-active | Product metric companion to the PRD | Maintained support doc |
| `docs/STRATEGY.md` | derived-active | Strategy companion to the PRD | Maintained support doc |
| `docs/BRAND.md` | derived-active | Brand guidance for current product surfaces | Maintained support doc |
| `docs/LAUNCH_ROADMAP.md` | derived-active | Launch-minimum roadmap and deferred-item tracker | Useful operational summary, not canonical truth |
| `docs/maintenance/OPERATING_MODEL.md` | derived-active | Maintenance workflow guidance | Operational guidance, not product authority |
| `docs/plans/` | derived-active | Active tranche execution plans | Current plans are execution authority for maintenance work only |
| `docs/quality/README.md` | derived-active | Human-readable index for quality-control docs | Operational directory guide |
| `docs/quality/verification-matrix.md` | derived-active | Verification command inventory and ownership | Active control doc |
| `docs/quality/cleanup-gate.md` | derived-active | Trusted cleanup gate contract | Active control doc |
| `docs/design/state-matrix.yaml` | derived-active | Coverage matrix synchronized from screen specs | Must mirror canonical screen specs |
| `docs/design/screen-graph.yaml` | derived-active | Navigation/helper graph derived from canonical design docs | Derived navigation view |
| `docs/design/screen-inventory.yaml` | derived-active | Synchronized summary of screens | Summary only, not contract authority |
| `docs/design/domain-lifecycles.yaml` | derived-active | Lifecycle model derived from PRD/API truth | Operationally useful state-machine reference |
| `docs/design/design-system-additions.yaml` | derived-active | Design system extension notes | Derived design-system aid |
| `docs/design/customer-posting-journey-mapping.md` | derived-active | Customer journey mapping for implementation alignment | Alignment aid, not root authority |
| `docs/design/prompts/README.md` | derived-active | Human-readable generator workflow guide | Explains generated-local artifacts |

## Historical Surfaces

| Surface | Status | Why it exists | Notes |
|---|---|---|---|
| `docs/adr/` | historical | Architecture decisions and their rationale | Read-only decision history |
| `docs/research/` | historical | Research inputs and syntheses | Evidence for future rewrites, not authority |
| `docs/design/prompts/generation-tracker.md` | historical | Archived Stitch-generation tracker | Kept only as design-generation evidence |
| `docs/quality/*audit*.md` | historical | Audit evidence and retrospective findings | Keep for traceability, not implementation truth |
| `docs/quality/*backlog*.md` | historical | Issue lists and rehab backlogs | Historical evidence once superseded |
| `docs/quality/*baseline*.md` | historical | Frozen snapshots of state | Useful for comparisons, not current authority |
| `docs/quality/*report*.md` | historical | Ratification and realignment reports | Durable evidence, not source of contracts |

## Generated-Local Surfaces

| Surface | Status | Why it exists | Notes |
|---|---|---|---|
| none currently retained under live `docs/` | generated-local | Reproducible outputs should be archived or regenerated locally | Archived prompt pack lives under `archive/greenfield-docs/docs/design/prompts/` |
 
## Removal Candidates

| Surface | Disposition | Why it exists | Notes |
|---|---|---|---|
| `docs/.DS_Store` | delete-candidate | OS metadata accidentally surfaced in `docs/` | Remove when touched; never treat as documentation |
| `docs/research/.DS_Store` | delete-candidate | OS metadata accidentally surfaced in `docs/research/` | Remove when touched; never treat as documentation |

## Classification Notes

- `docs/` is a mixed-authority tree. Canonical and derived-active material live side by side.
- `docs/design/prompts/` is a mixed tree. Treat `README.md` as derived-active workflow guidance, `global-context.yaml`
  as canonical context authority, and `generation-tracker.md` as historical evidence. The committed prompt-output pack
  has been archived to `archive/greenfield-docs/docs/design/prompts/`.
- `derived-active` means the document is maintained and useful, but it must mirror canonical sources rather than compete
  with them.
- `historical` means the document is preserved for traceability or audit context and should not be used to set current
  product or technical truth.
- `generated-local` means the artifact can be recreated from canonical inputs. It may be versioned for convenience, but
  it is not source.
- `delete-candidate` is a temporary holding status for junk or misleading duplicates that should be removed when safe.
  It is not part of the authority ladder.

## Surfaces Requiring Special Care

- `docs/quality/` contains both maintained control docs and historical audit artifacts. Do not treat the directory as a
  single authority class.
- `docs/plans/` is active execution material. Only current tranches are operational authority; completed or superseded
  plans should be reclassified as historical or removed from active use.
- Debate notes, idea scratchpads, and archived prompt outputs now live under `archive/greenfield-docs/docs/` rather
  than the active `docs/` tree.
