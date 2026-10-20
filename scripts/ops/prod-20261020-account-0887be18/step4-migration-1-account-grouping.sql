-- =============================================================================
-- STEP 4 / migration 1 of 3 -- PRODUCTION copy of
--   supabase/migrations/20261020090000_account_self_report_grouping.sql
-- wrapped in ONE transaction: if any statement fails, nothing is applied.
-- Adds objects only. Changes no existing row. Groups no account (that is a later step).
-- Copy the whole file into the Supabase SQL Editor and Run.
-- =============================================================================
begin;

-- =============================================================================
-- One account, several "self" reports -> one main report + grouped reports.
-- (docs: claude/2026-10-20 account integration design, decisions 1-3)
--
-- Nothing is moved or deleted. A grouped report keeps every row that points
-- at it (relationships, invites, links, reports, purchases); it only records
-- which report of the same account is the main one:
--
--   reports.merged_into_report_id  NULL  = stand-alone or main report
--                                  <id>  = grouped into that main report
--
-- The app then reads the person's own birth details and survey from the main
-- report everywhere (account screen, friend-add readiness, new analyses), and
-- shows the grouped reports' relationships together with the main report's.
--
-- Filling the main report (fill_main_report_from_grouped):
--   * birth details: only when the main report has none, and every grouped
--     report that has saved birth details holds the SAME date/time/place.
--     Conditional update (birth_date IS NULL); the birth-date correction
--     counter (birth_date_correction_used_at) is not touched -- integration
--     and restore are not a correction (decision 2).
--   * survey: only when the main report has no complete survey, and exactly
--     one distinct complete survey exists among the grouped reports. A NEW
--     survey_responses row is added (survey answers are append-only); nothing
--     is overwritten.
--   * different values -> nothing is filled; the person chooses in My Account.
--
-- Every change is logged in account_profile_events (no birth values or survey
-- answers in the log) so each step can be undone (ungroup / unfill).
-- Additive and re-runnable. Applying this file changes no existing row.
-- =============================================================================

-- 1) reports.merged_into_report_id ---------------------------------------------
alter table public.reports
  add column if not exists merged_into_report_id uuid
  references public.reports (id) on delete set null;

create index if not exists reports_merged_into_report_id_idx
  on public.reports (merged_into_report_id)
  where merged_into_report_id is not null;

comment on column public.reports.merged_into_report_id is
  'Self report grouped into the account''s main self report (same clerk_user_id). NULL = stand-alone or main. Rows pointing at a grouped report are kept as they are.';

-- Guard: only a self report can be grouped, only into a self report of the
-- SAME account, never into itself, and never in a chain (the main report is
-- never itself grouped, a report that has grouped reports is never grouped).
create or replace function public.reports_merged_into_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_target reports;
begin
  if new.merged_into_report_id is null then
    return new;
  end if;
  if new.merged_into_report_id = new.id then
    raise exception 'merged_into_self';
  end if;
  if new.report_type is distinct from 'self' then
    raise exception 'merged_into_requires_self_report';
  end if;
  select * into v_target from reports where id = new.merged_into_report_id;
  if not found then
    raise exception 'merged_into_target_missing';
  end if;
  if v_target.report_type is distinct from 'self' or v_target.clerk_user_id is distinct from new.clerk_user_id then
    raise exception 'merged_into_other_account_or_type';
  end if;
  if v_target.merged_into_report_id is not null then
    raise exception 'merged_into_chain';
  end if;
  if exists (select 1 from reports where merged_into_report_id = new.id) then
    raise exception 'merged_into_has_members';
  end if;
  return new;
end;
$$;

drop trigger if exists reports_merged_into_guard on public.reports;
create trigger reports_merged_into_guard
  before insert or update of merged_into_report_id, report_type, clerk_user_id on public.reports
  for each row execute function public.reports_merged_into_guard();

-- 2) report_birth_history -- previous birth details kept when the person picks
--    another saved value for the main report (never silently replaced).
create table if not exists public.report_birth_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  birth_date date,
  birth_time text,
  birth_place text,
  birth_latitude double precision,
  birth_longitude double precision,
  birth_timezone real,
  reason text not null,
  source_report_id uuid references public.reports (id) on delete set null,
  archived_at timestamptz not null default now()
);
create index if not exists report_birth_history_report_idx
  on public.report_birth_history (report_id, archived_at desc);

