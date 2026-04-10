#!/usr/bin/env bash
set -euo pipefail

# E2E means Maestro. No fallback to component tests.
if ! command -v maestro >/dev/null 2>&1; then
  echo "ERROR: Maestro CLI is required for E2E tests." >&2
  echo "Install: https://maestro.mobile.dev/getting-started/installing-maestro" >&2
  exit 1
fi

ACTIVE_FLOWS=(
  "maestro/flows/smoke.yaml"
  "maestro/flows/JRN-SHARED-01-onboarding.yaml"
  "maestro/flows/JRN-SHARED-05-profile-management.yaml"
  "maestro/flows/JRN-SHARED-06-settings-&-account.yaml"
  "maestro/flows/JRN-TASK-01-tasker-verification.yaml"
  "maestro/flows/JRN-CUST-01-post-a-task.yaml"
  "maestro/flows/SCR-SHARED-016-notification-center.yaml"
  "maestro/flows/SCR-TASK-016-tasker-stats.yaml"
  "maestro/flows/SCR-INFRA-004-terms-of-service.yaml"
  "maestro/flows/SCR-TASK-018-privacy-policy.yaml"
  "maestro/flows/tasker-browse.yaml"
)

for flow in "${ACTIVE_FLOWS[@]}"; do
  echo "Running Maestro flow: ${flow}"
  maestro test "${flow}"
done
