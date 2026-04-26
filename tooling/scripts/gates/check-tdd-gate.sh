#!/usr/bin/env bash
# check-tdd-gate.sh
# Enforces the TDD contract from tasky-entry stages 7-8.
#
# Four mechanical gates:
#   Gate 1: New-file-has-test — every newly-added production file must have a
#            corresponding test file. Fixed heuristics for mobile (__tests__
#            root), web (__tests__ companion + sibling + tests/ root),
#            and packages.
#   Gate 2: Change-implies-test — if any production code changed on the branch,
#            at least one test file must also be in the diff.
#   Gate 3: First-production ordering — branch production code must not appear before tests.
#            Once the branch has a test commit, Gates 1, 2, and 4 own ongoing pairing.
#   Gate 4: TDD evidence — .pi/sessions/<id>/tdd-evidence.json must exist with a
#            recorded red→green transition (exit 1 → exit 0) when production code changed.
#
# Exit code: 0 = pass, 1 = fail
# Usage: bash tooling/scripts/gates/check-tdd-gate.sh
#
# Environment variables:
#   TDD_BRANCH_BASE — override the auto-detected branch base commit (for testing)
#   TDD_EVIDENCE_FILE — override the auto-detected evidence file path
#   TDD_SESSION_ID — look for evidence at .pi/sessions/$TDD_SESSION_ID/tdd-evidence.json
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
cd "$ROOT_DIR"

if ! command -v jq >/dev/null 2>&1; then
  echo "tdd-gate: error: 'jq' is required" >&2
  exit 1
fi

# ── Branch base detection ────────────────────────────────────────────────────
# Override: set TDD_BRANCH_BASE to force a specific commit as the diff base.
if [ -n "${TDD_BRANCH_BASE:-}" ]; then
  BRANCH_BASE="$TDD_BRANCH_BASE"
else
  BRANCH_BASE=$(git merge-base HEAD origin/main 2>/dev/null \
    || git merge-base HEAD origin/staging 2>/dev/null \
    || git rev-parse "HEAD~1" 2>/dev/null || true)
fi

if [ -z "$BRANCH_BASE" ]; then
  echo "tdd-gate: SKIP (cannot determine branch base — no origin/main or origin/staging)"
  exit 0
fi

FAILURES=""
WARNINGS=""

add_failure() { FAILURES="${FAILURES}  - $1\n"; }
add_warning() { WARNINGS="${WARNINGS}  - $1\n"; }

print_remediation() {
  cat >&2 <<REMEDIATION

tdd-gate: autonomous remediation:
  - write the test BEFORE implementing production code (TDD red-phase first)
  - for backend: create <ClassName>Test.java in services/api/src/test/java
  - for frontend: create <component>.test.tsx in the matching __tests__ directory
  - record red-phase (failing) and green-phase (passing) evidence:
      mkdir -p .pi/sessions/<session-id>
      echo '{"red":{"cmd":"...","exit":1,"tail":"..."},"green":{"cmd":"...","exit":0,"tail":"..."}}' \\
        > .pi/sessions/<session-id>/tdd-evidence.json
  - rerun after adding tests: pnpm verify:tdd
REMEDIATION
}

# ── Shared patterns ──────────────────────────────────────────────────────────
BACKEND_PROD_PATTERN='^services/api/src/main/java/.*\.java$'
BACKEND_SKIP_PATTERN='(Dto|DTO)\.java$|(Config|Configuration|Properties|Activat)\.java$|(Exception|Error|Violation)\.java$|(Mapper|mapper|Converter)\.java$|/generated/'
FRONTEND_PROD_PATTERN='^(apps|packages)/[^/]+/src/.*\.(ts|tsx)$'
FRONTEND_SKIP_PATTERN='(\.test\.|\.spec\.|__tests__)|(\.d\.ts$|/locales/|/generated/)|(/src/test/)'
TEST_FILE_PATTERN='(\.test\.|\.spec\.)|(/__tests__/)|(^tests/)|(/src/test/)'

is_production_file() {
  local f="$1"
  echo "$f" | grep -qE "$BACKEND_PROD_PATTERN" && return 0
  echo "$f" | grep -qE "$FRONTEND_PROD_PATTERN" && return 0
  return 1
}

is_skipped_file() {
  local f="$1"
  echo "$f" | grep -qE "$BACKEND_PROD_PATTERN" && echo "$f" | grep -qE "$BACKEND_SKIP_PATTERN" && return 0
  echo "$f" | grep -qE "$FRONTEND_PROD_PATTERN" && echo "$f" | grep -qE "$FRONTEND_SKIP_PATTERN" && return 0
  return 1
}

is_test_file() {
  local f="$1"
  echo "$f" | grep -qE "$TEST_FILE_PATTERN"
}

