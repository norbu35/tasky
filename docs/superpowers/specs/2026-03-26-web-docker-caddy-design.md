# Web Docker Caddy Design

Date: 2026-03-26
Status: Draft for approval

## Goal

Add a generic web container adapter to the repo using:

- an internal Tasky web container in this repo
- Caddy inside that container to serve the built Vite app
- a compose overlay that publishes the web app on a configurable host port

The repo stops at the container boundary. Reverse proxy, TLS, ingress, and host networking are deployment concerns.

## Current State

- The backend/API is dockerized via [Dockerfile](/home/norbu/projects/tasky/Dockerfile) and [docker-compose.yml](/home/norbu/projects/tasky/docker-compose.yml).
- The web app at [apps/web](/home/norbu/projects/tasky/apps/web) already has a production Dockerfile and Caddy runtime.
- The current work introduces a separate compose overlay for the web container so the base compose path remains focused on the backend and supporting services.
- The repo should not prescribe any specific server topology, external Docker network, or host routing stack.

## Chosen Approach

Use a generic web container adapter with clear boundaries:

1. **Inner Caddy inside the Tasky web container**
   - serves built static assets from `apps/web/dist`
   - handles SPA fallback for client-side routes
   - listens on port `80` inside the container

2. **Generic compose overlay in the repo**
   - builds the web image from `apps/web/Dockerfile`
   - publishes the web container on `WEB_PORT` (default `8081`)
   - does not assume external networks, domains, TLS, or reverse proxies

This keeps the repo deployment-agnostic while still following industry-standard container packaging.

## Scope

### In Scope

- Keep the web runtime in [apps/web/Dockerfile](/home/norbu/projects/tasky/apps/web/Dockerfile)
- Keep SPA-serving behavior in [apps/web/Caddyfile](/home/norbu/projects/tasky/apps/web/Caddyfile)
- Add a generic `web` service overlay via [docker-compose.web.yml](/home/norbu/projects/tasky/docker-compose.web.yml)
- Publish the container on a configurable host port
- Document the generic build and run workflow
- Verify the container serves the web app and supports SPA routes

### Out of Scope

- Reverse proxy configuration
- TLS certificates
- DNS or domain mapping
- Host firewall or ingress rules
- Mobile containerization

## Design Details

### Tasky Web Container

The web Dockerfile is multi-stage:

1. **Build stage**
   - Node + pnpm
   - install workspace dependencies from repo root
   - build `@tasky/web`

2. **Runtime stage**
   - Caddy image
   - copy built `dist/`
   - copy a repo-local Caddyfile
   - serve static output on port `80`

### Internal Caddy Behavior

The Caddy config inside the web container:

- serves files from the built `dist/` directory
- applies SPA fallback to `index.html`
- returns asset files directly
- does not manage TLS or public certificates

This is an application runtime, not an internet-facing edge.

### Generic Compose Overlay

The repo keeps the base compose file generic. A separate [docker-compose.web.yml](/home/norbu/projects/tasky/docker-compose.web.yml) file adds the `web` service that:

- builds from the repo root using `apps/web/Dockerfile`
- uses image name `tasky-web:dev`
- publishes `80` through `${WEB_PORT:-8081}:80`
- can be layered onto the base compose file with standard Docker Compose override semantics

This is the generic web container adapter for the project.

## Why This Design

### Better than a server-specific overlay

- avoids coupling the repo to one deployment environment
- keeps container packaging portable across local, VPS, VM, and managed container targets
- leaves ingress concerns to the platform that owns them

### Better than adding `web` to the base compose file

- preserves current backend-focused default compose behavior
- keeps the web runtime opt-in
- avoids changing every local compose workflow

## Verification Plan

### Repo-Level Verification

- resolve the merged compose config successfully
- build the web image successfully
- start the web container successfully
- verify HTTP responds on the published host port
- verify SPA fallback works from the published endpoint

Expected examples:

```bash
docker compose -f docker-compose.yml -f docker-compose.web.yml config
docker compose -f docker-compose.yml -f docker-compose.web.yml build web
docker compose -f docker-compose.yml -f docker-compose.web.yml up -d web
wget -S -O- http://127.0.0.1:${WEB_PORT:-8081}/
wget -S -O- http://127.0.0.1:${WEB_PORT:-8081}/customer/tasks
```

## Risks

- The deployment environment must provide any required ingress or routing separately.
- If the frontend assumes a different API origin at runtime, the app may serve correctly but still need environment clarification.
- Port conflicts can occur if the chosen host port is already in use.

## Acceptance Criteria

1. The repo contains a production-style Docker build for the web app using internal Caddy.
2. The Tasky web container can run through a generic compose overlay and publish a configurable host port.
3. The web app supports SPA route fallback when served from the container.
4. The spec/docs stop at the generic web container adapter and leave host-specific routing to the deployment environment.
