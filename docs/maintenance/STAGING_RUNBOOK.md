# Staging Runbook

Last updated: 2026-04-10

## Scope

Tasky now has a concrete private VPS staging surface, but it is a private integration sandbox, not the final
release-grade staging environment.

Current implemented mode:

- private VPS
- loopback-only HTTP binding on the VPS
- SSH tunnel from the developer machine
- `SPRING_PROFILES_ACTIVE=local`
- dev-auth enabled intentionally

Still future:

- public or access-restricted release staging
- production-like profile posture with dev-auth disabled
- real Facebook OAuth rehearsal

## Environment Modes

| Mode                | Status              | Purpose                                                                                     | Key tradeoff                                                                                     |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Private VPS sandbox | Implemented in-repo | Solo-developer deploy checks, admin testing, API sanity, task flow smoke through SSH tunnel | Not valid for final Phase 1 launch signoff because it relies on dev-auth and private-only access |
| Release staging     | Not implemented yet | Final dress rehearsal before production                                                     | Requires public or allowlisted HTTPS reachability and dev-auth disabled                          |

## Repository Surfaces

The private VPS sandbox is defined by:

- `docker-compose.private-staging.yml`
- `.env.private-staging.example`
- `tooling/scripts/bootstrap-private-staging-vps.sh`
- `tooling/scripts/push-private-staging.sh`
- `tooling/scripts/deploy-private-staging.sh`
- `tooling/scripts/smoke-private-staging.sh`

The web container now serves the SPA and reverse-proxies:

- `/api/*`
- `/actuator/*`
- `/ws`

That means the web app can run on the same tunneled origin as the backend.

## Access Model

The sandbox stays private by binding the entrypoint to loopback on the VPS:

- `127.0.0.1:${STAGING_HTTP_PORT}:80`

Developer access is through SSH local forwarding:

```bash
ssh -L 8080:127.0.0.1:8080 <user>@<vps-host>
```

After the tunnel is up:

- Web app: `http://127.0.0.1:8080`
- Backend health: `http://127.0.0.1:8080/actuator/health`
- Backend API: `http://127.0.0.1:8080/api/v1/...`

## Runtime Posture: Private VPS Sandbox

### Required application posture

| Setting                              | Required value | Why                                                                                  |
| ------------------------------------ | -------------- | ------------------------------------------------------------------------------------ |
| `SPRING_PROFILES_ACTIVE`             | `local`        | `tasky.dev-auth.enabled` is only allowed in `local` or `test`                        |
| `TASKY_DEV_AUTH_ENABLED`             | `true`         | Explicit test bypass for this private sandbox                                        |
| `VITE_DEV_AUTH_ENABLED`              | `true`         | Web quick-login is part of the sandbox workflow                                      |
| `EXPO_PUBLIC_DEV_AUTH_ENABLED`       | `true`         | Mobile local simulator workflow uses the same bypass                                 |
| `TASKY_OTP_ENABLED`                  | `false`        | OTP is out of Phase 1 launch scope and the repo has no production-ready SMS provider |
| `TASKY_FEATURE_MONETIZATION_ENABLED` | `false`        | Phase 1 remains zero-monetization                                                    |
| `TASKY_PUSH_PROVIDER`                | `logging`      | Safe sandbox default                                                                 |

### Required services

| Dependency                    | Required now                | Notes                                                   |
| ----------------------------- | --------------------------- | ------------------------------------------------------- |
| Postgres + PostGIS            | Yes                         | Main database                                           |
| PgBouncer                     | Yes                         | Runtime app path                                        |
| MinIO / S3-compatible storage | Yes                         | Media and verification storage                          |
| QPay webhook secret           | Yes                         | Required application secret even with escrow disabled   |
| Facebook app credentials      | Optional in private sandbox | Real OAuth is intentionally bypassed here               |
| Firebase service account      | Optional                    | Only if push delivery is tested beyond logging provider |

## Deployment Steps

### 1. Prepare local secrets

```bash
cp .env.private-staging.example .env.private-staging
```

Fill in at minimum:

