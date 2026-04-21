#!/usr/bin/env bash
set -euo pipefail

# scan-backend-doc-drift.sh
#
# Scans backend architecture docs for banned stale terms that indicate doc drift.
# These terms reference retired mechanisms or incorrect column names that must not
# reappear in the canonical architecture documentation.
#
# Usage:
#   ./tooling/scripts/scan-backend-doc-drift.sh            # check for drift
#   ./tooling/scripts/scan-backend-doc-drift.sh --fix-hint  # show recommended fixes

fix_hint=false
if [[ "${1:-}" == "--fix-hint" ]]; then
  fix_hint=true
fi
files=(
  "docs/architecture/api.md"
  "docs/architecture/common.md"
)
while IFS= read -r -d '' f; do
  files+=("$f")
done < <(find services/api/src/main/java/mn/tasky -name "AGENTS.md" -print0 2>/dev/null || true)
banned_terms=(
  "DomainEventOutboxProcessor|retired — replaced by DomainEventOutboxService"
  "available_balance_mnt|wrong column — should be balance_mnt"
  "pending_balance_mnt|wrong column — should be held_balance_mnt"
  "wallet_id|wrong column in ledger_entries context — should be user_id"
)

total_files=0
total_hits=0

for file in "${files[@]}"; do
  if [[ ! -f "$file" ]]; then
    continue
  fi
  total_files=$((total_files + 1))

  for entry in "${banned_terms[@]}"; do
    pattern="${entry%%|*}"
    remediation="${entry#*|}"

    while IFS= read -r line_num; do
      if [[ -n "$line_num" ]]; then
        echo "${file}:${line_num}: banned term '${pattern}' found — ${remediation}"

        if $fix_hint; then
          case "$pattern" in
            DomainEventOutboxProcessor)
              echo "  fix: replace with DomainEventOutboxService"
              ;;
            available_balance_mnt)
              echo "  fix: replace with balance_mnt"
              ;;
            pending_balance_mnt)
              echo "  fix: replace with held_balance_mnt"
              ;;
            wallet_id)
              echo "  fix: replace with user_id in ledger_entries context"
              ;;
          esac
        fi

        total_hits=$((total_hits + 1))
      fi
    done < <(grep -n "$pattern" "$file" 2>/dev/null | awk -F: '{print $1}' || true)
  done
done

echo "Scanned ${total_files} files, found ${total_hits} banned terms"

if [[ $total_hits -gt 0 ]]; then
  exit 1
fi

exit 0
