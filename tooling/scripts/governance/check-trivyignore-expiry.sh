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
  if [[ "$line" =~ ^[A-Za-z]+-[0-9-]+[[:space:]]+#.*expires:[[:space:]]*([0-9]{4}-[0-9]{2}-[0-9]{2}) ]]; then
    EXPIRY="${BASH_REMATCH[1]}"
    CVE_ID=$(echo "$line" | awk '{print $1}')
    if [[ "$TODAY" > "$EXPIRY" || "$TODAY" == "$EXPIRY" ]]; then
      echo "EXPIRED: $CVE_ID (was due $EXPIRY)"
      EXPIRED=$((EXPIRED + 1))
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