# ── Test-path lookup (fixed heuristics) ──────────────────────────────────────
# For a given production source file, search for a matching test file.
# Returns the first match (empty string if none found).
find_test_for_prod_file() {
  local f="$1"
  local found=""

  # ── Backend: <ClassName>Test.java ──
  if echo "$f" | grep -qE '^services/api/src/main/java/'; then
    local class
    class=$(basename "$f" .java)
    found=$(find services/api/src/test/java -name "${class}Test.java" 2>/dev/null | head -1 || true)
    echo "${found:-}"
    return
  fi

  # ── Frontend ──
  local dir base base_noext
  dir=$(dirname "$f")
  base="${f##*/}"
  base_noext="${base%.*}"

  # Strategy 1: sibling test file
  found=$(find "$dir" -maxdepth 1 \
    \( -name "${base_noext}.test.ts" -o -name "${base_noext}.test.tsx" \) \
    2>/dev/null | head -1 || true)
  if [ -n "$found" ]; then echo "$found"; return; fi

  # Strategy 2: __tests__ companion directory next to the source file
  if [ -d "${dir}/__tests__" ]; then
    found=$(find "${dir}/__tests__" -maxdepth 1 \
      \( -name "${base_noext}.test.ts" -o -name "${base_noext}.test.tsx" \) \
      2>/dev/null | head -1 || true)
    if [ -n "$found" ]; then echo "$found"; return; fi
  fi

  # Strategy 3: mobile root __tests__ directory
  #   apps/mobile/src/screens/customer/Foo.tsx → apps/mobile/__tests__/screens/customer/Foo.test.tsx
  if echo "$f" | grep -qE '^apps/mobile/src/'; then
    local rel_path="${f#apps/mobile/src/}"
    local mobile_test="apps/mobile/__tests__/${rel_path%.*}.test.tsx"
    if [ -f "$mobile_test" ]; then echo "$mobile_test"; return; fi
    mobile_test="apps/mobile/__tests__/${rel_path%.*}.test.ts"
    if [ -f "$mobile_test" ]; then echo "$mobile_test"; return; fi
  fi

  # Strategy 4: web root tests/ directory (integration/accessibility tests)
  if echo "$f" | grep -qE '^apps/web/src/'; then
    found=$(find apps/web/tests -name "${base_noext}.test.*" 2>/dev/null | head -1 || true)
    if [ -n "$found" ]; then echo "$found"; return; fi
  fi

  # Strategy 5: packages __tests__ directory
  if echo "$f" | grep -qE '^packages/[^/]+/src/'; then
    local pkg_root
    pkg_root=$(echo "$f" | sed -E 's|^(packages/[^/]+)/.*|\1|')
    found=$(find "${pkg_root}/__tests__" -name "${base_noext}.test.*" 2>/dev/null | head -1 || true)
    if [ -n "$found" ]; then echo "$found"; return; fi
  fi

  echo ""
}

# ══════════════════════════════════════════════════════════════════════════════
# Gate 1: New production files must have corresponding test files (added only)
# ══════════════════════════════════════════════════════════════════════════════
echo "tdd-gate: [gate 1] checking new files have matching tests..."

# ── Backend: new (added) Java production classes ──
NEW_JAVA=$(git diff --diff-filter=A --name-only "$BRANCH_BASE"..HEAD \
  | grep -E "$BACKEND_PROD_PATTERN" \
  | grep -vE "$BACKEND_SKIP_PATTERN" \
  || true)

while IFS= read -r f; do
  [ -z "$f" ] && continue
  class=$(basename "$f" .java)
  test_found=$(find services/api/src/test/java -name "${class}Test.java" 2>/dev/null | head -1)
  if [ -z "$test_found" ]; then
    add_failure "gate-1: backend: no test class for new production file $f  (expected ${class}Test.java)"
  fi
done <<< "$NEW_JAVA"

# ── Frontend: new (added) non-test TypeScript/TSX files (fixed heuristics) ──
NEW_TS=$(git diff --diff-filter=A --name-only "$BRANCH_BASE"..HEAD \
  | grep -E "$FRONTEND_PROD_PATTERN" \
  | grep -vE "$FRONTEND_SKIP_PATTERN" \
  || true)

while IFS= read -r f; do
  [ -z "$f" ] && continue
  test_found=$(find_test_for_prod_file "$f")
  if [ -z "$test_found" ]; then
    base_noext="${f##*/}"
    base_noext="${base_noext%.*}"
    add_failure "gate-1: frontend: no test file for new $f  (expected ${base_noext}.test.ts(x) in a recognized test directory)"
  fi
done <<< "$NEW_TS"

# ══════════════════════════════════════════════════════════════════════════════
# Gate 2: Change-implies-test — production diff must include test changes
# ══════════════════════════════════════════════════════════════════════════════
echo "tdd-gate: [gate 2] checking change-implies-test..."

ALL_CHANGED=$(git diff --name-only "$BRANCH_BASE"..HEAD || true)

PROD_CHANGED=""
TEST_CHANGED=""

while IFS= read -r f; do
  [ -z "$f" ] && continue
  if is_production_file "$f" && ! is_skipped_file "$f"; then
    PROD_CHANGED="${PROD_CHANGED}${f}\n"
  fi
  if is_test_file "$f"; then
    TEST_CHANGED="${TEST_CHANGED}${f}\n"
  fi
done <<< "$ALL_CHANGED"

