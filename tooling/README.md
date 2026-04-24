# Tooling

This directory contains repository-level engineering tooling for maintenance and structural work.

## Layout

| Path                          | Role                                                                      | Entrypoints                                                                               |
| ----------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `tooling/config/`             | Shared lint, format, TS, Vitest, static-analysis config, and ops registry | Imported by workspace package configs, backend Gradle, and ops checks                     |
| `tooling/skills/`             | Repo-owned harness-agnostic agent workflows                               | `tooling/skills/AGENTS.md`, adapters                                                      |
| `tooling/scripts/contracts/`  | OpenAPI and SDK contract automation                                       | `package.json`, `services/api/build.gradle.kts`, `packages/sdk/package.json`              |
| `tooling/scripts/gates/`      | Verification gates and wiring audits                                      | `package.json`, `.github/workflows/**`, `services/api/build.gradle.kts`                   |
| `tooling/scripts/governance/` | Docs, migration, schema, workspace, and security-ignore governance        | `package.json`, `.github/workflows/**`, policy docs                                       |
| `tooling/scripts/deploy/`     | Private staging deploy helpers and performance smoke                      | workflows, runbooks                                                                       |
| `tooling/scripts/manual/`     | Manual diagnostics not used by default automation                         | humans only                                                                               |
| `tooling/observability/`      | Prometheus, Grafana, and Alertmanager config                              | `docker-compose.observability.yml`, `tooling/scripts/observability/start-alertmanager.sh` |

## Canonical Entrypoints

- Verify lane: `pnpm prepare:push`, `pnpm verify:cleanup`, `pnpm verify:ops`, `pnpm verify:tdd`, `pnpm verify:i18n`, `pnpm verify:backend:static`, `pnpm verify:backend`, `pnpm verify:frontend`, `pnpm verify:scenario:smoke`, `pnpm verify:scenario:fidelity`, `pnpm verify:drift`
- Contract lane: `pnpm contract:openapi:bundle`, `pnpm contract:openapi:check`, `pnpm contract:sdk:generate`, `pnpm contract:sdk:drift`
- Repo lane: `pnpm repo:docs:check`, `pnpm repo:design:check`, `pnpm repo:docs:claims`, `pnpm repo:docs:claims:triage`, `pnpm repo:docs:claims:audit`, `pnpm repo:prd:diff-ids`, `pnpm repo:ops:sync`, `pnpm repo:workspace:boundaries`, `pnpm repo:tooling:check`
- Backend scenario gates: `services/api/build.gradle.kts` -> `tooling/scripts/gates/check-gates.sh`
- Private staging deploy path: `tooling/scripts/deploy/push-private-staging.sh`, `tooling/scripts/deploy/deploy-private-staging.sh`, `tooling/scripts/deploy/smoke-private-staging.sh`

## Ops Registry

`tooling/config/ops-registry.yaml` is the executable ops inventory. `pnpm verify:ops` validates package scripts,
Husky hooks, GitHub workflow jobs/commands, compose files, generated inventory freshness, and tooling-script
lifecycle classifications against it. Run `pnpm repo:ops:sync --fix` after mechanical ops wiring changes; it
refreshes workflow job lists and regenerates `docs/maintenance/generated/OPS_INVENTORY.md`. `docs/ops/diagrams/**`
are ephemeral sketches for humans and are not validation inputs.

## Locale Gate

- `tooling/scripts/governance/validate-i18n.py` is the active locale audit. It checks client locale key parity,
  interpolation placeholder parity, backend message key/placeholder parity, and literal `t('key', 'fallback')`
  callsites.

## Out Of Scope

- product runtime code
- generated build outputs
- local install artifacts such as `tooling/config/node_modules/`
