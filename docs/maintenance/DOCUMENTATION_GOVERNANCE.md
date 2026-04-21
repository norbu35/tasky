# Documentation Governance

This document defines the allowed live documentation structure for the repository.

## Document Classes

| Class               | Purpose                                  | Examples                                                                |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| Canonical           | authoritative source of truth            | `AGENTS.md`, `docs/architecture/*.md`, `docs/API.yaml`, `docs/PRD.md`   |
| Local router        | path-specific entrypoint                 | `apps/web/AGENTS.md`, `apps/mobile/AGENTS.md`, `services/api/AGENTS.md` |
| Compatibility alias | legacy path kept only to reduce link rot | `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE_INDEX.md`                    |
| Operational         | runbooks and launch posture              | `docs/maintenance/*.md`                                                 |
| Archive             | historical reference only                | `archive/**`                                                            |

## Rules

1. Only `AGENTS.md` is allowed to be the canonical repo-level agent instruction file.
2. Client adapters may bootstrap tools, but may not point to another client adapter as a shared source of truth.
3. New architecture authority belongs under `docs/architecture/`.
4. `docs/ARCHITECTURE.md` and `docs/ARCHITECTURE_INDEX.md` are compatibility shims only.
5. Active docs must not depend on `docs/plans/`.
6. If a new surface needs path-local rules, add a nearest local `AGENTS.md` instead of expanding a root bootstrap file.
7. Repo packs and context bundling scripts should include the split architecture docs, not only the legacy monolith path.

## Review Checklist

- Does this change introduce a second authority surface for the same topic?
- Does it make agents read more than they need?
- Does it leave stale references behind?
- Does it update discovery docs in the same change when a canonical path moves?
