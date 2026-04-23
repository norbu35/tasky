# Documentation Governance

This document defines the live documentation structure for the repository. It is enforced by `tooling/scripts/governance/check-doc-governance.py`.

## Document classes

| Class      | Purpose                                                           | Typical surfaces                                                                                           |
| ---------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Governing  | Product, strategy, rollout, and operating policy                  | `AGENTS.md`, `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, selected `docs/maintenance/*.md` |
| Derived    | Active implementation design and UX detail for the current phase  | `docs/architecture/*.md`, `docs/BRAND.md`, active `docs/design/**`, active `docs/openapi/**`               |
| Generated  | Bundled or machine-produced output from another maintained source | `docs/API.yaml`                                                                                            |
| Router     | Entry points that send readers to the smallest relevant document  | `apps/*/AGENTS.md`, `services/api/AGENTS.md`, `docs/openapi/AGENTS.md`                                     |
| Historical | Archived material kept for reference only                         | `archive/**`, `docs/audits/**`                                                                             |

## Precedence

When active documents conflict, read them in this order:

1. `docs/PRD.md`
2. `docs/STRATEGY.md`
3. `docs/ROLLOUT_PHASES.md`
4. relevant `docs/maintenance/*.md`
5. `docs/architecture/*.md`
6. `docs/openapi/openapi.yaml`
7. `docs/BRAND.md` and active `docs/design/**`

Lower-order documents must be corrected when they drift.

## Rules

1. `AGENTS.md` is the repo-level entry point for working instructions.
2. Product behavior belongs in `docs/PRD.md`.
3. Market posture belongs in `docs/STRATEGY.md`.
4. Future rollout intent belongs in `docs/ROLLOUT_PHASES.md`.
5. Active architecture, design, and API docs must describe the current phase only.
6. Future technical detail must not stay in the active derivative path once that phase is deferred again.
7. If future material is worth keeping, move it to `archive/**` instead of leaving it mixed into active docs.
8. Active documents must not rely on `archive/**` for authority.
9. `docs/openapi/**` is the maintained active API contract source; `docs/API.yaml` is the bundled output and must be refreshed in the same change.
10. Do not use an ADR system in the live docs path until the team deliberately adopts one.

## Review checklist

- Does this change introduce a second document that tries to own the same topic?
- Does it keep governing docs above derived docs in the discovery path?
- Does any architecture, design, or API doc describe a future phase as if it were live?
- If content became future-only or historical, was it moved out of the active reading path?
- If OpenAPI changed, were both `docs/openapi/**` and `docs/API.yaml` updated together?
