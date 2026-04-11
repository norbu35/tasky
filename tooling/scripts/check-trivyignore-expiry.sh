#!/usr/bin/env bash
set -euo pipefail

TRIVYIGNORE="${1:-.trivyignore}"
TODAY=$(date +%Y-%m-%d)
EXPIRED=0

if [ ! -f "$TRIVYIGNORE" ]; then
  echo "No .trivyignore found — nothing to check."
  exit 0
fi

while IFS= read -r line; do
  if [[ "$line" =~ ^#\ Expires:\ ([0-9]{4}-[0-9]{2}-[0-9]{2}) ]]; then
    EXPIRY="${BASH_REMATCH[1]}"
    if [[ "$TODAY" > "$EXPIRY" || "$TODAY" == "$EXPIRY" ]]; then
      # Read the next non-comment, non-empty line (the CVE ID)
      while IFS= read -r cve_line; do
        cve_line=$(echo "$cve_line" | xargs)
        if [[ -n "$cve_line" && ! "$cve_line" =~ ^# ]]; then
          echo "EXPIRED: $cve_line (was due $EXPIRY)"
          EXPIRED=$((EXPIRED + 1))
          break
        fi
      done
    fi
  fi
done < "$TRIVYIGNORE"

if [ "$EXPIRED" -gt 0 ]; then
  echo ""
  echo "ERROR: $EXPIRED .trivyignore entries have expired."
  echo "Fix the underlying CVEs and remove them, or extend the expiry date with justification."
  exit 1
fi

echo ".trivyignore expiry check passed."
