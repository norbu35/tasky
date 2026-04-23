# Documentation Governance

This document defines the live documentation structure for the repository. It is enforced by `tooling/scripts/governance/check-doc-governance.py`.

## Document classes

| Class          | Purpose                                                           | Typical surfaces                                                                 |
| -------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Governing      | Product, strategy, and operating policy                           | `AGENTS.md`, `docs/PRD.md`, `docs/STRATEGY.md`, selected `docs/maintenance/*.md` |
| Derived        | Implementation design, UX detail, and other downstream material   | `docs/architecture/*.md`, `docs/BRAND.md`, `docs/design/**`                      |
| Generated      | Bundled or machine-produced output from another maintained source | `docs/API.yaml`                                                                  |
| Router         | Entry points that send readers to the smallest relevant document  | `apps/*/AGENTS.md`, `services/api/AGENTS.md`, `docs/openapi/AGENTS.md`           |
| Historical     | Audit material and archived context kept for reference only       | `archive/**`, `docs/audits/**`, ADR history where applicable                     |
| Future / Draft | Explicitly non-launch material                                    | draft specs and future-facing proposals                                          |

## Precedence

When active documents conflict, read them in this order:

1. `docs/PRD.md`
2. `docs/STRATEGY.md`
3. relevant `docs/maintenance/*.md`
4. `docs/architecture/*.md`
5. `docs/openapi/openapi.yaml`
6. `docs/BRAND.md` and `docs/design/**`

Lower-order documents should be corrected when they fall out of line with governing ones.

## Rules

1. `AGENTS.md` is the repo-level entry point for working instructions.
2. Product behavior belongs in `docs/PRD.md`.
3. Market posture belongs in `docs/STRATEGY.md`.
4. Operating rules belong in the relevant maintenance document.
5. Architecture guidance belongs under `docs/architecture/`.
6. Design guidance belongs under `docs/design/`.
7. Active documents must not rely on `archive/**` for authority.
8. `docs/openapi/**` is the maintained API contract source; `docs/API.yaml` is the bundled output and must be refreshed in the same change.
9. Future-facing material must be clearly labeled and must not read like launch guidance.

## Review checklist

- Does this change introduce a second document that tries to own the same topic?
- Does it keep governing docs above derived docs in the discovery path?
- Does any architecture or design doc claim more authority than it should?
- If OpenAPI changed, were both `docs/openapi/**` and `docs/API.yaml` updated together?
- If content became historical or future-only, is it clearly placed outside the live reading path?
