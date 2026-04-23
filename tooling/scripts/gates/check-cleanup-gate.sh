#!/usr/bin/env bash
set -euo pipefail

# Canonical fast structural gate.
# Keep this aligned with the PR "structural-gate" workflow so local and CI
# surface the same failures before the heavier suites start.

./gradlew --no-daemon :services:api:openApiValidate
pnpm repo:docs:check
turbo run typecheck
pnpm repo:workspace:boundaries
pnpm --filter @tasky/mobile structure:check
python3 tooling/scripts/governance/validate-migrations.py
python3 tooling/scripts/governance/validate-schema-parity.py
bash tooling/scripts/governance/scan-backend-doc-drift.sh
bash tooling/scripts/governance/check-trivyignore-expiry.sh
bash tooling/scripts/governance/check-gitleaks-secret-scan.sh

echo "cleanup-gate: PASS"
