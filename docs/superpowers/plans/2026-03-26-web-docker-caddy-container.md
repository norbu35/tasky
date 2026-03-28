# Web Docker Caddy Container Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the web app as a generic container adapter using internal Caddy and a standard compose overlay.

**Architecture:** Keep the existing web Docker runtime under `apps/web/`. Add a generic `docker-compose.web.yml` overlay that publishes the web container on a configurable host port, and remove all server-specific routing assumptions from repo docs and ticket wording.

**Tech Stack:** Docker, Docker Compose, Caddy, Vite, pnpm workspace, React web app

---

### Task 1: Define The Generic Overlay Contract

**Files:**
- Modify: `apps/web/tests/unit/web-container-overlay.test.ts`
- Test: `apps/web/tests/unit/web-container-overlay.test.ts`

- [ ] **Step 1: Write the failing contract expectations**

Update the test to require:

```ts
expect(readFileSync(resolve(repoRoot, "docker-compose.web.yml"), "utf8")).toContain("WEB_PORT");
expect(readFileSync(resolve(repoRoot, "README.md"), "utf8")).not.toContain("tasky.norbu.dev");
```

- [ ] **Step 2: Run the contract test to verify it fails**

Run:

```bash
pnpm --filter @tasky/web exec vitest run tests/unit/web-container-overlay.test.ts --reporter verbose
```

Expected: FAIL because the overlay and docs still use VPS-specific names and routing.

### Task 2: Implement The Generic Web Overlay

**Files:**
- Create: `docker-compose.web.yml`
- Verify: `docker-compose.yml`
- Test: `docker-compose.web.yml`

- [ ] **Step 1: Add the generic overlay**

Create `docker-compose.web.yml`:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    image: tasky-web:dev
    container_name: tasky-web
    restart: unless-stopped
    ports:
      - "${WEB_PORT:-8081}:80"
```

- [ ] **Step 2: Run compose verification**

Run:

```bash
docker compose -f docker-compose.yml -f docker-compose.web.yml config
```

Expected: PASS and output includes `web:` with the published `WEB_PORT` mapping.

### Task 3: Remove Server-Specific Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-03-26-web-docker-caddy-design.md`
- Modify: `docs/superpowers/plans/2026-03-26-web-docker-caddy-container.md`
- Modify: `tickets/TASK-111.json`
- Modify: `tickets/STATUS.json`

- [ ] **Step 1: Replace VPS-specific wording**

Update docs so they:

- use `docker-compose.web.yml`
- document `WEB_PORT`
- explicitly leave reverse proxy, TLS, ingress, and host networking outside the repo
- remove `tasky.norbu.dev`, `the-grid`, and transit Caddy instructions

- [ ] **Step 2: Update ticket metadata**

Set `TASK-111` to low risk and align AC/test IDs with the generic container adapter wording.

### Task 4: Verify The Generic Container Path

**Files:**
- Verify: `docker-compose.web.yml`
- Verify: `apps/web/Dockerfile`
- Verify: `apps/web/Caddyfile`
- Test: `apps/web/tests/unit/web-container-overlay.test.ts`

- [ ] **Step 1: Re-run the contract test**

Run:

```bash
pnpm --filter @tasky/web exec vitest run tests/unit/web-container-overlay.test.ts --reporter verbose
```

Expected: PASS.

- [ ] **Step 2: Verify the container workflow**

Run:

```bash
docker compose -f docker-compose.yml -f docker-compose.web.yml config
docker compose -f docker-compose.yml -f docker-compose.web.yml build web
docker compose -f docker-compose.yml -f docker-compose.web.yml up -d web
wget -S -O- http://127.0.0.1:${WEB_PORT:-8081}/ | head
wget -S -O- http://127.0.0.1:${WEB_PORT:-8081}/customer/tasks | head
```

Expected: PASS and both endpoints return the built web app with SPA fallback.

## Self-Review

- Spec coverage: the plan covers the generic overlay, ticket wording, server-agnostic docs, and runtime verification.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: file names, overlay name, and environment variable name all use `docker-compose.web.yml` and `WEB_PORT`.
