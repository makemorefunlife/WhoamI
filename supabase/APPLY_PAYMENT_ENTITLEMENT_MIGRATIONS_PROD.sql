begin;

-- =============================================================
-- Combined PROD apply script: payment/entitlement migrations
-- Generated 2026-09-26 for manual paste into Supabase Dashboard SQL Editor
-- (PROD project gncjslondpvysjaytagd)
--
-- Contains, in original order, the 10 migration files confirmed
-- (via direct to_regprocedure/to_regclass checks against PROD) to be
-- entirely unapplied there:
--    1. 20260922040000_credit_lots.sql
--    2. 20260922040100_credit_engine_lot_functions.sql
--    3. 20260922040200_us_memberships.sql
--    4. 20260922040300_us_membership_functions.sql
--    5. 20260922050000_kr_purchase_grants.sql
--    6. 20260922060000_kr_purchase_grants_provider_agnostic.sql
--    7. 20260922070000_account_deletion_entitlement_cleanup.sql
--    8. 20260922080000_paddle_webhooks_and_cancellation.sql
--    9. 20260923000000_paddle_webhook_idempotency_and_ordering.sql
--   10. 20260923010000_paddle_adjustment_idempotency.sql
--
-- Each section below is the ORIGINAL migration file's content,
-- copied verbatim -- no logic changes, no reordering, no cleanup.
-- All statements use IF NOT EXISTS / CREATE OR REPLACE / DROP
-- FUNCTION IF EXISTS patterns; there is no DROP TABLE, TRUNCATE, or
-- unqualified DELETE anywhere in this file.
--
-- TRANSACTION BOUNDARY: everything from `begin;` above to `commit;`
-- below runs as ONE transaction -- all 10 files succeed together or
-- none of them take effect. The verification SELECT runs AFTER
-- commit, against the final committed state.
--
-- IF SOMETHING GOES WRONG WHILE RUNNING THIS:
--   - An error message during execution is NOT a partial success --
--     do not treat it as "mostly worked." Stop and read the error.
--   - If this SQL Editor session still shows the transaction as
--     aborted (further statements fail with something like
--     "current transaction is aborted, commands ignored until end
--     of transaction block"), run `rollback;` first, then diagnose
--     the actual error before doing anything else.
--   - Do NOT re-run this file until the root cause of the error is
--     understood and fixed. Re-running blindly after a partial
--     failure risks confusing, not fixing, the state.
-- =============================================================


-- =============================================================
-- FILE: 20260922040000_credit_lots.sql
-- =============================================================

-- =============================================================================
-- credit_lots — turns credit_accounts.balance from one opaque counter into
-- a set of individually-tracked grant "lots", each with its own optional
-- expiry. This is what makes two things possible that a single balance
-- column cannot express:
--
--   1. FIFO-by-expiry consumption: reserve_credit (next migration) spends
--      from the soonest-to-expire lot first, so a time-boxed grant (a
--      membership's monthly relationship credits, a 30-Day Pass's
--      credits) is drawn down before a permanent one — see
--      lib/credits/creditEngine.ts.
--   2. "Did this specific grant get used" checks — e.g. US Annual
--      membership eligibility for the $9.99 Additional Relationship
--      add-on depends on whether THIS cycle's 2 included credits are
--      gone, not the user's total relationship balance (which may also
--      hold an unrelated one-time purchase).
--
-- credit_accounts.balance remains the fast-path cache (unchanged
-- semantics for every existing caller); credit_lots + credit_ledger
-- together are the source of truth. Expired lots are zeroed lazily by
-- expire_credit_lots() (called at the top of reserve_credit and any
-- balance read that needs to be exact) — no cron/pg_cron dependency.
-- =============================================================================