-- 3) account_profile_events -- what grouping/filling did (no personal values).
create table if not exists public.account_profile_events (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  event text not null check (event in (
    'grouped', 'ungrouped', 'birth_filled', 'birth_unfilled', 'survey_filled', 'survey_unfilled',
    'birth_chosen', 'survey_chosen'
  )),
  report_id uuid,
  source_report_id uuid,
  survey_response_id uuid,
  actor text not null default 'system' check (actor in ('system', 'user', 'ops')),
  created_at timestamptz not null default now()
);
create index if not exists account_profile_events_user_idx
  on public.account_profile_events (clerk_user_id, created_at desc);

alter table public.report_birth_history enable row level security;
alter table public.account_profile_events enable row level security;
revoke all on table public.report_birth_history from public;
revoke all on table public.account_profile_events from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.report_birth_history from anon';
    execute 'revoke all on table public.account_profile_events from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.report_birth_history from authenticated';
    execute 'revoke all on table public.account_profile_events from authenticated';
  end if;
end $$;
grant select, insert on table public.report_birth_history to service_role;
grant select, insert on table public.account_profile_events to service_role;

-- 4) Survey completeness, same rule as lib/v2/survey/dbCompletion.ts -------------
create or replace function public.survey_answers_complete(p_answers jsonb)
returns boolean
language sql
immutable
as $$
  select case
    when p_answers is null then false
    when jsonb_typeof(p_answers) = 'string' then public.survey_answers_complete((p_answers #>> '{}')::jsonb)
    when jsonb_typeof(p_answers) <> 'object' then false
    when p_answers ->> 'survey_source' = 'v2_10q' then true
    when jsonb_typeof(p_answers -> 'v2_profile') = 'object' then true
    else (
      select bool_and(upper(coalesce(p_answers ->> q, '')) in ('A', 'B', 'C', 'D'))
        from unnest(array['q1','q2','q3','q4','q5','q6','q7','q8','q9']) q
    ) and coalesce(p_answers ->> 'q10', '') in ('1', '2', '3', '4', '5')
  end;
$$;

create or replace function public.survey_answers_signature(p_answers jsonb)
returns text
language sql
immutable
as $$
  select case
    when p_answers is null then null
    when jsonb_typeof(p_answers) = 'string' then public.survey_answers_signature((p_answers #>> '{}')::jsonb)
    else concat_ws('|', upper(p_answers ->> 'q1'), upper(p_answers ->> 'q2'), upper(p_answers ->> 'q3'),
                   upper(p_answers ->> 'q4'), upper(p_answers ->> 'q5'), upper(p_answers ->> 'q6'),
                   upper(p_answers ->> 'q7'), upper(p_answers ->> 'q8'), upper(p_answers ->> 'q9'),
                   p_answers ->> 'q10')
  end;
$$;

-- 5) group_account_self_reports -------------------------------------------------
-- Groups every other stand-alone self report of the account into p_main.
-- p_apply = false -> lists what would change, changes nothing.
create or replace function public.group_account_self_reports(
  p_clerk_user_id text,
  p_main_report_id uuid,
  p_apply boolean,
  p_actor text default 'ops'
)
returns table(report_id uuid, action text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_main reports;
  r record;
begin
  -- Row locks only when applying (the dry run also works in a read-only transaction).
  if p_apply then
    select * into v_main from reports where id = p_main_report_id for update;
  else
    select * into v_main from reports where id = p_main_report_id;
  end if;
  if not found or v_main.clerk_user_id is distinct from p_clerk_user_id
     or v_main.report_type is distinct from 'self' then
    return query select p_main_report_id, 'main_not_owned_self'::text;
    return;
  end if;
  if v_main.merged_into_report_id is not null then
    return query select p_main_report_id, 'main_is_grouped'::text;
    return;
  end if;
  for r in
    select x.id from reports x
     where x.clerk_user_id = p_clerk_user_id and x.report_type = 'self'
       and x.id <> p_main_report_id and x.merged_into_report_id is null
       and not exists (select 1 from reports y where y.merged_into_report_id = x.id)
     order by x.created_at
  loop
    if p_apply then
      update reports set merged_into_report_id = p_main_report_id where id = r.id and merged_into_report_id is null;
      insert into account_profile_events (clerk_user_id, event, report_id, source_report_id, actor)
        values (p_clerk_user_id, 'grouped', r.id, p_main_report_id, p_actor);
    end if;
    return query select r.id, case when p_apply then 'grouped' else 'would_group' end;
  end loop;
end;
$$;

-- Undo: every grouped report of the account becomes stand-alone again.
create or replace function public.ungroup_account_self_reports(p_clerk_user_id text, p_actor text default 'ops')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer := 0;
  r record;
begin
  for r in select id, merged_into_report_id from reports
            where clerk_user_id = p_clerk_user_id and merged_into_report_id is not null for update
  loop
    update reports set merged_into_report_id = null where id = r.id;
    insert into account_profile_events (clerk_user_id, event, report_id, source_report_id, actor)
      values (p_clerk_user_id, 'ungrouped', r.id, r.merged_into_report_id, p_actor);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

-- 6) fill_main_report_from_grouped ----------------------------------------------
-- Fills ONLY empty fields of the main report from its grouped reports, when
-- the grouped reports agree. Returns one row per field: filled / already_set /
-- no_source / conflict (+ would_fill when p_apply = false).
create or replace function public.fill_main_report_from_grouped(
  p_main_report_id uuid,
  p_apply boolean,
  p_actor text default 'ops'
)
returns table(field text, result text, source_report_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_main reports;
  v_kinds integer;
  v_src reports;
  v_main_survey jsonb;
  v_survey_src uuid;
  v_survey_answers jsonb;
  v_new_survey uuid;
  v_updated integer;
begin
  if p_apply then
    select * into v_main from reports where id = p_main_report_id for update;
  else
    select * into v_main from reports where id = p_main_report_id;
  end if;
  if not found or v_main.report_type is distinct from 'self' or v_main.merged_into_report_id is not null then
    return query select 'all'::text, 'not_main'::text, null::uuid;
    return;
  end if;

  -- birth
  if v_main.birth_date is not null then
    return query select 'birth'::text, 'already_set'::text, null::uuid;
  else
    select count(distinct concat_ws('|', m.birth_date::text, nullif(trim(coalesce(m.birth_time, '')), ''),
                                    nullif(trim(coalesce(m.birth_place, '')), '')))
      into v_kinds
      from reports m
     where m.merged_into_report_id = p_main_report_id and m.clerk_user_id = v_main.clerk_user_id
       and m.report_type = 'self' and m.birth_date is not null;
    if v_kinds = 0 then
      return query select 'birth'::text, 'no_source'::text, null::uuid;
    elsif v_kinds > 1 then
      return query select 'birth'::text, 'conflict'::text, null::uuid;
    else
      select * into v_src from reports m
       where m.merged_into_report_id = p_main_report_id and m.clerk_user_id = v_main.clerk_user_id
         and m.report_type = 'self' and m.birth_date is not null
       order by m.created_at desc limit 1;
      if p_apply then
        update reports
           set birth_date = v_src.birth_date, birth_time = v_src.birth_time, birth_place = v_src.birth_place,
               birth_latitude = v_src.birth_latitude, birth_longitude = v_src.birth_longitude,
               birth_timezone = v_src.birth_timezone
         where id = p_main_report_id and birth_date is null;
        get diagnostics v_updated = row_count;
        if v_updated = 1 then
          insert into account_profile_events (clerk_user_id, event, report_id, source_report_id, actor)
            values (v_main.clerk_user_id, 'birth_filled', p_main_report_id, v_src.id, p_actor);
          return query select 'birth'::text, 'filled'::text, v_src.id;
        else
          return query select 'birth'::text, 'already_set'::text, null::uuid;
        end if;
      else
        return query select 'birth'::text, 'would_fill'::text, v_src.id;
      end if;
    end if;
  end if;

  -- survey
  select s.answers into v_main_survey from survey_responses s
   where s.report_id = p_main_report_id order by s.created_at desc, s.id desc limit 1;
  if public.survey_answers_complete(v_main_survey) then
    return query select 'survey'::text, 'already_set'::text, null::uuid;
    return;
  end if;
  with latest as (
    select distinct on (s.report_id) s.report_id, s.answers, s.created_at
      from survey_responses s
      join reports m on m.id = s.report_id
     where m.merged_into_report_id = p_main_report_id and m.clerk_user_id = v_main.clerk_user_id
       and m.report_type = 'self'
     order by s.report_id, s.created_at desc, s.id desc
  ), complete as (
    select * from latest where public.survey_answers_complete(answers)
  )
  select count(distinct public.survey_answers_signature(answers)) into v_kinds from complete;
  if v_kinds = 0 then
    return query select 'survey'::text, 'no_source'::text, null::uuid;
  elsif v_kinds > 1 then
    return query select 'survey'::text, 'conflict'::text, null::uuid;
  else
    select l.report_id, l.answers into v_survey_src, v_survey_answers
      from (
        select distinct on (s.report_id) s.report_id, s.answers, s.created_at
          from survey_responses s join reports m on m.id = s.report_id
         where m.merged_into_report_id = p_main_report_id and m.clerk_user_id = v_main.clerk_user_id
           and m.report_type = 'self'
         order by s.report_id, s.created_at desc, s.id desc
      ) l
     where public.survey_answers_complete(l.answers)
     order by l.created_at desc limit 1;
    if p_apply then
      insert into survey_responses (report_id, answers) values (p_main_report_id, v_survey_answers)
        returning id into v_new_survey;
      insert into account_profile_events (clerk_user_id, event, report_id, source_report_id, survey_response_id, actor)
        values (v_main.clerk_user_id, 'survey_filled', p_main_report_id, v_survey_src, v_new_survey, p_actor);
      return query select 'survey'::text, 'filled'::text, v_survey_src;
    else
      return query select 'survey'::text, 'would_fill'::text, v_survey_src;
    end if;
  end if;
end;
$$;

-- Undo a fill: clears the main report's birth details only if they still equal
-- the values copied from the source (an edit made since is kept), and removes
-- the survey row the fill added (survey_responses is otherwise append-only).
create or replace function public.unfill_main_report(p_main_report_id uuid, p_actor text default 'ops')
returns table(field text, result text)
language plpgsql
security definer
set search_path = public
as $$
declare
  e record;
  v_src reports;
  v_n integer;
begin
  for e in select * from account_profile_events
            where report_id = p_main_report_id and event in ('birth_filled', 'survey_filled')
            order by created_at desc
  loop
    if e.event = 'birth_filled' then
      select * into v_src from reports where id = e.source_report_id;
      update reports r set birth_date = null, birth_time = null, birth_place = null,
             birth_latitude = null, birth_longitude = null, birth_timezone = null
       where r.id = p_main_report_id
         and (r.birth_date, r.birth_time, r.birth_place) is not distinct from (v_src.birth_date, v_src.birth_time, v_src.birth_place);
      get diagnostics v_n = row_count;
      if v_n = 1 then
        insert into account_profile_events (clerk_user_id, event, report_id, source_report_id, actor)
          values (e.clerk_user_id, 'birth_unfilled', p_main_report_id, e.source_report_id, p_actor);
      end if;
      return query select 'birth'::text, case when v_n = 1 then 'unfilled' else 'kept_changed_since' end;
    else
      delete from survey_responses where id = e.survey_response_id;
      get diagnostics v_n = row_count;
      if v_n = 1 then
        insert into account_profile_events (clerk_user_id, event, report_id, source_report_id, survey_response_id, actor)
          values (e.clerk_user_id, 'survey_unfilled', p_main_report_id, e.source_report_id, e.survey_response_id, p_actor);
      end if;
      return query select 'survey'::text, case when v_n = 1 then 'unfilled' else 'already_gone' end;
    end if;
  end loop;
end;
$$;

revoke all on function public.group_account_self_reports(text, uuid, boolean, text) from public;
revoke all on function public.ungroup_account_self_reports(text, text) from public;
revoke all on function public.fill_main_report_from_grouped(uuid, boolean, text) from public;
revoke all on function public.unfill_main_report(uuid, text) from public;
grant execute on function public.group_account_self_reports(text, uuid, boolean, text) to service_role;
grant execute on function public.ungroup_account_self_reports(text, text) to service_role;
grant execute on function public.fill_main_report_from_grouped(uuid, boolean, text) to service_role;
grant execute on function public.unfill_main_report(uuid, text) to service_role;

commit;
