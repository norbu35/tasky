# Tranche: Seed schema test data

**Status:** planned
**Priority:** high
**Depends on:** V18__booking_intents.sql (ensures categories + schema exist)

## Description
Insert a small, complete dataset directly through a Flyway migration so local/dev environments can rely on consistent 10-row samples for the main schema modules (identity, marketplace, bookings, wallet, conversations, support, analytics). The migration will loop over deterministic UUIDs, reference the seeded categories, and create users, profiles, tasks, bookings, wallets, ledger entries, payouts, conversations, messages, disputes, reviews, notifications, analytics events, payment intents, device tokens, and related rows in a single PL/pgSQL block so cross-table FK ordering stays intact.

## Done When
- The new `V19__seed_test_data.sql` migration exists, inserts 10 rows per targeted table, and guards against running twice.
- Local devs can run `./gradlew flywayMigrate` or `./gradlew test` without failing Flyway checks.
- Consumers can rely on the new sample rows for manual testing of each module mentioned above.
