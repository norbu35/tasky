# Staging Runbook

## Scope

Tasky has a private VPS staging surface, but it is a private integration sandbox, not the final release-grade staging environment.

Current mode:

- private VPS
- loopback-only HTTP binding on the VPS
- SSH tunnel from the developer machine
- `SPRING_PROFILES_ACTIVE=local`
- dev-auth enabled intentionally

Not part of this environment yet:

- public or access-restricted release staging
- production-like profile posture with dev-auth disabled
- real Facebook OAuth rehearsal

## Environment modes

| Mode                | Status              | Purpose                                                                                     | Key tradeoff                                                                                     |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Private VPS sandbox | Implemented in-repo | Solo-developer deploy checks, admin testing, API sanity, task flow smoke through SSH tunnel | Not valid for final Phase 1 launch signoff because it relies on dev-auth and private-only access |
| Release staging     | Not implemented yet | Final dress rehearsal before production                                                     | Requires public or allowlisted HTTPS reachability and dev-auth disabled                          |

## Repository surfaces

The private VPS sandbox is defined by:

- `docker-compose.private-staging.yml`
- `.env.private-staging.example`
- `tooling/scripts/deploy/bootstrap-private-staging-vps.sh`
- `tooling/scripts/deploy/push-private-staging.sh`
- `tooling/scripts/deploy/deploy-private-staging.sh`
- `tooling/scripts/deploy/smoke-private-staging.sh`

## Access model

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

## Runtime posture: private VPS sandbox

### Required application posture

| Setting                              | Required value | Why                                                             |
| ------------------------------------ | -------------- | --------------------------------------------------------------- |
| `SPRING_PROFILES_ACTIVE`             | `local`        | `tasky.dev-auth.enabled` is only allowed in `local` or `test`   |
| `TASKY_DEV_AUTH_ENABLED`             | `true`         | Enables real backend dev auth endpoint for this private sandbox |
| `VITE_DEV_AUTH_ENABLED`              | `true`         | Web quick-login buttons                                         |
| `EXPO_PUBLIC_DEV_AUTH_ENABLED`       | `true`         | Mobile quick-login buttons                                      |
| `TASKY_OTP_ENABLED`                  | `false`        | OTP is out of the active Phase 1 launch scope                   |
| `TASKY_FEATURE_MONETIZATION_ENABLED` | `false`        | Phase 1 remains zero-monetization                               |
| `TASKY_PUSH_PROVIDER`                | `logging`      | Safe sandbox default                                            |

### Required services

| Dependency                    | Required now                                        | Notes                                                            |
| ----------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| Postgres + PostGIS            | Yes                                                 | Main database                                                    |
| PgBouncer                     | Yes                                                 | Runtime app path                                                 |
| MinIO / S3-compatible storage | Yes                                                 | Media and verification storage                                   |
| Facebook app credentials      | Optional in private sandbox                         | Real OAuth is intentionally bypassed here                        |
| Firebase service account      | Optional                                            | Needed only when push delivery is tested beyond logging provider |
| QPay webhook secret           | Not required for the active Phase 1 sandbox posture | Payment-adjacent flows are out of scope here                     |

## Deployment steps

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

### 2. Provision and deploy from the developer machine

Fast path for a fresh Debian/Ubuntu VPS with SSH and a sudo-capable user:

```bash
tooling/scripts/deploy/push-private-staging.sh <ssh-user@vps-host> /srv/tasky-private-staging .env.private-staging
```

This command:

- syncs the current repository to the VPS
- bootstraps Docker Engine and `docker compose` on Debian/Ubuntu hosts
- prepares the app directory on the VPS
- uploads `.env.private-staging`
- runs the private staging deploy script
- runs the private staging smoke script

## Sandbox accounts

Use the private sandbox with:

- dev-auth-created customer and tasker identities for flow smoke
- a manually promoted admin identity for admin smoke

Keep these identities in secure operator notes, not in the repository.
