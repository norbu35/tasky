# ---- Stage 1: Prune monorepo to only what @tasky/web needs ----
FROM node:22-bookworm AS pruner
WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install turbo globally so prune can run before pnpm install
RUN pnpm add -g turbo@^2

COPY . .

# Generate a pruned monorepo with a trimmed lockfile for @tasky/web
RUN turbo prune @tasky/web --docker

# ---- Stage 2: Install dependencies from pruned lockfile ----
FROM node:22-bookworm AS installer
WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy pruned lockfile and package.json manifests only
# This layer is cached unless dependencies change
COPY --from=pruner /workspace/out/json/ .

RUN pnpm install --frozen-lockfile

# Copy full pruned source on top (invalidated only when source changes)
COPY --from=pruner /workspace/out/full/ .

# ---- Stage 3: Build the web app ----
FROM installer AS builder

ARG VITE_API_BASE_URL=
ARG VITE_DEV_AUTH_ENABLED=false
ARG VITE_FACEBOOK_APP_ID=
ENV VITE_API_BASE_URL="$VITE_API_BASE_URL"
ENV VITE_DEV_AUTH_ENABLED="$VITE_DEV_AUTH_ENABLED"
ENV VITE_FACEBOOK_APP_ID="$VITE_FACEBOOK_APP_ID"

RUN pnpm turbo run build --filter=@tasky/web

# ---- Stage 4: Production image ----
FROM caddy:2.9-alpine

COPY apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /workspace/apps/web/dist /srv

RUN addgroup -S caddy && adduser -S -G caddy caddy
USER caddy

EXPOSE 80
