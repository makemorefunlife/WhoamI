#!/usr/bin/env bash
# DEV ONLY: runs the tests/db/*.db.test.mts files against a throwaway local
# PostgreSQL database built from supabase/migrations (baseline 20260714140000
# onward). Never points at a hosted database.
#
#   PGHOST=/tmp PGPORT=54329 PGUSER=postgres AHA_PG_MODULE=/path/to/node_modules/pg \
#     bash tests/db/run-db-tests.sh [test-file ...]
set -euo pipefail
DB="aha_dbtest_$$"
: "${PGHOST:?set PGHOST}" "${PGPORT:?set PGPORT}" "${PGUSER:?set PGUSER}" "${AHA_PG_MODULE:?set AHA_PG_MODULE}"
case "$PGHOST" in /*|localhost|127.0.0.1) ;; *) echo "refusing non-local PGHOST"; exit 1 ;; esac
psql -v ON_ERROR_STOP=1 -q -d postgres -c "create database $DB"
trap 'psql -q -d postgres -c "drop database if exists $DB" >/dev/null 2>&1 || true' EXIT
for r in anon authenticated service_role; do
  psql -q -d postgres -tc "select 1 from pg_roles where rolname='$r'" | grep -q 1 || psql -q -d postgres -c "create role $r"
done
for f in $(ls supabase/migrations/*.sql | awk '$0 >= "supabase/migrations/20260714140000"'); do
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f" >/dev/null 2>&1 || { echo "migration failed: $f"; psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f"; exit 1; }
done
export AHA_TEST_DATABASE_URL="postgresql://$PGUSER@localhost/$DB?host=$PGHOST&port=$PGPORT"
for sqlt in tests/sql/*.test.sql; do
  [ $# -gt 0 ] && break
  echo "== $sqlt"
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$sqlt" 2>&1 | grep -E "ok -|FAILED|ERROR" | sed 's/^psql:[^ ]* //' || true
done
files=("$@")
[ ${#files[@]} -eq 0 ] && files=(tests/db/*.db.test.mts)
for t in "${files[@]}"; do
  echo "== $t"
  npx tsx "$t"
done
