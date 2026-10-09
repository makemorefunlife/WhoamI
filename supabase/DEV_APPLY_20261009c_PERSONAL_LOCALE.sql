-- =============================================================================
-- DEV ONLY -- ahaitsme-dev (alcknxpemdjytwvnschq). Do NOT run on production.
-- Applies supabase/migrations/20261009120000_personal_locale_reports_and_credit_locale.sql
-- (per-language Personal deep rows, report_analysis_history, credit_lots.locale,
-- language-aware reserve_credit, guest save-to-account per language).
-- Additive, re-runnable, keeps every existing row (no backfill, no overwrite).
-- Run DEV_CHECK_20261009c_PERSONAL_LOCALE_STATE.sql before and after.
-- =============================================================================
begin;
do $$
begin
  if to_regclass('public.credit_lots') is null or to_regclass('public.report_analyses') is null then
    raise exception 'STOP: credit_lots / report_analyses missing -- wrong database?';
  end if;
  if to_regclass('public.guest_personal_profiles') is null then
    raise exception 'STOP: guest_personal_profiles missing -- run DEV_APPLY_20261009_GUEST_PERSONAL.sql first';
  end if;
  if to_regprocedure('public.reserve_credit(text,text,uuid,text,text,uuid,uuid,boolean)') is null then
    raise exception 'STOP: reserve_credit signature differs -- stop and report';
  end if;
end $$;
-- 1) report_analyses: per-language Personal deep types -------------------------
alter table public.report_analyses
  drop constraint if exists report_analyses_type_check;

alter table public.report_analyses
  add constraint report_analyses_type_check check (
    analysis_type in (
      'basic',
      'premium',
      'integrated',
      'relationship',
      'detailed_survey',
      'astrology',
      'deep_essence_structured',
      'deep_essence_structured_ko',
      'deep_essence_structured_en'
    )
  );

comment on column public.report_analyses.analysis_type is
  'basic | premium | integrated | relationship | detailed_survey | astrology | deep_essence_structured (legacy, read-only) | deep_essence_structured_ko | deep_essence_structured_en';

-- 2) Append-only history of replaced analyses ----------------------------------
create table if not exists public.report_analysis_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  analysis_type text not null,
  content text not null,
  metadata jsonb,
  original_created_at timestamptz,
  original_updated_at timestamptz,
  archived_reason text not null,
  archived_at timestamptz not null default now()
);
create index if not exists report_analysis_history_report_idx
  on public.report_analysis_history (report_id, analysis_type, archived_at desc);

alter table public.report_analysis_history enable row level security;
revoke all on table public.report_analysis_history from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.report_analysis_history from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.report_analysis_history from authenticated';
  end if;
end $$;
grant select, insert on table public.report_analysis_history to service_role;

-- Saves a per-language Personal deep report. If a row already exists for this
-- (report, type) it is copied to report_analysis_history first, in the same
-- transaction, so a saved report is never silently lost.
create or replace function public.save_personal_deep_analysis(
  p_report_id uuid,
  p_analysis_type text,
  p_content text,
  p_metadata jsonb,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old report_analyses;
begin
  if p_analysis_type not in ('deep_essence_structured_ko', 'deep_essence_structured_en') then
    raise exception 'invalid personal deep analysis type: %', p_analysis_type;
  end if;

  select * into v_old from report_analyses
    where report_id = p_report_id and analysis_type = p_analysis_type
    for update;

  if found then
    insert into report_analysis_history (
      report_id, analysis_type, content, metadata, original_created_at, original_updated_at, archived_reason
    ) values (
      v_old.report_id, v_old.analysis_type, v_old.content, v_old.metadata, v_old.created_at, v_old.updated_at,
      coalesce(nullif(p_reason, ''), 'replaced')
    );
    update report_analyses
      set content = p_content, metadata = p_metadata, updated_at = now()
      where id = v_old.id;
  else
    insert into report_analyses (report_id, analysis_type, content, metadata)
      values (p_report_id, p_analysis_type, p_content, p_metadata);
  end if;
  return true;
end;
$$;

revoke all on function public.save_personal_deep_analysis(uuid, text, text, jsonb, text) from public;
grant execute on function public.save_personal_deep_analysis(uuid, text, text, jsonb, text) to service_role;

-- 3) credit_lots.locale ---------------------------------------------------------
alter table public.credit_lots add column if not exists locale text;
alter table public.credit_lots drop constraint if exists credit_lots_locale_check;
alter table public.credit_lots
  add constraint credit_lots_locale_check check (locale is null or locale in ('ko-KR', 'en-US'));
comment on column public.credit_lots.locale is
  'Language this lot may be spent on (ko-KR | en-US), from the server-verified order. NULL = any language (lots created before 2026-10-09, promo/admin/tester/gift).';

