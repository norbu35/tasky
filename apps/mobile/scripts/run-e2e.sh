#!/usr/bin/env bash
set -euo pipefail

# E2E means Maestro. No fallback to component tests.
if ! command -v maestro >/dev/null 2>&1; then
  echo "ERROR: Maestro CLI is required for E2E tests." >&2
  echo "Install: https://maestro.mobile.dev/getting-started/installing-maestro" >&2
  exit 1
fi

maestro test maestro/flows
