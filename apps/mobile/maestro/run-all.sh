#!/bin/bash
# run-all.sh — Run all Maestro flows and capture output
# Usage: ./apps/mobile/maestro/run-all.sh [P0|P1|P2|ALL]
# Output: apps/mobile/maestro/results/<timestamp>/

set -euo pipefail

SCOPE="${1:-ALL}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_DIR="apps/mobile/maestro/results/${TIMESTAMP}"
FLOWS_DIR="apps/mobile/maestro/flows"
PASS=0
FAIL=0

mkdir -p "$RESULTS_DIR"

declare -A P0_FLOWS=(
  [JRN-SHARED-01]="JRN-SHARED-01-onboarding.yaml"
  [JRN-SHARED-03]="JRN-SHARED-03-phase-2-otp-login-new-user.yaml"
  [JRN-SHARED-07]="JRN-SHARED-07-review-submission.yaml"
  [JRN-CUST-02]="JRN-CUST-02-review-applicants-&-confirm-booking-phase-0-1.yaml"
  [JRN-CUST-04]="JRN-CUST-04-manage-active-booking.yaml"
  [JRN-CUST-05]="JRN-CUST-05-rebook-tasker.yaml"
  [JRN-CUST-07]="JRN-CUST-07-cancel-open-task.yaml"
  [JRN-CUST-08]="JRN-CUST-08-instant-match-phase-3.yaml"
  [JRN-TASK-03]="JRN-TASK-03-lead-unlock-accept-decline-phase-2.yaml"
  [JRN-TASK-04]="JRN-TASK-04-manage-active-booking-tasker.yaml"
  [JRN-TASK-05]="JRN-TASK-05-credit-purchase.yaml"
  [JRN-TASK-07]="JRN-TASK-07-tasker-pro-subscription-phase-3.yaml"
  [JRN-INFRA-02]="JRN-INFRA-02-suspended-banned-account.yaml"
)

declare -A P1_FLOWS=(
  [JRN-SHARED-04]="JRN-SHARED-04-messaging.yaml"
  [JRN-SHARED-05]="JRN-SHARED-05-profile-management.yaml"
  [JRN-SHARED-06]="JRN-SHARED-06-settings-&-account.yaml"
  [JRN-CUST-01]="JRN-CUST-01-post-a-task.yaml"
  [JRN-CUST-03]="JRN-CUST-03-review-applicants-&-confirm-booking-phase-2-—-lead-unlock.yaml"
  [JRN-CUST-06]="JRN-CUST-06-raise-&-track-dispute.yaml"
  [JRN-TASK-01]="JRN-TASK-01-tasker-verification.yaml"
  [JRN-TASK-02]="JRN-TASK-02-browse-&-apply-to-task.yaml"
  [JRN-TASK-06]="JRN-TASK-06-wallet-&-payout-phase-3.yaml"
  [JRN-TASK-08]="JRN-TASK-08-ai-profile-polish.yaml"
  [JRN-INFRA-01]="JRN-INFRA-01-error-recovery.yaml"
)

declare -A P2_FLOWS=(
  [SCR-SHARED-016]="SCR-SHARED-016-notification-center.yaml"
  [SCR-INFRA-004]="SCR-INFRA-004-terms-of-service.yaml"
  [SCR-TASK-016]="SCR-TASK-016-tasker-stats.yaml"
  [SCR-TASK-018]="SCR-TASK-018-privacy-policy.yaml"
  [SCR-P2-001]="SCR-P2-001-credits-balance.yaml"
  [SCR-P2-003]="SCR-P2-003-credits-history.yaml"
  [SCR-P2-005]="SCR-P2-005-referrals.yaml"
  [SCR-P3-003]="SCR-P3-003-escrow-payment.yaml"
)

run_flow() {
  local id="$1"
  local file="$2"
  local log="${RESULTS_DIR}/${id}.log"

  echo "Running $id..."
  if maestro test "${FLOWS_DIR}/${file}" > "$log" 2>&1; then
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

if [[ "$SCOPE" == "P0" || "$SCOPE" == "ALL" ]]; then
  echo "--- P0 Flows ---" | tee -a "${RESULTS_DIR}/summary.txt"
  for id in "${!P0_FLOWS[@]}"; do
    run_flow "$id" "${P0_FLOWS[$id]}"
  done
fi

if [[ "$SCOPE" == "P1" || "$SCOPE" == "ALL" ]]; then
  echo "--- P1 Flows ---" | tee -a "${RESULTS_DIR}/summary.txt"
  for id in "${!P1_FLOWS[@]}"; do
    run_flow "$id" "${P1_FLOWS[$id]}"
  done
fi

if [[ "$SCOPE" == "P2" || "$SCOPE" == "ALL" ]]; then
  echo "--- P2 Flows ---" | tee -a "${RESULTS_DIR}/summary.txt"
  for id in "${!P2_FLOWS[@]}"; do
    run_flow "$id" "${P2_FLOWS[$id]}"
  done
fi

echo "" | tee -a "${RESULTS_DIR}/summary.txt"
echo "Results: PASS=${PASS} FAIL=${FAIL}" | tee -a "${RESULTS_DIR}/summary.txt"
echo "Logs: ${RESULTS_DIR}/"
