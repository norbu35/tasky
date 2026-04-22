# Tasky Operations Router

Use this file when the change touches operational surfaces rather than product behavior or feature implementation.

## Applies To

- `docs/maintenance/**`
- `.github/workflows/**`
- `docker-compose*.yml`
- `docker/**`
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
- Prefer updating shared gate scripts over duplicating logic in each workflow.
- Deployment workflows must use deterministic image tags and deterministic config refs.
- Private staging remains a private VPS sandbox until a release-grade staging environment exists.
- `docs/API.yaml` is generated output only; do not use it as independent authority for ops decisions.

## Verification

```bash
pnpm verify:cleanup
pnpm verify:ops
pnpm verify:drift
pnpm verify:backend
```
