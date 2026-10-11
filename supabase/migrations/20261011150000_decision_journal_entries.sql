-- =============================================================================
-- Decision Journal: account-based server storage (IA v2 stage 5, 2026-10-11).
--
-- Until now entries lived only in the browser (localStorage
-- "ahaitsme_decisions_<reportId>"). From now on a signed-in account's entries
-- are stored here; device entries are moved in WITHOUT duplicates:
--   * the entry id created on the device is kept as the primary key, so the
--     same entry imported twice (two tabs, two devices, a retry) is one row;
--   * an id that already exists is never overwritten (insert ... on conflict
--     do nothing), so a device copy can't replace a newer server copy, and
--     an entry of another account is never touched;
--   * the device copy is NOT deleted (the browser keeps its records).
-- The 20-entry free allowance (unlimited while a 30-day pass / membership is
-- active) is counted here for NEW entries; moved-in entries are always kept.
-- Service-role only (API routes check the Clerk session). Additive.
-- =============================================================================

create table if not exists public.decision_journal_entries (
  id uuid primary key,
  clerk_user_id text not null,
  category text not null,
  context text not null check (char_length(context) <= 2000),
  situation text check (situation is null or char_length(situation) <= 4000),
  decision text check (decision is null or char_length(decision) <= 2000),
  feeling text check (feeling is null or char_length(feeling) <= 2000),
  review_date date,
  status text not null default 'pending' check (status in ('pending', 'reviewed')),
  rating smallint check (rating is null or rating between 1 and 5),
  note text not null default '' check (char_length(note) <= 4000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 'device' when moved in from a browser's local records
  imported_from text check (imported_from is null or imported_from in ('device')),
  imported_at timestamptz
);

create index if not exists decision_journal_entries_by_user
  on public.decision_journal_entries (clerk_user_id, updated_at desc);

alter table public.decision_journal_entries enable row level security;
revoke all on table public.decision_journal_entries from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.decision_journal_entries from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.decision_journal_entries from authenticated';
  end if;
end $$;
grant select, insert, update on table public.decision_journal_entries to service_role;

comment on table public.decision_journal_entries is
  'Decision Journal entries per account (Clerk user). Device entries are moved in by id without duplicates and never overwrite an existing row. Service-role only.';

-- New entry with the free allowance checked atomically (per account lock).
--   result: created | cap_reached | exists
create or replace function public.create_decision_journal_entry(
  p_clerk_user_id text,
  p_entry jsonb,
  p_cap integer,
  p_unlimited boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := (p_entry->>'id')::uuid;
begin
  perform pg_advisory_xact_lock(hashtext('decision_journal:' || p_clerk_user_id));
  if exists (select 1 from decision_journal_entries where id = v_id) then
    return 'exists';
  end if;
  if not coalesce(p_unlimited, false)
     and (select count(*) from decision_journal_entries where clerk_user_id = p_clerk_user_id) >= p_cap then
    return 'cap_reached';
  end if;
  insert into decision_journal_entries (
    id, clerk_user_id, category, context, situation, decision, feeling, review_date, status, created_at, updated_at
  ) values (
    v_id, p_clerk_user_id, p_entry->>'category', p_entry->>'context', p_entry->>'situation',
    p_entry->>'decision', p_entry->>'feeling', nullif(p_entry->>'review_date', '')::date, 'pending', now(), now()
  );
  return 'created';
end;
$$;

-- Moves device entries in. Returns how many rows were new.
create or replace function public.import_decision_journal_entries(
  p_clerk_user_id text,
  p_entries jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e jsonb;
  v_n integer := 0;
  v_k integer;
begin
  perform pg_advisory_xact_lock(hashtext('decision_journal:' || p_clerk_user_id));
  for v_e in select * from jsonb_array_elements(coalesce(p_entries, '[]'::jsonb)) loop
    insert into decision_journal_entries (
      id, clerk_user_id, category, context, situation, decision, feeling, review_date,
      status, rating, note, reviewed_at, created_at, updated_at, imported_from, imported_at
    ) values (
      (v_e->>'id')::uuid, p_clerk_user_id, v_e->>'category', v_e->>'context', v_e->>'situation',
      v_e->>'decision', v_e->>'feeling', nullif(v_e->>'review_date', '')::date,
      case when v_e->>'status' = 'reviewed' and (v_e->>'rating') is not null then 'reviewed' else 'pending' end,
      case when v_e->>'status' = 'reviewed' then nullif(v_e->>'rating', '')::smallint else null end,
      coalesce(v_e->>'note', ''),
      case when v_e->>'status' = 'reviewed' then nullif(v_e->>'reviewed_at', '')::timestamptz else null end,
      coalesce(nullif(v_e->>'created_at', '')::timestamptz, now()),
      coalesce(nullif(v_e->>'updated_at', '')::timestamptz, now()),
      'device', now()
    )
    on conflict (id) do nothing;
    get diagnostics v_k = row_count;
    v_n := v_n + v_k;
  end loop;
  return v_n;
end;
$$;

revoke all on function public.create_decision_journal_entry(text, jsonb, integer, boolean) from public;
revoke all on function public.import_decision_journal_entries(text, jsonb) from public;
grant execute on function public.create_decision_journal_entry(text, jsonb, integer, boolean) to service_role;
grant execute on function public.import_decision_journal_entries(text, jsonb) to service_role;
