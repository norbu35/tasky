#!/usr/bin/env bash
set -euo pipefail

# Canonical fast structural gate.
# Keep this aligned with the PR "structural-gate" workflow so local and CI
# surface the same failures before the heavier suites start.

CURRENT_STEP=""
CURRENT_COMMAND=""

print_remediation() {
  cat >&2 <<EOF
cleanup-gate: FAIL
autonomous remediation:
 - failing step: ${CURRENT_STEP}
 - rerun the failing command directly: ${CURRENT_COMMAND}
 - fix the source-of-truth surface named by that command before re-running the full lane
 - for docs/governance drift use: pnpm repo:docs:claims:triage and follow tooling/skills/doc-claims-remediation/SKILL.md
 - once fixed, rerun: pnpm verify:cleanup
EOF
}

run_step() {
  CURRENT_STEP="$1"
  shift
  CURRENT_COMMAND="$*"
  echo "cleanup-gate: running ${CURRENT_STEP}"
  if ! "$@"; then
    print_remediation
    exit 1
  fi
}

run_step "migration safety validation" python3 tooling/scripts/governance/validate-migrations.py
run_step "schema parity validation" python3 tooling/scripts/governance/validate-schema-parity.py
run_step "trivy ignore expiry check" bash tooling/scripts/governance/check-trivyignore-expiry.sh
run_step "gitleaks secret scan" bash tooling/scripts/governance/check-gitleaks-secret-scan.sh
run_step "workspace boundary validation" pnpm repo:workspace:boundaries
run_step "mobile structure check" pnpm --filter @tasky/mobile structure:check
run_step "workspace typecheck" turbo run typecheck
run_step "repo docs lane" pnpm repo:docs:check

echo "cleanup-gate: PASS"
