#!/usr/bin/env bash
# capture-visual-audit.sh — Visual audit screenshot capture operator
# Run from: apps/mobile/
# Usage: ./scripts/capture-visual-audit.sh [batch] [--flows-dir <dir>]
# NOTE: Failures are informational in capture mode. The script continues on flow failures.

# --help
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./scripts/capture-visual-audit.sh [BATCH] [--flows-dir DIR]

Positional arguments:
  BATCH       Batch name to run. One of: smoke, auth, customer, tasker, shared, all
              Default: all

Options:
  --flows-dir DIR   Directory containing Maestro flow files (default: maestro/flows/)
  --help, -h        Print this help message

Batch contents:
  smoke     smoke.yaml, JRN-CUST-01-post-a-task.yaml, tasker-browse.yaml
  auth      JRN-SHARED-01-onboarding.yaml
  customer  JRN-CUST-01-post-a-task.yaml, JRN-SHARED-05-profile-management.yaml
  tasker    tasker-browse.yaml, JRN-TASK-01-tasker-verification.yaml, SCR-TASK-016-tasker-stats.yaml
  shared    JRN-SHARED-05-profile-management.yaml, JRN-SHARED-06-settings-&-account.yaml,
            SCR-SHARED-016-notification-center.yaml, SCR-INFRA-004-terms-of-service.yaml,
            SCR-TASK-018-privacy-policy.yaml
  all       All of the above, deduplicated

Output:
  maestro/capture/<batch>/<timestamp>/
  Maestro screenshots automatically written to: ~/.maestro/tests/<timestamp>/

EOF
  exit 0
fi

set -uo pipefail

# --- Argument parsing ---
BATCH="${1:-all}"
FLOWS_DIR="maestro/flows/"

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --flows-dir)
      FLOWS_DIR="${2:?--flows-dir requires an argument}"
      shift 2
      ;;
    *)
      echo "ERROR: Unknown argument: $1" >&2
      echo "Run with --help for usage." >&2
      exit 1
      ;;
  esac
done

# Strip trailing slash for consistency, then re-add
FLOWS_DIR="${FLOWS_DIR%/}/"

# --- Validate batch name ---
VALID_BATCHES=(smoke auth customer tasker shared all)
VALID=0
for b in "${VALID_BATCHES[@]}"; do
  if [[ "$BATCH" == "$b" ]]; then
    VALID=1
    break
  fi
done
if [[ "$VALID" -eq 0 ]]; then
  echo "ERROR: Unknown batch '${BATCH}'. Valid batches: smoke, auth, customer, tasker, shared, all" >&2
  exit 1
fi

# --- Check Maestro ---
if ! command -v maestro >/dev/null 2>&1; then
  echo "ERROR: Maestro CLI is required for visual audit capture." >&2
  echo "Install: https://maestro.mobile.dev/getting-started/installing-maestro" >&2
  exit 1
fi

# --- Flow definitions per batch ---
SMOKE_FLOWS=(
  "smoke.yaml"
  "JRN-CUST-01-post-a-task.yaml"
  "tasker-browse.yaml"
)

AUTH_FLOWS=(
  "JRN-SHARED-01-onboarding.yaml"
)

CUSTOMER_FLOWS=(
  "JRN-CUST-01-post-a-task.yaml"
  "JRN-SHARED-05-profile-management.yaml"
)

TASKER_FLOWS=(
  "tasker-browse.yaml"
  "JRN-TASK-01-tasker-verification.yaml"
  "SCR-TASK-016-tasker-stats.yaml"
)

SHARED_FLOWS=(
  "JRN-SHARED-05-profile-management.yaml"
  "JRN-SHARED-06-settings-&-account.yaml"
  "SCR-SHARED-016-notification-center.yaml"
  "SCR-INFRA-004-terms-of-service.yaml"
  "SCR-TASK-018-privacy-policy.yaml"
)

# Build the flow list for the requested batch (deduplicated for 'all')
declare -a FLOWS_TO_RUN=()
declare -A SEEN=()

add_flows() {
  local arr=("$@")
  for flow in "${arr[@]}"; do
    if [[ -z "${SEEN[$flow]+_}" ]]; then
      SEEN[$flow]=1
      FLOWS_TO_RUN+=("$flow")
    fi
  done
}

case "$BATCH" in
  smoke)    add_flows "${SMOKE_FLOWS[@]}" ;;
  auth)     add_flows "${AUTH_FLOWS[@]}" ;;
  customer) add_flows "${CUSTOMER_FLOWS[@]}" ;;
  tasker)   add_flows "${TASKER_FLOWS[@]}" ;;
  shared)   add_flows "${SHARED_FLOWS[@]}" ;;
  all)
    add_flows "${SMOKE_FLOWS[@]}"
    add_flows "${AUTH_FLOWS[@]}"
    add_flows "${CUSTOMER_FLOWS[@]}"
    add_flows "${TASKER_FLOWS[@]}"
    add_flows "${SHARED_FLOWS[@]}"
    ;;
esac

# --- Setup output directory ---
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="maestro/capture/${BATCH}/${TIMESTAMP}"
mkdir -p "$OUTPUT_DIR"

SUMMARY_FILE="${OUTPUT_DIR}/capture-summary.txt"

{
  echo "=== Visual Audit Capture Summary ==="
  echo "Batch:     ${BATCH}"
  echo "Timestamp: ${TIMESTAMP}"
  echo "Flows dir: ${FLOWS_DIR}"
  echo "Output:    ${OUTPUT_DIR}"
  echo ""
  echo "Flows to run (${#FLOWS_TO_RUN[@]}):"
  for f in "${FLOWS_TO_RUN[@]}"; do
    echo "  - $f"
  done
  echo ""
  echo "--- Results ---"
} | tee "$SUMMARY_FILE"

# --- Run flows (failures are informational, do NOT exit) ---
PASS=0
FAIL=0
SKIP=0

for flow_name in "${FLOWS_TO_RUN[@]}"; do
  flow_path="${FLOWS_DIR}${flow_name}"
  flow_stem="${flow_name%.yaml}"
  log_file="${OUTPUT_DIR}/${flow_stem}.log"
  xml_file="${OUTPUT_DIR}/${flow_stem}.xml"

  echo "Running: ${flow_name}"

  if [[ ! -f "$flow_path" ]]; then
    echo "  SKIP: ${flow_name} (file not found: ${flow_path})"
    echo "SKIP: ${flow_name} (file not found)" | tee -a "$SUMMARY_FILE"
    SKIP=$((SKIP + 1))
    continue
  fi

  # Run with JUnit output; capture log separately. Failures are non-fatal.
  if maestro test --format junit --output "$xml_file" "$flow_path" > "$log_file" 2>&1; then
    echo "  PASS: ${flow_name}"
    echo "PASS: ${flow_name}" >> "$SUMMARY_FILE"
    PASS=$((PASS + 1))
  else
    echo "  WARN: ${flow_name} failed (capture continues) — see ${log_file}"
    echo "FAIL: ${flow_name}" >> "$SUMMARY_FILE"
    FAIL=$((FAIL + 1))
  fi
done

# --- Final summary ---
{
  echo ""
  echo "--- Totals ---"
  echo "PASS=${PASS}  FAIL=${FAIL}  SKIP=${SKIP}"
  echo ""
  echo "Maestro screenshots: ~/.maestro/tests/ (automatic)"
  echo "Capture output dir:  ${OUTPUT_DIR}"
} | tee -a "$SUMMARY_FILE"

echo ""
echo "Output directory: ${OUTPUT_DIR}"
