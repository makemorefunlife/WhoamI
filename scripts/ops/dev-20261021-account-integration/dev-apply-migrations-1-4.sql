-- =============================================================================
-- DEV ONLY (alcknxpemdjytwvnschq) -- account-integration migrations 1~4 in ONE
-- transaction: 20261020090000, 20261020100000, 20261020110000, 20261021090000
-- (same files as PROD). Adds objects and rights only; changes no existing row.
-- Run in the Supabase SQL Editor of the DEV project only
-- (URL contains alcknxpemdjytwvnschq). Expected: "Success. No rows returned".
-- =============================================================================
begin;
set local lock_timeout = '5s';

-- ===== 20261020090000_account_self_report_grouping.sql =====
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

-- ===== 20261020100000_credit_lot_market_scope.sql =====
-- =============================================================================
-- Credit lots: market scope is explicit from now on (2026-10-20, decisions 4/6).
--
-- Rules
--   * A lot bought for a market stays that market's (credit_lots.locale from
--     the server-verified order, unchanged since 20261009120000).
--   * Lots that could be used on both sites keep that right: existing rows are
--     NOT changed (locale NULL stays NULL = both). No backfill.
--   * NEW lots must say where they can be used:
--       - purchases: the order's market (kr_/us_ grant row). If it cannot be
--         found, the grant is stopped instead of creating an any-site lot.
--       - US membership gift coupons: English site only (coupons issued from
--         now on; coupons issued before keep both).
--       - tester / redeem codes: each NEW code must name ko-KR, en-US or both.
--       - admin grants: only through grant_credit_lot_scoped(..., scope).
--   * credit_lots.scope_basis records why: order | issuer | legacy.
--     NULL on rows created before this migration (= legacy).
--   * reserve_credit: the request must name its language (all callers do).
-- Additive and re-runnable. Applying it changes no existing row.
-- =============================================================================

-- 1) columns -----------------------------------------------------------------
alter table public.credit_lots add column if not exists scope_basis text;
alter table public.credit_lots drop constraint if exists credit_lots_scope_basis_check;
alter table public.credit_lots
  add constraint credit_lots_scope_basis_check check (scope_basis is null or scope_basis in ('order', 'issuer', 'legacy'));
comment on column public.credit_lots.scope_basis is
  'Why the lot has its locale: order (server-verified order market), issuer (coupon/code/admin chose ko-KR, en-US or both=NULL locale), legacy (code issued before scopes). NULL = created before 2026-10-20.';

alter table public.gift_personal_coupons add column if not exists market_scope text;
alter table public.gift_personal_coupons drop constraint if exists gift_personal_coupons_market_scope_check;
alter table public.gift_personal_coupons
  add constraint gift_personal_coupons_market_scope_check check (market_scope is null or market_scope in ('ko-KR', 'en-US', 'both'));
comment on column public.gift_personal_coupons.market_scope is
  'Where the redeemed credit can be used. Set on issue from the membership''s market. NULL = issued before 2026-10-20 (both sites, kept).';

alter table public.tester_personal_codes add column if not exists market_scope text;
alter table public.tester_personal_codes drop constraint if exists tester_personal_codes_market_scope_check;
alter table public.tester_personal_codes
  add constraint tester_personal_codes_market_scope_check check (market_scope is null or market_scope in ('ko-KR', 'en-US', 'both'));
comment on column public.tester_personal_codes.market_scope is
  'Where the redeemed credit can be used (ko-KR, en-US or both). Required for codes created from 2026-10-20; NULL = older code (both, kept).';

-- 2) coupons / codes get a scope when created ------------------------------------
create or replace function public.gift_personal_coupons_set_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  if new.market_scope is not null then
    return new;
  end if;
  select plan_id into v_plan from memberships where id = new.membership_id;
  if v_plan like 'us\_%' then
    new.market_scope := 'en-US';
  elsif v_plan like 'kr\_%' then
    new.market_scope := 'ko-KR';
  else
    raise exception 'gift_coupon_market_unresolved';
  end if;
  return new;
end;
$$;
drop trigger if exists gift_personal_coupons_set_scope on public.gift_personal_coupons;
create trigger gift_personal_coupons_set_scope
  before insert on public.gift_personal_coupons
  for each row execute function public.gift_personal_coupons_set_scope();

