#!/usr/bin/env bash
set -euo pipefail

if [[ "${TASKY_RUN_MAESTRO:-false}" == "true" ]]; then
  if ! command -v maestro >/dev/null 2>&1; then
    echo "Maestro CLI is required when TASKY_RUN_MAESTRO=true." >&2
    exit 1
  fi
  maestro test maestro/flows
  exit 0
fi

echo "TASKY_RUN_MAESTRO is false; running full component test fallback."
pnpm run test:unit
