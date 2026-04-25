# Tasky Operations Router

Use this file when the change touches operational surfaces rather than product behavior or feature implementation.

## Applies To

- `docs/maintenance/**`
- `.github/workflows/**`
- `docker-compose*.yml`
- `docker/**`
- `tooling/config/ops-registry.yaml`
- `tooling/scripts/**` for deploy, gate, governance, or environment automation
- root operational docs such as `README.md` when updating runbooks, verification, or deploy guidance

## Read Next

1. `AGENTS.md`
2. `docs/maintenance/OPERATING_MODEL.md`
3. The smallest relevant policy doc below:
   - `PRODUCTION_READINESS.md` for go / no-go and rollback posture
   - `STAGING_RUNBOOK.md` for the implemented private staging path
   - `FEATURE_ACTIVATION_POLICY.md` for toggle rollout decisions
   - `DOCUMENTATION_GOVERNANCE.md` for doc authority and cleanup rules
4. `docs/OBSERVABILITY.md` and `docs/METRICS.md` only when the change affects telemetry, dashboards, or alert policy
5. `docs/architecture/common.md` only for derived implementation detail needed to support the operational change

## Operating Rules

- Keep one canonical operational story across hooks, scripts, workflows, and manuals.
- Treat `tooling/config/ops-registry.yaml` as the executable inventory for package scripts, hooks, workflows,
  compose files, and tooling-script lifecycle classification.
- Treat `docs/maintenance/generated/OPS_INVENTORY.md` as generated output from that registry. Refresh it with
  `pnpm repo:ops:sync --fix`; do not edit it by hand.
- Prefer updating shared gate scripts over duplicating logic in each workflow.
- Deployment workflows must use deterministic image tags and deterministic config refs.
- Private staging remains a private VPS sandbox until a release-grade staging environment exists.
- `docs/API.yaml` is generated output only; do not use it as independent authority for ops decisions.
- Branch execution model is `feature/*` -> `staging` -> `main`.
- Do not use `--no-verify` for pushes targeting `staging` or `main`.
- Treat `.husky/pre-push`, `quality-gates.yml`, and `tooling/config/ops-registry.yaml` as the canonical enforcement
  surfaces for merge flow.

## Verification

Run the smallest command set that matches the operational claim.

Default ops and gate validation:

```bash
pnpm verify:cleanup
pnpm verify:ops
pnpm verify:drift
pnpm verify:backend
pnpm repo:docs:check
```

Conditional docs and skill helpers:

```bash
pnpm repo:design:check
pnpm repo:docs:claims:triage
pnpm repo:docs:claims:audit
pnpm repo:prd:diff-ids
pnpm verify:scenario:fidelity
```

Use the conditional helpers only when their trigger applies:

- `pnpm repo:design:check` for `screen-graph.yaml`, `journey-catalog.yaml`, or `domain-lifecycles.yaml` edits, or when those validators fail through `pnpm repo:docs:check`
- `python3 tooling/scripts/governance/validate-screen-spec-traceability.py` for `docs/design/screen-specs/SCR-*.yaml` edits, or when `pnpm repo:docs:check` reports screen-spec traceability failures
- `pnpm repo:docs:claims:triage` when the doc-claims validator failed
- `pnpm repo:docs:claims:audit` for proactive audit while editing architecture docs, maintenance docs, or backend module `AGENTS.md` files that name live repo surfaces
- `pnpm repo:prd:diff-ids` when `docs/PRD.md` changed and ripple review is required
- `pnpm verify:scenario:fidelity` only as report-only weak-test triage, not as a default blocking ops check

`pnpm repo:docs:check` remains the canonical docs lane; do not swap it out for narrower helper commands unless the task is explicitly triage-only.
