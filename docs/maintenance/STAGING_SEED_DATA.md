# Staging Seed Data

## Scope

This document describes what the repository actually seeds today and how those seeds are used in the current private VPS
staging sandbox.

## Seeded Reference Data

### Categories

`V2__seed_categories.sql` seeds 12 active categories:

| Sort | English            | Mongolian               |
| ---- | ------------------ | ----------------------- |
| 1    | Cleaning           | Цэвэрлэгээ              |
| 2    | Plumbing           | Сантехник               |
| 3    | Electrical         | Цахилгааны засвар       |
| 4    | Moving & Hauling   | Зөөвөрлөлт              |
| 5    | Heating & HVAC     | Халаалт, агааржуулалт   |
| 6    | Painting           | Будаг, ханын цаас       |
| 7    | Furniture Assembly | Тавилга угсралт         |
| 8    | Appliance Repair   | Гэр ахуйн техник засвар |
| 9    | Handyman           | Гар ажил                |
| 10   | Carpentry & Doors  | Мужааны ажил            |
| 11   | Flooring & Tiling  | Шал, хавтангийн ажил    |
| 12   | Delivery & Errands | Хүргэлт, туслах ажил    |

### Intake schemas

`V11__seed_intake_schemas.sql` activates version `1` intake schemas for exactly three launch categories:

| Category         | Activated | Key prompts                                                      |
| ---------------- | --------- | ---------------------------------------------------------------- |
| Cleaning         | Yes       | property type, number of rooms, cleaning type, supplies provided |
| Moving & Hauling | Yes       | moving scope, origin access, destination access, heavy lifting   |
| Handyman         | Yes       | type of work, special tools needed, estimated hours              |

All other categories are seeded as active categories, but they do not receive an activated intake schema from this
migration.

## Deterministic Sample Dataset

`V19__seed_test_data.sql` creates deterministic sample rows for local/dev-style dataset coverage:

| Table family               | Seed shape                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Users and profiles         | 10 users total: 5 customers and 5 taskers, all `ACTIVE`, with profile names `Customer 1..5` and `Tasker 6..10` |
| Wallets                    | 1 wallet per seeded user                                                                                       |
| Tasks                      | 10 sample tasks across seeded categories                                                                       |
| Task photos                | 1 photo row per sample task                                                                                    |
| Applications               | 1 application per sample task                                                                                  |
| Bookings                   | 10 bookings cycling through `ASSIGNED`, `PAID`, `COMPLETED`, `CANCELLED`                                       |
| Conversations and messages | 1 conversation and 1 message per sample booking/task pair                                                      |
| Disputes                   | 10 disputes cycling through `OPEN`, `ESCALATED`, `RESOLVED_TASKER`, `RESOLVED_CUSTOMER`                        |
| Reviews                    | 1 booking review per sample booking                                                                            |
| Ledger entries             | 1 deposit-style ledger row per seeded user                                                                     |
| Payout requests            | 10 rows cycling through `PENDING`, `PROCESSED`, `REJECTED`                                                     |
| Notification log           | 10 rows across `EMAIL`, `SMS`, `PUSH` and `SENT`/`FAILED`                                                      |
| Analytics events           | 10 sample analytics events                                                                                     |
| Payment intents            | 10 sample payment intent rows                                                                                  |
| Device tokens              | 1 device token per seeded user                                                                                 |

This dataset is useful for:

- admin list/detail surfaces
- pagination checks
- API shape validation
- browsing non-empty staging screens

## Seed Data Limitations

The current seeds are not enough for a release-grade staging rehearsal.

### Seeded users are not login-ready

`V19__seed_test_data.sql` inserts users with:

- `phone = NULL`
- `phone_blind_idx = NULL`
- no `facebook_id`

That means the seeded users are data fixtures, not usable sign-in identities.

### No seeded admin account exists

There is no confirmed migration or bootstrap script that creates a login-ready `ADMIN` user. Admin access must still be
provisioned manually.

### Dev-login does not solve admin identities

`POST /api/v1/auth/dev/login` only accepts `CUSTOMER` and `TASKER`. In the current private VPS sandbox that is
acceptable and intentional, but it still does not solve admin bootstrapping.

## Private Sandbox Accounts

The private VPS sandbox can use dev-auth-created smoke identities for customer and tasker flows.

| Account                | Provisioning path                                          | Purpose                                                                     |
| ---------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| Customer smoke account | `POST /api/v1/auth/dev/login` with role `CUSTOMER`         | Post task, message, review, dispute                                         |
| Tasker smoke account   | `POST /api/v1/auth/dev/login` with role `TASKER`           | Browse feed, apply, booking participation, review                           |
| Admin smoke account    | Create any user first, then manual DB promotion to `ADMIN` | Verification queue, category management, toggles, disputes, user moderation |

Operational rule:

- Keep the identifiers for these smoke accounts in secure operator notes or the environment management system, not in
  repository files.

## Future Release-Staging Accounts

When release-grade staging exists, this account posture must change:

- customer and tasker accounts should be real Facebook-authenticated identities
- dev-auth should be off
- admin still needs either a proper bootstrap path or a controlled provisioning workflow

## Manual Admin Promotion

Current posture:

- There is no runtime admin bootstrap endpoint.
- The repository exposes only a DAO-level role update, not a public operator flow.

Sandbox workaround:

```sql
UPDATE users
SET role = 'ADMIN',
    updated_at = now()
WHERE id = '<sandbox-admin-user-id>';
```

Treat this as an explicit operational step and record it in the rehearsal evidence.

## How To Use Seeds In Staging

Use the data in two distinct ways:

1. Use seeded categories and sample rows to verify that admin/read-heavy surfaces are non-empty and structurally sound.
2. Use dev-auth-created customer/tasker accounts for private sandbox flow smoke.
3. Use a manually promoted admin account for admin smoke.

Do not confuse those two purposes. The seeded dataset is broad enough for browsing and contract checks, but not for
authenticating a customer, tasker, or admin through the real production-like login path.
