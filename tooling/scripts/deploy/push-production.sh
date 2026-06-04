#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
REMOTE_LOGIN="norbu@10.10.0.1"
REMOTE_DIR="/home/norbu/docker/p-app-ncp-tasky"
ENV_FILE="${ROOT_DIR}/.env.production"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Production env file not found: ${ENV_FILE}" >&2
  exit 1
fi

for required in ssh scp rsync; do
  if ! command -v "${required}" >/dev/null 2>&1; then
    echo "Missing required command: ${required}" >&2
    exit 1
  fi
done

echo "Preparing remote directory ${REMOTE_DIR} on ${REMOTE_LOGIN}..."
ssh "${REMOTE_LOGIN}" "mkdir -p '${REMOTE_DIR}'"

echo "Syncing repository to ${REMOTE_LOGIN}:${REMOTE_DIR}..."
rsync -az --delete \
  --exclude '.git/' \
  --exclude '.github/' \
  --exclude '.worktrees/' \
  --exclude '.gradle/' \
  --exclude '.idea/' \
  --exclude '.vscode/' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'node_modules/' \
  --exclude '**/node_modules/' \
  --exclude '**/build/' \
  --exclude '**/dist/' \
  --exclude '.expo/' \
  --exclude 'apps/*/coverage/' \
  --exclude 'apps/*/playwright-report/' \
  --exclude 'apps/*/test-results/' \
  --exclude 'artifacts/' \
  --exclude '*.log' \
  --exclude 'docker/backups/' \
  "${ROOT_DIR}/" "${REMOTE_LOGIN}:${REMOTE_DIR}/"


echo "Uploading production env file..."
scp "${ENV_FILE}" "${REMOTE_LOGIN}:${REMOTE_DIR}/.env"

echo "Deploying production stack on VPS..."
ssh "${REMOTE_LOGIN}" "
  cd '${REMOTE_DIR}'
  docker compose -f docker-compose.production.yml up -d --build --remove-orphans
"

echo "Production deploy complete!"
