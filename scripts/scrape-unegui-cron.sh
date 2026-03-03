#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Cron wrapper for Unegui.mn scraper — runs incremental scrape daily.
#
# Setup:
#   1. pip install -r requirements.txt
#   2. chmod +x scripts/scrape-unegui-cron.sh
#   3. Add cron entry (daily at 3 AM):
#        0 3 * * * /absolute/path/to/tasky/scripts/scrape-unegui-cron.sh
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../data/unegui/logs"
mkdir -p "$LOG_DIR"
LOGFILE="$LOG_DIR/scrape_$(date +%Y%m%d_%H%M%S).log"

python3 "$SCRIPT_DIR/scrape-unegui.py" \
  --categories cleaning,moving,plumbing,electrical,painting,construction \
  --location ulaanbaatar \
  --max-pages 5 \
  --output "$SCRIPT_DIR/../data/unegui/" \
  --mode incremental \
  --fetch-phones \
  2>&1 | tee "$LOGFILE"

# Retain last 30 days of logs
find "$LOG_DIR" -name "scrape_*.log" -mtime +30 -delete
