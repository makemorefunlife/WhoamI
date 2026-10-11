-- =============================================================================
-- DEV ONLY -- ahaitsme-dev (alcknxpemdjytwvnschq). Do NOT run on production.
-- Applies supabase/migrations/20261011090000_relationship_premium_ownership.sql:
-- per-creator relationship deep reports, share rows linked to one report,
-- generation lock per creator. Additive, re-runnable. Existing reports
-- (result_premium_by_kind) and existing share rows are NOT changed.
-- Run DEV_CHECK_20261011_RELATIONSHIP_OWNERSHIP_STATE.sql before and after.
-- =============================================================================
begin;
do $$
begin
  if to_regclass('public.relationship_reports') is null
     or to_regclass('public.relationship_report_shares') is null
     or to_regclass('public.relationship_premium_generation_locks') is null then
    raise exception 'STOP: relationship tables missing -- wrong database?';
  end if;
end $$;
-- 1) Per-creator reports -----------------------------------------------------
create table if not exists public.relationship_premium_reports (
  id uuid primary key default gen_random_uuid(),
  relationship_report_id uuid not null references public.relationship_reports (id) on delete cascade,
  -- The creator's own participant report (verified owned + participant at generation).
  owner_report_id uuid not null references public.reports (id) on delete cascade,
  owner_clerk_user_id text not null,
  kind text not null check (kind in ('romantic', 'work', 'cohabitation', 'friendship', 'family')),
  locale text not null check (locale in ('ko-KR', 'en-US')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists relationship_premium_reports_slot_key
  on public.relationship_premium_reports (relationship_report_id, owner_report_id, kind, locale);
create index if not exists relationship_premium_reports_owner_idx
  on public.relationship_premium_reports (owner_report_id, relationship_report_id);

create table if not exists public.relationship_premium_report_history (
  id uuid primary key default gen_random_uuid(),
  premium_report_id uuid not null references public.relationship_premium_reports (id) on delete cascade,
  payload jsonb not null,
  original_updated_at timestamptz,
  archived_reason text not null,
  archived_at timestamptz not null default now()
);
create index if not exists relationship_premium_report_history_idx
  on public.relationship_premium_report_history (premium_report_id, archived_at desc);

alter table public.relationship_premium_reports enable row level security;
alter table public.relationship_premium_report_history enable row level security;
revoke all on table public.relationship_premium_reports from public;
revoke all on table public.relationship_premium_report_history from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.relationship_premium_reports, public.relationship_premium_report_history from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.relationship_premium_reports, public.relationship_premium_report_history from authenticated';
  end if;
end $$;
grant select, insert, update on table public.relationship_premium_reports to service_role;
grant select, insert on table public.relationship_premium_report_history to service_role;

comment on table public.relationship_premium_reports is
  'Relationship deep report per (relationship, creator report, kind, locale). Service-role API only. Visible to the creator; to the other participant only via an active relationship_report_shares row whose premium_report_id = id.';

-- Saves the creator's report for one slot. An existing payload is archived
-- first (same transaction), so a regenerate never silently loses a report.
create or replace function public.save_relationship_premium_report(
  p_relationship_report_id uuid,
  p_owner_report_id uuid,
  p_owner_clerk_user_id text,
  p_kind text,
  p_locale text,
  p_payload jsonb,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old relationship_premium_reports;
  v_id uuid;
begin
  if p_owner_clerk_user_id is null or p_owner_clerk_user_id = '' then
    raise exception 'owner required';
  end if;
  if not exists (
    select 1 from relationship_reports rr
     where rr.id = p_relationship_report_id
       and (rr.report_id_a = p_owner_report_id or rr.report_id_b = p_owner_report_id)
  ) then
    raise exception 'owner report is not a participant';
  end if;
  if not exists (
    select 1 from reports r where r.id = p_owner_report_id and r.clerk_user_id = p_owner_clerk_user_id
  ) then
    raise exception 'owner report not owned by caller';
  end if;

  select * into v_old from relationship_premium_reports
   where relationship_report_id = p_relationship_report_id
     and owner_report_id = p_owner_report_id
     and kind = p_kind and locale = p_locale
   for update;

  if found then
    insert into relationship_premium_report_history (premium_report_id, payload, original_updated_at, archived_reason)
      values (v_old.id, v_old.payload, v_old.updated_at, coalesce(nullif(p_reason, ''), 'replaced'));
    update relationship_premium_reports
       set payload = p_payload, updated_at = now()
     where id = v_old.id;
    v_id := v_old.id;
  else
    insert into relationship_premium_reports (
      relationship_report_id, owner_report_id, owner_clerk_user_id, kind, locale, payload
    ) values (
      p_relationship_report_id, p_owner_report_id, p_owner_clerk_user_id, p_kind, p_locale, p_payload
    ) returning id into v_id;
  end if;
  return v_id;
end;
$$;
revoke all on function public.save_relationship_premium_report(uuid, uuid, text, text, text, jsonb, text) from public;
grant execute on function public.save_relationship_premium_report(uuid, uuid, text, text, text, jsonb, text) to service_role;

-- 2) Existing share table: link a share to one report -------------------------
alter table public.relationship_report_shares
  add column if not exists premium_report_id uuid
    references public.relationship_premium_reports (id) on delete cascade;

-- The old "one active share per (relationship, kind)" rule stays for legacy
-- rows only; a linked share is unique per report, so both participants can
-- each share their own report of the same kind.
drop index if exists public.relationship_report_shares_active_unique;
create unique index if not exists relationship_report_shares_active_unique_legacy
  on public.relationship_report_shares (relationship_report_id, kind)
  where status = 'active' and premium_report_id is null;
create unique index if not exists relationship_report_shares_active_unique_report
  on public.relationship_report_shares (premium_report_id)
  where status = 'active' and premium_report_id is not null;
create index if not exists relationship_report_shares_by_report
  on public.relationship_report_shares (premium_report_id, status);

comment on column public.relationship_report_shares.premium_report_id is
  'The exact relationship_premium_reports row this share opens. NULL = share created before 2026-10-11 (legacy, report creator unknown).';

-- 3) Generation lock: one in-flight slot per creator -------------------------
-- Each participant generates their own report, so two participants of the
-- same relationship/kind/locale no longer block each other.
drop index if exists public.relationship_premium_generation_locks_key;
create unique index if not exists relationship_premium_generation_locks_owner_key
  on public.relationship_premium_generation_locks (relationship_report_id, requested_by_report_id, kind, locale);
commit;

-- Verification (expected: true, true, true, true)
select
  to_regclass('public.relationship_premium_reports') is not null as has_premium_reports,
  exists (select 1 from information_schema.columns where table_schema='public'
           and table_name='relationship_report_shares' and column_name='premium_report_id') as shares_have_report_link,
  to_regprocedure('public.save_relationship_premium_report(uuid,uuid,text,text,text,jsonb,text)') is not null as has_save_fn,
  exists (select 1 from pg_indexes where indexname = 'relationship_premium_generation_locks_owner_key') as lock_per_creator;
