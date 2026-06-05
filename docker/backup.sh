#!/usr/bin/env bash
# ============================================================================
# docker/backup.sh — PostgreSQL logical backup for Tasky
#
# Usage:
#   ./docker/backup.sh                          # backup to docker/backups/
#   ./docker/backup.sh --dry-run                # dry-run mode (no dump, no upload)
#   BACKUP_DIR=/mnt/backups ./docker/backup.sh  # custom output directory
#
# Offsite upload (optional):
#   Set OFFSITE_S3_ENDPOINT, OFFSITE_S3_BUCKET,
#   OFFSITE_S3_ACCESS_KEY, OFFSITE_S3_SECRET_KEY.
#   If any are unset, a warning is logged and upload is skipped.
#
# Restore:
#   docker exec -i tasky-postgres \
#     pg_restore -U tasky -d tasky --clean --if-exists < backup-file.dump
#
# WAL archive pruning:
#   WAL files older than 7 days under the WAL archive volume are pruned.
#
# Prometheus metric:
#   On success, writes current unix timestamp to BACKUP_METRIC_FILE
#   (default: /backups/.backup_success_timestamp). Export this file via
#   the node_exporter textfile collector or app actuator.
#
# RPO / RTO targets:
#   Production:  RPO ≤ 1 h (hourly cron), RTO < 4 h
# ============================================================================
set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "==> DRY-RUN MODE — no dump will be written."
fi

BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/backups}"
TIMESTAMP="$(date +%Y%m%dT%H%M%S)"
DUMP_FILE="${BACKUP_DIR}/tasky-${TIMESTAMP}.dump"
METRIC_FILE="${BACKUP_DIR}/.backup_success_timestamp"

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-tasky-postgres}"
POSTGRES_USER="${POSTGRES_USER:-tasky}"
POSTGRES_DB="${POSTGRES_DB:-tasky}"

# Offsite S3 configuration
OFFSITE_S3_ENDPOINT="${OFFSITE_S3_ENDPOINT:-}"
OFFSITE_S3_BUCKET="${OFFSITE_S3_BUCKET:-}"
OFFSITE_S3_ACCESS_KEY="${OFFSITE_S3_ACCESS_KEY:-}"
OFFSITE_S3_SECRET_KEY="${OFFSITE_S3_SECRET_KEY:-}"

mkdir -p "$BACKUP_DIR"

# --- Local dump ---
echo "==> Starting backup of '${POSTGRES_DB}' from container '${POSTGRES_CONTAINER}' ..."

if [[ "$DRY_RUN" == "true" ]]; then
    echo "==> [dry-run] Would run: docker exec $POSTGRES_CONTAINER pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -Fc --clean --if-exists"
    echo "==> [dry-run] Local dump skipped."
else
    if command -v docker &>/dev/null; then
        docker exec "$POSTGRES_CONTAINER" \
            pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --clean --if-exists \
            >"$DUMP_FILE"
    else
        echo "==> Docker not found. Running pg_dump directly against postgres host..."
        PGPASSWORD="${PGPASSWORD:-}" pg_dump -h "${POSTGRES_HOST:-postgres}" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --clean --if-exists \
            >"$DUMP_FILE"
    fi

    DUMP_SIZE="$(du -h "$DUMP_FILE" | cut -f1)"
    echo "==> Backup complete: ${DUMP_FILE} (${DUMP_SIZE})"

    # Prune local backups older than 7 days
    find "$BACKUP_DIR" -name 'tasky-*.dump' -mtime +7 -delete 2>/dev/null || true
    echo "==> Pruned local backups older than 7 days."
fi

# --- Offsite upload ---
if [[ -n "$OFFSITE_S3_ENDPOINT" && -n "$OFFSITE_S3_BUCKET" &&
    -n "$OFFSITE_S3_ACCESS_KEY" && -n "$OFFSITE_S3_SECRET_KEY" ]]; then
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "==> [dry-run] Would upload ${DUMP_FILE} to s3://${OFFSITE_S3_BUCKET}/${TIMESTAMP}/tasky.dump"
    else
        echo "==> Uploading to offsite storage ..."
        if command -v mc &>/dev/null; then
            mc alias set offsite "$OFFSITE_S3_ENDPOINT" "$OFFSITE_S3_ACCESS_KEY" "$OFFSITE_S3_SECRET_KEY" 2>/dev/null || true
            mc cp "$DUMP_FILE" "offsite/${OFFSITE_S3_BUCKET}/${TIMESTAMP}/tasky.dump" &&
                echo "==> Offsite upload complete." ||
                echo "==> WARNING: Offsite upload failed." >&2
        elif command -v aws &>/dev/null; then
            AWS_ACCESS_KEY_ID="$OFFSITE_S3_ACCESS_KEY" \
                AWS_SECRET_ACCESS_KEY="$OFFSITE_S3_SECRET_KEY" \
                aws s3 cp "$DUMP_FILE" "s3://${OFFSITE_S3_BUCKET}/${TIMESTAMP}/tasky.dump" \
                --endpoint-url "$OFFSITE_S3_ENDPOINT" &&
                echo "==> Offsite upload complete." ||
                echo "==> WARNING: Offsite upload failed." >&2
        else
            echo "==> WARNING: Neither mc nor aws CLI found — skipping offsite upload." >&2
        fi
    fi
else
    echo "==> WARNING: Offsite backup vars not set — skipping offsite upload." \
        "Set OFFSITE_S3_ENDPOINT, OFFSITE_S3_BUCKET, OFFSITE_S3_ACCESS_KEY, OFFSITE_S3_SECRET_KEY."
fi

# --- WAL archive pruning ---
WAL_ARCHIVE_DIR="${WAL_ARCHIVE_DIR:-/var/lib/postgresql/wal_archive}"
if [[ "$DRY_RUN" == "true" ]]; then
    echo "==> [dry-run] Would prune WAL files older than 7 days in ${WAL_ARCHIVE_DIR}"
else
    if command -v docker &>/dev/null; then
        docker exec "$POSTGRES_CONTAINER" \
            find "$WAL_ARCHIVE_DIR" -name '*.partial' -o -type f -mtime +7 -delete 2>/dev/null || true
    else
        echo "==> Docker not found. Pruning WAL archive locally..."
        find "$WAL_ARCHIVE_DIR" -name '*.partial' -o -type f -mtime +7 -delete 2>/dev/null || true
    fi
    echo "==> Pruned WAL archive files older than 7 days."
fi

# --- Prometheus metric ---
if [[ "$DRY_RUN" != "true" ]]; then
    date +%s >"$METRIC_FILE"
    echo "==> Backup metric written to ${METRIC_FILE}"
fi

echo "==> Done."
