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

<!-- TODO (T3): backup check, offsite upload procedure -->

_TODO (T3)_

## 9. Restore Drill Evidence

<!-- TODO (T3): restore drill template and evidence log -->

_TODO (T3)_

## 10. WAL Archive Retention

<!-- TODO (T3): WAL prune policy -->

_TODO (T3)_

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
