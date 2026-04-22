# Documentation Governance

**Status:** Canonical operational policy

This document defines the allowed live documentation structure for the repository. Enforced by
`tooling/scripts/check-doc-governance.py`.

## Status Vocabulary

Only the following status classes are allowed in active repository docs:

| Status         | Meaning                                                                                                | Typical surfaces                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Canonical      | Governing source of truth for intended product, strategy, or policy                                    | `AGENTS.md`, `docs/PRD.md`, `docs/STRATEGY.md`, relevant `docs/maintenance/*.md` |
| Derived        | Implementation design, UX detail, messaging, or other lower-order material derived from governing docs | `docs/architecture/*.md`, `docs/BRAND.md`, `docs/design/**`                      |
| Generated      | Machine-produced compatibility or bundle surface regenerated from another source                       | `docs/API.yaml`                                                                  |
| Historical     | Retained for audit or reference only and never normative                                               | `archive/**`                                                                     |
| Draft / Future | Explicitly non-active forward design or roadmap material                                               | draft future specs and non-live contract proposals                               |
| Stale          | Temporary remediation marker only while a live surface is being corrected                              | short-lived remediation use only                                                 |

Only narrow governing docs may claim `Canonical`. Architecture docs and design docs must not.

## Authority Hierarchy

When active docs conflict, precedence is:

1. `docs/PRD.md`
2. `docs/STRATEGY.md`
3. relevant `docs/maintenance/*.md`
4. `docs/architecture/*.md`
5. `docs/openapi/openapi.yaml`
6. `docs/BRAND.md` and `docs/design/**`

Lower docs must be corrected, not rationalized. Architecture is derived implementation design. Design is derived UX
and messaging detail. `archive/**` is historical only and never normative.

## Active Document Classes

| Class        | Purpose                                                                | Examples                                                                         |
| ------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Canonical    | Governing product, strategy, policy, and repo agent truth              | `AGENTS.md`, `docs/PRD.md`, `docs/STRATEGY.md`, selected `docs/maintenance/*.md` |
| Derived      | Implementation or UX detail that must align upward                     | `docs/architecture/*.md`, `docs/BRAND.md`, `docs/design/**`                      |
| Generated    | Compatibility or bundled output generated from an authoritative source | `docs/API.yaml`                                                                  |
| Local router | Path-specific entrypoint that routes to smaller relevant docs          | `apps/*/AGENTS.md`, `services/api/AGENTS.md`, `docs/openapi/AGENTS.md`           |
| Historical   | Archived material retained for context                                 | `archive/**`                                                                     |

## Rules

1. Only `AGENTS.md` is allowed to be the canonical repo-level agent instruction file.
2. New governing product truth belongs in `docs/PRD.md`, `docs/STRATEGY.md`, or the relevant maintenance policy doc.
3. New architecture guidance belongs under `docs/architecture/` and must be marked derived.
4. New design guidance belongs under `docs/design/` and must be marked derived.
5. Active docs must not depend on `archive/**` or historical plan directories for authority.
6. `docs/openapi/**` is the active API contract source. `docs/API.yaml` is generated output only and must be refreshed in the same change.
7. Draft or future material must be labeled as non-active and must not masquerade as launch-live guidance.
8. `Stale` may be used only as a temporary remediation status and must be removed once the replacement lands.

## Review Checklist

- Does this change introduce a second authority surface for the same topic?
- Does it keep governing docs above derived docs in discovery paths?
- Does any architecture or design doc incorrectly claim canonical authority?
- If OpenAPI changed, did the change update both `docs/openapi/**` and the generated `docs/API.yaml` bundle?
- If material became historical or future-only, is it clearly labeled non-normative and out of active discovery?
