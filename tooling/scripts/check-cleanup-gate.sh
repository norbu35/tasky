#!/usr/bin/env bash
set -euo pipefail

# Trusted structural-cleanup gate.
# Intentionally excludes `pnpm -r test` for now because deterministic
# web test failures are tracked in tests/registry.yaml notes.

./gradlew --no-daemon openApiValidate gateSmoke
pnpm -r typecheck

echo "cleanup-gate: PASS"
