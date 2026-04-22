## Summary

<!-- Brief description of changes -->

## Changes

-

## Checklist

- [ ] Code follows conventions in `AGENTS.md`
- [ ] API contract updated in `docs/API.yaml` and SDK regenerated (if endpoints changed)
- [ ] Tests added/updated for new behavior
- [ ] `pnpm -r typecheck` passes
- [ ] If this change touches `apps/mobile/src/**` structural boundaries (§7.7), I ran `pnpm --filter @tasky/mobile structure:check` locally and updated both the contract and the checker if a rule changed.
- [ ] If this change touches backend architecture docs (`docs/architecture/api.md`, `docs/architecture/common.md`, or backend `AGENTS.md`), I ran `./tooling/scripts/manual/scan-backend-doc-drift.sh` locally and verified no banned stale terms were introduced.
