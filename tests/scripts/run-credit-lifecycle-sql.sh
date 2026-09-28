#!/usr/bin/env bash
# Applies the credit/purchase migrations to a THROWAWAY local database and
# runs tests/sql/credit-lifecycle.test.sql against the real SQL functions.
#
# Usage: PGHOST=/tmp PGPORT=5432 PGUSER=postgres bash tests/scripts/run-credit-lifecycle-sql.sh
# Needs a local Postgres you can create databases on. Never point at prod.
set -euo pipefail
cd "$(dirname "$0")/../.."

DB="credit_lifecycle_test_$$"
P=(psql -v ON_ERROR_STOP=1 -q)
MIGRATIONS=(
  20260907020100_credit_engine_tables.sql
  20260907020200_credit_engine_functions.sql
  20260922040000_credit_lots.sql
  20260922040100_credit_engine_lot_functions.sql
  20260922040200_us_memberships.sql
  20260922040300_us_membership_functions.sql
  20260922050000_kr_purchase_grants.sql
  20260922060000_kr_purchase_grants_provider_agnostic.sql
  20260926080000_fix_grant_credit_lot_ambiguous_balance.sql
  20260926090000_single_purchase_and_triple_one_year_expiry.sql
  20260928120000_payment_manual_reviews.sql
)

cleanup() { "${P[@]}" -d postgres -c "drop database if exists $DB;" >/dev/null 2>&1 || true; }
trap cleanup EXIT

"${P[@]}" -d postgres -c "create database $DB;"
"${P[@]}" -d "$DB" -c "do \$\$ begin create role service_role; exception when duplicate_object then null; end \$\$;"
# Minimal stub for the one FK target outside the credit system.
"${P[@]}" -d "$DB" -c "create extension if not exists pgcrypto; create table public.relationship_reports(id uuid primary key default gen_random_uuid());"
for m in "${MIGRATIONS[@]}"; do
  "${P[@]}" -d "$DB" -f "supabase/migrations/$m" >/dev/null
done
"${P[@]}" -d "$DB" -f tests/sql/credit-lifecycle.test.sql 2>&1 | sed -n 's/^psql:.*NOTICE:  //p'
echo "credit-lifecycle.sql: all assertions passed"