create or replace function public.tester_personal_codes_require_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.market_scope is null then
    raise exception 'tester_code_market_scope_required (ko-KR, en-US or both)';
  end if;
  return new;
end;
$$;
drop trigger if exists tester_personal_codes_require_scope on public.tester_personal_codes;
create trigger tester_personal_codes_require_scope
  before insert on public.tester_personal_codes
  for each row execute function public.tester_personal_codes_require_scope();

-- 3) lot scope on insert ------------------------------------------------------------
-- Replaces 20261009120000's credit_lots_set_locale (same trigger name).
create or replace function public.credit_lots_set_locale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issuer_scope text := nullif(current_setting('aha.lot_scope', true), '');
  v_scope text;
begin
  -- Caller already decided (explicit locale + basis).
  if new.scope_basis is not null then
    return new;
  end if;

  -- grant_credit_lot_scoped(): the issuer named the scope.
  if v_issuer_scope is not null then
    new.locale := case when v_issuer_scope = 'both' then null else v_issuer_scope end;
    new.scope_basis := 'issuer';
    return new;
  end if;

  if new.reference_id is not null then
    -- Purchases: the server-verified order's market.
    if to_regclass('public.kr_purchase_grants') is not null
       and exists (select 1 from kr_purchase_grants where id = new.reference_id) then
      new.locale := 'ko-KR';
      new.scope_basis := 'order';
      return new;
    elsif to_regclass('public.us_purchase_grants') is not null
       and exists (select 1 from us_purchase_grants where id = new.reference_id) then
      new.locale := 'en-US';
      new.scope_basis := 'order';
      return new;
    elsif to_regclass('public.membership_monthly_grants') is not null
       and exists (
         select 1 from membership_monthly_grants g join memberships m on m.id = g.membership_id
          where g.id = new.reference_id and m.plan_id like 'us\_%'
       ) then
      new.locale := 'en-US';
      new.scope_basis := 'order';
      return new;
    elsif to_regclass('public.membership_term_grants') is not null
       and exists (
         select 1 from membership_term_grants g join memberships m on m.id = g.membership_id
          where g.id = new.reference_id and m.plan_id like 'us\_%'
       ) then
      new.locale := 'en-US';
      new.scope_basis := 'order';
      return new;
    end if;

    -- Coupons / codes: the scope written on the coupon or code.
    if new.source = 'promo' then
      if exists (select 1 from gift_personal_coupons where id = new.reference_id) then
        select market_scope into v_scope from gift_personal_coupons where id = new.reference_id;
      elsif exists (select 1 from tester_personal_code_redemptions where id = new.reference_id) then
        select c.market_scope into v_scope
          from tester_personal_code_redemptions r join tester_personal_codes c on c.id = r.tester_code_id
         where r.id = new.reference_id;
      else
        raise exception 'promo_lot_scope_unresolved';
      end if;
      if v_scope is null then
        -- Coupon / code issued before scopes existed: both sites, as before.
        new.locale := null;
        new.scope_basis := 'legacy';
      else
        new.locale := case when v_scope = 'both' then null else v_scope end;
        new.scope_basis := 'issuer';
      end if;
      return new;
    end if;
  end if;

  if new.locale is not null then
    -- An explicit language from a caller that is not an order/coupon path.
    new.scope_basis := 'issuer';
    return new;
  end if;

  if new.source in ('membership', 'one_time_purchase', 'additional_purchase') then
    raise exception 'purchase_lot_market_unresolved';
  end if;
  raise exception 'lot_scope_required (use grant_credit_lot_scoped)';
end;
$$;

drop trigger if exists credit_lots_set_locale on public.credit_lots;
create trigger credit_lots_set_locale
  before insert on public.credit_lots
  for each row execute function public.credit_lots_set_locale();

