#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Docker cron wrapper for Unegui.mn scraper.
#
# First-time setup:
#   1. Build the image (do this once, and after any code/dep changes):
#        docker build -t unegui-scraper:latest /home/norbu/scripts/unegui-scraper
#
#   2. Install the cron job (daily at 03:00):
#        crontab -e
#        0 3 * * * /home/norbu/scripts/unegui-scraper/docker-run-cron.sh
#
# Security model:
#   - Container runs as root; the container IS the sandbox
#   - All Linux capabilities dropped (--cap-drop=ALL)
#   - No privilege escalation (--security-opt no-new-privileges)
#   - Read-only root filesystem; only /tmp and the data volume are writable
#   - Ephemeral container (--rm): destroyed the moment the scrape finishes
#   - No inbound ports exposed
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE="unegui-scraper:latest"
DATA_DIR="$SCRIPT_DIR/data/unegui"
LOG_DIR="$DATA_DIR/logs"

mkdir -p "$DATA_DIR" "$LOG_DIR"
LOGFILE="$LOG_DIR/scrape_$(date +%Y%m%d_%H%M%S).log"

# Fail fast if the image has not been built yet.
if ! docker image inspect "$IMAGE" &>/dev/null; then
    echo "ERROR: Docker image '$IMAGE' not found." >&2
    echo "Build it first: docker build -t $IMAGE $SCRIPT_DIR" >&2
    exit 1
fi

docker run --rm \
    --init \
    --name "unegui-scraper-$(date +%s)" \
    \
    `# --- Security hardening ---` \
    --cap-drop=ALL \
    --cap-add DAC_OVERRIDE \
    --security-opt no-new-privileges \
    \
    `# --- Read-only filesystem; /tmp needed for Python temp files ---` \
    --read-only \
    --tmpfs /tmp:rw,nosuid,size=256m \
    \
    `# --- Resource caps to protect the VPS ---` \
    --memory=1g \
    --memory-swap=1g \
    --cpus=1.0 \
    \
    `# --- Only the output directory is writable on the host ---` \
    --volume "$DATA_DIR":/data:rw \
    \
    "$IMAGE" \
        --categories cleaning,moving,plumbing,electrical,painting,construction \
        --location ulaanbaatar \
        --max-pages 5 \
        --output /data \
        --mode incremental \
        --fetch-phones \
    2>&1 | tee "$LOGFILE"

# Retain last 30 days of logs
find "$LOG_DIR" -name "scrape_*.log" -mtime +30 -delete
