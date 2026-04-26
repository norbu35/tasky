# Tasky Agent Operating Contract

Repo-level router. Read this first, then jump to the smallest area surface that matches the change.

## Discovery Path

For non-trivial work, read in order until the smallest sufficient surface is covered:

1. `docs/PRD.md`
2. `docs/STRATEGY.md`
3. `docs/ROLLOUT_PHASES.md` for phase-gated capabilities
4. relevant `docs/maintenance/*.md` policy
5. the area `AGENTS.md` from the table below
6. `docs/openapi/AGENTS.md` only for request/response contract work

Higher documents govern lower documents. `archive/**` is historical only.

| Working area                       | Read next                                                      |
| ---------------------------------- | -------------------------------------------------------------- |
| Whole repo or shared contract work | `docs/architecture/AGENTS.md`                                  |
| `docs/openapi/**`                  | `docs/openapi/AGENTS.md`                                       |
| `docs/design/**`                   | `docs/design/AGENTS.md`                                        |
| `services/api/**`                  | `services/api/AGENTS.md`, then the affected module `AGENTS.md` |
| `apps/web/**`                      | `apps/web/AGENTS.md`                                           |
| `apps/mobile/**`                   | `apps/mobile/AGENTS.md`                                        |
| `packages/core/**`                 | `packages/core/AGENTS.md`                                      |
| `packages/design-tokens/**`        | `packages/design-tokens/AGENTS.md`                             |
| `packages/sdk/**`                  | `packages/sdk/AGENTS.md`                                       |
| `packages/test-utils/**`           | `packages/test-utils/AGENTS.md`                                |
| `tooling/skills/**`                | `tooling/skills/AGENTS.md`                                     |
| `tooling/**`, CI, ops              | `tooling/AGENTS.md` and `docs/maintenance/AGENTS.md`           |

On conflict, the more specific surface wins unless it contradicts a higher governing doc.

## Code Navigation

- Use Serena (`mcp__serena__*`) for symbol search, references, declarations, implementations, and safe refactors. Fall back to grep/glob if Serena returns empty or errors.
- Use `npx repomix` for broad context only; do not use it for narrow symbol lookups Serena can answer. Pre-baked include sets live in `package.json` `pack:*` scripts.

## Branch Flow And Push Discipline

- Branches flow `feature/*` → `staging` → `main`. Promote `staging` to `main` only after full local verification passes.
- Do not bypass `.husky/pre-push` with `--no-verify` (or equivalent) for pushes that target `staging` or `main`. This is the canonical statement; downstream files do not restate it.

## Env File Ownership

- Root `.env` and `.env*.example` files are for the monorepo stack, backend runtime, infrastructure services, and deployment orchestration.
- Web local client config lives in `apps/web/.env.local`, seeded from `apps/web/.env.example`. Keep browser-exposed values under `VITE_*`; never put secrets there.
- Mobile local client/native config lives in `apps/mobile/.env`, seeded from `apps/mobile/.env.example`. Keep JS-exposed values under `EXPO_PUBLIC_*`; never put secrets there.
- App code must not read the root `.env` directly for app-owned client config. Use real process env plus the app-local env file. Deployment compose/build scripts may still pass app build args from deployment env files when they are orchestration inputs.

## I18n Rules (canonical)

Frontend code consumes i18n via `react-i18next` with locale keys; web and mobile each own their locales.

- Web locales: `apps/web/src/locales/{en,mn}/translation.json`. Mobile locales: `apps/mobile/src/locales/{en,mn}/translation.json`. Do not create shared client locale files.
- Do not introduce hardcoded user-visible copy (UI, validation, toast/snackbar, empty/error states, accessibility labels, placeholders, test-rendered copy). Add or reuse keys instead.
- Do not pass literal fallback text to `t(...)`; call `t('namespace.key')`.
- When adding, renaming, or removing keys, update every supported locale in the same change and keep interpolation placeholders identical across locales.
- Tests render translated copy through the production i18n contract (or a test instance loaded from locale files) and assert by translated text or semantic role — never by mocking `t` to return fallback args.
- Run `pnpm verify:i18n` after touching frontend copy, locale files, i18n setup, or tests that render translated UI.

`apps/web/AGENTS.md` and `apps/mobile/AGENTS.md` reference these rules; they do not restate them.

## Workflow Rules (triggers)

