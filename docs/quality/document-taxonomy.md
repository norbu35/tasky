# Document Taxonomy

Last updated: 2026-04-09

## Purpose

Classify `docs/` surfaces by authority so maintenance work can separate canonical truth from derived views, historical
evidence, and generated-local output.

`docs/` is not a uniform source bucket. Some files are canonical, some are actively maintained but derived, and some are
preserved only as history.

## Classification

| Status | Meaning | Typical examples |
|---|---|---|
| `canonical` | Primary source of truth for the topic | `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/API.yaml`, `docs/design/journey-catalog.yaml`, `docs/design/screen-specs/`, `docs/design/component-contract.yaml`, `docs/design/prompts/global-context.yaml` |
| `derived-active` | Maintained operational doc that must mirror canonical sources or execution state | `docs/ARCHITECTURE_INDEX.md`, `docs/LAUNCH_ROADMAP.md`, `docs/plans/`, `docs/quality/README.md`, `docs/quality/verification-matrix.md`, `docs/quality/cleanup-gate.md`, `docs/design/state-matrix.yaml`, `docs/design/screen-graph.yaml`, `docs/design/screen-inventory.yaml`, `docs/design/domain-lifecycles.yaml`, `docs/design/design-system-additions.yaml`, `docs/design/customer-posting-journey-mapping.md`, `docs/design/prompts/README.md` |
| `historical` | Versioned evidence or prior decision context, not current authority | `docs/adr/`, `docs/research/`, `docs/design/prompts/generation-tracker.md`, `docs/quality/*audit*.md`, `docs/quality/*backlog*.md`, `docs/quality/*baseline*.md`, `docs/quality/*report*.md` |
| `generated-local` | Reproducible output or local artifact; never source | temporary prompt packs before archiving, test result dumps, local cache output |

## Operating Rules

- Read canonical docs first when resolving product, technical, or design questions.
- Treat derived-active docs as synchronized views or workflow aids, not as independent truth.
- Treat historical docs as read-only context. They can justify decisions, but they do not override canonical sources.
- Treat generated-local artifacts as reproducible outputs. If the input source changes, regenerate them instead of
  editing them by hand.
- When a file or directory is both operational and derived, name both roles explicitly instead of assuming equal
  authority.
- Treat `docs/design/prompts/` as a mixed tree: the README is operational, the global context is canonical, and the
  tracker is historical. Generated prompt-output packs should be archived or regenerated locally, not kept as active
  doc surfaces by default.
- Treat delete-candidate as a removal disposition for junk or obsolete duplicates, not as a peer authority class.

## Authority Chain

When documents conflict, use this order:

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/API.yaml`
4. Canonical design sources under `docs/design/`
5. Derived-active operational docs
6. Historical evidence
7. Generated-local artifacts

## Maintenance Notes

- Update the inventory when a major `docs/` surface is added, renamed, or retired.
- Reclassify a surface before it starts acting like a second authority.
- Keep the taxonomy short enough that future agents can apply it without inventing new labels.
