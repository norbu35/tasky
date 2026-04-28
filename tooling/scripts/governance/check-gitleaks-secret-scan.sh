#!/usr/bin/env bash
set -euo pipefail

# Gitleaks governance gate for CI.
# Runs gitleaks detect against the full git history and fails on any finding
# not covered by .gitleaksignore or the .gitleaks.toml allowlist.
#
# Local:  called via pnpm verify:cleanup (structural gate)
# CI:     called from quality-gates.yml security job

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
CONFIG="${ROOT_DIR}/.gitleaks.toml"

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks-secret-scan: SKIP (gitleaks not installed)" >&2
  exit 0
fi

if [ ! -f "$CONFIG" ]; then
  echo "gitleaks-secret-scan: FAIL (.gitleaks.toml missing)" >&2
  echo "autonomous remediation:" >&2
  echo " - restore the repo-level gitleaks config before using this gate" >&2
  exit 1
fi

echo "Running gitleaks secret scan..."
if ! gitleaks detect \
  --config "$CONFIG" \
  --no-banner \
  --exit-code 1; then
  echo "autonomous remediation:" >&2
  echo " - remove the committed secret or rotate and purge it, then update .gitleaksignore/.gitleaks.toml only when the finding is intentionally suppressed" >&2
  echo " - rerun: bash tooling/scripts/governance/check-gitleaks-secret-scan.sh" >&2
  exit 1
fi

echo "gitleaks-secret-scan: PASS"