create table if not exists public.credit_lots (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  credit_type text not null check (credit_type in ('personal', 'relationship')),
  amount integer not null check (amount > 0),
  remaining integer not null check (remaining >= 0),
  source text not null check (source in ('membership', 'one_time_purchase', 'additional_purchase', 'promo', 'admin')),
  reference_id uuid,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists credit_lots_spend_order_idx
  on public.credit_lots (clerk_user_id, credit_type, expires_at asc nulls last, created_at asc)
  where remaining > 0;

create index if not exists credit_lots_expiry_sweep_idx
  on public.credit_lots (clerk_user_id, credit_type)
  where remaining > 0 and expires_at is not null;

alter table public.credit_lots enable row level security;
grant select, insert, update, delete on table public.credit_lots to service_role;

comment on table public.credit_lots is
  'RLS enabled; service-role API only. One row per grant event, independently spendable/expirable. Source of truth for FIFO-by-expiry consumption and per-grant "was this specific lot used up" checks; credit_accounts.balance is a cached sum kept in sync by grant_credit_lot/reserve_credit/release_credit/expire_credit_lots.';

-- reserve_credit now records which lot a reservation drew from, so
-- release_credit can credit the SAME lot back (not just the aggregate
-- balance) if the generation attempt fails.
alter table public.credit_reservations
  add column if not exists credit_lot_id uuid references public.credit_lots(id);

-- expire_credit_lots (next migration) writes one 'expiration' ledger row
-- per sweep that actually zeroed something.
alter table public.credit_ledger drop constraint if exists credit_ledger_reason_check;
alter table public.credit_ledger add constraint credit_ledger_reason_check
  check (reason in (
    'reservation_hold', 'consumption', 'reservation_release',
    'membership_grant', 'one_time_purchase', 'additional_purchase', 'promo', 'admin_grant',
    'expiration'
  ));

-- =============================================================
-- FILE: 20260922040100_credit_engine_lot_functions.sql
-- =============================================================

-- =============================================================================
-- Credit engine RPCs, rewritten to be lot-aware (see credit_lots migration).
-- Every existing call site (reserveRelationshipCredit, reservePersonalCredit,
-- consumeCredit, releaseCredit, grantCredits in lib/credits/creditEngine.ts)
-- keeps its exact signature and return shape — only the internal spending
-- order and bookkeeping change. consume_credit is untouched (a reservation's
-- lot was already decremented at reserve time; finalizing never re-touches
-- the lot).
-- =============================================================================

-- Zeroes out any of this user's lots (of this credit_type) whose expires_at
-- has passed and still has remaining > 0, decrements the cached balance by
-- the total zeroed, and writes one 'expiration' ledger row for that total.
-- This is what makes "no rollover" actually true: an expired lot's unused
-- remainder is never available to reserve_credit again, with no cron job —
-- it's swept lazily, right before every spend/read that needs to be exact.
create or replace function public.expire_credit_lots(
  p_clerk_user_id text,
  p_credit_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_total integer;
  v_balance integer;
begin
  with victims as (
    select id, remaining
      from credit_lots
      where clerk_user_id = p_clerk_user_id
        and credit_type = p_credit_type
        and remaining > 0
        and expires_at is not null
        and expires_at <= now()
      for update
  ),
  zeroed as (
    update credit_lots cl
      set remaining = 0
      from victims v
      where cl.id = v.id
      returning v.remaining as expired_amount
  )
  select coalesce(sum(expired_amount), 0) into v_expired_total from zeroed;

  if v_expired_total > 0 then
    update credit_accounts
      set balance = greatest(balance - v_expired_total, 0), updated_at = now()
      where clerk_user_id = p_clerk_user_id and credit_type = p_credit_type
      returning balance into v_balance;

    insert into credit_ledger (
      clerk_user_id, credit_type, delta, reason, balance_after, enforced
    ) values (
      p_clerk_user_id, p_credit_type, -v_expired_total, 'expiration', coalesce(v_balance, 0), true
    );
  end if;
end;
$$;

-- Same grant as before, plus: creates the credit_lots row and returns its
-- id. grant_credit (below) becomes a thin wrapper over this for backward
-- compatibility — no existing caller needs to change.
create or replace function public.grant_credit_lot(
  p_clerk_user_id text,
  p_credit_type text,
  p_amount integer,
  p_source text,
  p_reference_id uuid default null,
  p_expires_at timestamptz default null
)
returns table(balance integer, lot_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_reason text;
  v_lot_id uuid;
begin
  if p_credit_type not in ('personal', 'relationship') then
    raise exception 'invalid credit_type: %', p_credit_type;
  end if;
  if p_amount <= 0 then
    raise exception 'grant amount must be positive: %', p_amount;
  end if;

  v_reason := case p_source
    when 'membership' then 'membership_grant'
    when 'one_time_purchase' then 'one_time_purchase'
    when 'additional_purchase' then 'additional_purchase'
    when 'promo' then 'promo'
    when 'admin' then 'admin_grant'
    else null
  end;
  if v_reason is null then
    raise exception 'invalid grant source: %', p_source;
  end if;

  insert into credit_lots (
    clerk_user_id, credit_type, amount, remaining, source, reference_id, expires_at
  ) values (
    p_clerk_user_id, p_credit_type, p_amount, p_amount, p_source, p_reference_id, p_expires_at
  ) returning id into v_lot_id;

  insert into credit_accounts (clerk_user_id, credit_type, balance)
    values (p_clerk_user_id, p_credit_type, p_amount)
  on conflict (clerk_user_id, credit_type)
    do update set balance = credit_accounts.balance + excluded.balance, updated_at = now()
  returning balance into v_balance;

  insert into credit_ledger (
    clerk_user_id, credit_type, delta, reason, source, reference_id, balance_after, enforced, expires_at
  ) values (
    p_clerk_user_id, p_credit_type, p_amount, v_reason, p_source, p_reference_id, v_balance, true, p_expires_at
  );

  return query select v_balance, v_lot_id;
end;
$$;

create or replace function public.grant_credit(
  p_clerk_user_id text,
  p_credit_type text,
  p_amount integer,
  p_source text,
  p_reference_id uuid default null,
  p_expires_at timestamptz default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  select g.balance into v_balance from grant_credit_lot(
    p_clerk_user_id, p_credit_type, p_amount, p_source, p_reference_id, p_expires_at
  ) g;
  return v_balance;
end;
$$;

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
    -- Spend the soonest-to-expire lot first (expires_at ASC NULLS LAST):
    -- time-boxed grants (membership monthly credits, 30-Day Pass credits)
    -- get used before permanent ones, so a user's permanent credits are
    -- never stranded behind an about-to-expire lot they didn't get to.
    select id into v_lot_id
      from credit_lots
      where clerk_user_id = p_clerk_user_id
        and credit_type = p_credit_type
        and remaining >= 1
        and (expires_at is null or expires_at > now())
      order by expires_at asc nulls last, created_at asc
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

create or replace function public.release_credit(
  p_generation_request_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res record;
  v_balance integer;
begin
  select * into v_res from credit_reservations
    where generation_request_id = p_generation_request_id;

  if not found then
    return true; -- already finalized (or never existed) -- idempotent no-op
  end if;

  if v_res.enforced then
    if v_res.credit_lot_id is not null then
      -- Credit back to the SAME lot it was drawn from, not just the
      -- aggregate balance, so that lot's remaining stays accurate for
      -- FIFO ordering and per-lot "was this used up" checks. If the lot
      -- has since expired, this is harmless: expire_credit_lots will
      -- zero it again (and correct the cached balance) the next time
      -- anything touches this user's lots.
      update credit_lots set remaining = remaining + 1 where id = v_res.credit_lot_id;
    end if;
    update credit_accounts
      set balance = balance + 1, updated_at = now()
      where clerk_user_id = v_res.clerk_user_id and credit_type = v_res.credit_type
      returning balance into v_balance;
  else
    select balance into v_balance
      from credit_accounts
      where clerk_user_id = v_res.clerk_user_id and credit_type = v_res.credit_type;
  end if;

  begin
    insert into credit_ledger (
      clerk_user_id, credit_type, delta, reason, reference_id, balance_after, enforced
    ) values (
      v_res.clerk_user_id, v_res.credit_type, 1, 'reservation_release', v_res.id, coalesce(v_balance, 0), v_res.enforced
    );
  exception when unique_violation then
    -- consume_credit already won the race for this reservation.
    delete from credit_reservations where id = v_res.id;
    return true;
  end;

  delete from credit_reservations where id = v_res.id;
  return true;
end;
$$;

revoke all on function public.expire_credit_lots(text, text) from public;
revoke all on function public.grant_credit_lot(text, text, integer, text, uuid, timestamptz) from public;
revoke all on function public.grant_credit(text, text, integer, text, uuid, timestamptz) from public;
revoke all on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) from public;
revoke all on function public.release_credit(uuid) from public;

grant execute on function public.expire_credit_lots(text, text) to service_role;
grant execute on function public.grant_credit_lot(text, text, integer, text, uuid, timestamptz) to service_role;
grant execute on function public.grant_credit(text, text, integer, text, uuid, timestamptz) to service_role;
grant execute on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) to service_role;
grant execute on function public.release_credit(uuid) to service_role;

-- =============================================================
-- FILE: 20260922040200_us_memberships.sql
-- =============================================================

-- =============================================================================
-- US Annual Membership schema. Deliberately generic (no "us_" in table
-- names) so KR can adopt the same membership shape later without a second
-- schema -- only lib/payment/usPricing.ts's plan ids are US-specific.
--
-- Paddle sends no monthly-cycle event for an annual subscription -- only
-- the initial purchase and each yearly renewal are real Paddle
-- transactions. The 2/month relationship-credit entitlement inside a term
-- is therefore NOT webhook-driven: it's computed on demand from
-- memberships.started_at (see membership_cycle_at + ensure_monthly_
-- relationship_grant in the next migration) using calendar-month
-- arithmetic anchored to the original signup day-of-month (not drifting
-- through short months -- Jan 31 -> Feb 28 -> Mar 31 -> Apr 30).
-- =============================================================================

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  plan_id text not null,
  status text not null check (status in ('active', 'cancelled', 'refunded', 'ended')),
  -- Original signup instant -- the permanent anchor for monthly-cycle
  -- day-of-month math. Never changes across renewals.
  started_at timestamptz not null,
  -- How many annual renewals have landed (0 = original term). Bumped by
  -- process_us_annual_renewal.
  term_index integer not null default 0,
  current_term_start timestamptz not null,
  current_term_end timestamptz not null,
  paddle_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one ACTIVE membership per user (a cancelled/refunded/ended one
-- doesn't block a fresh signup from creating a new row).
create unique index if not exists memberships_one_active_per_user
  on public.memberships (clerk_user_id)
  where status = 'active';

create unique index if not exists memberships_paddle_subscription_key
  on public.memberships (paddle_subscription_id)
  where paddle_subscription_id is not null;

-- Idempotency + record of each lazily-granted monthly relationship-credit
-- cycle. (membership_id, cycle_index) unique is what makes
-- ensure_monthly_relationship_grant safe to call as often as needed
-- (every balance check, every generation attempt) without ever
-- double-granting a cycle.
create table if not exists public.membership_monthly_grants (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete cascade,
  cycle_index integer not null,
  cycle_start timestamptz not null,
  cycle_end timestamptz not null,
  -- The credit_lots row this cycle's +2 relationship grant created. Also
  -- what additional_relationship_eligible() checks the remaining balance
  -- of, so eligibility is "this cycle's included credits are gone", not
  -- "total relationship balance is zero".
  lot_id uuid references public.credit_lots(id),
  granted_at timestamptz not null default now(),
  unique (membership_id, cycle_index)
);

-- Idempotency + record for the two per-term grants that are NOT monthly:
-- the welcome gift (2x Gift Personal coupons, term_index = 0 ONLY) and the
-- member's own +1 Personal credit (every term, including renewals).
create table if not exists public.membership_term_grants (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete cascade,
  term_index integer not null,
  grant_type text not null check (grant_type in ('welcome_gift_coupons', 'term_personal_credit')),
  lot_id uuid references public.credit_lots(id),
  granted_at timestamptz not null default now(),
  unique (membership_id, term_index, grant_type)
);

-- Gift Personal coupons -- a personal-analysis credit issued to be handed
-- to someone else, not spent by the annual member themselves. Redemption
-- (redeem_gift_personal_coupon, next migration) grants a normal permanent
-- personal credit_lot to whoever redeems the code.
create table if not exists public.gift_personal_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  issued_to_clerk_user_id text not null,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  status text not null default 'unredeemed' check (status in ('unredeemed', 'redeemed', 'revoked')),
  redeemed_by_clerk_user_id text,
  redeemed_at timestamptz,
  redeemed_lot_id uuid references public.credit_lots(id),
  created_at timestamptz not null default now()
);

create unique index if not exists gift_personal_coupons_code_key
  on public.gift_personal_coupons (code);

-- One row per successfully-verified US Paddle transaction (initial
-- purchase of any of the 5 US plans, or an annual renewal transaction).
-- Mirrors beta_purchase_grants' pattern exactly (unique on
-- paddle_transaction_id is the idempotency guard -- see
-- app/api/beta/checkout/complete/route.ts for why re-fetching the
-- transaction server-side, keyed by its id, is the trust boundary here,
-- not the client's callback or a webhook). Kept separate from
-- beta_purchase_grants because its plan_id set and event_kind concept
-- (initial vs renewal) are specific to the US catalog.
create table if not exists public.us_purchase_grants (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  plan_id text not null check (plan_id in (
    'us_personal_premium', 'us_relationship_premium', 'us_insight_pass_30d',
    'us_annual_membership', 'us_additional_relationship'
  )),
  event_kind text not null default 'initial' check (event_kind in ('initial', 'renewal')),
  paddle_transaction_id text not null,
  paddle_price_id text not null,
  currency_code text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists us_purchase_grants_txn_key
  on public.us_purchase_grants (paddle_transaction_id);

create index if not exists us_purchase_grants_user_idx
  on public.us_purchase_grants (clerk_user_id, created_at desc);

alter table public.memberships enable row level security;
alter table public.membership_monthly_grants enable row level security;
alter table public.membership_term_grants enable row level security;
alter table public.gift_personal_coupons enable row level security;
alter table public.us_purchase_grants enable row level security;

grant select, insert, update, delete on table public.memberships to service_role;
grant select, insert, update, delete on table public.membership_monthly_grants to service_role;
grant select, insert, update, delete on table public.membership_term_grants to service_role;
grant select, insert, update, delete on table public.gift_personal_coupons to service_role;
grant select, insert on table public.us_purchase_grants to service_role;

-- =============================================================
-- FILE: 20260922040300_us_membership_functions.sql
-- =============================================================

-- =============================================================================
-- US Annual Membership functions: anchor-day month math, lazy monthly
-- relationship-credit grant, purchase/renewal processing (idempotent on
-- paddle_transaction_id via us_purchase_grants), gift coupon redemption,
-- and the Additional Relationship add-on eligibility check.
-- =============================================================================

-- Adds p_months calendar months to p_ts, keeping the ORIGINAL day-of-month
-- and clamping into short target months instead of overflowing into the
-- next one (Postgres's own `timestamptz + interval 'N months'` does NOT
-- clamp: 2026-01-31 + 1 month = 2026-03-03, not Feb 28). Only ever called
-- with p_months >= 0 in this codebase.
create or replace function public.add_calendar_months_clamped(
  p_ts timestamptz,
  p_months integer
)
returns timestamptz
language plpgsql
immutable
as $$
declare
  v_naive timestamp := p_ts at time zone 'UTC';
  v_year integer := extract(year from v_naive)::integer;
  v_month integer := extract(month from v_naive)::integer;
  v_day integer := extract(day from v_naive)::integer;
  v_time_of_day time := v_naive::time;
  v_total_months integer;
  v_target_year integer;
  v_target_month integer;
  v_last_day integer;
  v_target_day integer;
begin
  v_total_months := (v_year * 12 + (v_month - 1)) + p_months;
  v_target_year := v_total_months / 12;
  v_target_month := (v_total_months % 12) + 1;

  v_last_day := extract(day from (
    (make_date(v_target_year, v_target_month, 1) + interval '1 month' - interval '1 day')
  ))::integer;
  v_target_day := least(v_day, v_last_day);

  return (make_date(v_target_year, v_target_month, v_target_day) + v_time_of_day) at time zone 'UTC';
end;
$$;

-- Given a membership's anchor (started_at) and an instant (p_as_of), finds
-- which monthly cycle p_as_of falls in. Bounded loop (max 50 years of
-- months) rather than closed-form arithmetic, so the day-of-month clamping
-- above is trivially correct by construction instead of re-derived.
create or replace function public.membership_cycle_at(
  p_started_at timestamptz,
  p_as_of timestamptz
)
returns table(cycle_index integer, cycle_start timestamptz, cycle_end timestamptz)
language plpgsql
immutable
as $$
declare
  v_idx integer := 0;
  v_end timestamptz;
begin
  loop
    v_end := add_calendar_months_clamped(p_started_at, v_idx + 1);
    exit when v_end > p_as_of or v_idx >= 600;
    v_idx := v_idx + 1;
  end loop;
  return query select v_idx, add_calendar_months_clamped(p_started_at, v_idx), v_end;
end;
$$;

-- Lazily grants THIS cycle's 2 relationship credits, exactly once, only
-- while the membership is active and within its currently-paid term
-- (status check + term-window check together are what stop a
-- cancelled/refunded/lapsed membership from accruing new grants -- a
-- membership past current_term_end with no renewal yet simply gets
-- nothing here until process_us_annual_renewal extends the term).
--
-- Row insert (membership_monthly_grants) + credit grant (grant_credit_lot)
-- happen in this one function call = one transaction: if grant_credit_lot
-- raises for any reason, the whole call rolls back, INCLUDING the
-- membership_monthly_grants insert -- there is no code path that leaves a
-- grant row with no matching credit lot.
create or replace function public.ensure_monthly_relationship_grant(
  p_membership_id uuid
)
returns table(cycle_index integer, granted boolean, lot_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_m record;
  v_cycle record;
  v_cycle_end timestamptz;
  v_grant_id uuid;
  v_lot_id uuid;
  v_now timestamptz := now();
begin
  select * into v_m from memberships where id = p_membership_id for update;
  if not found then
    raise exception 'membership not found: %', p_membership_id;
  end if;

  if v_m.status <> 'active' then
    return query select null::integer, false, null::uuid;
    return;
  end if;

  if v_now < v_m.current_term_start or v_now >= v_m.current_term_end then
    return query select null::integer, false, null::uuid;
    return;
  end if;

  select * into v_cycle from membership_cycle_at(v_m.started_at, v_now);
  -- Clamp so a cycle window never straddles a renewal boundary.
  v_cycle_end := least(v_cycle.cycle_end, v_m.current_term_end);

  begin
    insert into membership_monthly_grants (membership_id, cycle_index, cycle_start, cycle_end)
      values (p_membership_id, v_cycle.cycle_index, v_cycle.cycle_start, v_cycle_end)
      returning id into v_grant_id;
  exception when unique_violation then
    select mmg.lot_id into v_lot_id from membership_monthly_grants mmg
      where mmg.membership_id = p_membership_id and mmg.cycle_index = v_cycle.cycle_index;
    return query select v_cycle.cycle_index, false, v_lot_id;
    return;
  end;

  select g.lot_id into v_lot_id from grant_credit_lot(
    v_m.clerk_user_id, 'relationship', 2, 'membership', v_grant_id, v_cycle_end
  ) g;

  update membership_monthly_grants set lot_id = v_lot_id where id = v_grant_id;

  return query select v_cycle.cycle_index, true, v_lot_id;
end;
$$;

-- Additional Relationship ($9.99) add-on eligibility: specifically
-- "has this cycle's 2 included relationship credits been fully used",
-- not "is the user's total relationship balance zero" -- a user who also
-- holds an unrelated one-time relationship credit should not be blocked
-- from buying the add-on, and one who hasn't touched this cycle's
-- included credits yet should not be offered it.
create or replace function public.additional_relationship_eligible(
  p_clerk_user_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_m record;
  v_ensured record;
  v_lot record;
begin
  select * into v_m from memberships
    where clerk_user_id = p_clerk_user_id and status = 'active'
    limit 1;

  if not found then
    return false;
  end if;

  if now() < v_m.current_term_start or now() >= v_m.current_term_end then
    return false;
  end if;

  select * into v_ensured from ensure_monthly_relationship_grant(v_m.id);
  if v_ensured.lot_id is null then
    return false;
  end if;

  perform expire_credit_lots(p_clerk_user_id, 'relationship');

  select * into v_lot from credit_lots where id = v_ensured.lot_id;
  if not found then
    return false;
  end if;

  return v_lot.remaining <= 0;
end;
$$;

-- Redeems a Gift Personal coupon: atomically claims the row (status
-- transition guarded by the WHERE clause, not a separate read-then-write)
-- and grants a normal, non-expiring personal credit_lot to the redeemer.
create or replace function public.redeem_gift_personal_coupon(
  p_code text,
  p_redeemed_by_clerk_user_id text
)
returns table(ok boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon_id uuid;
  v_lot_id uuid;
begin
  update gift_personal_coupons
    set status = 'redeemed',
        redeemed_by_clerk_user_id = p_redeemed_by_clerk_user_id,
        redeemed_at = now()
    where code = p_code and status = 'unredeemed'
    returning id into v_coupon_id;

  if v_coupon_id is null then
    if exists (select 1 from gift_personal_coupons where code = p_code) then
      return query select false, 'already_redeemed_or_revoked';
    else
      return query select false, 'not_found';
    end if;
    return;
  end if;

  select g.lot_id into v_lot_id from grant_credit_lot(
    p_redeemed_by_clerk_user_id, 'personal', 1, 'promo', v_coupon_id, null
  ) g;

  update gift_personal_coupons set redeemed_lot_id = v_lot_id where id = v_coupon_id;

  return query select true, null::text;
end;
$$;

-- Initial purchase of any of the 5 US plans. Idempotent on
-- paddle_transaction_id via the us_purchase_grants unique index (same
-- pattern as process_beta_purchase): a unique_violation on that insert
-- means this exact transaction was already processed (or is mid-flight in
-- a concurrent call), so this no-ops instead of granting twice.
create or replace function public.process_us_purchase(
  p_clerk_user_id text,
  p_plan_id text,
  p_paddle_transaction_id text,
  p_paddle_price_id text,
  p_currency_code text,
  p_paddle_subscription_id text default null
)
returns table(ok boolean, already_processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant_id uuid;
  v_membership_id uuid;
  v_now timestamptz := now();
  v_term_end timestamptz;
  v_welcome_grant_id uuid;
  i integer;
  v_code text;
begin
  if p_plan_id not in (
    'us_personal_premium', 'us_relationship_premium', 'us_insight_pass_30d',
    'us_annual_membership', 'us_additional_relationship'
  ) then
    raise exception 'invalid plan_id: %', p_plan_id;
  end if;

  begin
    insert into us_purchase_grants (
      clerk_user_id, plan_id, event_kind, paddle_transaction_id, paddle_price_id, currency_code
    ) values (
      p_clerk_user_id, p_plan_id, 'initial', p_paddle_transaction_id, p_paddle_price_id, p_currency_code
    )
    returning id into v_grant_id;
  exception when unique_violation then
    return query select true, true;
    return;
  end;

  if p_plan_id = 'us_personal_premium' then
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, null);

  elsif p_plan_id = 'us_relationship_premium' then
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, null);

  elsif p_plan_id = 'us_insight_pass_30d' then
    -- Both credits AND Journal access share the same 30-day window from
    -- purchase -- credits are NOT permanent (see design note: do not let
    -- Journal be the only thing that expires).
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');
    -- Journal access window itself is derived at read time from this
    -- purchase's created_at + 30 days (see lib/entitlements/decisionJournalAccess.ts) --
    -- no separate table needed for a single fixed-length pass.

  elsif p_plan_id = 'us_additional_relationship' then
    -- Eligibility (current cycle's included credits fully used) is
    -- enforced at checkout-session creation time, not here: by the time a
    -- real, verified Paddle transaction exists the charge has already
    -- happened, so this grant must not be able to fail/roll back over an
    -- eligibility re-check -- that would leave the buyer charged with
    -- nothing granted.
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'additional_purchase', v_grant_id, null);

  elsif p_plan_id = 'us_annual_membership' then
    v_term_end := add_calendar_months_clamped(v_now, 12);

    insert into memberships (
      clerk_user_id, plan_id, status, started_at, term_index,
      current_term_start, current_term_end, paddle_subscription_id
    ) values (
      p_clerk_user_id, p_plan_id, 'active', v_now, 0,
      v_now, v_term_end, p_paddle_subscription_id
    )
    returning id into v_membership_id;

    -- Welcome gift: 2x Gift Personal coupons, term_index = 0 ONLY. Guarded
    -- by membership_term_grants' unique (membership_id, term_index,
    -- grant_type) so this can never repeat even if this branch were ever
    -- reached twice for the same membership (it can't be, in practice --
    -- one membership row is created once, right here -- but the guard
    -- costs nothing and matches the same idempotent-by-construction style
    -- as everything else in this file).
    insert into membership_term_grants (membership_id, term_index, grant_type)
      values (v_membership_id, 0, 'welcome_gift_coupons')
      returning id into v_welcome_grant_id;

    for i in 1..2 loop
      v_code := 'GIFT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      insert into gift_personal_coupons (code, issued_to_clerk_user_id, membership_id)
        values (v_code, p_clerk_user_id, v_membership_id);
    end loop;

    -- Member's own Personal credit for this term (term_index = 0), no
    -- expiry -- separate grant_type from the welcome gift so each has its
    -- own idempotency slot.
    insert into membership_term_grants (membership_id, term_index, grant_type)
      values (v_membership_id, 0, 'term_personal_credit')
      returning id into v_grant_id;
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'membership', v_grant_id, null);

    -- Month-1 relationship credits are NOT granted here -- they come from
    -- ensure_monthly_relationship_grant the first time anything checks
    -- this membership's entitlements, same as every later cycle.
  end if;

  return query select true, false;
end;
$$;

-- Annual renewal transaction (a real, separate Paddle transaction each
-- year). Idempotent the same way as the initial purchase: unique on
-- paddle_transaction_id. Bumps term_index/current_term_start/
-- current_term_end and grants that term's Personal credit -- the welcome
-- gift is deliberately NOT repeated.
create or replace function public.process_us_annual_renewal(
  p_clerk_user_id text,
  p_paddle_transaction_id text,
  p_paddle_price_id text,
  p_currency_code text,
  p_paddle_subscription_id text
)
returns table(ok boolean, already_processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant_id uuid;
  v_m record;
  v_new_term_index integer;
  v_new_term_end timestamptz;
begin
  begin
    insert into us_purchase_grants (
      clerk_user_id, plan_id, event_kind, paddle_transaction_id, paddle_price_id, currency_code
    ) values (
      p_clerk_user_id, 'us_annual_membership', 'renewal', p_paddle_transaction_id, p_paddle_price_id, p_currency_code
    )
    returning id into v_grant_id;
  exception when unique_violation then
    return query select true, true;
    return;
  end;

  select * into v_m from memberships
    where paddle_subscription_id = p_paddle_subscription_id
    for update;

  if not found then
    raise exception 'no membership found for paddle_subscription_id: %', p_paddle_subscription_id;
  end if;

  v_new_term_index := v_m.term_index + 1;
  -- Anchored to the ORIGINAL started_at, not current_term_start, so a
  -- string of renewals never accumulates day-of-month drift.
  v_new_term_end := add_calendar_months_clamped(v_m.started_at, (v_new_term_index + 1) * 12);

  update memberships
    set status = 'active',
        term_index = v_new_term_index,
        current_term_start = v_m.current_term_end,
        current_term_end = v_new_term_end,
        updated_at = now()
    where id = v_m.id;

  insert into membership_term_grants (membership_id, term_index, grant_type)
    values (v_m.id, v_new_term_index, 'term_personal_credit')
    returning id into v_grant_id;
  perform grant_credit_lot(v_m.clerk_user_id, 'personal', 1, 'membership', v_grant_id, null);

  return query select true, false;
end;
$$;

revoke all on function public.add_calendar_months_clamped(timestamptz, integer) from public;
revoke all on function public.membership_cycle_at(timestamptz, timestamptz) from public;
revoke all on function public.ensure_monthly_relationship_grant(uuid) from public;
revoke all on function public.additional_relationship_eligible(text) from public;
revoke all on function public.redeem_gift_personal_coupon(text, text) from public;
revoke all on function public.process_us_purchase(text, text, text, text, text, text) from public;
revoke all on function public.process_us_annual_renewal(text, text, text, text, text) from public;

grant execute on function public.add_calendar_months_clamped(timestamptz, integer) to service_role;
grant execute on function public.membership_cycle_at(timestamptz, timestamptz) to service_role;
grant execute on function public.ensure_monthly_relationship_grant(uuid) to service_role;
grant execute on function public.additional_relationship_eligible(text) to service_role;
grant execute on function public.redeem_gift_personal_coupon(text, text) to service_role;
grant execute on function public.process_us_purchase(text, text, text, text, text, text) to service_role;
grant execute on function public.process_us_annual_renewal(text, text, text, text, text) to service_role;

-- =============================================================
-- FILE: 20260922050000_kr_purchase_grants.sql
-- =============================================================

-- =============================================================================
-- KR regional Paddle sandbox catalog (Personal/DEEPSELF, Relationship
-- Single, 30-Day Insight Pass, Relationship Triple) -- deliberately its own
-- table + function, completely separate from us_purchase_grants /
-- process_us_purchase and from the pre-existing beta_purchase_grants /
-- process_beta_purchase:
--
--   - plan_id namespaces never overlap ('kr_*' here vs 'us_*' in
--     us_purchase_grants vs the un-prefixed beta ids in
--     beta_purchase_grants), so there is no code path, migration, or
--     query that could resolve a KR plan id against the US table or vice
--     versa -- the separation is physical, not just a convention.
--   - Grants land in the exact same shared credit_lots / credit_accounts /
--     credit_ledger tables as every other catalog (grant_credit_lot is
--     reused as-is) -- one entitlement engine underneath three separate,
--     never-mixed purchase-grant ledgers on top.
--
-- No membership/annual concept exists in the KR catalog (not part of this
-- request), so nothing here touches memberships/membership_*_grants.
-- =============================================================================

create table if not exists public.kr_purchase_grants (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  plan_id text not null check (plan_id in (
    'kr_personal_premium', 'kr_relationship_premium', 'kr_insight_pass_30d', 'kr_relationship_triple'
  )),
  paddle_transaction_id text not null,
  paddle_price_id text not null,
  currency_code text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists kr_purchase_grants_txn_key
  on public.kr_purchase_grants (paddle_transaction_id);

create index if not exists kr_purchase_grants_user_idx
  on public.kr_purchase_grants (clerk_user_id, created_at desc);

alter table public.kr_purchase_grants enable row level security;
grant select, insert on table public.kr_purchase_grants to service_role;

comment on table public.kr_purchase_grants is
  'RLS enabled; service-role API only. One row per successfully-verified KR-catalog Paddle sandbox transaction -- unique on paddle_transaction_id is the idempotency guard, same pattern as beta_purchase_grants / us_purchase_grants. KR-only plan_id namespace, kept in its own table so it can never be queried/joined against the US or Beta grant tables by accident.';

-- Idempotent on paddle_transaction_id, same contract as process_us_purchase
-- and process_beta_purchase: a unique_violation on the grants insert means
-- this exact transaction already ran (or is mid-flight concurrently), so
-- this no-ops instead of granting twice.
create or replace function public.process_kr_purchase(
  p_clerk_user_id text,
  p_plan_id text,
  p_paddle_transaction_id text,
  p_paddle_price_id text,
  p_currency_code text
)
returns table(ok boolean, already_processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant_id uuid;
  v_now timestamptz := now();
begin
  if p_plan_id not in (
    'kr_personal_premium', 'kr_relationship_premium', 'kr_insight_pass_30d', 'kr_relationship_triple'
  ) then
    raise exception 'invalid plan_id: %', p_plan_id;
  end if;

  begin
    insert into kr_purchase_grants (
      clerk_user_id, plan_id, paddle_transaction_id, paddle_price_id, currency_code
    ) values (
      p_clerk_user_id, p_plan_id, p_paddle_transaction_id, p_paddle_price_id, p_currency_code
    )
    returning id into v_grant_id;
  exception when unique_violation then
    return query select true, true;
    return;
  end;

  if p_plan_id = 'kr_personal_premium' then
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, null);

  elsif p_plan_id = 'kr_relationship_premium' then
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, null);

  elsif p_plan_id = 'kr_insight_pass_30d' then
    -- Same rule as the US pass: credits AND Journal access share the same
    -- 30-day window from purchase, credits are not permanent.
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');

  elsif p_plan_id = 'kr_relationship_triple' then
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 3, 'one_time_purchase', v_grant_id, null);
  end if;

  return query select true, false;
end;
$$;

revoke all on function public.process_kr_purchase(text, text, text, text, text) from public;
grant execute on function public.process_kr_purchase(text, text, text, text, text) to service_role;

-- =============================================================
-- FILE: 20260922060000_kr_purchase_grants_provider_agnostic.sql
-- =============================================================

-- =============================================================================
-- Makes kr_purchase_grants / process_kr_purchase payment-provider-agnostic.
--
-- WHY: both US and KR currently run on Paddle Sandbox while Paddle's domain
-- review is pending, but KR may switch to Toss Payments afterward based on
-- real operational data -- a decision made independently of the US side.
-- The KR entitlement/grant path must not have Paddle baked into its own
-- schema or RPC signature, so that a future Toss integration only has to
-- supply a different `payment_provider` value and its own transaction/price
-- identifiers -- it should never need to touch credit_lots, credit_accounts,
-- credit_ledger, or this table's grant logic at all.
--
-- This does NOT touch the US side (us_purchase_grants / process_us_purchase)
-- or the Beta side (beta_purchase_grants / process_beta_purchase) -- both
-- stay on Paddle only, unchanged, per the request. Only KR is made
-- provider-agnostic, since only KR has a real, stated future provider swap.
--
-- Renames, on the table created in 20260922050000_kr_purchase_grants.sql:
--   paddle_transaction_id -> provider_transaction_id
--   paddle_price_id       -> provider_price_id
-- Adds:
--   payment_provider text not null default 'paddle'
--     (every existing/new-until-switched row is explicitly 'paddle' --
--     never inferred, never nullable, so a future Toss row is required to
--     say so explicitly rather than silently defaulting forever)
--
-- process_kr_purchase is replaced (old 5-arg signature dropped) with a new
-- signature taking p_provider_transaction_id / p_provider_price_id /
-- p_payment_provider (default 'paddle', so every existing call site that
-- doesn't pass it keeps working unchanged). The unique idempotency index
-- moves with the column rename automatically (Postgres renames the index's
-- underlying column reference along with the column).
-- =============================================================================

alter table public.kr_purchase_grants
  rename column paddle_transaction_id to provider_transaction_id;

alter table public.kr_purchase_grants
  rename column paddle_price_id to provider_price_id;

alter table public.kr_purchase_grants
  add column if not exists payment_provider text not null default 'paddle';

comment on table public.kr_purchase_grants is
  'RLS enabled; service-role API only. One row per successfully-verified KR-catalog purchase transaction -- unique on provider_transaction_id is the idempotency guard, same pattern as beta_purchase_grants / us_purchase_grants. KR-only plan_id namespace, kept in its own table so it can never be queried/joined against the US or Beta grant tables by accident. payment_provider records which processor handled the transaction (''paddle'' today; KR may switch to ''toss'' later based on operational data -- the entitlement logic below has no Paddle-specific dependency, only opaque provider transaction/price identifiers).';

comment on column public.kr_purchase_grants.provider_transaction_id is
  'Opaque transaction id from whichever processor handled this purchase (Paddle sandbox transaction id today). Never assume Paddle''s id format.';

comment on column public.kr_purchase_grants.provider_price_id is
  'Opaque price/SKU id from whichever processor handled this purchase. Never assume Paddle''s id format.';

drop function if exists public.process_kr_purchase(text, text, text, text, text);

create or replace function public.process_kr_purchase(
  p_clerk_user_id text,
  p_plan_id text,
  p_provider_transaction_id text,
  p_provider_price_id text,
  p_currency_code text,
  p_payment_provider text default 'paddle'
)
returns table(ok boolean, already_processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant_id uuid;
  v_now timestamptz := now();
begin
  if p_plan_id not in (
    'kr_personal_premium', 'kr_relationship_premium', 'kr_insight_pass_30d', 'kr_relationship_triple'
  ) then
    raise exception 'invalid plan_id: %', p_plan_id;
  end if;

  begin
    insert into kr_purchase_grants (
      clerk_user_id, plan_id, provider_transaction_id, provider_price_id, currency_code, payment_provider
    ) values (
      p_clerk_user_id, p_plan_id, p_provider_transaction_id, p_provider_price_id, p_currency_code, p_payment_provider
    )
    returning id into v_grant_id;
  exception when unique_violation then
    return query select true, true;
    return;
  end;

  if p_plan_id = 'kr_personal_premium' then
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, null);

  elsif p_plan_id = 'kr_relationship_premium' then
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, null);

  elsif p_plan_id = 'kr_insight_pass_30d' then
    -- Same rule as the US pass: credits AND Journal access share the same
    -- 30-day window from purchase, credits are not permanent.
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');

  elsif p_plan_id = 'kr_relationship_triple' then
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 3, 'one_time_purchase', v_grant_id, null);
  end if;

  return query select true, false;
end;
$$;

revoke all on function public.process_kr_purchase(text, text, text, text, text, text) from public;
grant execute on function public.process_kr_purchase(text, text, text, text, text, text) to service_role;

-- =============================================================
-- FILE: 20260922070000_account_deletion_entitlement_cleanup.sql
-- =============================================================

-- =============================================================================
-- Account-deletion cleanup for entitlement/service-usage state, as distinct
-- from actual purchase/transaction evidence.
--
-- Classification (see the Privacy Policy audit this migration accompanies):
--
--   DELETE on account deletion (non-financial service-usage state, no
--   independent legal/accounting retention need):
--     - credit_accounts, credit_lots, credit_reservations, credit_ledger
--       (the entitlement engine's cached balances, individually-tracked
--       grant lots, in-flight reservation holds, and append-only usage
--       history -- none of these carry a currency amount or are
--       themselves evidence a specific payment happened)
--     - memberships, membership_monthly_grants, membership_term_grants,
--       gift_personal_coupons (membership/entitlement STATE -- the actual
--       evidence that a membership was purchased/renewed already lives
--       independently in us_purchase_grants, event_kind in
--       ('initial','renewal'), which this migration does NOT delete)
--
--   RETAIN, but anonymized (sever the direct link to the live Clerk user
--   id, per the "anonymized archival identifier" instruction -- the
--   deleted row's own primary key, which was never shown to the user, is
--   used as that identifier):
--     - us_purchase_grants, kr_purchase_grants, beta_purchase_grants --
--       these are the actual minimal transaction record (provider
--       transaction id, price id, currency, plan/product, timestamp)
--       kept for accounting / e-commerce recordkeeping. plan_id,
--       transaction id, price id, currency_code, created_at are left
--       untouched; only clerk_user_id is replaced with
--       'deleted:<row id>'.
--
-- Cross-user safety: a gift coupon a DIFFERENT (still-active) member
-- issued may have been redeemed BY the user being deleted. Deleting that
-- user's own credit_lots would otherwise violate
-- gift_personal_coupons.redeemed_lot_id's FK (it has no ON DELETE clause,
-- default RESTRICT) and would leave the issuer's coupon row pointing at
-- the deleted user's raw clerk_user_id. So redeemed_by_clerk_user_id /
-- redeemed_lot_id on any coupon NOT owned by this user (i.e. not deleted
-- by the cascade in step 1 below) is cleared FIRST -- the issuer's own
-- coupon row and its 'redeemed' status are left intact; only the
-- redeemer's identity is anonymized away, exactly like every other
-- cross-reference to a deleted user here.
--
-- Order matters (FK dependencies, no ON DELETE clause = RESTRICT unless
-- noted):
--   1. Clear gift_personal_coupons.redeemed_by_clerk_user_id /
--      redeemed_lot_id wherever this user was the REDEEMER (not the
--      issuer -- the issuer's own coupons are removed by cascade in the
--      next step instead).
--   2. Delete memberships owned by this user -- cascades to
--      membership_monthly_grants, membership_term_grants, and any
--      gift_personal_coupons ISSUED under this user's own membership(s)
--      (all three have `references public.memberships(id) on delete
--      cascade`).
--   3. Delete credit_reservations (references credit_lots with no
--      cascade -- must go before credit_lots).
--   4. Delete credit_lots (now safe: step 1 cleared any external
--      redeemed_lot_id reference, step 2's cascade cleared this user's
--      own membership_monthly_grants/membership_term_grants.lot_id
--      references, step 3 cleared this user's own reservations).
--   5. Delete credit_ledger, credit_accounts (no incoming FKs referencing
--      them from elsewhere).
--   6. Anonymize (not delete) the purchase-grant tables.
--
-- Idempotent: safe to call more than once for the same id (every step is
-- a plain DELETE/UPDATE ... WHERE, not an INSERT), which matters because
-- account deletion should never fail-partial in a way that can't be
-- retried.
-- =============================================================================

create or replace function public.cleanup_account_entitlement_data(p_clerk_user_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Sever this user's REDEEMER identity from coupons issued by someone
  -- else (their own issued coupons are handled by the membership cascade
  -- in step 2 instead).
  update gift_personal_coupons
  set redeemed_by_clerk_user_id = null,
      redeemed_lot_id = null
  where redeemed_by_clerk_user_id = p_clerk_user_id
    and membership_id not in (
      select id from memberships where clerk_user_id = p_clerk_user_id
    );

  -- 2. Own memberships + cascaded monthly/term grants + own issued coupons.
  delete from memberships where clerk_user_id = p_clerk_user_id;

  -- 3. In-flight reservation holds.
  delete from credit_reservations where clerk_user_id = p_clerk_user_id;

  -- 4. Individually-tracked grant lots (now unreferenced).
  delete from credit_lots where clerk_user_id = p_clerk_user_id;

  -- 5. Append-only usage ledger + cached balance.
  delete from credit_ledger where clerk_user_id = p_clerk_user_id;
  delete from credit_accounts where clerk_user_id = p_clerk_user_id;

  -- 6. Anonymize (retain) minimal transaction evidence.
  update us_purchase_grants
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;

  update kr_purchase_grants
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;

  update beta_purchase_grants
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;
end;
$$;

revoke all on function public.cleanup_account_entitlement_data(text) from public;
grant execute on function public.cleanup_account_entitlement_data(text) to service_role;

comment on function public.cleanup_account_entitlement_data(text) is
  'Called from app/api/account/delete/route.ts alongside the existing reports-row delete. Deletes non-financial entitlement/service-usage state (credit engine + membership tables) and anonymizes (never deletes) the minimal purchase-grant transaction record kept for accounting/e-commerce recordkeeping, by replacing clerk_user_id with an opaque deleted:<row id> archival identifier. Idempotent.';

-- =============================================================
-- FILE: 20260922080000_paddle_webhooks_and_cancellation.sql
-- =============================================================

-- =============================================================================
-- Paddle webhook infrastructure + Annual Membership cancellation lifecycle.
--
-- Three things this migration adds:
--
--   1. paddle_webhook_events -- idempotency ledger for inbound Paddle
--      webhook deliveries. Paddle explicitly does not guarantee
--      exactly-once delivery (retries on anything but a 2xx), so every
--      webhook is claimed here (unique on paddle_event_id) BEFORE any
--      processing happens. This is a second, independent layer of
--      idempotency on top of the existing paddle_transaction_id unique
--      constraints in us_purchase_grants/kr_purchase_grants/
--      beta_purchase_grants -- belt and suspenders, since a webhook can
--      also carry events (subscription.updated, subscription.canceled)
--      that never touch those tables at all.
--
--   2. memberships.cancel_at_period_end / cancel_requested_at -- tracks a
--      user-or-Paddle-initiated "don't renew" request SEPARATELY from
--      `status`. `status` continues to mean exactly what it always has
--      (does this membership currently grant entitlements) -- a member
--      who cancels keeps `status = 'active'` and keeps their monthly
--      relationship grants and Additional Relationship eligibility until
--      Paddle's own subscription.canceled event confirms the term
--      actually ended (see refundPolicy.ts's existing, unchanged promise:
--      "you will retain access ... until the end of your current billing
--      cycle"). cancel_at_period_end is purely a display/idempotency flag
--      for the cancellation UI and API.
--
--   3. Refund clawback support -- a generic revoke_remaining_credit_for_grant
--      helper (zero out `remaining` on credit_lots for one grant id,
--      never touching credit already consumed) and
--      mark_membership_refunded (revokes every remaining credit lot tied
--      to a membership's own term/monthly grants and sets status to the
--      existing 'refunded' enum value). Neither function invents new
--      status values -- 'refunded' already existed in memberships' check
--      constraint from its first migration.
-- =============================================================================

create table if not exists public.paddle_webhook_events (
  id uuid primary key default gen_random_uuid(),
  paddle_event_id text not null,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists paddle_webhook_events_event_id_key
  on public.paddle_webhook_events (paddle_event_id);

create index if not exists paddle_webhook_events_received_at_idx
  on public.paddle_webhook_events (received_at desc);

alter table public.paddle_webhook_events enable row level security;
grant select, insert, update on table public.paddle_webhook_events to service_role;

comment on table public.paddle_webhook_events is
  'RLS enabled; service-role API only. Idempotency ledger for inbound Paddle webhook deliveries -- unique on paddle_event_id. processed_at is set once app/api/webhooks/paddle/route.ts finishes handling (or deliberately no-ops) an event; null means received but not yet completed.';

-- Claim-before-process: returns true the first time this event_id is seen
-- (caller should process it), false on any repeat delivery (caller should
-- immediately return 200 without reprocessing). Never raises on a
-- duplicate -- that is the expected, common case with Paddle's
-- at-least-once delivery.
create or replace function public.claim_paddle_webhook_event(
  p_paddle_event_id text,
  p_event_type text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into paddle_webhook_events (paddle_event_id, event_type)
    values (p_paddle_event_id, p_event_type);
  return true;
exception when unique_violation then
  return false;
end;
$$;

create or replace function public.mark_paddle_webhook_event_processed(
  p_paddle_event_id text
)
returns void
language sql
security definer
set search_path = public
as $$
  update paddle_webhook_events
  set processed_at = now()
  where paddle_event_id = p_paddle_event_id;
$$;

revoke all on function public.claim_paddle_webhook_event(text, text) from public;
revoke all on function public.mark_paddle_webhook_event_processed(text) from public;
grant execute on function public.claim_paddle_webhook_event(text, text) to service_role;
grant execute on function public.mark_paddle_webhook_event_processed(text) to service_role;

-- -----------------------------------------------------------------------------
-- Membership cancellation tracking
-- -----------------------------------------------------------------------------

alter table public.memberships
  add column if not exists cancel_at_period_end boolean not null default false;

alter table public.memberships
  add column if not exists cancel_requested_at timestamptz;

comment on column public.memberships.cancel_at_period_end is
  'True once a cancellation (user- or Paddle-portal-initiated) has been scheduled for the end of the current term. Does NOT change entitlement behavior by itself -- status remains ''active'' and every existing entitlement check (ensure_monthly_relationship_grant, additional_relationship_eligible) is unaffected until subscription.canceled actually lands and flips status to ''cancelled''. Purely for display and to make the cancel API idempotent.';

-- Set by app/api/account/membership/cancel/route.ts right after a
-- successful Paddle cancel call, AND by the subscription.updated webhook
-- handler whenever Paddle reports a scheduled_change (so a cancellation
-- made through Paddle's own customer portal, not just our UI, is also
-- reflected locally). Idempotent: safe to call with the same values
-- repeatedly.
create or replace function public.set_membership_cancel_schedule(
  p_paddle_subscription_id text,
  p_cancel_at_period_end boolean
)
returns void
language sql
security definer
set search_path = public
as $$
  update memberships
  set cancel_at_period_end = p_cancel_at_period_end,
      cancel_requested_at = case
        when p_cancel_at_period_end then coalesce(cancel_requested_at, now())
        else null
      end,
      updated_at = now()
  where paddle_subscription_id = p_paddle_subscription_id;
$$;

-- Called from the subscription.canceled webhook once Paddle confirms the
-- term has actually ended (or an immediate cancellation, e.g. from account
-- deletion, has taken effect). Terminal: this is the one place `status`
-- moves to 'cancelled'. Idempotent -- re-running for an already-cancelled
-- membership is a harmless no-op update.
create or replace function public.mark_membership_canceled(
  p_paddle_subscription_id text
)
returns void
language sql
security definer
set search_path = public
as $$
  update memberships
  set status = 'cancelled',
      cancel_at_period_end = false,
      updated_at = now()
  where paddle_subscription_id = p_paddle_subscription_id
    and status <> 'cancelled';
$$;

revoke all on function public.set_membership_cancel_schedule(text, boolean) from public;
revoke all on function public.mark_membership_canceled(text) from public;
grant execute on function public.set_membership_cancel_schedule(text, boolean) to service_role;
grant execute on function public.mark_membership_canceled(text) to service_role;

-- -----------------------------------------------------------------------------
-- Refund clawback
-- -----------------------------------------------------------------------------

-- New ledger reason for a refund-driven revocation, same pattern as the
-- 'expiration' reason added in 20260922040000_credit_lots.sql (drop +
-- re-add the check constraint rather than a bare ALTER, since Postgres
-- has no ALTER CONSTRAINT for a CHECK's condition).
alter table public.credit_ledger drop constraint if exists credit_ledger_reason_check;
alter table public.credit_ledger add constraint credit_ledger_reason_check
  check (reason in (
    'reservation_hold', 'consumption', 'reservation_release',
    'membership_grant', 'one_time_purchase', 'additional_purchase', 'promo', 'admin_grant',
    'expiration', 'refund_revocation'
  ));

-- Zeroes REMAINING balance only on credit_lots granted by one specific
-- grant row (a us_purchase_grants/kr_purchase_grants/beta_purchase_grants
-- id for a one-time purchase, or a membership_term_grants/
-- membership_monthly_grants id for a membership-sourced lot). Credit
-- already consumed (a report already generated) is never clawed back --
-- only what the buyer has not yet used. Writes a matching credit_ledger
-- row per affected lot so the balance change is auditable the same way
-- every other balance-affecting event already is, and keeps
-- credit_accounts.balance in sync.
create or replace function public.revoke_remaining_credit_for_grant(
  p_grant_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot record;
  v_new_balance integer;
begin
  for v_lot in
    select id, clerk_user_id, credit_type, remaining
    from credit_lots
    where reference_id = p_grant_id
      and remaining > 0
  loop
    update credit_lots
      set remaining = 0
      where id = v_lot.id;

    update credit_accounts
      set balance = greatest(balance - v_lot.remaining, 0),
          updated_at = now()
      where clerk_user_id = v_lot.clerk_user_id
        and credit_type = v_lot.credit_type
      returning balance into v_new_balance;

    if v_new_balance is not null then
      insert into credit_ledger (
        clerk_user_id, credit_type, delta, reason, source, reference_id, balance_after, enforced
      ) values (
        v_lot.clerk_user_id, v_lot.credit_type, -v_lot.remaining, 'refund_revocation', null, p_grant_id, v_new_balance, true
      );
    end if;
  end loop;
end;
$$;

-- Full refund of an annual membership purchase or renewal: revokes every
-- remaining (unconsumed) credit lot tied to ANY of this membership's own
-- term/monthly grants -- not just the specific term/renewal that was
-- refunded -- and marks the membership 'refunded'. This is deliberately
-- the conservative, whole-membership interpretation: a full refund of an
-- annual purchase is treated as undoing the membership entirely, since
-- Paddle's own adjustment payload does not give us a reliable way to
-- scope a refund to "only this one term" independently of the rest of an
-- active membership. A future partial/term-scoped refund policy would
-- need its own, separately-designed handling -- this migration does not
-- attempt it.
create or replace function public.mark_membership_refunded(
  p_paddle_subscription_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership_id uuid;
  v_grant record;
begin
  select id into v_membership_id
    from memberships
    where paddle_subscription_id = p_paddle_subscription_id;

  if v_membership_id is null then
    return;
  end if;

  for v_grant in
    select id from membership_term_grants where membership_id = v_membership_id
  loop
    perform revoke_remaining_credit_for_grant(v_grant.id);
  end loop;

  for v_grant in
    select id from membership_monthly_grants where membership_id = v_membership_id
  loop
    perform revoke_remaining_credit_for_grant(v_grant.id);
  end loop;

  update gift_personal_coupons
    set status = 'revoked'
    where membership_id = v_membership_id
      and status = 'unredeemed';

  update memberships
    set status = 'refunded',
        cancel_at_period_end = false,
        updated_at = now()
    where id = v_membership_id;
end;
$$;

revoke all on function public.revoke_remaining_credit_for_grant(uuid) from public;
revoke all on function public.mark_membership_refunded(text) from public;
grant execute on function public.revoke_remaining_credit_for_grant(uuid) to service_role;
grant execute on function public.mark_membership_refunded(text) to service_role;

-- =============================================================
-- FILE: 20260923000000_paddle_webhook_idempotency_and_ordering.sql
-- =============================================================

-- =============================================================================
-- Fixes two real bugs in 20260922080000_paddle_webhooks_and_cancellation.sql's
-- webhook infrastructure, found before it ever ran in Sandbox:
--
--   1. claim_paddle_webhook_event only distinguished "never seen" from
--      "seen" (any row existing at all short-circuited to "duplicate,
--      skip"). That conflates RECEIVED with SUCCESSFULLY PROCESSED: if a
--      handler threw after the event was claimed, the event_id row still
--      existed, so Paddle's own retry of that same failed event would be
--      silently skipped forever instead of being retried. Paddle is
--      at-least-once delivery and retries on any non-2xx specifically so
--      failures CAN be retried -- the old code defeated that.
--
--      Fixed with a proper state machine: processed_at IS NOT NULL means
--      actually done (skip); processed_at IS NULL means received but not
--      completed, so it is safe -- and now correct -- to re-claim and
--      retry. A processing_started_at "lease" (2 minutes) additionally
--      protects against two truly concurrent deliveries of the same
--      event_id both running the handler at once: the second sees an
--      unexpired lease and is told 'in_progress' rather than re-running
--      the handler. The claim itself is one atomic
--      INSERT ... ON CONFLICT ... DO UPDATE ... WHERE statement, so this
--      holds under real concurrent callers (Postgres serializes
--      conflicting upserts on the same key) without needing an
--      application-held lock across the claim/handle/mark-done steps
--      (which, split across separate RPC round-trips from Node, could
--      never share one DB transaction anyway).
--
--   2. subscription.updated / subscription.canceled / a refund adjustment
--      can arrive out of order (Paddle does not guarantee delivery
--      order). The previous set_membership_cancel_schedule /
--      mark_membership_canceled / mark_membership_refunded had no notion
--      of event time, so a late-arriving OLDER event could overwrite
--      state a NEWER event had already applied -- e.g. an out-of-order
--      subscription.updated{scheduled_change: cancel} landing after
--      subscription.canceled had already finalized the membership could
--      flip cancel_at_period_end back on for an already-cancelled row.
--
--      Fixed with memberships.last_paddle_event_at: every one of these
--      three functions now takes the triggering event's own occurred_at
--      and only applies its change when that occurred_at is at or after
--      whatever is already stored -- an older, later-arriving event is a
--      harmless no-op instead of a state rollback.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Webhook event state machine: received vs. processed vs. failed vs.
--    in-flight, with a retry-count/lease so a genuine failure gets retried
--    but two concurrent deliveries of the same event don't both run.
-- -----------------------------------------------------------------------------

alter table public.paddle_webhook_events
  add column if not exists occurred_at timestamptz,
  add column if not exists processing_started_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists last_error text;

comment on table public.paddle_webhook_events is
  'RLS enabled; service-role API only. Idempotency + retry state machine for inbound Paddle webhook deliveries, unique on paddle_event_id. processed_at IS NOT NULL is the ONLY thing that means "done, never redo this" -- a row existing with processed_at still null means received but not yet successfully handled (a prior attempt failed, or one is in flight right now), and claim_paddle_webhook_event will correctly re-claim it. processing_started_at is a short lease (see claim_paddle_webhook_event) that keeps two concurrent deliveries of the same event from both running the handler; it is cleared on both success and failure so a genuine failure is immediately retryable rather than waiting out the lease.';

drop function if exists public.claim_paddle_webhook_event(text, text);

-- Atomically claims an event for processing. Returns:
--   'claimed'           -- caller should run the handler now (fresh event,
--                          or a retry of one whose prior attempt failed /
--                          whose lease expired).
--   'already_processed' -- a prior attempt already succeeded; 200, no-op.
--   'in_progress'        -- another delivery of this same event is
--                          currently inside its lease window; caller
--                          should return a non-2xx so Paddle retries
--                          later (by which time that other attempt will
--                          have either finished, clearing this state via
--                          mark_processed/mark_failed, or its lease will
--                          have expired and the retry will claim it).
--
-- The claim itself is a single INSERT ... ON CONFLICT ... DO UPDATE ...
-- WHERE statement -- atomic under concurrent execution by Postgres's own
-- conflict-resolution locking, so no advisory lock or SELECT ... FOR
-- UPDATE is needed here.
create or replace function public.claim_paddle_webhook_event(
  p_paddle_event_id text,
  p_event_type text,
  p_occurred_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lease_seconds constant integer := 120;
  v_claimed_rows integer;
  v_already_processed boolean;
begin
  insert into paddle_webhook_events (
    paddle_event_id, event_type, occurred_at, processing_started_at, attempt_count
  )
  values (
    p_paddle_event_id, p_event_type, p_occurred_at, now(), 1
  )
  on conflict (paddle_event_id) do update
    set processing_started_at = now(),
        attempt_count = paddle_webhook_events.attempt_count + 1,
        failed_at = null
    where paddle_webhook_events.processed_at is null
      and (
        paddle_webhook_events.processing_started_at is null
        or paddle_webhook_events.processing_started_at < now() - make_interval(secs => v_lease_seconds)
      );

  get diagnostics v_claimed_rows = row_count;

  if v_claimed_rows > 0 then
    return 'claimed';
  end if;

  select processed_at is not null into strict v_already_processed
  from paddle_webhook_events
  where paddle_event_id = p_paddle_event_id;

  if v_already_processed then
    return 'already_processed';
  end if;

  return 'in_progress';
end;
$$;

create or replace function public.mark_paddle_webhook_event_processed(
  p_paddle_event_id text
)
returns void
language sql
security definer
set search_path = public
as $$
  update paddle_webhook_events
  set processed_at = now(),
      processing_started_at = null
  where paddle_event_id = p_paddle_event_id;
$$;

-- Releases the lease immediately (processing_started_at = null) so a fast
-- Paddle retry -- or a manual retry -- can re-claim right away instead of
-- waiting out the 2-minute lease window meant for genuine concurrency,
-- not for a handler that has already thrown and returned.
create or replace function public.mark_paddle_webhook_event_failed(
  p_paddle_event_id text,
  p_last_error text
)
returns void
language sql
security definer
set search_path = public
as $$
  update paddle_webhook_events
  set failed_at = now(),
      last_error = left(coalesce(p_last_error, 'unknown_error'), 500),
      processing_started_at = null
  where paddle_event_id = p_paddle_event_id;
$$;

revoke all on function public.claim_paddle_webhook_event(text, text, timestamptz) from public;
revoke all on function public.mark_paddle_webhook_event_failed(text, text) from public;
grant execute on function public.claim_paddle_webhook_event(text, text, timestamptz) to service_role;
grant execute on function public.mark_paddle_webhook_event_failed(text, text) to service_role;

-- -----------------------------------------------------------------------------
-- 2. Out-of-order-delivery guard for membership state transitions driven
--    by webhook events.
-- -----------------------------------------------------------------------------

alter table public.memberships
  add column if not exists last_paddle_event_at timestamptz;

comment on column public.memberships.last_paddle_event_at is
  'occurred_at of the most recent Paddle webhook event that successfully changed cancel_at_period_end/status on this row. set_membership_cancel_schedule / mark_membership_canceled / mark_membership_refunded all no-op when handed an occurred_at older than this -- an out-of-order redelivery of a stale event can never roll back state a newer event already applied. Not touched by the initial purchase/renewal grant path (process_us_purchase / process_us_annual_renewal), which has no ordering ambiguity of its own (each transaction id is independently idempotent).';

drop function if exists public.set_membership_cancel_schedule(text, boolean);

create or replace function public.set_membership_cancel_schedule(
  p_paddle_subscription_id text,
  p_cancel_at_period_end boolean,
  p_event_occurred_at timestamptz
)
returns void
language sql
security definer
set search_path = public
as $$
  update memberships
  set cancel_at_period_end = p_cancel_at_period_end,
      cancel_requested_at = case
        when p_cancel_at_period_end then coalesce(cancel_requested_at, now())
        else null
      end,
      last_paddle_event_at = p_event_occurred_at,
      updated_at = now()
  where paddle_subscription_id = p_paddle_subscription_id
    and (last_paddle_event_at is null or last_paddle_event_at <= p_event_occurred_at);
$$;

drop function if exists public.mark_membership_canceled(text);

create or replace function public.mark_membership_canceled(
  p_paddle_subscription_id text,
  p_event_occurred_at timestamptz
)
returns void
language sql
security definer
set search_path = public
as $$
  update memberships
  set status = 'cancelled',
      cancel_at_period_end = false,
      last_paddle_event_at = p_event_occurred_at,
      updated_at = now()
  where paddle_subscription_id = p_paddle_subscription_id
    and status <> 'cancelled'
    and (last_paddle_event_at is null or last_paddle_event_at <= p_event_occurred_at);
$$;

drop function if exists public.mark_membership_refunded(text);

create or replace function public.mark_membership_refunded(
  p_paddle_subscription_id text,
  p_event_occurred_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership_id uuid;
  v_grant record;
begin
  select id into v_membership_id
    from memberships
    where paddle_subscription_id = p_paddle_subscription_id
      and (last_paddle_event_at is null or last_paddle_event_at <= p_event_occurred_at);

  if v_membership_id is null then
    return;
  end if;

  for v_grant in
    select id from membership_term_grants where membership_id = v_membership_id
  loop
    perform revoke_remaining_credit_for_grant(v_grant.id);
  end loop;

  for v_grant in
    select id from membership_monthly_grants where membership_id = v_membership_id
  loop
    perform revoke_remaining_credit_for_grant(v_grant.id);
  end loop;

  update gift_personal_coupons
    set status = 'revoked'
    where membership_id = v_membership_id
      and status = 'unredeemed';

  update memberships
    set status = 'refunded',
        cancel_at_period_end = false,
        last_paddle_event_at = p_event_occurred_at,
        updated_at = now()
    where id = v_membership_id;
end;
$$;

revoke all on function public.set_membership_cancel_schedule(text, boolean, timestamptz) from public;
revoke all on function public.mark_membership_canceled(text, timestamptz) from public;
revoke all on function public.mark_membership_refunded(text, timestamptz) from public;
grant execute on function public.set_membership_cancel_schedule(text, boolean, timestamptz) to service_role;
grant execute on function public.mark_membership_canceled(text, timestamptz) to service_role;
grant execute on function public.mark_membership_refunded(text, timestamptz) to service_role;

-- =============================================================
-- FILE: 20260923010000_paddle_adjustment_idempotency.sql
-- =============================================================

-- =============================================================================
-- Adjustment-level (not just event-level) idempotency for refund clawback.
--
-- The webhook-event idempotency added in
-- 20260923000000_paddle_webhook_idempotency_and_ordering.sql keys off
-- Paddle's own event_id. That is correct for "don't process the same
-- DELIVERY twice", but a single real-world refund is not one event_id --
-- Paddle sends adjustment.created (often status=pending_approval) and then
-- one or more adjustment.updated events (e.g. once it lands on
-- status=approved) for the SAME underlying adjustment.id. Event-id-level
-- idempotency alone does nothing to stop adjustment.created{approved} and
-- a later adjustment.updated{approved} for that same adjustment from BOTH
-- reaching the refund-clawback code path -- they are two different,
-- individually-legitimate event_ids.
--
-- On audit, revoke_remaining_credit_for_grant and mark_membership_refunded
-- are each individually safe against being CALLED AGAIN sequentially for
-- the same grant/subscription (they only ever act on remaining > 0 /
-- status <> 'refunded' rows, so a second sequential call is a no-op).
-- BUT that is not enough under real concurrency: if two deliveries for the
-- same adjustment_id are handled by two overlapping requests,
-- revoke_remaining_credit_for_grant's own loop (SELECT ... WHERE
-- remaining > 0, then UPDATE using the value read at SELECT time) has a
-- classic read-then-write race -- two concurrent callers can both read
-- remaining=100 before either commits, and both decrement
-- credit_accounts.balance by 100 and insert a credit_ledger row, double
-- clawing back the same credit and double-logging it. This migration
-- closes that gap with an explicit adjustment_id-level atomic claim,
-- structurally identical to claim_paddle_webhook_event's own state
-- machine (received vs. processed vs. in-flight, with a lease so a
-- genuine failure can still be retried).
-- =============================================================================

create table if not exists public.processed_paddle_adjustments (
  id uuid primary key default gen_random_uuid(),
  adjustment_id text not null,
  transaction_id text,
  subscription_id text,
  action text not null,
  status text not null,
  processing_started_at timestamptz,
  processed_at timestamptz,
  failed_at timestamptz,
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

create unique index if not exists processed_paddle_adjustments_adjustment_id_key
  on public.processed_paddle_adjustments (adjustment_id);

create index if not exists processed_paddle_adjustments_created_at_idx
  on public.processed_paddle_adjustments (created_at desc);

alter table public.processed_paddle_adjustments enable row level security;
grant select, insert, update on table public.processed_paddle_adjustments to service_role;

comment on table public.processed_paddle_adjustments is
  'RLS enabled; service-role API only. Idempotency key for refund CLAWBACK SIDE EFFECTS, keyed on Paddle''s adjustment.id -- distinct from paddle_webhook_events, which keys on event_id and does not by itself prevent adjustment.created and a later adjustment.updated for the same adjustment from both triggering the clawback. processed_at IS NOT NULL means the clawback for this adjustment has actually run to completion; a row existing with processed_at still null means a prior attempt failed or one is currently in flight (see claim_paddle_adjustment_refund).';

-- Same claim semantics as claim_paddle_webhook_event: 'claimed' means run
-- the clawback now, 'already_processed' means a prior attempt already
-- succeeded (no-op), 'in_progress' means another delivery of an event for
-- this same adjustment_id is inside its lease window right now (caller
-- should treat this as a failure so the OUTER webhook event gets retried
-- later, by which point this will have resolved).
create or replace function public.claim_paddle_adjustment_refund(
  p_adjustment_id text,
  p_action text,
  p_status text,
  p_transaction_id text,
  p_subscription_id text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lease_seconds constant integer := 120;
  v_claimed_rows integer;
  v_already_processed boolean;
begin
  insert into processed_paddle_adjustments (
    adjustment_id, action, status, transaction_id, subscription_id,
    processing_started_at, attempt_count
  )
  values (
    p_adjustment_id, p_action, p_status, p_transaction_id, p_subscription_id,
    now(), 1
  )
  on conflict (adjustment_id) do update
    set processing_started_at = now(),
        attempt_count = processed_paddle_adjustments.attempt_count + 1,
        failed_at = null,
        -- Keep the latest known status/action for observability (e.g. a
        -- pending_approval row later reclaimed by the approved event) --
        -- purely informational, never part of the idempotency decision.
        status = p_status,
        action = p_action
    where processed_paddle_adjustments.processed_at is null
      and (
        processed_paddle_adjustments.processing_started_at is null
        or processed_paddle_adjustments.processing_started_at < now() - make_interval(secs => v_lease_seconds)
      );

  get diagnostics v_claimed_rows = row_count;

  if v_claimed_rows > 0 then
    return 'claimed';
  end if;

  select processed_at is not null into strict v_already_processed
  from processed_paddle_adjustments
  where adjustment_id = p_adjustment_id;

  if v_already_processed then
    return 'already_processed';
  end if;

  return 'in_progress';
end;
$$;

create or replace function public.mark_paddle_adjustment_processed(
  p_adjustment_id text
)
returns void
language sql
security definer
set search_path = public
as $$
  update processed_paddle_adjustments
  set processed_at = now(),
      processing_started_at = null
  where adjustment_id = p_adjustment_id;
$$;

create or replace function public.mark_paddle_adjustment_failed(
  p_adjustment_id text,
  p_last_error text
)
returns void
language sql
security definer
set search_path = public
as $$
  update processed_paddle_adjustments
  set failed_at = now(),
      last_error = left(coalesce(p_last_error, 'unknown_error'), 500),
      processing_started_at = null
  where adjustment_id = p_adjustment_id;
$$;

revoke all on function public.claim_paddle_adjustment_refund(text, text, text, text, text) from public;
revoke all on function public.mark_paddle_adjustment_processed(text) from public;
revoke all on function public.mark_paddle_adjustment_failed(text, text) from public;
grant execute on function public.claim_paddle_adjustment_refund(text, text, text, text, text) to service_role;
grant execute on function public.mark_paddle_adjustment_processed(text) to service_role;
grant execute on function public.mark_paddle_adjustment_failed(text, text) to service_role;

-- =============================================================
-- End of the 10 migration files -- commit the transaction now.
-- =============================================================
commit;

-- =============================================================
-- VERIFICATION (read-only) -- runs after commit, against the final
-- committed state. Every column below should now be `true`.
-- Compare against the pre-migration check, which returned all
-- `false` for these same 10 checks.
-- =============================================================
select
  (to_regprocedure('public.process_us_purchase(text,text,text,text,text,text)') is not null) as has_process_us_purchase,
  (to_regprocedure('public.process_kr_purchase(text,text,text,text,text,text)') is not null) as has_process_kr_purchase,
  (to_regprocedure('public.additional_relationship_eligible(text)') is not null) as has_additional_relationship_eligible,
  (to_regprocedure('public.claim_paddle_webhook_event(text,text,timestamptz)') is not null) as has_claim_paddle_webhook_event,
  (to_regclass('public.paddle_webhook_events') is not null) as has_webhook_events_table,
  (to_regclass('public.processed_paddle_adjustments') is not null) as has_adjustments_table,
  (to_regclass('public.credit_lots') is not null) as has_credit_lots,
  (to_regclass('public.memberships') is not null) as has_memberships,
  (to_regclass('public.us_purchase_grants') is not null) as has_us_purchase_grants,
  (to_regclass('public.kr_purchase_grants') is not null) as has_kr_purchase_grants;
