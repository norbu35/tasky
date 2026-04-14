FROM node:22-bookworm AS build
WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

ARG VITE_API_BASE_URL=
ARG VITE_DEV_AUTH_ENABLED=true
ARG VITE_FACEBOOK_APP_ID=
ENV VITE_API_BASE_URL="$VITE_API_BASE_URL"
ENV VITE_DEV_AUTH_ENABLED="$VITE_DEV_AUTH_ENABLED"
ENV VITE_FACEBOOK_APP_ID="$VITE_FACEBOOK_APP_ID"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/design-tokens/package.json packages/design-tokens/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages/core packages/core
COPY packages/sdk packages/sdk
COPY packages/design-tokens packages/design-tokens

RUN pnpm --filter @tasky/web build

FROM caddy:2.9-alpine

COPY apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /workspace/apps/web/dist /srv

RUN addgroup --system caddy && adduser --system --ingroup caddy caddy
USER caddy

EXPOSE 80
