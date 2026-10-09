#!/usr/bin/env bash
# Applies the credit/purchase migrations + 20261009120000 to a THROWAWAY local
# database and runs tests/sql/personal-locale.test.sql plus a two-session
# concurrency check. Never point at a shared or production database.
# Usage: PGHOST=/var/run/postgresql PGUSER=postgres bash tests/scripts/run-personal-locale-sql.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

DB="personal_locale_test_$$"
P=(psql -v ON_ERROR_STOP=1 -q)
MIGRATIONS=(
  20260907020100_credit_engine_tables.sql
  20260907020200_credit_engine_functions.sql
  20260907030000_beta_purchase_grants.sql
  20260922040000_credit_lots.sql
  20260922040100_credit_engine_lot_functions.sql
  20260922040200_us_memberships.sql
  20260922040300_us_membership_functions.sql
  20260922050000_kr_purchase_grants.sql
  20260922060000_kr_purchase_grants_provider_agnostic.sql
  20260926080000_fix_grant_credit_lot_ambiguous_balance.sql
  20260926090000_single_purchase_and_triple_one_year_expiry.sql
  20260922070000_account_deletion_entitlement_cleanup.sql
  20260922080000_paddle_webhooks_and_cancellation.sql
  20260923000000_paddle_webhook_idempotency_and_ordering.sql
  20260928000000_redeem_code_system.sql
  20260928120000_payment_manual_reviews.sql
  20261007120000_one_time_membership_toss_and_refunds.sql
  20261007130000_toss_guest_checkout.sql
  20261008090000_toss_guest_email_and_test_mode.sql
  20261009090000_guest_personal_access.sql
  20261009120000_personal_locale_reports_and_credit_locale.sql
)

cleanup() { "${P[@]}" -d postgres -c "drop database if exists $DB;" >/dev/null 2>&1 || true; }
trap cleanup EXIT

"${P[@]}" -d postgres -c "create database $DB;"
"${P[@]}" -d "$DB" -c "do \$\$ begin create role service_role; exception when duplicate_object then null; end \$\$;"
# Minimal stubs for tables outside the credit system.
"${P[@]}" -d "$DB" <<'SQL'
create extension if not exists pgcrypto;
create table public.relationship_reports(id uuid primary key default gen_random_uuid());
create table public.reports(id uuid primary key default gen_random_uuid(), clerk_user_id text, report_type text,
  birth_date date, birth_time text, birth_place text);
create table public.survey_responses(id uuid primary key default gen_random_uuid(), report_id uuid, answers jsonb);
create table public.report_analyses(
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  analysis_type text not null, content text not null, metadata jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint report_analyses_type_check check (analysis_type in ('basic','premium','integrated','relationship','detailed_survey','astrology','deep_essence_structured')),
  constraint report_analyses_report_type_unique unique (report_id, analysis_type));
SQL
for m in "${MIGRATIONS[@]}"; do
  "${P[@]}" -d "$DB" -f "supabase/migrations/$m" >/dev/null
done
# Re-running the new migration must be safe.
"${P[@]}" -d "$DB" -f supabase/migrations/20261009120000_personal_locale_reports_and_credit_locale.sql >/dev/null
"${P[@]}" -d "$DB" -f tests/sql/personal-locale.test.sql 2>&1 | sed -n 's/^psql:.*NOTICE:  //p'

# Concurrency: two sessions race for the last ko-KR credit -> exactly one wins.
"${P[@]}" -d "$DB" -c "select process_kr_purchase('u_race','kr_personal_premium','toss:race','toss:kr_personal_premium','KRW','toss');" >/dev/null
for i in 1 2 3 4; do
  psql -q -t -A -d "$DB" -c "select ok from reserve_credit('u_race','personal',null,null,'ko-KR',null,'cccccccc-0000-0000-0000-00000000000$i',true);" > "/tmp/race_$$_$i" &
done
wait
WINS=$(cat /tmp/race_$$_* | grep -c '^t$' || true)
rm -f /tmp/race_$$_*
LEFT=$(psql -q -t -A -d "$DB" -c "select sum(remaining) from credit_lots where clerk_user_id='u_race';")
if [ "$WINS" != "1" ] || [ "$LEFT" != "0" ]; then
  echo "FAIL - concurrent reserve: wins=$WINS remaining=$LEFT"; exit 1
fi
echo "ok - 4 concurrent reserves for 1 credit: exactly 1 succeeded, remaining 0"
echo "personal-locale.sql: all assertions passed"
