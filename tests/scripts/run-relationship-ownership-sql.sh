#!/usr/bin/env bash
# Applies the share/lock/credit migrations + 20261011090000 to a THROWAWAY
# local database and runs tests/sql/relationship-premium-ownership.test.sql.
# Usage: PGHOST=/var/run/postgresql PGUSER=postgres bash tests/scripts/run-relationship-ownership-sql.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB="rel_ownership_test_$$"
P=(psql -v ON_ERROR_STOP=1 -q)
CREDIT=(
  20260907020100_credit_engine_tables.sql 20260907020200_credit_engine_functions.sql
  20260907030000_beta_purchase_grants.sql 20260922040000_credit_lots.sql
  20260922040100_credit_engine_lot_functions.sql 20260922040200_us_memberships.sql
  20260922040300_us_membership_functions.sql 20260922050000_kr_purchase_grants.sql
  20260922060000_kr_purchase_grants_provider_agnostic.sql 20260926080000_fix_grant_credit_lot_ambiguous_balance.sql
  20260926090000_single_purchase_and_triple_one_year_expiry.sql
)
cleanup() { "${P[@]}" -d postgres -c "drop database if exists $DB;" >/dev/null 2>&1 || true; }
trap cleanup EXIT
"${P[@]}" -d postgres -c "create database $DB;"
"${P[@]}" -d "$DB" <<'SQL'
do $$ begin create role service_role; exception when duplicate_object then null; end $$;
create extension if not exists pgcrypto;
create table public.reports(id uuid primary key default gen_random_uuid(), clerk_user_id text, name text);
create table public.relationship_reports(
  id uuid primary key default gen_random_uuid(),
  report_id_a uuid not null references public.reports(id) on delete cascade,
  report_id_b uuid not null references public.reports(id) on delete cascade,
  analysis_type text, relationship_kind text, result_premium_by_kind jsonb);
SQL
"${P[@]}" -d "$DB" -f supabase/migrations/20260901120000_relationship_report_shares.sql >/dev/null
"${P[@]}" -d "$DB" -f supabase/migrations/20260907010000_relationship_premium_generation_locks.sql >/dev/null
"${P[@]}" -d "$DB" -f supabase/migrations/20260907020000_add_current_request_id_to_generation_locks.sql >/dev/null
for m in "${CREDIT[@]}"; do "${P[@]}" -d "$DB" -f "supabase/migrations/$m" >/dev/null; done
# Pre-existing (legacy) share row BEFORE the migration: must survive unchanged.
"${P[@]}" -d "$DB" <<'SQL'
insert into reports(id, clerk_user_id) values ('11111111-0000-0000-0000-000000000001','old_a'),('11111111-0000-0000-0000-000000000002','old_b');
insert into relationship_reports(id, report_id_a, report_id_b, analysis_type, result_premium_by_kind)
  values ('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002','premium','{"work":{"byLocale":{"ko-KR":{"format":"old"}}}}');
insert into relationship_report_shares(relationship_report_id, kind, owner_report_id, recipient_report_id, share_token, status)
  values ('22222222-0000-0000-0000-000000000001','work','11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002','legacy_tok','active');
SQL
"${P[@]}" -d "$DB" -f supabase/migrations/20261011090000_relationship_premium_ownership.sql >/dev/null
"${P[@]}" -d "$DB" -f supabase/migrations/20261011090000_relationship_premium_ownership.sql >/dev/null  # re-run safe
LEG=$(psql -q -t -A -d "$DB" -c "select status||'|'||coalesce(premium_report_id::text,'null')||'|'||owner_report_id from relationship_report_shares where share_token='legacy_tok';")
[ "$LEG" = "active|null|11111111-0000-0000-0000-000000000001" ] || { echo "FAIL legacy share changed: $LEG"; exit 1; }
echo "ok - existing share row unchanged by the migration (still active, no report link, same owner)"
"${P[@]}" -d "$DB" -f tests/sql/relationship-premium-ownership.test.sql 2>&1 | sed -n 's/^psql:.*NOTICE:  //p'
echo "relationship-premium-ownership.sql: all assertions passed"
