-- init-db.sql
-- Runs once when the Postgres container initialises a fresh data volume.
-- Creates a least-privilege application user (tasky_app) separate from the
-- superuser used for migrations.

-- The superuser (POSTGRES_USER, default: tasky) owns the database and runs
-- Flyway migrations. The app user only gets CONNECT + DML privileges.

\set app_user tasky_app
\set app_password `echo ${TASKY_APP_PASSWORD:-tasky_app}`

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tasky_app') THEN
        EXECUTE format('CREATE ROLE tasky_app LOGIN PASSWORD %L', :'app_password');
    END IF;
END
$$;

-- Allow connections to the tasky database
GRANT CONNECT ON DATABASE tasky TO tasky_app;

-- Schema-level privileges (applied after Flyway creates tables)
-- Re-run safe: GRANT is idempotent
GRANT USAGE ON SCHEMA public TO tasky_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tasky_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO tasky_app;

-- Grant on any tables that already exist
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tasky_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tasky_app;
