#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ENV_FILE="${1:-${ROOT_DIR}/.env.private-staging}"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.private-staging.yml"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Private staging env file not found: ${ENV_FILE}" >&2
  echo "Copy .env.private-staging.example to .env.private-staging and fill in secrets." >&2
  exit 1
fi

echo "Validating private staging compose configuration..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" config >/dev/null

echo "Deploying private staging stack..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build --remove-orphans

echo "Current private staging containers:"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps

echo
echo "Run smoke verification next:"
echo "  ${ROOT_DIR}/tooling/scripts/deploy/smoke-private-staging.sh ${ENV_FILE}"
