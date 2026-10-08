-- =============================================================================
-- Guest (no-account) use of a single Personal purchase, and guest purchase of
-- the 12-Month Membership with account linking.
--
-- Additive: new tables (service-role only), new columns on
-- toss_payment_orders, new functions, and a new version of
-- claim_paid_guest_toss_order. Existing rows keep their meaning.
--
-- Ownership of a guest purchase is proven by (a) the emailed purchase link or
-- (b) a 6-digit code sent to the ORDER email -- never by typing an email.
-- Either creates a 7-day guest access session (only its hash is stored).
--
-- Retention (kept apart on purpose):
--   * generation right ......... approved_at + 12 months (the pass)
--   * input only, never generated  deleted when the pass expires
--                                  (approved_at + 12 months), or right away
--                                  if the order is refunded / cancelled
--   * generated report + input ... generated_at + 12 months
--   * saved to an account ....... guest copy cleared at once (account rules apply)
--   * order / payment record .... unchanged (statutory retention)
--
-- None of these tables is reachable by anon / authenticated roles: RLS on,
-- no policies, privileges only for service_role (server routes).
-- =============================================================================

-- ---------------------------------------------------------------- orders
alter table public.toss_payment_orders add column if not exists guest_use_status text;
alter table public.toss_payment_orders add column if not exists guest_use_request_id uuid;
alter table public.toss_payment_orders add column if not exists guest_use_reserved_at timestamptz;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'toss_payment_orders_guest_use_status_check') then
    alter table public.toss_payment_orders
      add constraint toss_payment_orders_guest_use_status_check
      check (guest_use_status is null or guest_use_status in ('reserved', 'used'));
  end if;
end $$;
comment on column public.toss_payment_orders.guest_use_status is
  'Guest (no-account) use of a Personal order: null = unused, reserved = generating, used = report generated. A used order is never also granted as an account credit.';

