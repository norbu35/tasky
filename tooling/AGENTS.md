# Tasky Tooling Router

Use this file when the task is primarily about repository tooling, CI/CD wiring, deploy automation, or observability
configuration rather than product behavior.

## Applies To

- `tooling/config/**`
- `tooling/skills/**`
- `tooling/scripts/**`
- `tooling/observability/**`
- `.github/workflows/**` when changing how tooling is invoked
- `docker-compose.observability.yml`
- root `package.json` gate and tooling scripts

## Lane Routing

Pick the smallest lane that matches the job:

| Lane       | Use for                                                             | Primary commands                                                                                                                             |
| ---------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify`   | CI-local verification, hook surfaces, PR gates, release gate wiring | `pnpm verify:cleanup`, `pnpm verify:ops`, `pnpm verify:backend`, `pnpm verify:frontend`, `pnpm verify:scenario:smoke`, `pnpm verify:drift`   |
| `contract` | OpenAPI bundle, generated SDK, contract drift                       | `pnpm contract:openapi:bundle`, `pnpm contract:openapi:check`, `pnpm contract:sdk:generate`, `pnpm contract:sdk:drift`                       |
| `repo`     | Docs governance, script-surface audit, workspace boundaries         | `pnpm repo:docs:check`, `pnpm repo:docs:claims`, `pnpm repo:docs:claims:triage`, `pnpm repo:tooling:check`, `pnpm repo:workspace:boundaries` |
| `deploy`   | Private staging push/deploy/smoke and performance smoke             | `tooling/scripts/deploy/**`                                                                                                                  |
| `manual`   | Human-only diagnostics not used by default automation               | `tooling/scripts/manual/**`                                                                                                                  |

## Read Next

1. `AGENTS.md`
2. `docs/maintenance/AGENTS.md`
3. `docs/maintenance/OPERATING_MODEL.md`
4. `docs/maintenance/STAGING_RUNBOOK.md` for private staging deploy work
5. `docs/maintenance/PRODUCTION_READINESS.md` for release and rollback work
6. `docs/OBSERVABILITY.md` only when touching metrics, dashboards, Prometheus, Grafana, or Alertmanager

## Operating Rules

- Keep one canonical path per concern. Prefer shared scripts and root aliases over duplicated workflow logic.
- Every active script in `tooling/scripts/**` must have a live caller in `package.json`, `.github/workflows/**`,
  Gradle, compose, or a runbook.
- Manual-only scripts must stay explicitly documented as manual helpers.
- Generated outputs must be regenerated through their owning script, not hand-maintained as independent authority.
- Deploy inputs must be deterministic: workflow refs, image tags, and config refs must resolve to one exact target.
- Observability config must run as checked in. Do not rely on undocumented template expansion.
- Compatibility aliases such as `gate:*`, `openapi:*`, `sdk:*`, `docs:check`, `tooling:check`, and `workspace:boundaries`
  exist for transition only. Prefer the lane names above in new work.

## Pipeline Map

| Surface                  | Purpose                                                     | Canonical entrypoint                       |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------ |
| PR structural gate       | Repo drift, docs, boundaries, migrations, schema checks     | `pnpm verify:cleanup`                      |
| PR ops/config validation | Tooling surface, workflow wiring, compose config validation | `pnpm verify:ops`                          |
| PR backend quality       | Backend compile, tests, coverage, OpenAPI validation        | `pnpm verify:backend`                      |
| PR frontend quality      | Frontend lint and tests                                     | `pnpm verify:frontend`                     |
| Main image build         | Build and publish API and web images                        | `.github/workflows/build-and-push.yml`     |
| Staging deploy           | Promote a verified build to private staging                 | `.github/workflows/deploy-staging.yml`     |
| Release gate             | Pre-production validation                                   | `.github/workflows/release-gate.yml`       |
| Production deploy        | Manual promotion after release gate                         | `.github/workflows/deploy-production.yml`  |
| Nightly regression       | Extended backend, web, and security validation              | `.github/workflows/nightly-regression.yml` |
| Nightly mobile           | Extended Android and Maestro regression                     | `.github/workflows/nightly-mobile.yml`     |

## Directory Map

| Path                             | Role                                                           | Default caller                                         |
| -------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| `tooling/skills/`                | Repo-owned harness-agnostic agent workflows                    | adapters, `AGENTS.md`, direct agent use                |
| `tooling/scripts/contracts/`     | OpenAPI and SDK contract automation                            | `pnpm contract:*`                                      |
| `tooling/scripts/gates/`         | Verification entrypoints and wiring audits                     | `pnpm verify:*`, Gradle gates, PR CI                   |
| `tooling/scripts/governance/`    | Docs, migration, schema, workspace, security-ignore governance | `pnpm repo:*`, `pnpm verify:cleanup`, deploy workflows |
| `tooling/scripts/deploy/`        | Private staging and performance/deploy helpers                 | staging runbook, release gate                          |
| `tooling/scripts/observability/` | Runtime observability bootstrap helpers                        | `docker-compose.observability.yml`                     |
| `tooling/scripts/manual/`        | Manual diagnostics                                             | human-triggered only                                   |

## Tooling Inventory

| Surface                                                        | Function                                                | Called from                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `tooling/scripts/gates/check-cleanup-gate.sh`                  | Structural repo gate                                    | `pnpm verify:cleanup`, PR structural gate                     |
| `tooling/scripts/gates/check-ops-config.mjs`                   | Workflow wiring and compose config validation           | `pnpm verify:ops`                                             |
| `tooling/scripts/gates/check-tooling-surface.mjs`              | Enforces script classification and live callers         | `pnpm repo:tooling:check`                                     |
| `tooling/scripts/governance/check-doc-governance.py`           | Documentation governance                                | `pnpm repo:docs:check`, `pnpm verify:cleanup`                 |
| `tooling/scripts/contracts/bundle-openapi.mjs`                 | Bundle `docs/openapi/**` into `docs/API.yaml`           | `pnpm contract:openapi:bundle`, `pnpm contract:openapi:check` |
| `tooling/scripts/contracts/validate-openapi-phase.mjs`         | Enforce OpenAPI rollout phase metadata                  | `pnpm contract:openapi:check`, `pnpm repo:docs:check`         |
| `tooling/scripts/contracts/validate-sdk-contract-drift.sh`     | Regenerate SDK and fail on drift                        | `pnpm contract:sdk:drift`                                     |
| `tooling/scripts/governance/validate-workspace-boundaries.mjs` | Workspace boundary enforcement                          | `pnpm repo:workspace:boundaries`, `pnpm verify:cleanup`       |
| `tooling/scripts/governance/validate-migrations.py`            | Flyway migration naming and immutability checks         | `pnpm verify:cleanup`, staging and release workflows          |
| `tooling/scripts/governance/validate-schema-parity.py`         | Schema inventory drift check                            | `pnpm verify:cleanup`                                         |
| `tooling/scripts/governance/validate-prd-scenario-links.py`    | PRD requirement to scenario traceability                | `pnpm repo:docs:check`, `pnpm verify:scenario:smoke`          |
| `tooling/scripts/governance/validate-design-contracts.py`      | Design component contract drift check                   | `pnpm repo:docs:check`                                        |
| `tooling/scripts/governance/validate-doc-claims.py`            | Validate architecture and AGENTS surface refs stay live | `pnpm repo:docs:check`, `pnpm verify:cleanup`                 |
| `tooling/scripts/governance/validate-doc-references.py`        | Verify pnpm/file refs in AGENTS.md and adapters resolve | `pnpm repo:docs:check`, `pnpm verify:cleanup`                 |
| `tooling/scripts/governance/check-trivyignore-expiry.sh`       | Expiring security-ignore audit                          | `pnpm verify:cleanup`                                         |
| `tooling/scripts/gates/check-gates.sh`                         | Scenario gate evaluator for smoke/regression/full       | `services/api/build.gradle.kts`                               |
| `tooling/scripts/deploy/performance-smoke.sh`                  | Latency smoke against live or locally booted backend    | release gate                                                  |
| `tooling/scripts/observability/start-alertmanager.sh`          | Render Alertmanager config from env at startup          | `docker-compose.observability.yml`                            |
| `tooling/scripts/deploy/bootstrap-private-staging-vps.sh`      | Host bootstrap for private staging                      | staging runbook / manual                                      |
| `tooling/scripts/deploy/push-private-staging.sh`               | Push repo and env to private staging and trigger deploy | staging runbook / manual                                      |
| `tooling/scripts/deploy/deploy-private-staging.sh`             | Compose deployment on private staging host              | staging runbook / manual                                      |
| `tooling/scripts/deploy/smoke-private-staging.sh`              | Post-deploy staging smoke checks                        | staging runbook / manual                                      |
| `tooling/scripts/manual/analyze_i18n.py`                       | Manual locale diagnostic                                | manual only                                                   |

## Agent Finish Rules

When claiming tooling or ops work complete, run the smallest matching lane:

- verification and CI/hook changes: `pnpm verify:ops`
- structural gate or governance changes: `pnpm verify:cleanup`
- contract generation or SDK drift changes: `pnpm contract:openapi:check` and `pnpm contract:sdk:drift`
- workspace or script-surface changes: `pnpm repo:tooling:check`
- private staging / observability config changes: `docker compose -f docker-compose.observability.yml config`

Do not escalate to broader suites unless the touched surface requires them.

## Verification

Run the smallest gate that matches the claim:

```bash
pnpm verify:cleanup
pnpm verify:ops
pnpm verify:backend
pnpm verify:frontend
pnpm verify:scenario:smoke
pnpm verify:drift
pnpm repo:tooling:check
pnpm repo:docs:check
pnpm repo:docs:claims
pnpm repo:docs:claims:triage
pnpm contract:openapi:check
pnpm contract:sdk:drift
docker compose -f docker-compose.observability.yml config
```

If a check fails in current product code, treat it as application drift unless the failure is clearly caused by broken
tooling wiring.
