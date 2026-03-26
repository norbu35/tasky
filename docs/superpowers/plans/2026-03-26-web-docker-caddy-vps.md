# Web Docker Caddy VPS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Containerize the web app for this VPS using an internal Caddy static server, attach it to `the-grid`, and document the required transit-Caddy route for `tasky.norbu.dev`.

**Architecture:** The repo gains a multi-stage web image under `apps/web/` that builds the Vite app and serves `dist/` from Caddy. The repo-local `docker-compose.yml` gets a `web` service attached to both the local stack and the external `the-grid` network. Public TLS and host routing remain in the existing VPS transit Caddy stack under `~/docker/p-net-ncp-transit`.

**Tech Stack:** Docker, Docker Compose, Caddy, Vite, pnpm workspace, React web app

---

### Task 1: Add The Web Runtime Files

**Files:**
- Create: `apps/web/Dockerfile`
- Create: `apps/web/Caddyfile`
- Test: `apps/web/package.json`

- [ ] **Step 1: Write the failing runtime test as an executable build command**

Run:

```bash
docker build -f apps/web/Dockerfile .
```

Expected: FAIL because `apps/web/Dockerfile` does not exist yet.

- [ ] **Step 2: Write the minimal Dockerfile**

Create `apps/web/Dockerfile`:

```dockerfile
FROM node:20-bookworm AS build
WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/sdk/package.json packages/sdk/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages/core packages/core
COPY packages/sdk packages/sdk

RUN pnpm --filter @tasky/web build

FROM caddy:2.9-alpine
WORKDIR /srv

COPY apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /workspace/apps/web/dist /srv

EXPOSE 80
```

- [ ] **Step 3: Write the minimal Caddy config**

Create `apps/web/Caddyfile`:

```caddyfile
:80 {
    root * /srv
    encode zstd gzip
    file_server

    @spa {
        not file
        path /*
    }

    try_files {path} /index.html
}
```

- [ ] **Step 4: Run the build command to verify it passes**

Run:

```bash
docker build -f apps/web/Dockerfile .
```

Expected: PASS and finish with a Caddy-based final image.

- [ ] **Step 5: Commit**

```bash
git add apps/web/Dockerfile apps/web/Caddyfile
git commit -m "feat(web): add caddy runtime image" \
  -m "Ticket: TASK-072
Spec: NFR-UI-02
API: no API change
Tests: docker build for apps/web image
Risk: medium"
```

### Task 2: Wire The Web Service Into Compose

**Files:**
- Modify: `docker-compose.yml`
- Test: `docker-compose.yml`

- [ ] **Step 1: Write the failing compose verification**

Run:

```bash
docker compose config
```

Expected: current config passes, but there is no `web` service or `the-grid` network in output.

- [ ] **Step 2: Add the web service and external network**

Update `docker-compose.yml` by adding this service block under `services:`:

```yaml
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    image: tasky-web:dev
    container_name: tasky-web
    restart: unless-stopped
    expose:
      - "80"
    networks:
      - default
      - the-grid
```

Add this network block at the bottom:

```yaml
networks:
  the-grid:
    external: true
```

Keep the existing `volumes:` block intact above it.

- [ ] **Step 3: Run config verification to verify the new service is valid**

Run:

```bash
docker compose config
```

Expected: PASS and output includes `web:` and external network `the-grid`.

- [ ] **Step 4: Build the service**

Run:

```bash
docker compose build web
```

Expected: PASS and the image `tasky-web:dev` is built.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml
git commit -m "feat(web): add compose service for web container" \
  -m "Ticket: TASK-072
