## Summary

<!-- Brief description of changes -->

## Changes

-

## Checklist

- [ ] Code follows conventions in `AGENTS.md`
- [ ] `pnpm verify:cleanup` passes (structural gate, docs, migrations, schema parity)
- [ ] If `docs/openapi/**` changed: `pnpm openapi:bundle` run and `docs/API.yaml` committed in the same change
- [ ] If OpenAPI changed: `pnpm sdk:drift` passes and updated `packages/sdk/src/generated/api-types.ts` committed
- [ ] If Flyway migration added/changed: `python3 tooling/scripts/governance/validate-schema-parity.py --update-expected` run and `tooling/config/expected-schema.json` committed
- [ ] If backend test added: `./services/api/scripts/sync-registry.sh` run and `tests/registry.yaml` committed
- [ ] Tests added/updated for new behavior
- [ ] If this change touches `apps/mobile/src/**` structural boundaries (§7.7), I ran `pnpm --filter @tasky/mobile structure:check` locally and updated both the contract and the checker if a rule changed.
- [ ] If any of the security-critical files listed in `AGENTS.md` changed, I've called it out explicitly below.

<!--
Note: the prior "scan-backend-doc-drift" manual checkbox has been removed —
that scan now runs automatically inside `pnpm verify:cleanup`.
-->
