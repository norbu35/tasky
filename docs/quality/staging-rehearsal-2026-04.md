# Staging Rehearsal 2026-04

Last updated: 2026-04-10

## Status

`blocked`

## Objective

Task 14 in `docs/plans/2026-04-09-sdlc-product-audit-and-release-readiness.md` requires a real deployed environment and
recorded smoke evidence. The repo now supports a private VPS staging sandbox, but no actual VPS environment has been
provisioned from repo context yet.

## What Is Ready

The repository now has the documents and verification surfaces needed to run a staging rehearsal:

- `docs/maintenance/STAGING_RUNBOOK.md`
- `docs/maintenance/STAGING_TOGGLE_POSTURE.md`
- `docs/maintenance/STAGING_SEED_DATA.md`
- `docker-compose.private-staging.yml`
- `.env.private-staging.example`
- `tooling/scripts/bootstrap-private-staging-vps.sh`
- `tooling/scripts/push-private-staging.sh`
- `tooling/scripts/deploy-private-staging.sh`
- `tooling/scripts/smoke-private-staging.sh`
- `.github/workflows/release-gate.yml`
- `.github/workflows/quality-gates.yml`

Local preconditions already verified in this audit program:

- `./gradlew --no-daemon gateRegression`
- `pnpm -r typecheck`
- `pnpm -r test`
- `pnpm --filter @tasky/web test:e2e:smoke`
- `pnpm --filter @tasky/mobile test:e2e:smoke`

## What Is Missing

The remaining blocker is no longer repository design. It is missing environment instantiation:

1. No private VPS host has been provisioned and connected to this repository workflow.
2. No filled `.env.private-staging` exists on a target VPS.
3. No staging secret source is available from repo context for:
   - `TASKY_JWT_SECRET`
   - `TASKY_ENCRYPTION_KEY`
   - `TASKY_BLIND_INDEX_KEY`
   - `TASKY_QPAY_WEBHOOK_SECRET`
   - optional `FIREBASE_SERVICE_ACCOUNT_JSON`
4. No promoted admin smoke identity exists yet on a live sandbox instance.
5. Future release-grade staging still does not exist; real Facebook OAuth and production-like posture remain unverified.

## Commands Prepared For The Rehearsal

Once a private VPS exists, the first deploy path is:

```bash
cp .env.private-staging.example .env.private-staging
tooling/scripts/push-private-staging.sh <ssh-user@vps-host> /srv/tasky-private-staging .env.private-staging
ssh -L 8080:127.0.0.1:8080 <user>@<vps-host>
```

Then run the manual sandbox smoke using the provisioned customer, tasker, and admin accounts from
`docs/maintenance/STAGING_RUNBOOK.md`.

## Unblock Criteria

This rehearsal becomes executable when all of the following exist:

1. A real private VPS target.
2. A filled `.env.private-staging` on that VPS.
3. SSH access to the VPS.
4. One customer smoke account.
5. One tasker smoke account.
6. One admin smoke account created via manual role promotion.
7. Later, a separate release-grade staging environment for final signoff.

## Next Operator Action

Use this file as the handoff record for the first real private VPS sandbox rehearsal. After the environment exists:

1. Run the staging deploy.
2. Execute the smoke sequence from the staging runbook and smoke script.
3. Record command output, failures, fixes, and timestamps here.
4. Update `CHANGELOG.md` only after the rehearsal has actually been executed.
