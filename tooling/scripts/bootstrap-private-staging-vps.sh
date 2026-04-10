#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="${1:-}"
APP_DIR="${2:-/srv/tasky-private-staging}"

if [[ -z "${DEPLOY_USER}" ]]; then
  echo "Usage: $0 <deploy-user> [app-dir]" >&2
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "This script must run as root (or via sudo)." >&2
  exit 1
fi

if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  echo "Deploy user does not exist on this host: ${DEPLOY_USER}" >&2
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "Unsupported host: bootstrap currently targets Debian/Ubuntu hosts with apt-get." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

compose_package=""
if apt-cache show docker-compose-plugin >/dev/null 2>&1; then
  compose_package="docker-compose-plugin"
elif apt-cache show docker-compose-v2 >/dev/null 2>&1; then
  compose_package="docker-compose-v2"
fi

packages=(
  ca-certificates
  curl
  git
  rsync
  openssh-client
  docker.io
)

if [[ -n "${compose_package}" ]]; then
  packages+=("${compose_package}")
fi

echo "Installing private staging host dependencies..."
apt-get update
apt-get install -y "${packages[@]}"

echo "Enabling Docker service..."
systemctl enable --now docker

if getent group docker >/dev/null 2>&1; then
  usermod -aG docker "${DEPLOY_USER}"
fi

echo "Preparing application directory..."
install -d -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" "${APP_DIR}"

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is still unavailable after package install." >&2
  echo "Install a compose plugin manually before deploying the private staging stack." >&2
  exit 1
fi

cat <<EOF
Private staging VPS bootstrap complete.

Host:
- Docker Engine installed and started
- docker compose available
- ${DEPLOY_USER} added to docker group
- app directory prepared at ${APP_DIR}

Next step from the developer machine:
- sync the repo and deploy with tooling/scripts/push-private-staging.sh
EOF