-- ---------------------------------------------------------------- codes
create table if not exists public.guest_purchase_codes (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.toss_payment_orders(order_id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists guest_purchase_codes_order_idx on public.guest_purchase_codes (order_id, created_at desc);

-- ---------------------------------------------------------------- sessions
create table if not exists public.guest_access_sessions (
  id uuid primary key default gen_random_uuid(),
  session_hash text not null unique,
  order_id text not null references public.toss_payment_orders(order_id) on delete cascade,
  via text not null check (via in ('link', 'code')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index if not exists guest_access_sessions_order_idx on public.guest_access_sessions (order_id);

-- ---------------------------------------------------------------- guest Personal storage
create table if not exists public.guest_personal_profiles (
  order_id text primary key references public.toss_payment_orders(order_id) on delete cascade,
  locale text not null check (locale in ('ko-KR', 'en-US')),
  birth_date text,
  birth_time text,
  birth_time_unknown boolean not null default false,
  birth_place text,
  birth_place_unknown boolean not null default false,
  survey_answers jsonb,
  report jsonb,
  report_locale text,
  generated_at timestamptz,
  input_expires_at timestamptz not null,
  retention_expires_at timestamptz,
  migrated_report_id uuid,
  migrated_clerk_user_id text,
  migrated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.guest_personal_profiles is
  'Server-side temporary store for a guest Personal purchase (birth input, survey, generated report). Service-role only. Retention: input-only rows until the pass expires; generated rows 12 months from generation; cleared on save-to-account.';

alter table public.guest_purchase_codes enable row level security;
alter table public.guest_access_sessions enable row level security;
alter table public.guest_personal_profiles enable row level security;
revoke all on table public.guest_purchase_codes from public;
revoke all on table public.guest_access_sessions from public;
revoke all on table public.guest_personal_profiles from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.guest_purchase_codes, public.guest_access_sessions, public.guest_personal_profiles from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.guest_purchase_codes, public.guest_access_sessions, public.guest_personal_profiles from authenticated';
  end if;
end $$;
grant select, insert, update, delete on table public.guest_purchase_codes to service_role;
grant select, insert, update, delete on table public.guest_access_sessions to service_role;
grant select, insert, update, delete on table public.guest_personal_profiles to service_role;

-- Guest-usable order: a paid guest order not linked to any account.
create or replace function public.guest_order_eligible(p_o public.toss_payment_orders)
returns boolean
language sql
immutable
as $$
  select p_o.guest_email is not null and p_o.clerk_user_id is null
     and p_o.status = 'paid' and p_o.approved_at is not null;
$$;

-- ---------------------------------------------------------------- codes
-- Issues a code for the ORDER email (the caller sends it). Older unused codes
-- for the order stop working. At most p_max_per_hour codes per order per hour.
create or replace function public.issue_guest_purchase_code(
  p_order_id text,
  p_code_hash text,
  p_ttl_seconds integer default 600,
  p_max_per_hour integer default 5
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o toss_payment_orders;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found or not guest_order_eligible(v_o) then
    return 'not_eligible';
  end if;
  if (select count(*) from guest_purchase_codes
      where order_id = p_order_id and created_at > now() - interval '1 hour') >= p_max_per_hour then
    return 'too_many';
  end if;
  update guest_purchase_codes set expires_at = least(expires_at, now())
    where order_id = p_order_id and consumed_at is null and expires_at > now();
  insert into guest_purchase_codes (order_id, code_hash, expires_at)
    values (p_order_id, p_code_hash, now() + make_interval(secs => greatest(p_ttl_seconds, 60)));
  return 'issued';
end;
$$;

-- Checks a code: 'ok' (consumed), 'mismatch', 'locked' (too many tries),
-- 'expired' (none valid), 'not_eligible'.
create or replace function public.verify_guest_purchase_code(
  p_order_id text,
  p_code_hash text,
  p_max_attempts integer default 5
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o toss_payment_orders;
  v_c record;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id;
  if not found or not guest_order_eligible(v_o) then
    return 'not_eligible';
  end if;
  select * into v_c from guest_purchase_codes
    where order_id = p_order_id and consumed_at is null and expires_at > now()
    order by created_at desc limit 1
    for update;
  if not found then
    return 'expired';
  end if;
  if v_c.attempts >= p_max_attempts then
    return 'locked';
  end if;
  if v_c.code_hash <> p_code_hash then
    update guest_purchase_codes set attempts = attempts + 1 where id = v_c.id;
    return case when v_c.attempts + 1 >= p_max_attempts then 'locked' else 'mismatch' end;
  end if;
  update guest_purchase_codes set consumed_at = now() where id = v_c.id;
  return 'ok';
end;
$$;

-- ---------------------------------------------------------------- sessions
create or replace function public.create_guest_access_session(
  p_order_id text,
  p_session_hash text,
  p_via text,
  p_ttl_seconds integer default 604800
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o toss_payment_orders;
  v_exp timestamptz := now() + make_interval(secs => p_ttl_seconds);
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id;
  if not found or not guest_order_eligible(v_o) then
    return null;
  end if;
  insert into guest_access_sessions (session_hash, order_id, via, expires_at)
    values (p_session_hash, p_order_id, p_via, v_exp);
  return v_exp;
end;
$$;

-- Valid session -> its order id (null when expired / revoked / unknown).
create or replace function public.resolve_guest_access_session(p_session_hash text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select s.order_id from guest_access_sessions s
  where s.session_hash = p_session_hash and s.revoked_at is null and s.expires_at > now()
  limit 1;
$$;

-- ---------------------------------------------------------------- guest Personal
-- Saves / replaces the guest's input. Allowed only while nothing has been
-- generated for the order and the order is still guest-usable.
create or replace function public.save_guest_personal_input(
  p_order_id text,
  p_locale text,
  p_birth_date text,
  p_birth_time text,
  p_birth_time_unknown boolean,
  p_birth_place text,
  p_birth_place_unknown boolean,
  p_survey_answers jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o toss_payment_orders;
  v_p record;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found or not guest_order_eligible(v_o) then
    return 'not_eligible';
  end if;
  if v_o.guest_use_status is not null then
    return 'locked';
  end if;
  select * into v_p from guest_personal_profiles where order_id = p_order_id;
  if found and v_p.generated_at is not null then
    return 'locked';
  end if;
  insert into guest_personal_profiles (
    order_id, locale, birth_date, birth_time, birth_time_unknown, birth_place, birth_place_unknown,
    survey_answers, input_expires_at
  ) values (
    p_order_id, p_locale, p_birth_date, p_birth_time, coalesce(p_birth_time_unknown, false),
    p_birth_place, coalesce(p_birth_place_unknown, false), p_survey_answers,
    v_o.approved_at + interval '12 months'
  )
  on conflict (order_id) do update set
    locale = excluded.locale,
    birth_date = excluded.birth_date,
    birth_time = excluded.birth_time,
    birth_time_unknown = excluded.birth_time_unknown,
    birth_place = excluded.birth_place,
    birth_place_unknown = excluded.birth_place_unknown,
    survey_answers = excluded.survey_answers,
    updated_at = now();
  return 'saved';
end;
$$;

-- Reserves the order's single use for one generation request.
--   reserved | in_progress | already_used | claimed | expired | no_input | not_eligible
-- A reservation older than 10 minutes is treated as abandoned (generation
-- requests are capped well below that) and may be taken over.
create or replace function public.reserve_guest_personal_use(
  p_order_id text,
  p_request_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o toss_payment_orders;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found or v_o.guest_email is null then
    return 'not_eligible';
  end if;
  if v_o.clerk_user_id is not null then
    return 'claimed';
  end if;
  if v_o.status <> 'paid' or v_o.approved_at is null then
    return 'not_eligible';
  end if;
  if v_o.guest_use_status = 'used' then
    return 'already_used';
  end if;
  if v_o.guest_use_status = 'reserved' and v_o.guest_use_reserved_at > now() - interval '10 minutes' then
    return 'in_progress';
  end if;
  if v_o.approved_at + interval '12 months' <= now() then
    return 'expired';
  end if;
  if not exists (select 1 from guest_personal_profiles where order_id = p_order_id and birth_date is not null) then
    return 'no_input';
  end if;
  update toss_payment_orders
    set guest_use_status = 'reserved', guest_use_request_id = p_request_id,
        guest_use_reserved_at = now(), updated_at = now()
    where id = v_o.id;
  return 'reserved';
end;
$$;

-- Stores the generated report and marks the order used -- only for the
-- request that holds the reservation (a lost / taken-over reservation saves
-- nothing).
create or replace function public.complete_guest_personal_use(
  p_order_id text,
  p_request_id uuid,
  p_report jsonb,
  p_report_locale text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update toss_payment_orders
    set guest_use_status = 'used', updated_at = now()
    where order_id = p_order_id and guest_use_status = 'reserved' and guest_use_request_id = p_request_id
      and clerk_user_id is null
    returning id into v_id;
  if v_id is null then
    return false;
  end if;
  update guest_personal_profiles
    set report = p_report, report_locale = p_report_locale, generated_at = now(),
        retention_expires_at = now() + interval '12 months', updated_at = now()
    where order_id = p_order_id;
  return true;
end;
$$;

create or replace function public.release_guest_personal_use(p_order_id text, p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update toss_payment_orders
    set guest_use_status = null, guest_use_request_id = null, guest_use_reserved_at = null, updated_at = now()
    where order_id = p_order_id and guest_use_status = 'reserved' and guest_use_request_id = p_request_id;
end;
$$;

-- Saves a USED guest Personal order into the signed-in account whose
-- Clerk-verified email equals the order email: a new 'self' report with the
-- same birth input, survey and generated analysis (no re-entry, no
-- regeneration, no credit). Idempotent per order; the guest copy is cleared.
--   result: saved | already_saved | email_mismatch | claimed_by_other | not_used | not_found
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
      v_report, 'deep_essence_structured',
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

-- Retention sweep (called by the background route). Returns rows affected.
create or replace function public.purge_guest_personal_data()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer := 0;
  k integer;
begin
  -- generated: 12 months after generation
  delete from guest_personal_profiles where generated_at is not null and migrated_at is null
    and retention_expires_at <= now();
  get diagnostics k = row_count; n := n + k;
  -- input only: when the pass expires
  delete from guest_personal_profiles where generated_at is null and migrated_at is null
    and input_expires_at <= now();
  get diagnostics k = row_count; n := n + k;
  -- refunded / cancelled / test-completed orders: right away
  delete from guest_personal_profiles p using toss_payment_orders o
    where o.order_id = p.order_id and p.migrated_at is null
      and o.status in ('refunded', 'canceled', 'failed', 'test_completed');
  get diagnostics k = row_count; n := n + k;
  delete from guest_access_sessions where expires_at <= now() - interval '1 day' or revoked_at <= now() - interval '1 day';
  get diagnostics k = row_count; n := n + k;
  delete from guest_purchase_codes where expires_at <= now() - interval '1 day';
  get diagnostics k = row_count; n := n + k;
  return n;
end;
$$;

-- ---------------------------------------------------------------- claim (account-required products)
-- New version: a guest-USED Personal order is never granted as a credit
-- (use save_guest_personal_to_account); a guest membership claimed by an
-- account that already has an active membership is refused (the caller
-- refunds it); membership windows are anchored to the purchase time.
create or replace function public.claim_paid_guest_toss_order(
  p_order_id text,
  p_clerk_user_id text,
  p_verified_emails text[]
)
returns table(result text, already_processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o record;
  v_r record;
  v_txn text;
  v_shift interval;
  v_membership uuid;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found or v_o.guest_email is null then
    return query select 'not_found'::text, false;
    return;
  end if;
  if v_o.clerk_user_id is not null then
    if v_o.clerk_user_id = p_clerk_user_id then
      return query select 'already_claimed'::text, true;
    else
      return query select 'claimed_by_other'::text, false;
    end if;
    return;
  end if;
  if not exists (
    select 1 from unnest(coalesce(p_verified_emails, '{}'::text[])) e
    where lower(trim(e)) = v_o.guest_email
  ) then
    return query select 'email_mismatch'::text, false;
    return;
  end if;
  if v_o.status <> 'paid' or v_o.approved_at is null then
    return query select 'not_paid'::text, false;
    return;
  end if;
  if v_o.guest_use_status = 'reserved' then
    return query select 'guest_use_in_progress'::text, false;
    return;
  end if;
  if v_o.guest_use_status = 'used' then
    return query select 'guest_used'::text, false;
    return;
  end if;

  begin
    update toss_payment_orders
      set clerk_user_id = p_clerk_user_id, claimed_at = now(), updated_at = now()
      where id = v_o.id;
    select * into v_r from process_toss_order(p_order_id);
  exception when others then
    if sqlerrm like '%active_membership_exists%' then
      -- subtransaction rolled back: the order is unclaimed and unchanged
      return query select 'already_member'::text, false;
      return;
    end if;
    raise;
  end;

  v_shift := now() - v_o.approved_at;
  v_txn := 'toss:' || v_o.payment_key;
  if v_shift > interval '0' then
    update credit_lots cl set expires_at = cl.expires_at - v_shift
      where cl.expires_at is not null
        and cl.reference_id in (
          select g.id from kr_purchase_grants g where g.provider_transaction_id = v_txn
          union all
          select g.id from us_purchase_grants g where g.paddle_transaction_id = v_txn
        );
    update kr_purchase_grants set created_at = v_o.approved_at where provider_transaction_id = v_txn;
    update us_purchase_grants set created_at = v_o.approved_at where paddle_transaction_id = v_txn;

    -- 12-Month Membership: "12 months from the purchase date"
    select id into v_membership from memberships where payment_order_id = p_order_id;
    if v_membership is not null then
      update memberships
        set started_at = started_at - v_shift,
            current_term_start = current_term_start - v_shift,
            current_term_end = current_term_end - v_shift,
            updated_at = now()
        where id = v_membership;
      update credit_lots cl set expires_at = cl.expires_at - v_shift
        where cl.expires_at is not null
          and cl.reference_id in (select id from membership_term_grants where membership_id = v_membership);
      update gift_personal_coupons set expires_at = expires_at - v_shift
        where membership_id = v_membership and expires_at is not null;
    end if;
  end if;

  return query select 'claimed'::text, coalesce(v_r.already_processed, false);
end;
$$;

revoke all on function public.guest_order_eligible(public.toss_payment_orders) from public;
revoke all on function public.issue_guest_purchase_code(text, text, integer, integer) from public;
revoke all on function public.verify_guest_purchase_code(text, text, integer) from public;
revoke all on function public.create_guest_access_session(text, text, text, integer) from public;
revoke all on function public.resolve_guest_access_session(text) from public;
revoke all on function public.save_guest_personal_input(text, text, text, text, boolean, text, boolean, jsonb) from public;
revoke all on function public.reserve_guest_personal_use(text, uuid) from public;
revoke all on function public.complete_guest_personal_use(text, uuid, jsonb, text) from public;
revoke all on function public.release_guest_personal_use(text, uuid) from public;
revoke all on function public.save_guest_personal_to_account(text, text, text[]) from public;
revoke all on function public.purge_guest_personal_data() from public;
revoke all on function public.claim_paid_guest_toss_order(text, text, text[]) from public;
grant execute on function public.guest_order_eligible(public.toss_payment_orders) to service_role;
grant execute on function public.issue_guest_purchase_code(text, text, integer, integer) to service_role;
grant execute on function public.verify_guest_purchase_code(text, text, integer) to service_role;
grant execute on function public.create_guest_access_session(text, text, text, integer) to service_role;
grant execute on function public.resolve_guest_access_session(text) to service_role;
grant execute on function public.save_guest_personal_input(text, text, text, text, boolean, text, boolean, jsonb) to service_role;
grant execute on function public.reserve_guest_personal_use(text, uuid) to service_role;
grant execute on function public.complete_guest_personal_use(text, uuid, jsonb, text) to service_role;
grant execute on function public.release_guest_personal_use(text, uuid) to service_role;
grant execute on function public.save_guest_personal_to_account(text, text, text[]) to service_role;
grant execute on function public.purge_guest_personal_data() to service_role;
grant execute on function public.claim_paid_guest_toss_order(text, text, text[]) to service_role;
