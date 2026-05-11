#!/usr/bin/env bash
# Substitute ALERT_WEBHOOK_URL into alertmanager.yml and start alertmanager.
# Usage: ALERT_WEBHOOK_URL=https://hooks.example.com/xxx ./start-alertmanager.sh
set -euo pipefail

TEMPLATE_DIR="$(dirname "$0")"
CONFIG="${TEMPLATE_DIR}/alertmanager.yml"

if [[ -z "${ALERT_WEBHOOK_URL:-}" ]]; then
  echo "WARNING: ALERT_WEBHOOK_URL is not set. Alertmanager will start but webhook receiver will be empty." >&2
fi

# Substitute env vars into a temp config
GENERATED="$(mktemp)"
envsubst '${ALERT_WEBHOOK_URL}' < "$CONFIG" > "$GENERATED"
trap 'rm -f "$GENERATED"' EXIT

echo "==> Starting alertmanager with generated config: $GENERATED"
exec alertmanager --config.file="$GENERATED" "$@"