if [ -n "$PROD_CHANGED" ] && [ -z "$TEST_CHANGED" ]; then
  add_failure "gate-2: production files changed but no test files in the diff — at least one test file must change alongside production code"
fi

# ══════════════════════════════════════════════════════════════════════════════
# Gate 3: First-production ordering — branch production code must not appear before tests
# ══════════════════════════════════════════════════════════════════════════════
echo "tdd-gate: [gate 3] checking first production commit ordering..."

# Get branch commits in chronological order (oldest first)
BRANCH_COMMITS=$(git rev-list --reverse "$BRANCH_BASE"..HEAD 2>/dev/null || true)

if [ -n "$BRANCH_COMMITS" ]; then
  # Simple counter of test files seen in earlier commits
  tests_seen_count=0

  while IFS= read -r commit; do
    [ -z "$commit" ] && continue

    COMMIT_CHANGED=$(git diff-tree --no-commit-id --name-only -r "$commit" 2>/dev/null || true)

    COMMIT_TESTS=""
    COMMIT_PRODS=""

    while IFS= read -r f; do
      [ -z "$f" ] && continue
      if is_test_file "$f"; then
        COMMIT_TESTS="${COMMIT_TESTS}${f}\n"
        tests_seen_count=$((tests_seen_count + 1))
      fi
      if is_production_file "$f" && ! is_skipped_file "$f"; then
        COMMIT_PRODS="${COMMIT_PRODS}${f}\n"
      fi
    done <<< "$COMMIT_CHANGED"

    # Flag if the first production commit appears before any test commit.
    if [ -n "$COMMIT_PRODS" ]; then
      if [ -z "$COMMIT_TESTS" ] && [ "$tests_seen_count" -eq 0 ]; then
        SHORT_SHA=$(git rev-parse --short "$commit")
        add_failure "gate-3: first production commit ${SHORT_SHA} appears before any test commit — write tests first (red phase)"
      fi
    fi
  done <<< "$BRANCH_COMMITS"
fi

# ══════════════════════════════════════════════════════════════════════════════
# Gate 4: TDD evidence — red→green transition must be recorded
# ══════════════════════════════════════════════════════════════════════════════
echo "tdd-gate: [gate 4] checking TDD evidence..."

# Only enforce if production code actually changed
if [ -n "$PROD_CHANGED" ]; then
  EVIDENCE_FILE=""

  # Check env var override first
  if [ -n "${TDD_EVIDENCE_FILE:-}" ] && [ -f "$TDD_EVIDENCE_FILE" ]; then
    EVIDENCE_FILE="$TDD_EVIDENCE_FILE"
  elif [ -n "${TDD_SESSION_ID:-}" ] && [ -f ".pi/sessions/${TDD_SESSION_ID}/tdd-evidence.json" ]; then
    EVIDENCE_FILE=".pi/sessions/${TDD_SESSION_ID}/tdd-evidence.json"
  else
    # Find most recently modified evidence file
    EVIDENCE_FILE=$(find .pi/sessions -name 'tdd-evidence.json' -type f 2>/dev/null \
      | xargs ls -t 2>/dev/null | head -1 || true)
    if [ -n "$EVIDENCE_FILE" ]; then
      add_warning "gate-4: using most recently modified tdd evidence fallback (${EVIDENCE_FILE}); set TDD_EVIDENCE_FILE or TDD_SESSION_ID for branch-specific evidence"
    fi
  fi

  if [ -z "$EVIDENCE_FILE" ]; then
    add_failure "gate-4: no tdd-evidence.json found — create .pi/sessions/<id>/tdd-evidence.json with {red:{cmd,exit:1,tail},green:{cmd,exit:0,tail}}"
  else
    # Validate red→green transition
    RED_EXIT=$(jq -r '.red.exit // empty' "$EVIDENCE_FILE" 2>/dev/null || true)
    GREEN_EXIT=$(jq -r '.green.exit // empty' "$EVIDENCE_FILE" 2>/dev/null || true)

    if [ -z "$RED_EXIT" ] || [ -z "$GREEN_EXIT" ]; then
      add_failure "gate-4: tdd-evidence.json missing red or green phase — both {red:{cmd,exit,tail}} and {green:{cmd,exit,tail}} are required"
    elif [ "$RED_EXIT" != "1" ]; then
      add_failure "gate-4: red phase exit code is ${RED_EXIT}, expected 1 (test must fail before implementation)"
    elif [ "$GREEN_EXIT" != "0" ]; then
      add_failure "gate-4: green phase exit code is ${GREEN_EXIT}, expected 0 (test must pass after implementation)"
    fi
  fi
fi

# ══════════════════════════════════════════════════════════════════════════════
# Report
# ══════════════════════════════════════════════════════════════════════════════
if [ -n "$WARNINGS" ]; then
  printf "\ntdd-gate: WARNINGS\n" >&2
  printf "%b" "$WARNINGS" >&2
fi

if [ -n "$FAILURES" ]; then
  printf "\ntdd-gate: FAIL\n" >&2
  printf "%b" "$FAILURES" >&2
  print_remediation
  exit 1
fi

echo "tdd-gate: PASS (all 4 gates clear)"
