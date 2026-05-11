# Production Runbook

> Canonical ops reference for the Tasky Phase 1 production environment.
> Maintained by the on-call operator. Every section must be filled before launch.
> See `docs/maintenance/PRODUCTION_READINESS.md` for the readiness gate.

## Table of Contents

1. [Bootstrap](#1-bootstrap)
2. [Secret Injection](#2-secret-injection)
3. [Host Firewall](#3-host-firewall)
4. [SSH Hardening](#4-ssh-hardening)
5. [Encryption at Rest](#5-encryption-at-rest)
6. [Deploy Procedure](#6-deploy-procedure)
7. [Rollback Procedure](#7-rollback-procedure)
8. [Backup Verification + Offsite](#8-backup-verification--offsite)
9. [Restore Drill Evidence](#9-restore-drill-evidence)
10. [WAL Archive Retention](#10-wal-archive-retention)
11. [Blind-Index Key Rotation](#11-blind-index-key-rotation)
12. [JWT Secret Rotation](#12-jwt-secret-rotation)
13. [Encryption Key Rotation](#13-encryption-key-rotation)
14. [Per-Alert Runbook Entries](#14-per-alert-runbook-entries)
15. [On-Call / Paging](#15-on-call--paging)
16. [Incident Response (SEV-1/2/3)](#16-incident-response-sev-123)
17. [Capacity Sizing + Cost Model](#17-capacity-sizing--cost-model)
18. [Cutover Plan](#18-cutover-plan)
19. [Day-2 Plan](#19-day-2-plan)

---

## 1. Bootstrap

<!-- TODO (T6): VPS provisioning, Docker install, env setup -->

_TODO (T6)_

## 2. Secret Injection

<!-- TODO (T6): .env chmod, ownership -->

_TODO (T6)_

## 3. Host Firewall

<!-- TODO (T6): ufw/nftables rules -->

_TODO (T6)_

## 4. SSH Hardening

<!-- TODO (T6): SSH config, fail2ban -->

_TODO (T6)_

## 5. Encryption at Rest

<!-- TODO (T6): LUKS or provider-side attestation -->

_TODO (T6)_

## 6. Deploy Procedure

<!-- TODO (T13): deploy steps -->

_TODO (T13)_

## 7. Rollback Procedure

<!-- TODO (T13): rollback steps -->

_TODO (T13)_

## 8. Backup Verification + Offsite

### Schedule

The `backup-cron` service runs `docker/backup.sh` hourly inside the compose stack.

### Verification steps

1. Confirm the latest dump exists:

   ```bash
   ls -lh docker/backups/tasky-*.dump | tail -5
   ```

2. Verify the dump is restorable (dry-run restore):

   ```bash
   docker exec tasky-postgres pg_restore --list /path/to/latest.dump | head
   ```

3. Check the Prometheus metric:

   ```bash
   curl -s http://localhost:8080/actuator/prometheus | grep tasky_backup_last_success_unixtime
   ```

   If the value is `0`, no backup has succeeded. The `BackupStale` alert fires if no success is recorded within 2 hours.

### Offsite upload

Offsite upload uses an S3-compatible endpoint (any provider). Configure these env vars in `.env`:

```
OFFSITE_S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
OFFSITE_S3_BUCKET=tasky-production-backups
OFFSITE_S3_ACCESS_KEY=<key>
OFFSITE_S3_SECRET_KEY=<secret>
```

If any variable is unset, the script logs a warning and skips upload — the local dump still succeeds.

Upload path: `s3://<bucket>/<YYYYMMDDTHHMMSS>/tasky.dump`

### RPO / RTO

- **RPO** (Recovery Point Objective): ≤ 1 hour (hourly backup interval + WAL archiving)
- **RTO** (Recovery Time Objective): < 4 hours (restore from dump + replay WAL if needed)

## 9. Restore Drill Evidence

### Procedure (run quarterly or after infrastructure changes)

1. Identify the latest production backup:

   ```bash
   LATEST=$(ls -t docker/backups/tasky-*.dump | head -1)
   echo "Restoring from: $LATEST ($(du -h "$LATEST" | cut -f1))"
   ```

2. Create a temporary restore target (do NOT restore into production):

   ```bash
   docker exec -i tasky-postgres createdb -U tasky tasky_restore_test
   ```

3. Restore into the test database:

   ```bash
   docker exec -i tasky-postgres \
     pg_restore -U tasky -d tasky_restore_test --no-owner --no-privileges \
     < "$LATEST"
   ```

4. Verify row counts match expected ranges:

   ```bash
   docker exec tasky-postgres psql -U tasky -d tasky_restore_test -c \
     "SELECT 'users' AS table, count(*) FROM users UNION ALL
      SELECT 'tasks', count(*) FROM tasks UNION ALL
      SELECT 'bookings', count(*) FROM bookings UNION ALL
      SELECT 'messages', count(*) FROM messages;"
   ```

5. Clean up:

   ```bash
   docker exec -i tasky-postgres dropdb -U tasky tasky_restore_test
   ```

6. Record evidence in the table below.

### Evidence log

| Date         | Backup file                  | Rows verified        | Restore time | Operator | Notes                                   |
| ------------ | ---------------------------- | -------------------- | ------------ | -------- | --------------------------------------- |
| _YYYY-MM-DD_ | _tasky-YYYYMMDDTHHMMSS.dump_ | _users: N, tasks: N_ | _Xm Ys_      | _name_   | _e.g., "All tables present, no errors"_ |

## 10. WAL Archive Retention

### Configuration

WAL archiving is enabled in `docker-compose.production.yml` via Postgres parameters:

- `wal_level=replica`
- `archive_mode=on`
- `archive_command=test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f`

WAL files are stored in the `production_wal_archive` Docker volume.

### Prune policy

`docker/backup.sh` prunes WAL archive files older than **7 days** on every run (hourly).

Manual prune (if needed):

```bash
docker exec tasky-postgres \
  find /var/lib/postgresql/wal_archive -type f -mtime +7 -delete
```

### Monitoring

The `BackupStale` Prometheus alert indirectly monitors backup (and WAL prune) health. If backup runs stop, the alert fires within 2 hours.

## 11. Blind-Index Key Rotation

<!-- TODO (T6): dual-key rotation procedure -->

_TODO (T6)_

## 12. JWT Secret Rotation

<!-- TODO (T6): JWT secret rotation steps -->

_TODO (T6)_

## 13. Encryption Key Rotation

<!-- TODO (T6): encryption key rotation steps -->

_TODO (T6)_

## 14. Per-Alert Runbook Entries

<!-- TODO (T4): one entry per alert — diagnosis, causes, remediation -->

_TODO (T4)_

## 15. On-Call / Paging

<!-- TODO (T6): primary, backup, channel, test message procedure -->

_TODO (T6)_

## 16. Incident Response (SEV-1/2/3)

<!-- TODO (T13): SEV-1/2/3 procedures -->

_TODO (T13)_

## 17. Capacity Sizing + Cost Model

<!-- TODO (T6): VPS class, load envelope, monthly cost table -->

_TODO (T6)_

## 18. Cutover Plan

<!-- TODO (T13): DNS, store release, comms -->

_TODO (T13)_

## 19. Day-2 Plan

<!-- TODO (T13): first 48 h, escalation, rollback criteria -->

_TODO (T13)_
