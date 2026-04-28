# Staging Data Setup

## Scope

Tasky no longer uses Flyway to seed private-sandbox data. The active database migration history is a schema-only
`V1__baseline.sql`; fresh local, test, private-staging, and future production databases start empty.

## Active-use rule

When checking docs against the active Phase 1 baseline:

- treat launch categories, launch booking flow, verification, reviews, disputes, and admin moderation as authoritative
- do not treat the presence or absence of local/private-sandbox rows as product scope evidence
- keep future-phase rows, toggles, and sample data out of Flyway

## Launch Catalog Setup

Launch category templates, intake schemas, district/reference rows, moderation policy rows, and feature-toggle rows are
operator/admin setup data. They may be created through admin tooling, deploy-time runbooks, or controlled private notes,
but they are not versioned migration seed data.

Runtime-safe defaults when rows are absent:

- `data_retention_dry_run` behaves as enabled
- planned or implemented deferred commerce toggles such as `platform_fee_enabled` and `recurring_cleaning_enabled` behave
  as disabled
- `escrow_enabled` behaves as disabled
- moderation policy reads use the built-in default policy, and policy updates create the singleton row if needed

## Sandbox Accounts

Customer and tasker smoke testing in the private sandbox depends on dev-auth-created identities. Admin testing still
requires controlled promotion of a sandbox user to `ADMIN`.

Keep sandbox identities and any sample-data import notes in secure operator notes, not in the repository.
