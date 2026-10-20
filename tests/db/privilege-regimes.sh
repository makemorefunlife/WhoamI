#!/usr/bin/env bash
# DEV ONLY: checks that the objects added by the account-integration
# migrations end up with the SAME access rights whatever the database's
# default privileges are -- i.e. that every grant/revoke is written in the
# migrations, not inherited from the platform:
#
#   legacy  = Supabase before 2026-10-30: new public tables/functions/sequences
#             are auto-granted to anon, authenticated, service_role
#   explicit= Supabase from 2026-10-30 (new projects, Preview branches,
#             `supabase db reset`): nothing is auto-granted
#
# Each regime builds a throwaway local database from supabase/migrations
# (baseline 20260714140000 onward) and prints, per object and role, the
# privileges the role actually has. The two outputs must be identical and
# match the expected rights (see EXPECTED below). Never points at a hosted DB.
#
#   PGHOST=/tmp PGPORT=54329 PGUSER=postgres bash tests/db/privilege-regimes.sh
set -euo pipefail
: "${PGHOST:?set PGHOST}" "${PGPORT:?set PGPORT}" "${PGUSER:?set PGUSER}"
case "$PGHOST" in /*|localhost|127.0.0.1) ;; *) echo "refusing non-local PGHOST"; exit 1 ;; esac

TABLES="account_profile_events report_birth_history relationship_basic_results relationship_basic_result_history"
FUNCS="reports_merged_into_guard survey_answers_complete survey_answers_signature group_account_self_reports ungroup_account_self_reports fill_main_report_from_grouped unfill_main_report gift_personal_coupons_set_scope tester_personal_codes_require_scope credit_lots_set_locale grant_credit_lot_scoped reserve_credit save_relationship_basic_result"

report() {
  local db="$1"
  psql -At -d "$db" <<SQL
select 'table ' || c.relname || ' rls=' || c.relrowsecurity || ' ' || r.rolname || '=' ||
       concat_ws(',',
         case when has_table_privilege(r.rolname, c.oid, 'select') then 'select' end,
         case when has_table_privilege(r.rolname, c.oid, 'insert') then 'insert' end,
         case when has_table_privilege(r.rolname, c.oid, 'update') then 'update' end,
         case when has_table_privilege(r.rolname, c.oid, 'delete') then 'delete' end,
         case when has_table_privilege(r.rolname, c.oid, 'truncate') then 'truncate' end)
  from pg_class c cross join (values ('anon'), ('authenticated'), ('service_role')) r(rolname)
 where c.relnamespace = 'public'::regnamespace and c.relname = any (string_to_array('$TABLES', ' '))
union all
select 'function ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') ' || r.rolname || '=' ||
       case when has_function_privilege(r.rolname, p.oid, 'execute') then 'execute' else '' end
  from pg_proc p cross join (values ('anon'), ('authenticated'), ('service_role')) r(rolname)
 where p.pronamespace = 'public'::regnamespace and p.proname = any (string_to_array('$FUNCS', ' '))
order by 1;
SQL
}

build() {
  local db="$1" regime="$2"
  psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $db" -c "create database $db"
  for r in anon authenticated service_role; do
    psql -q -d postgres -tc "select 1 from pg_roles where rolname='$r'" | grep -q 1 || psql -q -d postgres -c "create role $r"
  done
  if [ "$regime" = legacy ]; then
    psql -v ON_ERROR_STOP=1 -q -d "$db" -c "
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
      alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;"
  else
    psql -v ON_ERROR_STOP=1 -q -d "$db" -c "
      alter default privileges in schema public revoke all on tables from anon, authenticated, service_role;
      alter default privileges in schema public revoke all on functions from anon, authenticated, service_role;
      alter default privileges in schema public revoke all on sequences from anon, authenticated, service_role;"
  fi
  for f in $(ls supabase/migrations/*.sql | awk '$0 >= "supabase/migrations/20260714140000"'); do
    psql -v ON_ERROR_STOP=1 -q -d "$db" -f "$f" >/dev/null 2>&1 || { echo "migration failed ($regime): $f"; exit 1; }
  done
}

DB_A="aha_priv_legacy_$$"; DB_B="aha_priv_explicit_$$"
trap 'psql -q -d postgres -c "drop database if exists $DB_A" -c "drop database if exists $DB_B" >/dev/null 2>&1 || true' EXIT
build "$DB_A" legacy;   report "$DB_A" > /tmp/priv_legacy_$$.txt
build "$DB_B" explicit; report "$DB_B" > /tmp/priv_explicit_$$.txt

# Expected: tables -> RLS on, no anon/authenticated access, service_role only
# what the app needs; functions -> no anon/authenticated execute; RPCs the
# server calls -> service_role execute.
fail=0
if ! diff -u /tmp/priv_legacy_$$.txt /tmp/priv_explicit_$$.txt; then
  echo "FAILED - access rights differ between legacy and explicit default privileges"; fail=1
else
  echo "ok - same access rights with legacy and explicit default privileges"
fi
if grep -E "^(table|function) .* (anon|authenticated)=.+" /tmp/priv_explicit_$$.txt; then
  echo "FAILED - anon/authenticated can reach an account-integration object"; fail=1
else
  echo "ok - anon/authenticated reach none of the account-integration objects"
fi
if grep -E "^table .* rls=false" /tmp/priv_explicit_$$.txt; then echo "FAILED - RLS off"; fail=1; else echo "ok - RLS on for every new table"; fi
for t in "account_profile_events rls=true service_role=select,insert" \
         "report_birth_history rls=true service_role=select,insert" \
         "relationship_basic_results rls=true service_role=select,insert,update" \
         "relationship_basic_result_history rls=true service_role=select,insert"; do
  grep -q "^table $t\$" /tmp/priv_explicit_$$.txt && echo "ok - table ${t%% *}: ${t#* }" || { echo "FAILED - table ${t%% *} expected ${t#* }"; fail=1; }
done
for f in group_account_self_reports ungroup_account_self_reports fill_main_report_from_grouped unfill_main_report \
         grant_credit_lot_scoped reserve_credit save_relationship_basic_result; do
  grep -q "^function $f(.*) service_role=execute$" /tmp/priv_explicit_$$.txt && echo "ok - service_role can execute $f" || { echo "FAILED - service_role cannot execute $f"; fail=1; }
done
echo "--- explicit regime"; cat /tmp/priv_explicit_$$.txt
rm -f /tmp/priv_legacy_$$.txt /tmp/priv_explicit_$$.txt
exit $fail
