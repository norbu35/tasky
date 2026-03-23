#!/usr/bin/env bash
# ============================================================================
# docker/backup.sh — PostgreSQL logical backup for Tasky
#
# Usage:
#   ./docker/backup.sh                       # backup to docker/backups/
#   BACKUP_DIR=/mnt/backups ./docker/backup.sh  # custom output directory
#
# Restore:
#   docker exec -i tasky-postgres \
'`
#     pg_restore -U tasky -d tasky --clean --if-exists < backup-file.dump
#
#   Or for plain-SQL format:
#   docker exec -i tasky-postgres \
#     psql -U tasky -d tasky < backup-file.sql
#
# RPO / RTO targets (informational):
#   Dev / Staging:  RPO 1 hour  (scheduled cron), RTO < 30 min
#   Production:     RPO 5 min   (WAL archiving + this script), RTO < 30 min
# ============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/backups}"
TIMESTAMP="$(date +%Y%m%dT%H%M%S)"
DUMP_FILE="${BACKUP_DIR}/tasky-${TIMESTAMP}.dump"

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-tasky-postgres}"
POSTGRES_USER="${POSTGRES_USER:-tasky}"
POSTGRES_DB="${POSTGRES_DB:-tasky}"

mkdir -p "$BACKUP_DIR"

echo "==> Starting backup of '${POSTGRES_DB}' from container '${POSTGRES_CONTAINER}' ..."

docker exec "$POSTGRES_CONTAINER" \
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --clean --if-exists \
    > "$DUMP_FILE"

DUMP_SIZE="$(du -h "$DUMP_FILE" | cut -f1)"
echo "==> Backup complete: ${DUMP_FILE} (${DUMP_SIZE})"

# Prune backups older than 7 days
find "$BACKUP_DIR" -name 'tasky-*.dump' -mtime +7 -delete 2>/dev/null || true
echo "==> Pruned backups older than 7 days."
