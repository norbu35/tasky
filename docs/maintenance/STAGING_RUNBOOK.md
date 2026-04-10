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
| `TASKY_DEV_AUTH_ENABLED`             | `true`         | Enables real backend dev auth endpoint for this private sandbox                      |
| `VITE_DEV_AUTH_ENABLED`              | `true`         | Web quick-login buttons (calls real backend)                                         |
| `EXPO_PUBLIC_DEV_AUTH_ENABLED`       | `true`         | Mobile quick-login buttons (calls real backend)                                      |
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

## Mobile Client Auth Transition (Dev → Staging/Production)

Dev auth now calls the real backend (`POST /api/v1/auth/dev/login`) and returns real JWT sessions.
Fake tokens and react-query cache seeding have been removed.

### What must change before real users

| Item | Dev-auth behavior | Required for staging/production | Status |
| --- | --- | --- | --- |
| Access token | Real JWT from backend dev-login endpoint | Real JWT from Facebook OAuth or OTP | **Done** (dev-login returns real JWTs) |
| Token refresh | Access tokens expire after configured TTL | **Must be implemented.** Without a refresh interceptor the app silently breaks after token expiry. | **Not implemented** |
| Session invalidation on 401 | Not needed in local sandbox | App must detect 401 from expired/revoked tokens and either refresh or sign the user out. | **Not implemented** |
| `EXPO_PUBLIC_API_BASE_URL` | Unset (defaults to `http://localhost:8080`) | Must point to the staging/production origin | Set per-environment |
| App Transport Security | `NSAllowsLocalNetworking: true` covers localhost | Production URLs **must use HTTPS**. `NSAllowsArbitraryLoads` is `false`. | iOS plist is correct; just needs HTTPS origin |
| CORS allowed origins | Backend defaults to `http://localhost:5173` | Must include the production web origin. (Not relevant for native mobile, but relevant for web client.) | Configured via `tasky.cors.allowed-origins` |

### Token refresh implementation checklist

This is the highest-priority mobile auth gap. Without it, every user session silently dies after 1 hour.

1. Add a 401-interceptor to `requestJson` / `requestVoid` in `apps/mobile/src/lib/mobileApiClient.ts`:
   - On 401 response, attempt `POST /api/v1/auth/token/refresh` with the stored `refreshToken`.
   - On successful refresh, update the zustand session with the new `accessToken` and retry the
     original request.
   - On refresh failure (e.g., refresh token also expired), call `signOut()` and navigate to the
     login screen.
2. Ensure only one refresh attempt runs at a time (queue concurrent 401s behind a single refresh
   promise).
3. Add a test that exercises the refresh-then-retry path.

### Observability gap: JWT 401s invisible in backend logs

The `JwtAuthenticationFilter` rejects expired or invalid tokens by writing directly to the response
and returning without calling `filterChain.doFilter()`. Because the `RequestObservabilityFilter`
wraps the filter chain, it still logs the response status — **however**, the filter registration
order means JWT rejections may not appear in the observability log depending on the Spring Boot
auto-configuration order.

During the inbox-error investigation (2026-04-10), 401 responses from expired tokens were confirmed
invisible in `docker logs`. This makes debugging auth failures in staging/production harder. Consider
adding explicit logging inside the JWT filter for rejected tokens, or verifying the filter
registration order so the observability filter always wraps the security chain.

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
