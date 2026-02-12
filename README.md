# Tasky Monorepo

Tasky is a trust-first domestic services marketplace for Mongolia.

## Repository Layout
- `AGENTS.md`: governing policy for delivery, quality, and security gates
- `docs/`: PRD, architecture, API contract, quality contracts
- `src/`: Spring Boot backend source
- `apps/web`: React web client scaffold
- `apps/mobile`: React Native (Expo) mobile scaffold
- `packages/sdk`: shared TypeScript SDK scaffold (generated from OpenAPI)
- `scripts/`: verification and workflow tooling

## Prerequisites
- Java 21
- Docker + Docker Compose
- Python 3.10+
- Node.js 20+ and pnpm 10+
- `jq`, `git`, `rg`, `curl`
- `semgrep` for high-risk verification

## Quick Start
1. Start local infrastructure:
```bash
cp .env.example .env
docker compose up -d postgres minio minio-bootstrap
```
2. Run backend:
```bash
./gradlew --no-daemon bootRun
```
3. Verify backend health:
```bash
curl http://127.0.0.1:8080/actuator/health
curl http://127.0.0.1:8080/api/v1/system/version
```

## Verification Workflow
Generate local verification artifact:
```bash
scripts/self-verify.sh \
  --ticket TASK-123 \
  --risk medium \
  --req REQ-AUTH-01,NFR-API-01 \
  --out artifacts/self-verify.json
```

High-risk verification runs:
- SAST (`semgrep`)
- migration checks
- performance smoke (`scripts/performance-smoke.sh`)

If `PERF_TARGET_URL` is unset, performance smoke auto-starts local backend via `./gradlew bootRun`.

## Frontend/SDK Scaffold
Install JS dependencies:
```bash
pnpm install
```

Generate SDK types from OpenAPI:
```bash
pnpm sdk:generate
```

Run web app:
```bash
pnpm --filter @tasky/web dev
```

Run mobile app:
```bash
pnpm --filter @tasky/mobile start
```
