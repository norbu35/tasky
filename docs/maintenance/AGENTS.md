# Tasky Operations Router

Use this file when the change touches operational surfaces rather than product behavior or feature implementation.
Branch flow and `--no-verify` discipline live in root `AGENTS.md`.

## Applies To

- `docs/maintenance/**`
- `.github/workflows/**`
- `docker-compose*.yml`, `docker/**`
- `tooling/config/ops-registry.yaml`
- `tooling/scripts/**` for deploy, gate, governance, or environment automation
- root operational docs (e.g. `README.md`) when updating runbooks, verification, or deploy guidance

## Read Next

1. `docs/maintenance/OPERATING_MODEL.md`
2. The smallest relevant policy doc:
   - `PRODUCTION_READINESS.md` for go / no-go and rollback posture
   - `STAGING_RUNBOOK.md` for the implemented private staging path
   - `FEATURE_ACTIVATION_POLICY.md` for toggle rollout decisions
   - `DOCUMENTATION_GOVERNANCE.md` for doc authority and cleanup rules
3. `docs/OBSERVABILITY.md` and `docs/METRICS.md` only when the change affects telemetry, dashboards, or alert policy
4. `docs/architecture/common.md` only for derived implementation detail needed to support the operational change

## Operating Rules

- Keep one canonical operational story across hooks, scripts, workflows, and manuals.
- Treat `tooling/config/ops-registry.yaml` as the executable inventory for package scripts, hooks, workflows, compose files, and tooling-script lifecycle classification.
- Treat `docs/maintenance/generated/OPS_INVENTORY.md` as generated output. Refresh it with `pnpm repo:ops:sync --fix`; do not edit it by hand.
- Prefer updating shared gate scripts over duplicating logic in each workflow.
- Deployment workflows must use deterministic image tags and deterministic config refs.
- Private staging remains a private VPS sandbox until a release-grade staging environment exists.
- `docs/API.yaml` is generated output only; do not use it as independent authority for ops decisions.
- Treat `.husky/pre-push`, `quality-gates.yml`, and `tooling/config/ops-registry.yaml` as the canonical enforcement surfaces for merge flow.

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

Conditional helpers (apply only when triggered):

- `pnpm repo:design:check` for `screen-graph.yaml`, `journey-catalog.yaml`, or `domain-lifecycles.yaml` edits, or when those validators fail through `pnpm repo:docs:check`.
- `python3 tooling/scripts/governance/validate-screen-spec-traceability.py` for `docs/design/screen-specs/SCR-*.yaml` edits, or when `pnpm repo:docs:check` reports screen-spec traceability failures.
- `pnpm repo:docs:claims:triage` when the doc-claims validator failed.
- `pnpm repo:docs:claims:audit` for proactive audit while editing architecture docs, maintenance docs, or backend module `AGENTS.md` files that name live repo surfaces.
- `pnpm repo:prd:diff-ids` when `docs/PRD.md` changed and ripple review is required.
- `pnpm verify:scenario:fidelity` is report-only weak-test triage, not a default blocking ops check.

`pnpm repo:docs:check` remains the canonical docs lane; do not swap it out for narrower helpers unless the task is explicitly triage-only.
