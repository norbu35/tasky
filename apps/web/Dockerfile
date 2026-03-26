FROM node:20-bookworm AS build
WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

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

EXPOSE 80