- `POSTGRES_PASSWORD`
- `APP_DB_PASSWORD`
- `MINIO_ROOT_PASSWORD`
- `MINIO_SECRET_KEY`
- `TASKY_JWT_SECRET`
- `TASKY_ENCRYPTION_KEY`
- `TASKY_BLIND_INDEX_KEY`
- `TASKY_QPAY_WEBHOOK_SECRET`

### 2. Provision and deploy from the developer machine

Fast path for a fresh Debian/Ubuntu VPS with SSH and a sudo-capable user:

```bash
tooling/scripts/push-private-staging.sh <ssh-user@vps-host> /srv/tasky-private-staging .env.private-staging
```

This command does all of the following:

- syncs the current repository to the VPS
- bootstraps Docker Engine and `docker compose` on Debian/Ubuntu hosts
- prepares the app directory on the VPS
- uploads `.env.private-staging`
- runs the private staging deploy script
- runs the private staging smoke script

Operator requirement:

- the SSH user must either be `root` on the VPS or have passwordless `sudo` for the bootstrap step

### 3. Manual fallback on the VPS

```bash
sudo ./tooling/scripts/bootstrap-private-staging-vps.sh <deploy-user> /srv/tasky-private-staging
./tooling/scripts/deploy-private-staging.sh .env.private-staging
```

Use the manual path only if you prefer to clone/sync the repo yourself.

### 4. Run the smoke script on the VPS

```bash
tooling/scripts/smoke-private-staging.sh .env.private-staging
```

This verifies:

- web entrypoint responds
- actuator health is `UP`
- customer dev-login works
- tasker dev-login works
- customer/tasker scope pings work

## Admin Access In The Private Sandbox

There is still no runtime bootstrap for an admin account:

- `POST /api/v1/auth/dev/login` only creates `CUSTOMER` or `TASKER`
- no migration seeds a login-ready `ADMIN`

Current private-sandbox procedure:

1. Create a user through dev-login or another supported auth path.
2. Capture the user ID.
3. Promote that user to `ADMIN` with a controlled DB change.

Example SQL:

```sql
UPDATE users
SET role = 'ADMIN',
    updated_at = now()
WHERE id = '<sandbox-admin-user-id>';
```

This remains an operator-only workaround and must be recorded in rehearsal evidence.

## Mobile Testing Against The Private Sandbox

The private sandbox is designed for SSH tunneling, which makes mobile testing practical on the developer machine.

### iOS simulator / local Expo workflow

Because the tunnel terminates on the developer machine, use the local forwarded origin:

```bash
export EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
export EXPO_PUBLIC_DEV_AUTH_ENABLED=true
pnpm --filter @tasky/mobile start
```

Important note:

- the current iOS plist allows local networking but not arbitrary remote HTTP
- the SSH tunnel solves that by making the sandbox appear as local loopback

## What This Sandbox Validates

This environment is appropriate for:

- Dockerized deployability on a VPS
- migrations and app startup
- admin surfaces
- category management
- feature-toggle surfaces
- customer/tasker API flow smoke via dev-auth
- reverse proxy and same-origin web behavior
- MinIO/Postgres/PgBouncer integration

## What It Does Not Validate

This environment is not sufficient for final launch signoff because it does not prove:

- real Facebook OAuth callback and login behavior
- production-like `prod` profile startup posture
- dev-auth disabled behavior
- public or allowlisted HTTPS network path

Those remain responsibilities of a future release-grade staging environment.

## Pre-Deploy Verification

Run the trusted repo checks before updating the VPS sandbox:

```bash
./gradlew --no-daemon gateRegression
pnpm -r typecheck
pnpm -r test
pnpm --filter @tasky/web test:e2e:smoke
pnpm --filter @tasky/mobile test:e2e:smoke
```

For host bootstrap script verification, the local repository can at least prove shell syntax:

```bash
bash -n tooling/scripts/bootstrap-private-staging-vps.sh
bash -n tooling/scripts/push-private-staging.sh
```

## Rollback And Recovery

Repository-provided helpers:

- `docker/backup.sh`
- `docker/restore.sh`

For any VPS sandbox change that touches schema or important operator data:

1. take a fresh logical backup
2. deploy
3. run the smoke script
4. keep the backup artifact tied to the deploy record
