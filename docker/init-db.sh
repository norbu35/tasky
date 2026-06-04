#!/bin/bash
# init-db.sh
# Runs once when the Postgres container initialises a fresh data volume.
# Creates a least-privilege application user (APP_DB_USER) separate from the
# superuser used for migrations.
#
# The superuser (POSTGRES_USER, default: tasky) owns the database and runs
# Flyway migrations. The app user only gets CONNECT + DML privileges.
#
# Requires APP_DB_USER and APP_DB_PASSWORD environment variables.
# Fallback defaults are safe for local development only.

set -euo pipefail

APP_DB_USER="${APP_DB_USER:-tasky_app}"
APP_DB_PASSWORD="${APP_DB_PASSWORD:-tasky_app}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  DO \$\$
  BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${APP_DB_USER}') THEN
          EXECUTE 'CREATE ROLE ${APP_DB_USER} LOGIN PASSWORD ''${APP_DB_PASSWORD}''';
      ELSE
          EXECUTE 'ALTER ROLE ${APP_DB_USER} WITH PASSWORD ''${APP_DB_PASSWORD}''';
      END IF;
  END
  \$\$;

  GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${APP_DB_USER};
  GRANT USAGE ON SCHEMA public TO ${APP_DB_USER};
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_DB_USER};
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT USAGE, SELECT ON SEQUENCES TO ${APP_DB_USER};
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_DB_USER};
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_DB_USER};
EOSQL
