# Web Docker Caddy Design

Date: 2026-03-26
Status: Draft for approval

## Goal

Add a production-style Docker path for the web app on this VPS, using:

- an internal Tasky web container in this repo
- Caddy inside that container to serve the built Vite app
- the existing VPS transit Caddy stack as the only public edge

Target public host: `tasky.norbu.dev`

## VPS Reality

This server already has an established container routing pattern:

- public edge Caddy lives in `~/docker/p-net-ncp-transit`
- application containers join the external Docker network `the-grid`
- the transit Caddy routes public domains to internal upstream containers on that network

That means Tasky should fit into the existing host pattern instead of introducing a second competing public edge.

## Current State

- The backend/API is dockerized via [Dockerfile](/home/norbu/projects/tasky/Dockerfile) and [docker-compose.yml](/home/norbu/projects/tasky/docker-compose.yml).
- The web app at [apps/web](/home/norbu/projects/tasky/apps/web) has Vite build scripts but no Dockerfile, no web container service, and no production static server configuration.
- The mobile app remains outside containerized runtime scope.
- There is no system-level Caddy service on this VPS; Caddy is already running as a container in the transit stack.

## Chosen Approach

Use a two-layer Caddy model with clear responsibilities:

1. **Inner Caddy inside the Tasky web container**
   - serves built static assets from `apps/web/dist`
   - handles SPA fallback for client-side routes
   - is only reachable inside Docker networking

2. **Outer transit Caddy already on the VPS**
   - terminates TLS
   - owns public host routing
   - proxies `tasky.norbu.dev` to the Tasky web container on `the-grid`

This preserves the existing VPS architecture and keeps Tasky aligned with the other hosted services.

## Scope

### In Scope

- Add a dedicated web Dockerfile under `apps/web/`
- Add an internal Caddy config under `apps/web/`
- Add a `web` service to [docker-compose.yml](/home/norbu/projects/tasky/docker-compose.yml)
- Connect that service to the external `the-grid` Docker network
- Expose only the internal HTTP port from the Tasky web container
- Document the required transit-Caddy route for `tasky.norbu.dev`
- Verify that the container serves the web app and supports SPA routes

### Out of Scope

- Replacing the existing VPS transit stack
- Adding a second public TLS edge inside this repo
- Mobile containerization
- Full production domain cutover automation for the external transit stack
- API reverse-proxy logic beyond what is necessary for the current frontend runtime

## Design Details

### Tasky Web Container

The web Dockerfile will be multi-stage:

1. **Build stage**
   - Node + pnpm
   - install workspace dependencies from repo root
   - build `@tasky/web`

2. **Runtime stage**
   - Caddy image
   - copy built `dist/`
   - copy a repo-local Caddyfile
   - serve static output on an internal HTTP port

### Internal Caddy Behavior

The Caddy config inside the Tasky web container will:

- serve files from the built `dist/` directory
- apply SPA fallback to `index.html`
- return asset files directly
- not manage TLS or public certificates

This Caddy instance is an app runtime, not an internet-facing edge.

### Compose Integration

The repo compose file will add a `web` service that:

- builds from the repo root using `apps/web/Dockerfile`
- joins:
  - the repo-local default network
  - the external `the-grid` network
- uses `expose`, not public `ports`, for the web listener

This matches the pattern already used by other VPS app containers behind transit.

### Transit Caddy Integration

The public route will be added to `~/docker/p-net-ncp-transit/Caddyfile` as a host rule for `tasky.norbu.dev` that:

- receives HTTPS traffic at the existing transit layer
- reverse proxies to the Tasky web container upstream on `the-grid`

The repo should document this host-level step, but not attempt to mutate the external transit stack automatically.

## Why This Design

### Better than a standalone public Caddy in this repo

- avoids duplicated edge routing
- keeps TLS and wildcard cert management centralized
- follows the already-proven VPS deployment pattern
- reduces operational confusion when adding or rotating domains

### Better than a Node static server

- smaller runtime surface
- simpler static hosting semantics
- better match for “built frontend behind central reverse proxy”

## Verification Plan

### Repo-Level Verification

- build the web image successfully
- start the Tasky web container successfully
- verify internal HTTP responds
- verify SPA fallback works from the container endpoint

Expected examples:

```bash
docker compose build web
docker compose up -d web
curl -I http://127.0.0.1:<mapped-local-port-if-used>
```

If no local host port is published, verification can use container networking:

```bash
docker exec p-net-ncp-transit wget -S -O- http://<tasky-web-service-name>:<port>
```

### VPS Route Verification

After the transit Caddyfile is updated and reloaded:

```bash
curl -I https://tasky.norbu.dev
curl -I https://tasky.norbu.dev/customer/tasks
```

## Risks

- The repo’s compose file currently does not declare `the-grid`, so that external network must be added carefully.
- If the frontend assumes a different API origin at runtime, the app may serve correctly but still need environment clarification.
- Transit route naming must align with the actual Docker service/container DNS reachable on `the-grid`.

## Acceptance Criteria

1. The repo contains a production-style Docker build for the web app using internal Caddy.
2. The Tasky web container can run on this VPS and attach to `the-grid`.
3. The web app supports SPA route fallback when served from the container.
4. The spec/docs clearly describe the required transit-Caddy mapping for `tasky.norbu.dev`.