- Contract-first: if the API changes, update `docs/openapi/**` first, regenerate `docs/API.yaml`, regenerate `@tasky/sdk`, then implement.
- Design machine-readable docs: edits to `docs/design/screen-graph.yaml`, `docs/design/journey-catalog.yaml`, or `docs/design/domain-lifecycles.yaml` must use canonical IDs (no prose placeholders) and pass `pnpm repo:design:check` plus `pnpm repo:docs:check`.
- Screen specs: edits to `docs/design/screen-specs/SCR-*.yaml` must keep traceability wired through live `REQ-P1`/`NFR`, `JRN`, `SCR`, and existing `SCN` IDs; new or materially changed specs use `traceability.status: validated`. Run `python3 tooling/scripts/governance/validate-screen-spec-traceability.py` plus `pnpm repo:docs:check`.
- Merge gates: edits to `.github/workflows/quality-gates.yml` or merge-gate wiring must keep the docs lane wired in and update `tooling/config/ops-registry.yaml` and ops/config checks in the same change.
- Ops inventory: package-script, hook, workflow, compose, or tooling-script wiring changes require `pnpm repo:ops:sync --fix` then `pnpm verify:ops`.
- Schema parity: a Flyway migration that adds, drops, or renames a column or table requires `python3 tooling/scripts/governance/validate-schema-parity.py --update-expected` and committing the updated `tooling/config/expected-schema.json`.
- Use the active issue or approved execution brief as the task source; do not rely on archived plan directories. Keep changes vertical and reviewable. Update `CHANGELOG.md` when convention requires it.

## Rollout Phase

The current product phase is **Phase 1 launch baseline** unless `docs/PRD.md` says otherwise. `docs/ROLLOUT_PHASES.md` is the AI-readable phase map.

Dormant future-phase code, schemas, routes, and toggles may exist intentionally. Keep them off by default and do not expose them in launch UX or copy. A toggle being switchable is not product readiness — activation requires PRD, strategy, maintenance policy, contract, UX/copy, verification, monitoring, and rollback updates in the same workflow.

## Repo Skills

Reusable repo-owned agent workflows live under `tooling/skills/**` and stay harness-agnostic. Load each skill's `SKILL.md`.

| Skill                                            | When to use                                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `tooling/skills/doc-claims-remediation/SKILL.md` | Reactively when `validate-doc-claims.py` fails; proactively when editing architecture/maintenance/module docs. |
| `tooling/skills/intake-to-prd/SKILL.md`          | PRD-first routing and ripple review; run the narrowest matching `pnpm repo:prd:diff-ids` mode.                 |
| `tooling/skills/design-surface-drift/SKILL.md`   | `screen-graph.yaml`, `journey-catalog.yaml`, `domain-lifecycles.yaml` edits, or those validators failing.      |
| `tooling/skills/scenario-fidelity/SKILL.md`      | Report-only weak-test triage after writing or strengthening scenario-linked tests. Not a blocking gate.        |

## Security-Critical Files

For any file below: read the current body before editing, run the relevant gate, and call the change out explicitly in the PR.

| File                             | Risk if changed carelessly                             |
| -------------------------------- | ------------------------------------------------------ |
| `SecurityConfig.java`            | filter-chain order, role enforcement, public path list |
| `JwtAuthenticationFilter.java`   | token validation and blacklist order                   |
| `JwtTokenService.java`           | signing, validation, jti stamping                      |
| `TokenBlacklistService.java`     | revocation TTL and logic                               |
| `StompRateLimitInterceptor.java` | websocket DoS protection                               |
| `ChannelInterceptorConfig.java`  | STOMP auth and subscription authorization              |
| `apps/web/Caddyfile.production`  | CSP widening can open XSS vectors                      |

Additional invariants: `APP_DB_USER` (not `POSTGRES_USER`) for runtime DB; never bypass PgBouncer for runtime; web primitives stay Radix + Tailwind; mobile primitives stay native and token-driven; secrets only in env vars.

## Verification

Pick the smallest gate that matches the claim. Areas declare their own defaults (`services/api/AGENTS.md`, `apps/web/AGENTS.md`, `apps/mobile/AGENTS.md`, `tooling/AGENTS.md`).

| Surface                      | Source                                           |
| ---------------------------- | ------------------------------------------------ |
| Local push gate (`main`)     | `.husky/pre-push`                                |
| Local push gate (non-`main`) | `.husky/pre-push` lightweight path               |
| Merge CI gate                | `.github/workflows/quality-gates.yml`            |
| Release gate                 | `.github/workflows/release-gate.yml`             |
| Nightly regression           | `./gradlew gateRegression`, `./gradlew gateFull` |

`./gradlew gateSmoke` is fast local critical-scenario confidence, not the singular pre-merge source of truth.
