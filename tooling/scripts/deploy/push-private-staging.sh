#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
REMOTE_LOGIN="${1:-}"
REMOTE_DIR="${2:-/srv/tasky-private-staging}"
ENV_FILE="${3:-${ROOT_DIR}/.env.private-staging}"
DEPLOY_USER="${4:-}"

if [[ -z "${REMOTE_LOGIN}" ]]; then
  echo "Usage: $0 <ssh-user@host> [remote-dir] [env-file] [deploy-user]" >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Private staging env file not found: ${ENV_FILE}" >&2
  echo "Copy .env.private-staging.example to .env.private-staging and fill in secrets first." >&2
  exit 1
fi

for required in ssh scp rsync; do
  if ! command -v "${required}" >/dev/null 2>&1; then
    echo "Missing required command: ${required}" >&2
    exit 1
  fi
done

if [[ -z "${DEPLOY_USER}" ]]; then
  if [[ "${REMOTE_LOGIN}" == *"@"* ]]; then
    DEPLOY_USER="${REMOTE_LOGIN%@*}"
  else
    DEPLOY_USER="${USER}"
  fi
fi

REMOTE_BOOTSTRAP='find tooling/scripts -type f -name "*.sh" -exec chmod +x {} +; chmod +x gradlew; if [ "$(id -u)" -eq 0 ]; then ./tooling/scripts/deploy/bootstrap-private-staging-vps.sh; elif sudo -n true >/dev/null 2>&1; then sudo -n ./tooling/scripts/deploy/bootstrap-private-staging-vps.sh; else echo "Remote bootstrap requires root SSH or passwordless sudo." >&2; exit 1; fi'

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
  "${ROOT_DIR}/" "${REMOTE_LOGIN}:${REMOTE_DIR}/"

echo "Bootstrapping remote host packages and Docker..."
ssh "${REMOTE_LOGIN}" \
  "cd '${REMOTE_DIR}' && ${REMOTE_BOOTSTRAP} '${DEPLOY_USER}' '${REMOTE_DIR}'"

echo "Uploading private staging env file..."
scp "${ENV_FILE}" "${REMOTE_LOGIN}:${REMOTE_DIR}/.env.private-staging"

echo "Deploying private staging stack..."
ssh "${REMOTE_LOGIN}" \
  "cd '${REMOTE_DIR}' && find tooling/scripts -type f -name '*.sh' -exec chmod +x {} + && chmod +x gradlew && ./tooling/scripts/deploy/deploy-private-staging.sh .env.private-staging"

if [[ "${RUN_SMOKE:-true}" == "true" ]]; then
  echo "Running private staging smoke checks..."
  ssh "${REMOTE_LOGIN}" \
    "cd '${REMOTE_DIR}' && ./tooling/scripts/deploy/smoke-private-staging.sh .env.private-staging"
fi

cat <<EOF
Private staging push complete.

Access the sandbox through an SSH tunnel:
  ssh -L 8080:127.0.0.1:8080 ${REMOTE_LOGIN}
EOF
