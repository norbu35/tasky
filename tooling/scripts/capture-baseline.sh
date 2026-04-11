#!/usr/bin/env bash
# capture-baseline.sh — Capture machine-verifiable gate snapshot before upgrade branches.
# Output: baseline.json in repo root (NOT committed to main; copied into each upgrade branch).
#
# PREREQUISITES:
#   - Docker services running: docker compose up -d postgres minio minio-bootstrap
#   - .env loaded: set -a && source .env && set +a
#   - For e2e smoke: backend running with CORS allowing http://127.0.0.1:4173
#     and web app built with VITE_API_BASE_URL=http://localhost:8080
#
# NOTE: e2e smoke is recorded as "fail" on main (pre-existing regression in a611dd0
# removed API mocks but spec files still reference mock IDs like public-task-1).
# All other gates are green.
# Note: -e (errexit) is intentionally omitted — individual gate commands are
# allowed to fail (e.g. e2e smoke); we capture their exit codes explicitly.
set -uo pipefail

COMMIT=$(git rev-parse HEAD)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "=== Running backend gates ==="
./gradlew clean :services:api:test 2>&1 | tail -5
BACKEND_TESTS=$(find services/api/build/test-results -name "*.xml" -exec grep -l "testcase" {} \; | xargs grep -c "<testcase" | awk -F: '{s+=$2} END {print s}' || echo "0")
JACOCO_LINE=$(perl -ne 'print "$1\n" if /Total.*?(\d+)%/' services/api/build/reports/jacoco/test/html/index.html 2>/dev/null | head -1 || echo "0")
OPENAPI_VALID="false"
./gradlew :services:api:openApiValidate 2>&1 | tail -1 && OPENAPI_VALID="true" || true

echo "=== Running frontend gates ==="
TYPE_ERRORS=$(pnpm -r typecheck 2>&1 | { grep -E 'error TS' || true; } | wc -l | tr -d ' ')
LINT_ERRORS=$(pnpm -r lint 2>&1 | { grep -E 'error$| error ' || true; } | wc -l | tr -d ' ')
WEB_TESTS=$(pnpm --filter @tasky/web test:unit 2>&1 | grep -oE 'Tests[[:space:]]+[0-9]+ passed' | grep -oE '[0-9]+' || echo "0")
MOBILE_TESTS=$(pnpm --filter @tasky/mobile test:unit 2>&1 | \
  grep -E '^Tests:' | grep -oE '[0-9]+' | head -1 || echo "0")

E2E_SMOKE="fail"
pnpm --filter @tasky/web test:e2e:smoke 2>&1 | tail -3 && E2E_SMOKE="pass" || true

BOUNDARIES="fail"
pnpm workspace:boundaries 2>&1 | tail -1 && BOUNDARIES="pass" || true

cat > baseline.json <<ENDJSON
{
  "timestamp": "$TIMESTAMP",
  "commit": "$COMMIT",
  "backend": {
    "testCount": ${BACKEND_TESTS:-0},
    "jacocoLineCoverage": ${JACOCO_LINE:-0},
    "openApiValid": $OPENAPI_VALID
  },
  "web": {
    "testCount": ${WEB_TESTS:-0},
    "typeErrors": ${TYPE_ERRORS:-0},
    "lintErrors": ${LINT_ERRORS:-0},
    "e2eSmoke": "$E2E_SMOKE"
  },
  "mobile": {
    "testCount": ${MOBILE_TESTS:-0},
    "typeErrors": ${TYPE_ERRORS:-0},
    "lintErrors": ${LINT_ERRORS:-0}
  },
  "workspaceBoundaries": "$BOUNDARIES"
}
ENDJSON

echo ""
echo "=== Baseline captured ==="
cat baseline.json
