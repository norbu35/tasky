# Seed schema test data Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `tooling/agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Populate 10 sample rows per module across the core schema so local/dev backends can rely on consistent test data without manual inserts.

**Architecture:** A single Flyway migration (`V19__seed_test_data.sql`) executes a PL/pgSQL block that loops over deterministic UUIDs, arranges users into customer/tasker cohorts, references existing categories, and creates related rows in the right FK order (users → wallets → tasks → bookings → conversations/messages → support/analytics artifacts).

**Tech Stack:** PostgreSQL, Flyway migrations, PL/pgSQL DO blocks.

---

### Task 1: Add the sample-data migration

**Files:**
- Create: `services/api/src/main/resources/db/migration/V19__seed_test_data.sql`

**Step 1: Write the insertion block**
- Draft the PL/pgSQL DO block that ensures categories exist, guards against prior runs, and appends 10 rows into each target table while capturing the required UUID arrays (users, tasks, bookings, conversations, etc.).

**Step 2: Run migrations locally**
- Run: `./gradlew flywayMigrate`
- Expected: Existing migrations finish and `V19__seed_test_data.sql` applies without constraint failures; the Flyway log shows the new version marked success.

**Step 3: Verify sample counts**
- Run SQL queries such as `SELECT COUNT(*) FROM tasks WHERE description LIKE 'Sample%'` and `SELECT COUNT(*) FROM bookings WHERE price > 0` against the same DB, or re-run `./gradlew test` if easier; expect 10 rows per seeded table and no FK errors.

**Step 4: Ensure roll-forward readability**
- Inspect the migration file for clarity (in-line comments that explain the loops and guard) so reviewers can follow how the data relates to the seeded categories and wallets. No command necessary.

**Step 5: Commit the changes**
- Run: `git status`, `git add docs/plans/2026-04-03-test-data-seed-design.md docs/plans/2026-04-03-test-data-seed-plan.md services/api/src/main/resources/db/migration/V19__seed_test_data.sql`
- Commit message: `feat(db): add seeded schema test data`
