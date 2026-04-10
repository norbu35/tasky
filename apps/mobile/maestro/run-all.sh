#!/bin/bash
# run-all.sh — Run Maestro flow buckets and capture output
# Usage: ./maestro/run-all.sh [SMOKE|ACTIVE|FIXTURE_REQUIRED|DEFERRED|ALL]
# Run from: apps/mobile/
# Output: maestro/results/<timestamp>/

set -euo pipefail

SCOPE="${1:-ACTIVE}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_DIR="maestro/results/${TIMESTAMP}"
PASS=0
FAIL=0

mkdir -p "$RESULTS_DIR"

SMOKE_FLOWS=(
  "smoke:maestro/flows/smoke.yaml"
  "post-task:maestro/flows/JRN-CUST-01-post-a-task.yaml"
  "tasker-browse:maestro/flows/tasker-browse.yaml"
)

ACTIVE_FLOWS=(
  "JRN-SHARED-01:maestro/flows/JRN-SHARED-01-onboarding.yaml"
  "JRN-SHARED-05:maestro/flows/JRN-SHARED-05-profile-management.yaml"
  "JRN-SHARED-06:maestro/flows/JRN-SHARED-06-settings-&-account.yaml"
  "JRN-TASK-01:maestro/flows/JRN-TASK-01-tasker-verification.yaml"
  "SCR-SHARED-016:maestro/flows/SCR-SHARED-016-notification-center.yaml"
  "SCR-TASK-016:maestro/flows/SCR-TASK-016-tasker-stats.yaml"
  "SCR-INFRA-004:maestro/flows/SCR-INFRA-004-terms-of-service.yaml"
  "SCR-TASK-018:maestro/flows/SCR-TASK-018-privacy-policy.yaml"
)

FIXTURE_REQUIRED_FLOWS=(
  "JRN-SHARED-04:maestro/flows/requires-fixture/JRN-SHARED-04-messaging.yaml"
  "JRN-SHARED-07:maestro/flows/requires-fixture/JRN-SHARED-07-review-submission.yaml"
  "JRN-CUST-02:maestro/flows/requires-fixture/JRN-CUST-02-review-applicants-&-confirm-booking-phase-0-1.yaml"
  "JRN-CUST-04:maestro/flows/requires-fixture/JRN-CUST-04-manage-active-booking.yaml"
  "JRN-CUST-05:maestro/flows/requires-fixture/JRN-CUST-05-rebook-tasker.yaml"
  "JRN-CUST-06:maestro/flows/requires-fixture/JRN-CUST-06-raise-&-track-dispute.yaml"
  "JRN-CUST-07:maestro/flows/requires-fixture/JRN-CUST-07-cancel-open-task.yaml"
  "JRN-INFRA-01:maestro/flows/requires-fixture/JRN-INFRA-01-error-recovery.yaml"
  "JRN-INFRA-02:maestro/flows/requires-fixture/JRN-INFRA-02-suspended-banned-account.yaml"
  "JRN-TASK-02:maestro/flows/requires-fixture/JRN-TASK-02-browse-&-apply-to-task.yaml"
  "JRN-TASK-04:maestro/flows/requires-fixture/JRN-TASK-04-manage-active-booking-tasker.yaml"
)

DEFERRED_FLOWS=(
  "JRN-SHARED-02:maestro/flows/deferred/JRN-SHARED-02-otp-migration.yaml"
  "JRN-SHARED-03:maestro/flows/deferred/JRN-SHARED-03-phase-2-otp-login-new-user.yaml"
  "JRN-CUST-03:maestro/flows/deferred/JRN-CUST-03-review-applicants-&-confirm-booking-phase-2-—-lead-unlock.yaml"
  "JRN-CUST-08:maestro/flows/deferred/JRN-CUST-08-instant-match-phase-3.yaml"
  "JRN-CUST-09:maestro/flows/deferred/JRN-CUST-09-purchase-task-boost-phase-2.yaml"
  "JRN-TASK-03:maestro/flows/deferred/JRN-TASK-03-lead-unlock-accept-decline-phase-2.yaml"
  "JRN-TASK-05:maestro/flows/deferred/JRN-TASK-05-credit-purchase.yaml"
  "JRN-TASK-06:maestro/flows/deferred/JRN-TASK-06-wallet-&-payout-phase-3.yaml"
  "JRN-TASK-07:maestro/flows/deferred/JRN-TASK-07-tasker-pro-subscription-phase-3.yaml"
  "JRN-TASK-08:maestro/flows/deferred/JRN-TASK-08-ai-profile-polish.yaml"
  "SCR-P2-001:maestro/flows/deferred/SCR-P2-001-credits-balance.yaml"
  "SCR-P2-003:maestro/flows/deferred/SCR-P2-003-credits-history.yaml"
  "SCR-P2-005:maestro/flows/deferred/SCR-P2-005-referrals.yaml"
  "SCR-P3-003:maestro/flows/deferred/SCR-P3-003-escrow-payment.yaml"
  "JRN-B2B-01:maestro/flows/deferred/JRN-B2B-01-create-business-account.yaml"
  "JRN-B2B-02:maestro/flows/deferred/JRN-B2B-02-post-task-as-business.yaml"
  "JRN-B2B-03:maestro/flows/deferred/JRN-B2B-03-manage-business-tasks.yaml"
  "JRN-B2B-04:maestro/flows/deferred/JRN-B2B-04-business-subscription-billing.yaml"
)

run_flow() {
  local id="${1%%:*}"
  local file="${1#*:}"
  local log="${RESULTS_DIR}/${id}.log"

  echo "Running $id..."
  if maestro test "${file}" > "$log" 2>&1; then
    echo "  PASS: $id"
    echo "PASS: $id" >> "${RESULTS_DIR}/summary.txt"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $id (see $log)"
    echo "FAIL: $id" >> "${RESULTS_DIR}/summary.txt"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Maestro Run: ${TIMESTAMP} ===" | tee "${RESULTS_DIR}/summary.txt"
echo "Scope: ${SCOPE}" | tee -a "${RESULTS_DIR}/summary.txt"

if [[ "$SCOPE" == "SMOKE" || "$SCOPE" == "ALL" ]]; then
  echo "--- Smoke Flows ---" | tee -a "${RESULTS_DIR}/summary.txt"
  for entry in "${SMOKE_FLOWS[@]}"; do
    run_flow "$entry"
  done
fi

if [[ "$SCOPE" == "ACTIVE" || "$SCOPE" == "ALL" ]]; then
  echo "--- Active Flows ---" | tee -a "${RESULTS_DIR}/summary.txt"
  for entry in "${ACTIVE_FLOWS[@]}"; do
    run_flow "$entry"
  done
fi

if [[ "$SCOPE" == "FIXTURE_REQUIRED" || "$SCOPE" == "ALL" ]]; then
  echo "--- Fixture Required Flows ---" | tee -a "${RESULTS_DIR}/summary.txt"
  for entry in "${FIXTURE_REQUIRED_FLOWS[@]}"; do
    run_flow "$entry"
  done
fi

if [[ "$SCOPE" == "DEFERRED" || "$SCOPE" == "ALL" ]]; then
  echo "--- Deferred Flows ---" | tee -a "${RESULTS_DIR}/summary.txt"
  for entry in "${DEFERRED_FLOWS[@]}"; do
    run_flow "$entry"
  done
fi

echo "" | tee -a "${RESULTS_DIR}/summary.txt"
echo "Results: PASS=${PASS} FAIL=${FAIL}" | tee -a "${RESULTS_DIR}/summary.txt"
echo "Logs: ${RESULTS_DIR}/"
