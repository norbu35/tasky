# Documentation Governance

This document defines the allowed live documentation structure for the repository. Enforced by `tooling/scripts/check-doc-governance.py`.

## Document Classes

| Class               | Purpose                         | Examples                                                                                          |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Canonical           | authoritative source of truth   | `AGENTS.md`, `docs/architecture/*.md`, `docs/openapi/**`, `docs/PRD.md`                           |
| Compatibility alias | generated compatibility surface | `docs/API.yaml`                                                                                   |
| Local router        | path-specific entrypoint        | `apps/web/AGENTS.md`, `apps/mobile/AGENTS.md`, `services/api/AGENTS.md`, `docs/openapi/AGENTS.md` |
| Operational         | runbooks and launch posture     | `docs/maintenance/*.md`                                                                           |
| Archive             | historical reference only       | `archive/**`                                                                                      |

## Rules

1. Only `AGENTS.md` is allowed to be the canonical repo-level agent instruction file.
2. Client adapters may bootstrap tools, but may not point to another client adapter as a shared source of truth.
3. New architecture authority belongs under `docs/architecture/`.
4. Active docs must not depend on `docs/plans/`.
5. If a new surface needs path-local rules, add a nearest local `AGENTS.md` instead of expanding a root bootstrap file.
6. Repo packs and context bundling scripts should include the split architecture docs.
7. Live OpenAPI source belongs in `docs/openapi/**`; `docs/API.yaml` is a generated compatibility artifact and must be refreshed in the same change.

## Review Checklist

- Does this change introduce a second authority surface for the same topic?
- Does it make agents read more than they need?
- Does it leave stale references behind?
- Does it update discovery docs in the same change when a canonical path moves?
- If OpenAPI changed, did the change update both `docs/openapi/**` and the generated `docs/API.yaml` bundle?
