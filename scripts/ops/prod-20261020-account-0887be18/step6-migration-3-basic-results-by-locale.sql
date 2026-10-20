-- =============================================================================
-- STEP 6 / migration 3 of 3 -- PRODUCTION copy of
--   supabase/migrations/20261020110000_relationship_basic_results_by_locale.sql
-- wrapped in ONE transaction: if any statement fails, nothing is applied.
-- Adds 2 new tables + 1 function. Changes no existing row
-- (relationship_reports.result_basic is not touched).
-- Run in Supabase SQL Editor of ahaitsme-prod (URL contains gncjslondpvysjaytagd).
-- Expected: "Success. No rows returned".  Undo: step6-undo-migration-3.sql
-- =============================================================================
begin;
set local lock_timeout = '5s';

create table if not exists public.relationship_basic_results (
  id uuid primary key default gen_random_uuid(),
  relationship_report_id uuid not null references public.relationship_reports (id) on delete cascade,
  locale text not null check (locale in ('ko-KR', 'en-US')),
  result jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (relationship_report_id, locale)
);

create table if not exists public.relationship_basic_result_history (
  id uuid primary key default gen_random_uuid(),
  relationship_report_id uuid not null references public.relationship_reports (id) on delete cascade,
  locale text not null,
  result jsonb not null,
  original_created_at timestamptz,
  archived_reason text not null,
  archived_at timestamptz not null default now()
);
create index if not exists relationship_basic_result_history_rr_idx
  on public.relationship_basic_result_history (relationship_report_id, locale, archived_at desc);

comment on table public.relationship_basic_results is
  'Free relationship result generated in a language other than relationship_reports.result_basic (the original, never rewritten). One row per relationship and language.';

alter table public.relationship_basic_results enable row level security;
alter table public.relationship_basic_result_history enable row level security;
revoke all on table public.relationship_basic_results from public;
revoke all on table public.relationship_basic_result_history from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.relationship_basic_results from anon';
    execute 'revoke all on table public.relationship_basic_result_history from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.relationship_basic_results from authenticated';
    execute 'revoke all on table public.relationship_basic_result_history from authenticated';
  end if;
end $$;
grant select, insert, update on table public.relationship_basic_results to service_role;
grant select, insert on table public.relationship_basic_result_history to service_role;

create or replace function public.save_relationship_basic_result(
  p_relationship_report_id uuid,
  p_locale text,
  p_result jsonb,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old relationship_basic_results;
begin
  if p_locale not in ('ko-KR', 'en-US') then
    raise exception 'invalid locale: %', p_locale;
  end if;
  select * into v_old from relationship_basic_results
   where relationship_report_id = p_relationship_report_id and locale = p_locale
   for update;
  if found then
    insert into relationship_basic_result_history (relationship_report_id, locale, result, original_created_at, archived_reason)
      values (v_old.relationship_report_id, v_old.locale, v_old.result, v_old.created_at, coalesce(nullif(p_reason, ''), 'replaced'));
    update relationship_basic_results set result = p_result, updated_at = now() where id = v_old.id;
  else
    insert into relationship_basic_results (relationship_report_id, locale, result)
      values (p_relationship_report_id, p_locale, p_result);
  end if;
  return true;
end;
$$;
revoke all on function public.save_relationship_basic_result(uuid, text, jsonb, text) from public;
grant execute on function public.save_relationship_basic_result(uuid, text, jsonb, text) to service_role;

commit;
