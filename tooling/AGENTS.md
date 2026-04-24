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

| Lane       | Use for                                                                | Primary commands                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify`   | CI-local verification, hook surfaces, merge gates, release gate wiring | `pnpm prepare:push`, `pnpm verify:cleanup`, `pnpm verify:ops`, `pnpm verify:i18n`, `pnpm verify:backend:static`, `pnpm verify:backend`, `pnpm verify:frontend`, `pnpm verify:scenario:smoke`, `pnpm verify:scenario:fidelity`, `pnpm verify:drift` |
| `contract` | OpenAPI bundle, generated SDK, contract drift                          | `pnpm contract:openapi:bundle`, `pnpm contract:openapi:check`, `pnpm contract:sdk:generate`, `pnpm contract:sdk:drift`                                                                                                                             |
| `repo`     | Docs governance, script-surface audit, workspace boundaries            | `pnpm repo:docs:check`, `pnpm repo:docs:claims`, `pnpm repo:docs:claims:triage`, `pnpm repo:docs:claims:audit`, `pnpm repo:design:check`, `pnpm repo:prd:diff-ids`, `pnpm repo:tooling:check`, `pnpm repo:workspace:boundaries`                    |
| `deploy`   | Private staging push/deploy/smoke and performance smoke                | `tooling/scripts/deploy/**`                                                                                                                                                                                                                        |
| `manual`   | Human-only diagnostics not used by default automation                  | `tooling/scripts/manual/**`                                                                                                                                                                                                                        |

Not every command in a lane is a default finish gate. Treat these as conditional helpers:

- `pnpm repo:design:check` only when editing `docs/design/screen-graph.yaml`, `docs/design/journey-catalog.yaml`, or `docs/design/domain-lifecycles.yaml`, or when those validators fail through `pnpm repo:docs:check`
- `pnpm repo:docs:claims:audit` only for proactive audit while editing architecture docs, maintenance docs, or backend module `AGENTS.md` files that name live repo surfaces
- `pnpm repo:prd:diff-ids` only when `docs/PRD.md` changed and ripple review is in scope
- `pnpm verify:scenario:fidelity` only for report-only weak-test triage; it is not a default blocking verification command

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
- Merge-gate workflow edits must keep `pnpm repo:docs:check` wired into `quality-gates.yml`, and any change to that wiring must update `tooling/scripts/gates/check-ops-config.mjs` plus the docs that describe the gate in the same change.
- Design navigation and lifecycle docs are machine-readable contracts: keep ID-bearing fields free of prose placeholders, and require canonical `SCR-*`, `JRN-*`, and lifecycle IDs before considering the change complete.
- Deploy inputs must be deterministic: workflow refs, image tags, and config refs must resolve to one exact target.
- Observability config must run as checked in. Do not rely on undocumented template expansion.
- Compatibility aliases such as `openapi:*`, `sdk:*`, `docs:check`, `tooling:check`, and `workspace:boundaries`
  exist for transition only. Prefer the lane names above in new work.
- Branch flow is `feature/*` -> `staging` -> `main`; keep verification wiring aligned with that route.
- Do not bypass hooks with `--no-verify` for `staging`/`main` pushes.

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

| Path                             | Role                                                           | Default caller                                         |
| -------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| `tooling/skills/`                | Repo-owned harness-agnostic agent workflows                    | adapters, `AGENTS.md`, direct agent use                |
| `tooling/scripts/contracts/`     | OpenAPI and SDK contract automation                            | `pnpm contract:*`                                      |
| `tooling/scripts/gates/`         | Verification entrypoints and wiring audits                     | `pnpm verify:*`, Gradle gates, merge CI                |
| `tooling/scripts/governance/`    | Docs, migration, schema, workspace, security-ignore governance | `pnpm repo:*`, `pnpm verify:cleanup`, deploy workflows |
| `tooling/scripts/deploy/`        | Private staging and performance/deploy helpers                 | staging runbook, release gate                          |
| `tooling/scripts/observability/` | Runtime observability bootstrap helpers                        | `docker-compose.observability.yml`                     |
| `tooling/scripts/manual/`        | Manual diagnostics                                             | human-triggered only                                   |

## Tooling Inventory

| Surface                                                                 | Function                                                | Called from                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `tooling/scripts/gates/check-cleanup-gate.sh`                           | Structural repo gate                                    | `pnpm verify:cleanup`, merge structural gate                                  |
| `tooling/scripts/gates/check-ops-config.mjs`                            | Workflow wiring and compose config validation           | `pnpm verify:ops`                                                             |
| `tooling/scripts/gates/check-tdd-gate.sh`                               | Test-discipline gate for touched production surfaces    | `pnpm verify:tdd`, local pre-push                                             |
| `tooling/scripts/gates/check-tooling-surface.mjs`                       | Enforces script classification and live callers         | `pnpm repo:tooling:check`                                                     |
| `tooling/scripts/governance/check-doc-governance.py`                    | Documentation governance                                | `pnpm repo:docs:check`, `pnpm verify:cleanup`                                 |
| `tooling/scripts/governance/validate-i18n.py`                           | Locale parity, interpolation, and i18n callsite audit   | `pnpm verify:i18n`, `pnpm verify:frontend`, merge frontend quality            |
| `tooling/scripts/contracts/bundle-openapi.mjs`                          | Bundle `docs/openapi/**` into `docs/API.yaml`           | `pnpm contract:openapi:bundle`, `pnpm contract:openapi:check`                 |
| `tooling/scripts/contracts/validate-openapi-backend-contracts.py`       | Backend request DTO to OpenAPI payload parity           | `pnpm contract:openapi:check`, `pnpm repo:docs:check`                         |
| `tooling/scripts/contracts/validate-openapi-phase.mjs`                  | Enforce OpenAPI rollout phase metadata                  | `pnpm contract:openapi:check`, `pnpm repo:docs:check`                         |
| `tooling/scripts/contracts/validate-sdk-contract-drift.sh`              | Regenerate SDK and fail on drift                        | `pnpm contract:sdk:drift`                                                     |
| `tooling/scripts/governance/validate-workspace-boundaries.mjs`          | Workspace boundary enforcement                          | `pnpm repo:workspace:boundaries`, `pnpm verify:cleanup`                       |
| `tooling/scripts/governance/validate-migrations.py`                     | Flyway migration naming and immutability checks         | `pnpm verify:cleanup`, staging and release workflows                          |
| `tooling/scripts/governance/validate-schema-parity.py`                  | Schema inventory drift check                            | `pnpm verify:cleanup`                                                         |
| `tooling/scripts/governance/validate-prd-scenario-links.py`             | PRD requirement to scenario traceability                | `pnpm repo:docs:check`, `pnpm verify:scenario:smoke`                          |
| `tooling/scripts/governance/validate-requirement-references.py`         | Live REQ/NFR reference validation                       | `pnpm repo:docs:check`                                                        |
| `tooling/scripts/governance/validate-assistance-vocabulary.py`          | Assistance/intervention vocabulary parity               | `pnpm repo:docs:check`                                                        |
| `tooling/scripts/governance/validate-design-contracts.py`               | Design component contract drift check                   | `pnpm repo:docs:check`                                                        |
| `tooling/skills/design-surface-drift/scripts/`                          | Design screen-graph, journey, and lifecycle structure   | `pnpm repo:design:check`, `pnpm repo:docs:check` for those validator failures |
| `tooling/skills/intake-to-prd/scripts/extract_prd_diff_ids.py`          | Extract changed REQ-P1/NFR IDs from PRD git diff        | `pnpm repo:prd:diff-ids` when `docs/PRD.md` changes                           |
| `tooling/skills/doc-claims-remediation/scripts/triage_doc_claims.py`    | Grouped doc-claims failure triage                       | `pnpm repo:docs:claims:triage`                                                |
| `tooling/skills/doc-claims-remediation/scripts/audit_unclaimed_refs.py` | Proactive unclaimed reference audit                     | `pnpm repo:docs:claims:audit` during tracked-doc edits                        |
| `tooling/skills/scenario-fidelity/scripts/find_weak_coverage.py`        | Report-only weak-test triage                            | `pnpm verify:scenario:fidelity` for manual review or optional nightly info    |
| `tooling/scripts/governance/validate-doc-claims.py`                     | Validate architecture and AGENTS surface refs stay live | `pnpm repo:docs:check`, `pnpm verify:cleanup`                                 |
| `tooling/scripts/governance/validate-doc-references.py`                 | Verify pnpm/file refs in AGENTS.md and adapters resolve | `pnpm repo:docs:check`, `pnpm verify:cleanup`                                 |
| `tooling/scripts/governance/check-trivyignore-expiry.sh`                | Expiring security-ignore audit                          | `pnpm verify:cleanup`                                                         |
| `tooling/scripts/gates/check-gates.sh`                                  | Scenario gate evaluator for smoke/regression/full       | `services/api/build.gradle.kts`                                               |
| `tooling/scripts/deploy/performance-smoke.sh`                           | Latency smoke against live or locally booted backend    | release gate                                                                  |
| `tooling/scripts/observability/start-alertmanager.sh`                   | Render Alertmanager config from env at startup          | `docker-compose.observability.yml`                                            |
| `tooling/scripts/deploy/bootstrap-private-staging-vps.sh`               | Host bootstrap for private staging                      | staging runbook / manual                                                      |
| `tooling/scripts/deploy/push-private-staging.sh`                        | Push repo and env to private staging and trigger deploy | staging runbook / manual                                                      |
| `tooling/scripts/deploy/deploy-private-staging.sh`                      | Compose deployment on private staging host              | staging runbook / manual                                                      |
| `tooling/scripts/deploy/smoke-private-staging.sh`                       | Post-deploy staging smoke checks                        | staging runbook / manual                                                      |

## Agent Finish Rules

When claiming tooling or ops work complete, run the smallest matching lane:

- verification and CI/hook changes: `pnpm verify:ops`
- structural gate or governance changes: `pnpm verify:cleanup`
- contract generation or SDK drift changes: `pnpm contract:openapi:check` and `pnpm contract:sdk:drift`
- workspace or script-surface changes: `pnpm repo:tooling:check`
- private staging / observability config changes: `docker compose -f docker-compose.observability.yml config`

Do not escalate to broader suites unless the touched surface requires them.
Do not treat report-only helpers such as `pnpm repo:docs:claims:audit`, `pnpm repo:prd:diff-ids`, or `pnpm verify:scenario:fidelity` as default finish gates unless the task explicitly called for them.

## Verification

Run the smallest gate that matches the claim.

Default blocking gates:

```bash
pnpm prepare:push
pnpm verify:cleanup
pnpm verify:ops
pnpm verify:i18n
pnpm verify:backend:static
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

Conditional helper commands:

```bash
pnpm repo:design:check
pnpm repo:docs:claims:audit
pnpm repo:prd:diff-ids
pnpm verify:scenario:fidelity
```

If a check fails in current product code, treat it as application drift unless the failure is clearly caused by broken
tooling wiring.