-- 4) grant_credit_lot_scoped -- admin / promo grants with an explicit scope ---------
create or replace function public.grant_credit_lot_scoped(
  p_clerk_user_id text,
  p_credit_type text,
  p_amount integer,
  p_source text,
  p_scope text,
  p_reference_id uuid default null,
  p_expires_at timestamptz default null
)
returns table(balance integer, lot_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_scope is null or p_scope not in ('ko-KR', 'en-US', 'both') then
    raise exception 'scope must be ko-KR, en-US or both';
  end if;
  perform set_config('aha.lot_scope', p_scope, true);
  return query select g.balance, g.lot_id
    from grant_credit_lot(p_clerk_user_id, p_credit_type, p_amount, p_source, p_reference_id, p_expires_at) g;
  perform set_config('aha.lot_scope', '', true);
end;
$$;
revoke all on function public.grant_credit_lot_scoped(text, text, integer, text, text, uuid, timestamptz) from public;
grant execute on function public.grant_credit_lot_scoped(text, text, integer, text, text, uuid, timestamptz) to service_role;

-- 5) reserve_credit: the request must name its language ------------------------------
-- Identical to 20261009120000 except the locale guard at the top.
create or replace function public.reserve_credit(
  p_clerk_user_id text,
  p_credit_type text,
  p_relationship_report_id uuid,
  p_kind text,
  p_locale text,
  p_generation_lock_id uuid,
  p_generation_request_id uuid,
  p_enforced boolean
)
returns table(reservation_id uuid, ok boolean, balance_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_reservation_id uuid;
  v_lot_id uuid;
begin
  if p_credit_type not in ('personal', 'relationship') then
    raise exception 'invalid credit_type: %', p_credit_type;
  end if;
  -- 2026-10-20: every spend names its market language; NULL used to mean
  -- "any lot" (all callers already pass one -- this only closes the gap).
  if p_locale is null or p_locale not in ('ko-KR', 'en-US') then
    raise exception 'reserve_credit_locale_required';
  end if;

  perform expire_credit_lots(p_clerk_user_id, p_credit_type);

  if p_enforced then
    select id into v_lot_id
      from credit_lots
      where clerk_user_id = p_clerk_user_id
        and credit_type = p_credit_type
        and remaining >= 1
        and (expires_at is null or expires_at > now())
        and (p_locale is null or locale is null or locale = p_locale)
      order by expires_at asc nulls last, (locale is null) asc, created_at asc
      limit 1
      for update skip locked;

    if v_lot_id is null then
      return query select null::uuid, false, null::integer;
      return;
    end if;

    update credit_lots set remaining = remaining - 1 where id = v_lot_id;

    update credit_accounts
      set balance = balance - 1, updated_at = now()
      where clerk_user_id = p_clerk_user_id and credit_type = p_credit_type
      returning balance into v_balance;
  else
    select balance into v_balance
      from credit_accounts
      where clerk_user_id = p_clerk_user_id and credit_type = p_credit_type;
    v_balance := coalesce(v_balance, 0);
  end if;

  insert into credit_reservations (
    clerk_user_id, credit_type, relationship_report_id, kind, locale,
    generation_lock_id, generation_request_id, enforced, credit_lot_id
  ) values (
    p_clerk_user_id, p_credit_type, p_relationship_report_id, p_kind, p_locale,
    p_generation_lock_id, p_generation_request_id, p_enforced, v_lot_id
  )
  returning id into v_reservation_id;

  insert into credit_ledger (
    clerk_user_id, credit_type, delta, reason, reference_id, balance_after, enforced
  ) values (
    p_clerk_user_id, p_credit_type, -1, 'reservation_hold', v_reservation_id, v_balance, p_enforced
  );

  return query select v_reservation_id, true, v_balance;
end;
$$;

revoke all on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) from public;
grant execute on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) to service_role;

