#!/usr/bin/env bash
# Throwaway local DB: Decision Journal server storage migration.
set -euo pipefail
cd "$(dirname "$0")/../.."
DB="decision_journal_test_$$"
P=(psql -v ON_ERROR_STOP=1 -q)
cleanup() { "${P[@]}" -d postgres -c "drop database if exists $DB;" >/dev/null 2>&1 || true; }
trap cleanup EXIT
"${P[@]}" -d postgres -c "create database $DB;"
"${P[@]}" -d "$DB" -c "do \$\$ begin create role service_role; exception when duplicate_object then null; end \$\$;"
"${P[@]}" -d "$DB" -f supabase/migrations/20261011150000_decision_journal_entries.sql >/dev/null
"${P[@]}" -d "$DB" -f supabase/migrations/20261011150000_decision_journal_entries.sql >/dev/null 2>&1 # re-run safe
"${P[@]}" -d "$DB" -f tests/sql/decision-journal.test.sql 2>&1 | sed -n -e 's/^psql:.*NOTICE:  \(ok - .*\)/\1/p' -e '/ERROR/,$p'
echo "decision-journal.sql: all assertions passed"
