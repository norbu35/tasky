#!/usr/bin/env bash
# ============================================================================
# docker/restore.sh — PostgreSQL logical restore for Tasky
#
# Usage:
#   ./docker/restore.sh <backup-file>
#
# The backup file must be a pg_dump custom-format (.dump) file produced by
# docker/backup.sh, or a plain-SQL file (.sql).
#
# Examples:
#   ./docker/restore.sh docker/backups/tasky-20260328T120000.dump
#   POSTGRES_CONTAINER=my-postgres ./docker/restore.sh /mnt/backups/tasky-latest.dump
#
# Requires a running Postgres container. Existing data will be dropped and
# replaced by the backup contents (--clean --if-exists).
#
# RPO / RTO targets (informational):
#   Dev / Staging:  RTO < 30 min
#   Production:     RTO < 4 h  (start from latest WAL archive + this script)
# ============================================================================
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file>" >&2
  exit 1
fi

DUMP_FILE="$1"

if [[ ! -f "${DUMP_FILE}" ]]; then
  echo "Restore failed: backup file not found: ${DUMP_FILE}" >&2
  exit 1
fi

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-tasky-postgres}"
POSTGRES_USER="${POSTGRES_USER:-tasky}"
POSTGRES_DB="${POSTGRES_DB:-tasky}"

echo "==> Restoring '${POSTGRES_DB}' from '${DUMP_FILE}' into container '${POSTGRES_CONTAINER}' ..."

# Detect format: custom (.dump) or plain SQL
if [[ "${DUMP_FILE}" == *.dump ]]; then
  docker exec -i "${POSTGRES_CONTAINER}" \
    pg_restore -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
    --clean --if-exists --no-owner --no-privileges \
    < "${DUMP_FILE}"
else
  docker exec -i "${POSTGRES_CONTAINER}" \
    psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
    < "${DUMP_FILE}"
fi

echo "==> Restore complete."