-- ===== 20261020110000_relationship_basic_results_by_locale.sql =====
-- =============================================================================
-- Free relationship result per language (2026-10-20, decision 5).
--
-- relationship_reports.result_basic stays the ORIGINAL and is never rewritten
-- once it exists (it was written in one language; viewing it from the other
-- site used to re-save it with the viewer's language stamped on it).
-- A result in another language is generated from scratch in that language
-- only when the person presses "Create in <language>", and is stored here,
-- one row per (relationship, language). Replacing a row (explicit regenerate)
-- first archives the previous copy.
-- Additive and re-runnable. No existing row is modified.
-- =============================================================================

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

-- ===== 20261021090000_account_integration_explicit_privileges.sql =====
-- =============================================================================
-- Account integration objects: access rights written out in full (2026-10-21).
--
-- Why: from 2026-10-30 Supabase no longer auto-grants Data API rights on new
-- public tables (new projects, Preview branches, `supabase db reset`), while
-- older databases still apply the old default privileges (anon /
-- authenticated / service_role get everything, functions are executable by
-- them). The three account-integration migrations (20261020090000/100000/
-- 110000) only revoked from PUBLIC/anon/authenticated and granted to
-- service_role, so the resulting rights depended on the database:
--   * security-definer RPCs (group/fill/unfill/ungroup, grant_credit_lot_scoped,
--     reserve_credit, save_relationship_basic_result) were executable by anon
--     and authenticated where the old function defaults apply;
--   * service_role got delete/truncate/... on the new tables where the old
--     table defaults apply.
-- This migration makes the rights identical everywhere. No row is changed.
--
-- Rights (the app talks to these objects only from the server, service_role):
--   tables    -- RLS on, no policies; anon/authenticated: nothing;
--                service_role: exactly what the server code does.
--   functions -- PUBLIC/anon/authenticated: no execute; service_role executes
--                only the RPCs the server calls. Trigger functions and the
--                helpers used inside security-definer functions need no
--                caller rights (triggers fire regardless; definer functions
--                run as the owner).
-- Re-runnable.
-- =============================================================================

-- 1) tables ---------------------------------------------------------------------
alter table public.account_profile_events enable row level security;
alter table public.report_birth_history enable row level security;
alter table public.relationship_basic_results enable row level security;
alter table public.relationship_basic_result_history enable row level security;

revoke all on table public.account_profile_events from public, anon, authenticated, service_role;
revoke all on table public.report_birth_history from public, anon, authenticated, service_role;
revoke all on table public.relationship_basic_results from public, anon, authenticated, service_role;
revoke all on table public.relationship_basic_result_history from public, anon, authenticated, service_role;

-- server inserts (lib/account/profileChoices.ts, lib/report/restoreBirthFromOwnedReports.ts);
-- select kept for server-side reads of the log (same as 20261020090000)
grant select, insert on table public.account_profile_events to service_role;
-- server inserts the previous birth details (lib/account/profileChoices.ts); select as above
grant select, insert on table public.report_birth_history to service_role;
-- lib/relationship/basicResultByLocale.ts (read); writes go through
-- save_relationship_basic_result. update kept for an explicit regenerate.
grant select, insert, update on table public.relationship_basic_results to service_role;
grant select, insert on table public.relationship_basic_result_history to service_role;

-- 2) functions ------------------------------------------------------------------
-- RPCs called by the server (service_role only).
revoke all on function public.group_account_self_reports(text, uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.ungroup_account_self_reports(text, text) from public, anon, authenticated;
revoke all on function public.fill_main_report_from_grouped(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.unfill_main_report(uuid, text) from public, anon, authenticated;
revoke all on function public.grant_credit_lot_scoped(text, text, integer, text, text, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function public.save_relationship_basic_result(uuid, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.group_account_self_reports(text, uuid, boolean, text) to service_role;
grant execute on function public.ungroup_account_self_reports(text, text) to service_role;
grant execute on function public.fill_main_report_from_grouped(uuid, boolean, text) to service_role;
grant execute on function public.unfill_main_report(uuid, text) to service_role;
grant execute on function public.grant_credit_lot_scoped(text, text, integer, text, text, uuid, timestamptz) to service_role;
grant execute on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) to service_role;
grant execute on function public.save_relationship_basic_result(uuid, text, jsonb, text) to service_role;

-- Trigger functions and internal helpers: no caller needs them.
revoke all on function public.reports_merged_into_guard() from public, anon, authenticated, service_role;
revoke all on function public.gift_personal_coupons_set_scope() from public, anon, authenticated, service_role;
revoke all on function public.tester_personal_codes_require_scope() from public, anon, authenticated, service_role;
revoke all on function public.credit_lots_set_locale() from public, anon, authenticated, service_role;
revoke all on function public.survey_answers_complete(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.survey_answers_signature(jsonb) from public, anon, authenticated, service_role;

commit;