Spec: NFR-UI-02
API: no API change
Tests: docker compose config; docker compose build web
Risk: medium"
```

### Task 3: Verify Internal Container Serving And SPA Fallback

**Files:**
- Modify: `apps/web/Caddyfile` if fallback needs correction
- Test: `apps/web/Caddyfile`

- [ ] **Step 1: Write the failing runtime verification**

Run:

```bash
docker compose up -d web
docker exec tasky-web wget -S -O- http://127.0.0.1/ | head
docker exec tasky-web wget -S -O- http://127.0.0.1/customer/tasks | head
```

Expected: if SPA fallback is wrong, `/customer/tasks` returns 404 or non-HTML content.

- [ ] **Step 2: Apply the minimal Caddy fallback fix if needed**

If the previous command returns 404 for client routes, ensure `apps/web/Caddyfile` is exactly:

```caddyfile
:80 {
    root * /srv
    encode zstd gzip
    try_files {path} /index.html
    file_server
}
```

- [ ] **Step 3: Rebuild and rerun the runtime verification**

Run:

```bash
docker compose build web
docker compose up -d web
docker exec tasky-web wget -S -O- http://127.0.0.1/ | head
docker exec tasky-web wget -S -O- http://127.0.0.1/customer/tasks | head
```

Expected: PASS; both routes return HTML successfully.

- [ ] **Step 4: Commit**

```bash
git add apps/web/Caddyfile
git commit -m "fix(web): ensure spa fallback in caddy container" \
  -m "Ticket: TASK-072
Spec: NFR-UI-02
API: no API change
Tests: docker exec wget for root and client route
Risk: medium"
```

### Task 4: Document VPS Transit Integration

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-03-26-web-docker-caddy-design.md`
- Test: `README.md`

- [ ] **Step 1: Write the failing documentation verification**

Run:

```bash
rg -n "tasky.norbu.dev|p-net-ncp-transit|the-grid|docker compose build web" README.md docs/superpowers/specs/2026-03-26-web-docker-caddy-design.md
```

Expected: FAIL or incomplete output because the runbook-level commands are not all documented yet.

- [ ] **Step 2: Add the repo runbook instructions**

Append a short section to `README.md` with this content:

```md
## Web Container On This VPS

Build and run the internal Tasky web container:

```bash
docker compose build web
docker compose up -d web
```

This service is intended to join the external Docker network `the-grid` and be routed publicly by the existing transit Caddy stack in `~/docker/p-net-ncp-transit`.

Required host-level transit route for `tasky.norbu.dev`:

```caddyfile
@tasky host tasky.norbu.dev
handle @tasky {
    reverse_proxy tasky-web:80
}
```

After updating the transit Caddyfile, reload that stack from `~/docker/p-net-ncp-transit`.
```
```

- [ ] **Step 3: Tighten the spec with the exact upstream example**

Add this exact upstream example under the transit integration section in `docs/superpowers/specs/2026-03-26-web-docker-caddy-design.md`:

```md
Example transit Caddy block:

```caddyfile
@tasky host tasky.norbu.dev
handle @tasky {
    reverse_proxy tasky-web:80
}
```
```

- [ ] **Step 4: Run the documentation verification**

Run:

```bash
rg -n "tasky.norbu.dev|p-net-ncp-transit|the-grid|docker compose build web" README.md docs/superpowers/specs/2026-03-26-web-docker-caddy-design.md
```

Expected: PASS with matches in both files.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/superpowers/specs/2026-03-26-web-docker-caddy-design.md
git commit -m "docs(web): add vps caddy transit runbook" \
  -m "Ticket: TASK-072
Spec: NFR-UI-02
API: no API change
Tests: rg verification for VPS routing docs
Risk: medium"
```

### Task 5: Final Verification

**Files:**
- Verify: `apps/web/Dockerfile`
- Verify: `apps/web/Caddyfile`
- Verify: `docker-compose.yml`
- Verify: `README.md`

- [ ] **Step 1: Run final container verification**

Run:

```bash
docker compose config
docker compose build web
docker compose up -d web
docker exec tasky-web wget -S -O- http://127.0.0.1/ | head
docker exec tasky-web wget -S -O- http://127.0.0.1/customer/tasks | head
```

Expected: PASS.

- [ ] **Step 2: Run web regression after container changes**

Run:

```bash
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/web test
git diff --check
```

Expected: PASS.

- [ ] **Step 3: Commit final verification if any file changed during fixes**

```bash
git add apps/web/Dockerfile apps/web/Caddyfile docker-compose.yml README.md
git commit -m "chore(web): finalize vps docker caddy setup" \
  -m "Ticket: TASK-072
Spec: NFR-UI-02
API: no API change
Tests: docker compose config/build/up; container wget checks; web typecheck; web test; git diff --check
Risk: medium"
```

## Self-Review

- Spec coverage: the plan covers the internal Caddy image, compose wiring, `the-grid` integration, SPA fallback, and VPS transit documentation for `tasky.norbu.dev`.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: service name is consistently `web` in compose and `tasky-web` as container/upstream hostname in documentation.
