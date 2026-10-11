#!/usr/bin/env bash
# Throwaway local DB: minimal baseline tables + ownership + guest invite migrations.
set -euo pipefail
cd "$(dirname "$0")/../.."
DB="guest_invite_test_$$"
P=(psql -v ON_ERROR_STOP=1 -q)
cleanup() { "${P[@]}" -d postgres -c "drop database if exists $DB;" >/dev/null 2>&1 || true; }
trap cleanup EXIT
"${P[@]}" -d postgres -c "create database $DB;"
"${P[@]}" -d "$DB" <<'SQL'
do $$ begin create role service_role; exception when duplicate_object then null; end $$;
create extension if not exists pgcrypto;
create table public.reports(
  id uuid primary key default gen_random_uuid(), clerk_user_id text not null, name text,
  birth_date date, birth_time text, birth_place text, birth_latitude double precision,
  birth_longitude double precision, birth_timezone real,
  report_type text not null default 'self' constraint reports_report_type_check check (report_type in ('self','partner_manual')),
  created_at timestamptz not null default now());
create table public.invites(
  id uuid primary key default gen_random_uuid(), from_report_id uuid not null, invite_token text not null unique,
  status text not null default 'open' constraint invites_status_check check (status in ('open','complete')),
  accepted_report_id uuid, relationship_report_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.relationship_reports(
  id uuid primary key default gen_random_uuid(),
  report_id_a uuid not null references public.reports(id) on delete cascade,
  report_id_b uuid not null references public.reports(id) on delete cascade,
  analysis_type text, relationship_kind text, result_premium_by_kind jsonb);
create table public.survey_responses(id uuid primary key default gen_random_uuid(), report_id uuid references public.reports(id) on delete cascade, answers jsonb, created_at timestamptz default now());
SQL
"${P[@]}" -d "$DB" -f supabase/migrations/20260901120000_relationship_report_shares.sql >/dev/null
"${P[@]}" -d "$DB" -f supabase/migrations/20260907010000_relationship_premium_generation_locks.sql >/dev/null
"${P[@]}" -d "$DB" -f supabase/migrations/20261011090000_relationship_premium_ownership.sql >/dev/null
"${P[@]}" -d "$DB" -f supabase/migrations/20261011130000_guest_invite_participants.sql >/dev/null
"${P[@]}" -d "$DB" -f supabase/migrations/20261011130000_guest_invite_participants.sql >/dev/null # re-run safe
"${P[@]}" -d "$DB" -f tests/sql/guest-invite.test.sql 2>&1 | sed -n 's/^psql:.*NOTICE:  //p'
echo "guest-invite.sql: all assertions passed"