-- Derives the language from the grant row the lot references. Only fills a
-- NULL locale; an explicit value is kept.
create or replace function public.credit_lots_set_locale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.locale is not null or new.reference_id is null then
    return new;
  end if;

  if to_regclass('public.kr_purchase_grants') is not null
     and exists (select 1 from kr_purchase_grants where id = new.reference_id) then
    new.locale := 'ko-KR';
  elsif to_regclass('public.us_purchase_grants') is not null
     and exists (select 1 from us_purchase_grants where id = new.reference_id) then
    new.locale := 'en-US';
  elsif to_regclass('public.membership_monthly_grants') is not null
     and exists (
       select 1 from membership_monthly_grants g join memberships m on m.id = g.membership_id
        where g.id = new.reference_id and m.plan_id like 'us\_%'
     ) then
    new.locale := 'en-US';
  elsif to_regclass('public.membership_term_grants') is not null
     and exists (
       select 1 from membership_term_grants g join memberships m on m.id = g.membership_id
        where g.id = new.reference_id and m.plan_id like 'us\_%'
     ) then
    new.locale := 'en-US';
  end if;
  return new;
end;
$$;

drop trigger if exists credit_lots_set_locale on public.credit_lots;
create trigger credit_lots_set_locale
  before insert on public.credit_lots
  for each row execute function public.credit_lots_set_locale();

-- 4) reserve_credit: language-aware lot selection --------------------------------
-- Identical to 20260922040100 except the lot filter/order:
--   eligible = lots with locale = p_locale, or locale NULL (legacy / universal);
--   order    = soonest expiry first (unchanged rule), then the exact-language
--              lot before a universal one, then oldest.
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

-- 5) Guest Personal save-to-account writes the per-language row -----------------
-- Same as 20261009090000 except the analysis_type: the generated report's own
-- language decides it (ko-KR -> _ko, en-US -> _en); an unknown language keeps
-- the legacy type so it is preserved as an original, never guessed.
create or replace function public.save_guest_personal_to_account(
  p_order_id text,
  p_clerk_user_id text,
  p_verified_emails text[]
)
returns table(result text, report_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o toss_payment_orders;
  v_p record;
  v_report uuid;
  v_type text;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found or v_o.guest_email is null then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;
  select * into v_p from guest_personal_profiles where order_id = p_order_id for update;
  if v_o.clerk_user_id is not null then
    if v_o.clerk_user_id = p_clerk_user_id and v_p.migrated_report_id is not null then
      return query select 'already_saved'::text, v_p.migrated_report_id;
    elsif v_o.clerk_user_id = p_clerk_user_id then
      return query select 'not_used'::text, null::uuid;
    else
      return query select 'claimed_by_other'::text, null::uuid;
    end if;
    return;
  end if;
  if not exists (
    select 1 from unnest(coalesce(p_verified_emails, '{}'::text[])) e where lower(trim(e)) = v_o.guest_email
  ) then
    return query select 'email_mismatch'::text, null::uuid;
    return;
  end if;
  if v_o.guest_use_status is distinct from 'used' or v_p is null or v_p.report is null then
    return query select 'not_used'::text, null::uuid;
    return;
  end if;

  v_type := case v_p.report_locale
    when 'ko-KR' then 'deep_essence_structured_ko'
    when 'en-US' then 'deep_essence_structured_en'
    else 'deep_essence_structured'
  end;

  insert into reports (clerk_user_id, report_type, birth_date, birth_time, birth_place)
    values (
      p_clerk_user_id, 'self',
      nullif(v_p.birth_date, '')::date,
      case when v_p.birth_time_unknown then null else v_p.birth_time end,
      v_p.birth_place
    )
    returning id into v_report;
  if v_p.survey_answers is not null then
    insert into survey_responses (report_id, answers) values (v_report, v_p.survey_answers);
  end if;
  insert into report_analyses (report_id, analysis_type, content, metadata)
    values (
      v_report, v_type,
      jsonb_build_object('locale', v_p.report_locale, 'slim_v1', v_p.report)::text,
      jsonb_build_object('locale', v_p.report_locale, 'source', 'guest_personal', 'order_id', p_order_id)
    );

  update toss_payment_orders
    set clerk_user_id = p_clerk_user_id, claimed_at = now(), status = 'granted', updated_at = now()
    where id = v_o.id;
  update guest_personal_profiles
    set migrated_report_id = v_report, migrated_clerk_user_id = p_clerk_user_id, migrated_at = now(),
        birth_date = null, birth_time = null, birth_place = null, survey_answers = null, report = null,
        updated_at = now()
    where order_id = p_order_id;
  update guest_access_sessions set revoked_at = now() where order_id = p_order_id and revoked_at is null;
  return query select 'saved'::text, v_report;
end;
$$;

revoke all on function public.save_guest_personal_to_account(text, text, text[]) from public;
grant execute on function public.save_guest_personal_to_account(text, text, text[]) to service_role;
commit;

-- Verification (expected: true, true, true, true, 1)
select
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'credit_lots' and column_name = 'locale') as credit_lots_has_locale,
  to_regclass('public.report_analysis_history') is not null as has_history_table,
  to_regprocedure('public.save_personal_deep_analysis(uuid,text,text,jsonb,text)') is not null as has_save_fn,
  exists (select 1 from pg_trigger where tgname = 'credit_lots_set_locale') as has_locale_trigger,
  (select count(*) from pg_proc where proname = 'reserve_credit') as reserve_credit_overloads;
