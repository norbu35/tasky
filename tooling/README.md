# Tooling

This directory contains repository-level engineering tooling for maintenance and structural work.

## Layout

| Path                          | Role                                                               | Entrypoints                                                                               |
| ----------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `tooling/config/`             | Shared lint, format, TS, Vitest, and static-analysis config        | Imported by workspace package configs and backend Gradle                                  |
| `tooling/skills/`             | Repo-owned harness-agnostic agent workflows                        | `tooling/skills/AGENTS.md`, adapters                                                      |
| `tooling/scripts/contracts/`  | OpenAPI and SDK contract automation                                | `package.json`, `services/api/build.gradle.kts`, `packages/sdk/package.json`              |
| `tooling/scripts/gates/`      | Verification gates and wiring audits                               | `package.json`, `.github/workflows/**`, `services/api/build.gradle.kts`                   |
| `tooling/scripts/governance/` | Docs, migration, schema, workspace, and security-ignore governance | `package.json`, `.github/workflows/**`, policy docs                                       |
| `tooling/scripts/deploy/`     | Private staging deploy helpers and performance smoke               | workflows, runbooks                                                                       |
| `tooling/scripts/manual/`     | Manual diagnostics not used by default automation                  | humans only                                                                               |
| `tooling/observability/`      | Prometheus, Grafana, and Alertmanager config                       | `docker-compose.observability.yml`, `tooling/scripts/observability/start-alertmanager.sh` |

## Canonical Entrypoints

- Verify lane: `pnpm verify:cleanup`, `pnpm verify:ops`, `pnpm verify:backend`, `pnpm verify:frontend`, `pnpm verify:scenario:smoke`, `pnpm verify:scenario:fidelity`, `pnpm verify:drift`
- Contract lane: `pnpm contract:openapi:bundle`, `pnpm contract:openapi:check`, `pnpm contract:sdk:generate`, `pnpm contract:sdk:drift`
- Repo lane: `pnpm repo:docs:check`, `pnpm repo:design:check`, `pnpm repo:docs:claims`, `pnpm repo:docs:claims:triage`, `pnpm repo:docs:claims:audit`, `pnpm repo:prd:diff-ids`, `pnpm repo:workspace:boundaries`, `pnpm repo:tooling:check`
- Backend scenario gates: `services/api/build.gradle.kts` -> `tooling/scripts/gates/check-gates.sh`
- Private staging deploy path: `tooling/scripts/deploy/push-private-staging.sh`, `tooling/scripts/deploy/deploy-private-staging.sh`, `tooling/scripts/deploy/smoke-private-staging.sh`

## Manual-Only Helpers

- `tooling/scripts/manual/analyze_i18n.py`

These are diagnostic helpers, not default gates.

## Out Of Scope

- product runtime code
- generated build outputs
- local install artifacts such as `tooling/config/node_modules/`
