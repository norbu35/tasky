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

Pick the smallest lane that matches the job. Branch-flow and `--no-verify` rules live in root `AGENTS.md`.

| Lane       | Use for                                                                    | Primary commands                                                                                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify`   | CI-local verification, hook surfaces, merge gates, release gate wiring     | `pnpm verify:cleanup`, `pnpm verify:ops`, `pnpm verify:i18n`, `pnpm verify:backend:static`, `pnpm verify:backend`, `pnpm verify:frontend`, `pnpm verify:scenario:smoke`, `pnpm verify:scenario:fidelity`, `pnpm verify:drift`                         |
| `contract` | OpenAPI bundle, generated SDK, contract drift                              | `pnpm contract:openapi:bundle`, `pnpm contract:openapi:check`, `pnpm contract:sdk:generate`, `pnpm contract:sdk:drift`                                                                                                                                |
| `repo`     | Docs governance, script-surface audit, ops inventory, workspace boundaries | `pnpm repo:docs:check`, `pnpm repo:docs:claims`, `pnpm repo:docs:claims:triage`, `pnpm repo:docs:claims:audit`, `pnpm repo:design:check`, `pnpm repo:prd:diff-ids`, `pnpm repo:ops:sync`, `pnpm repo:tooling:check`, `pnpm repo:workspace:boundaries` |
| `deploy`   | Private staging push/deploy/smoke and performance smoke                    | `tooling/scripts/deploy/**`                                                                                                                                                                                                                           |
| `manual`   | Human-only diagnostics not used by default automation                      | `tooling/scripts/manual/**`                                                                                                                                                                                                                           |

These commands are conditional, not default finish gates:

- `pnpm repo:design:check` only when editing `docs/design/screen-graph.yaml`, `docs/design/journey-catalog.yaml`, or `docs/design/domain-lifecycles.yaml`, or when those validators fail through `pnpm repo:docs:check`.
- `python3 tooling/scripts/governance/validate-screen-spec-traceability.py` only when editing `docs/design/screen-specs/SCR-*.yaml`, or when that validator fails through `pnpm repo:docs:check`.
- `pnpm repo:docs:claims:audit` only for proactive audit while editing architecture docs, maintenance docs, or backend module `AGENTS.md` files that name live repo surfaces.
- `pnpm repo:prd:diff-ids` only when `docs/PRD.md` changed and ripple review is in scope.
- `pnpm verify:scenario:fidelity` only for report-only weak-test triage.

## Read Next

- `docs/maintenance/OPERATING_MODEL.md`
- `docs/maintenance/STAGING_RUNBOOK.md` for private staging deploy work
- `docs/maintenance/PRODUCTION_READINESS.md` for release and rollback work
- `docs/OBSERVABILITY.md` only when touching metrics, dashboards, Prometheus, Grafana, or Alertmanager

## Operating Rules

- Keep one canonical path per concern. Prefer shared scripts and root aliases over duplicated workflow logic.
- Every script in `tooling/scripts/**` must be classified in `tooling/config/ops-registry.yaml`. `blocking` and `called_by_script` scripts must have an executable caller in `package.json`, `.github/workflows/**`, Gradle, compose, hooks, or another script. Manual-only scripts must stay classified as `manual`.
- After package-script, hook, workflow, compose, or tooling-script wiring changes, run `pnpm repo:ops:sync --fix` and commit the refreshed generated inventory.
- `pnpm repo:ops:sync --fix` owns the canonical YAML serialization of `tooling/config/ops-registry.yaml`; review the semantic entries it logs rather than preserving hand formatting.
- Generated outputs must be regenerated through their owning script, not hand-maintained as independent authority.
- Merge-gate workflow edits must keep the docs lane wired into `quality-gates.yml` through `pnpm verify:cleanup`, and any change to that wiring must update `tooling/config/ops-registry.yaml`, `tooling/scripts/gates/check-ops-config.mjs`, and the docs that describe the gate in the same change.
- Design navigation/lifecycle docs and screen specs are machine-readable contracts: keep ID-bearing fields free of prose placeholders; require canonical `SCR-*`, `JRN-*`, lifecycle IDs, and `traceability.status` fields before considering the change complete.
- Deploy inputs must be deterministic: workflow refs, image tags, and config refs must resolve to one exact target.
- Observability config must run as checked in. Do not rely on undocumented template expansion.
- Use the canonical lane names above. Retired transition aliases (`openapi:*`, `sdk:*`, `docs:check`, `tooling:check`, `workspace:boundaries`) must stay removed.

## Pipeline Map

| Surface                      | Purpose                                                              | Canonical entrypoint                       |
| ---------------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| Local push gate (`main`)     | Full local enforcement before production branch updates              | `.husky/pre-push`                          |
| Local push gate (non-`main`) | Lightweight local path for rapid iteration                           | `.husky/pre-push`                          |
| Merge structural gate        | Repo drift, docs, boundaries, migrations, schema checks              | `pnpm verify:cleanup`                      |
| Merge ops/config validation  | Tooling surface, workflow wiring, compose config validation          | `pnpm verify:ops`                          |
| Merge backend quality        | Backend compile, tests, coverage, OpenAPI validation                 | `pnpm verify:backend`                      |
| Backend static quality       | Backend formatting, Checkstyle, and PMD before heavier backend tests | `pnpm verify:backend:static`               |
| Merge frontend quality       | Frontend lint and tests                                              | `pnpm verify:frontend`                     |
| Main image build             | Build and publish API and web images                                 | `.github/workflows/build-and-push.yml`     |
| Staging deploy               | Promote a verified build to private staging                          | `.github/workflows/deploy-staging.yml`     |
| Release gate                 | Pre-production validation                                            | `.github/workflows/release-gate.yml`       |
| Production deploy            | Manual promotion after release gate                                  | `.github/workflows/deploy-production.yml`  |
| Nightly regression           | Extended backend, web, and security validation (manual while paused) | `.github/workflows/nightly-regression.yml` |
| Nightly mobile               | Extended Android and Maestro regression (manual while paused)        | `.github/workflows/nightly-mobile.yml`     |

## Directory Map

| Path                               | Role                                                                                         | Default caller                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `tooling/skills/`                  | Repo-owned harness-agnostic agent workflows                                                  | adapters, `AGENTS.md`, direct agent use                |
| `tooling/config/ops-registry.yaml` | Executable ops inventory for package scripts, hooks, workflows, compose, and tooling scripts | `pnpm verify:ops`, `pnpm repo:tooling:check`           |
| `tooling/scripts/contracts/`       | OpenAPI and SDK contract automation                                                          | `pnpm contract:*`                                      |
| `tooling/scripts/gates/`           | Verification entrypoints and wiring audits                                                   | `pnpm verify:*`, Gradle gates, merge CI                |
| `tooling/scripts/governance/`      | Docs, migration, schema, workspace, security-ignore governance                               | `pnpm repo:*`, `pnpm verify:cleanup`, deploy workflows |
| `tooling/scripts/deploy/`          | Private staging and performance/deploy helpers                                               | staging runbook, release gate                          |
| `tooling/scripts/observability/`   | Runtime observability bootstrap helpers                                                      | `docker-compose.observability.yml`                     |
| `tooling/scripts/manual/`          | Manual diagnostics                                                                           | human-triggered only                                   |

The full script-by-script inventory is generated from `tooling/config/ops-registry.yaml` (see `docs/maintenance/generated/OPS_INVENTORY.md`). Do not maintain a parallel list here.

## Agent Finish Rules

When claiming tooling or ops work complete, run the smallest matching lane:

- verification and CI/hook changes: `pnpm verify:ops`
- structural gate or governance changes: `pnpm verify:cleanup`
- contract generation or SDK drift changes: `pnpm contract:openapi:check` and `pnpm contract:sdk:drift`
- workspace or script-surface changes: `pnpm repo:tooling:check`
- private staging / observability config changes: `docker compose -f docker-compose.observability.yml config`

Do not escalate to broader suites unless the touched surface requires them. Do not treat report-only helpers (`pnpm repo:docs:claims:audit`, `pnpm repo:prd:diff-ids`, `pnpm verify:scenario:fidelity`) as default finish gates.

If a check fails in current product code, treat it as application drift unless the failure is clearly caused by broken tooling wiring.
