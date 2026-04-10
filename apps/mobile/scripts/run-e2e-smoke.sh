#!/usr/bin/env bash
set -euo pipefail

# E2E smoke means Maestro smoke. No fallback to component tests.
if ! command -v maestro >/dev/null 2>&1; then
  echo "ERROR: Maestro CLI is required for E2E smoke tests." >&2
  echo "Install: https://maestro.mobile.dev/getting-started/installing-maestro" >&2
  exit 1
fi

SMOKE_FLOWS=(
  "maestro/flows/smoke.yaml"
  "maestro/flows/JRN-CUST-01-post-a-task.yaml"
  "maestro/flows/tasker-browse.yaml"
)

for flow in "${SMOKE_FLOWS[@]}"; do
  echo "Running Maestro smoke flow: ${flow}"
  maestro test "${flow}"
done
