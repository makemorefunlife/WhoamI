-- =============================================================================
-- 12-Month Membership becomes a ONE-TIME purchase (Toss Payments), plus
-- membership-bound expiries and operator-driven prorated refunds.
--
-- Product decision (Sera, 2026-10-07): every product in both regions is a
-- one-time purchase. The US membership is $280 paid once for 12 months --
-- NOT an auto-renewing subscription.
--
-- FORWARD-ONLY. Nothing here rewrites an existing row's entitlement:
--   * Existing memberships are back-filled as billing_model =
--     'paddle_recurring' and keep their current behavior (renewal path,
--     cancel-at-period-end, permanent term Personal credit, gift coupon
--     1-year-from-issue rule, Paddle full-refund clawback).
--   * Existing credit_lots / gift_personal_coupons rows are not updated.
--   * Only purchases/redemptions made AFTER this migration get the new
--     rules below.
--
-- What changes for NEW purchases:
--   1. us_annual_membership can no longer be created through Paddle
--      (process_us_purchase raises 'membership_paddle_path_retired'); it is
--      created only by process_toss_order from a confirmed Toss payment,
--      as billing_model = 'one_time_12m' with no subscription id.
--   2. One-time membership: the term Personal credit, both welcome gift
--      coupons, and any credit a gift coupon produces expire at the
--      membership's current_term_end (monthly Relationship credits already
--      expired at their cycle end <= term end).
--   3. us_additional_relationship ($9.99) credit: purchase date + 1 year
--      (was permanent).
--   4. Operator refunds for one-time memberships:
--      membership_refund_requests + open/begin/complete/fail functions.
--      Amount = price paid x unused days / total days (UTC calendar days,
--      request-received date = cancellation date), rounded to the cent;
--      full refund only within 7 days with no detected benefit use.
--      Benefits end ONLY after the provider confirms the refund.
--
-- Prepared for review; NOT applied to Production by this file. Apply to
-- dev first, then Production via `supabase db push` / SQL editor after
-- review (see docs/dev/decisions/2026-10-07_one_time_membership_toss.md).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Schema additions (all additive, all with safe defaults)
-- -----------------------------------------------------------------------------

alter table public.us_purchase_grants
  add column if not exists payment_provider text not null default 'paddle';

comment on column public.us_purchase_grants.payment_provider is
  'Which processor handled this transaction (''paddle'' | ''toss''). For toss rows, paddle_transaction_id holds ''toss:<paymentKey>'' and paddle_price_id holds ''toss:<plan_id>'' -- the column names predate the second provider and are kept to avoid a breaking rename.';

alter table public.memberships
  add column if not exists billing_model text not null default 'paddle_recurring';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'memberships_billing_model_check'
  ) then
    alter table public.memberships
      add constraint memberships_billing_model_check
      check (billing_model in ('paddle_recurring', 'one_time_12m'));
  end if;
end $$;

alter table public.memberships add column if not exists price_paid numeric(12, 2);
alter table public.memberships add column if not exists price_currency text;
alter table public.memberships add column if not exists payment_order_id text;
alter table public.memberships add column if not exists ended_at timestamptz;
alter table public.memberships add column if not exists refunded_at timestamptz;

comment on column public.memberships.billing_model is
  '''paddle_recurring'' = legacy auto-renewing Paddle subscription (every row that existed before 2026-10-07 -- keeps its original terms). ''one_time_12m'' = $280 paid once via Toss, 12 months, never renews.';

alter table public.gift_personal_coupons
  add column if not exists expires_at timestamptz;

comment on column public.gift_personal_coupons.expires_at is
  'NULL = legacy rule (code valid 1 year from created_at, claimed credit valid 1 year from claim). Set for one-time memberships: the code must be claimed AND the resulting credit used before this instant (= membership current_term_end).';

-- Toss order ledger: one row per checkout attempt. orderId is generated
-- server-side; amount/currency are fixed server-side from the catalog and
-- re-checked at confirm time, so a tampered client amount can never be
-- confirmed.
create table if not exists public.toss_payment_orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  clerk_user_id text not null,
  plan_id text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency in ('KRW', 'USD')),
  order_name text not null,
  status text not null default 'ready' check (status in (
    'ready',        -- created, payment window not completed yet
    'confirming',   -- confirm claimed by a server request (Toss confirm in flight)
    'paid',         -- Toss confirmed DONE; entitlement grant not finished yet (retryable)
    'granted',      -- entitlement granted
    'failed',       -- Toss confirm rejected; nothing charged
    'canceled',     -- paid then fully canceled (e.g. grant impossible) -- see last_error
    'refunded'      -- operator refund completed (full or prorated)
  )),
  payment_key text,
  method text,
  approved_at timestamptz,
  grant_attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists toss_payment_orders_order_id_key
  on public.toss_payment_orders (order_id);
create unique index if not exists toss_payment_orders_payment_key_key
  on public.toss_payment_orders (payment_key) where payment_key is not null;
create index if not exists toss_payment_orders_user_idx
  on public.toss_payment_orders (clerk_user_id, created_at desc);
create index if not exists toss_payment_orders_attention_idx
  on public.toss_payment_orders (updated_at) where status in ('confirming', 'paid');

alter table public.toss_payment_orders enable row level security;
grant select, insert, update on table public.toss_payment_orders to service_role;

comment on table public.toss_payment_orders is
  'RLS enabled; service-role API only. Toss Payments checkout orders. Rows stuck in confirming/paid need attention (retry POST /api/payments/toss/confirm with the same orderId/paymentKey, or reconcile in the Toss dashboard). Kept on account deletion with clerk_user_id anonymized (transaction record).';

create table if not exists public.membership_refund_requests (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid references public.memberships(id) on delete set null,
  clerk_user_id text not null,
  payment_order_id text not null,
  request_received_on date not null,
  mode text not null check (mode in ('full_within_7_days', 'prorated')),
  price_paid numeric(12, 2) not null,
  currency text not null,
  total_days integer not null check (total_days > 0),
  unused_days integer not null check (unused_days >= 0),
  refund_amount numeric(12, 2) not null check (refund_amount >= 0),
  benefits_used_detected boolean not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'succeeded', 'failed')),
  attempts integer not null default 0,
  last_error text,
  provider_reference text,
  operator text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  succeeded_at timestamptz
);

-- One refund per membership: a failed request is RETRIED (same row, same
-- Toss Idempotency-Key = id), never duplicated.
create unique index if not exists membership_refund_requests_one_per_membership
  on public.membership_refund_requests (membership_id) where membership_id is not null;

alter table public.membership_refund_requests enable row level security;
grant select, insert, update on table public.membership_refund_requests to service_role;

comment on table public.membership_refund_requests is
  'RLS enabled; service-role API only. Operator-initiated refunds of one-time 12-Month Memberships. id doubles as the Toss cancel Idempotency-Key, so retries after a failure/timeout can never refund twice.';

-- -----------------------------------------------------------------------------
-- 2. process_us_purchase: retire the Paddle membership path, 1-year expiry
--    for the $9.99 Additional Relationship. Every other branch copied
--    verbatim from 20260926090000_single_purchase_and_triple_one_year_expiry.sql.
-- -----------------------------------------------------------------------------
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
  v_now timestamptz := now();
begin
  if p_plan_id not in (
    'us_personal_premium', 'us_relationship_premium', 'us_insight_pass_30d',
    'us_annual_membership', 'us_additional_relationship'
  ) then
    raise exception 'invalid plan_id: %', p_plan_id;
  end if;

  -- An already-recorded transaction (e.g. a late webhook retry for a legacy
  -- Paddle membership bought before this migration) is still answered as
  -- already_processed -- the idempotency check runs BEFORE the retirement
  -- check below, so nothing that was granted before is disturbed.
  if exists (select 1 from us_purchase_grants where paddle_transaction_id = p_paddle_transaction_id) then
    return query select true, true;
    return;
  end if;

  if p_plan_id = 'us_annual_membership' then
    -- 2026-10-07: the membership is a one-time Toss purchase now. A NEW
    -- membership can only be created by process_toss_order.
    raise exception 'membership_paddle_path_retired';
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
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, v_now + interval '1 year');

  elsif p_plan_id = 'us_relationship_premium' then
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, v_now + interval '1 year');

  elsif p_plan_id = 'us_insight_pass_30d' then
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');

  elsif p_plan_id = 'us_additional_relationship' then
    -- 2026-10-07: 12 months from purchase (was permanent). Eligibility is
    -- still enforced at checkout creation, never here.
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'additional_purchase', v_grant_id, v_now + interval '1 year');
  end if;

  return query select true, false;
end;
$$;

revoke all on function public.process_us_purchase(text, text, text, text, text, text) from public;
grant execute on function public.process_us_purchase(text, text, text, text, text, text) to service_role;

-- -----------------------------------------------------------------------------
-- 3. Toss order lifecycle
-- -----------------------------------------------------------------------------

-- Claims an order for confirmation. Verifies owner + amount + currency
-- against the server-created row. Returns the order's status AFTER the
-- claim so the caller knows what to do:
--   'claimed'      -> call Toss confirm now
--   'paid'         -> Toss already confirmed; (re)try the grant only
--   'granted'      -> nothing to do (duplicate request)
--   'in_progress'  -> another request is confirming right now
--   'mismatch' / 'not_found' / 'failed' / 'canceled' / 'refunded' -> stop
create or replace function public.claim_toss_order_for_confirm(
  p_order_id text,
  p_clerk_user_id text,
  p_payment_key text,
  p_amount numeric
)
returns table(result text, plan_id text, amount numeric, currency text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o record;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found then
    return query select 'not_found'::text, null::text, null::numeric, null::text;
    return;
  end if;

  if v_o.clerk_user_id <> p_clerk_user_id or v_o.amount <> p_amount then
    return query select 'mismatch'::text, v_o.plan_id, v_o.amount, v_o.currency;
    return;
  end if;

  if v_o.payment_key is not null and v_o.payment_key <> p_payment_key then
    return query select 'mismatch'::text, v_o.plan_id, v_o.amount, v_o.currency;
    return;
  end if;

  if v_o.status = 'ready' then
    update toss_payment_orders
      set status = 'confirming', payment_key = p_payment_key, updated_at = now()
      where id = v_o.id;
    return query select 'claimed'::text, v_o.plan_id, v_o.amount, v_o.currency;
  elsif v_o.status = 'confirming' then
    -- A confirm that crashed mid-flight can be re-driven after a short
    -- grace period; Toss's Idempotency-Key (= order_id) makes the repeat
    -- confirm call return the original result instead of charging again.
    if v_o.updated_at < now() - interval '2 minutes' then
      update toss_payment_orders set updated_at = now() where id = v_o.id;
      return query select 'claimed'::text, v_o.plan_id, v_o.amount, v_o.currency;
    else
      return query select 'in_progress'::text, v_o.plan_id, v_o.amount, v_o.currency;
    end if;
  else
    return query select v_o.status::text, v_o.plan_id, v_o.amount, v_o.currency;
  end if;
end;
$$;

create or replace function public.mark_toss_order_paid(
  p_order_id text,
  p_payment_key text,
  p_method text,
  p_approved_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update toss_payment_orders
    set status = 'paid',
        payment_key = p_payment_key,
        method = p_method,
        approved_at = p_approved_at,
        updated_at = now()
    where order_id = p_order_id
      and status in ('confirming', 'ready');
end;
$$;

-- Toss rejected the confirm (card declined, timeout before approval, ...):
-- nothing was charged, so the order can simply be failed. Never overwrites
-- a paid/granted order.
create or replace function public.mark_toss_order_failed(
  p_order_id text,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update toss_payment_orders
    set status = 'failed', last_error = left(p_error, 500), updated_at = now()
    where order_id = p_order_id
      and status in ('ready', 'confirming');
end;
$$;

create or replace function public.mark_toss_order_canceled(
  p_order_id text,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update toss_payment_orders
    set status = 'canceled', last_error = left(p_error, 500), updated_at = now()
    where order_id = p_order_id
      and status = 'paid';
end;
$$;

-- Grants the entitlement for a PAID Toss order. Idempotent on the order:
-- a second call (client retry, double tab) returns already_processed.
-- Raises 'active_membership_exists' when a membership purchase hits a user
-- who already has an in-term membership -- the caller then cancels the
-- Toss payment (normally prevented earlier, at order creation and right
-- before confirm).
create or replace function public.process_toss_order(
  p_order_id text
)
returns table(ok boolean, already_processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o record;
  v_txn text;
  v_grant_id uuid;
  v_membership_id uuid;
  v_now timestamptz := now();
  v_term_end timestamptz;
  v_code text;
  i integer;
  v_r record;
  v_already boolean := false;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found then
    raise exception 'toss order not found';
  end if;

  if v_o.status = 'granted' then
    return query select true, true;
    return;
  end if;
  if v_o.status <> 'paid' or v_o.payment_key is null then
    raise exception 'toss order not paid: %', v_o.status;
  end if;

  v_txn := 'toss:' || v_o.payment_key;

  update toss_payment_orders
    set grant_attempts = grant_attempts + 1, updated_at = now()
    where id = v_o.id;

  if v_o.plan_id = 'us_annual_membership' then
    -- Same idempotency key as every other US purchase: the transaction id.
    begin
      insert into us_purchase_grants (
        clerk_user_id, plan_id, event_kind, paddle_transaction_id, paddle_price_id, currency_code, payment_provider
      ) values (
        v_o.clerk_user_id, v_o.plan_id, 'initial', v_txn, 'toss:' || v_o.plan_id, v_o.currency, 'toss'
      )
      returning id into v_grant_id;
    exception when unique_violation then
      update toss_payment_orders set status = 'granted', updated_at = now() where id = v_o.id;
      return query select true, true;
      return;
    end;

    -- A finished one-time membership keeps status 'active' until something
    -- closes it; close any whose term is over so the one-active-per-user
    -- index admits the new one. Legacy recurring rows are only closed when
    -- their term is over AND they were already scheduled to cancel --
    -- otherwise a legacy member is still mid-renewal and must not be
    -- touched.
    update memberships
      set status = 'ended', ended_at = v_now, updated_at = v_now
      where clerk_user_id = v_o.clerk_user_id
        and status = 'active'
        and current_term_end <= v_now
        and (billing_model = 'one_time_12m' or cancel_at_period_end = true);

    if exists (
      select 1 from memberships where clerk_user_id = v_o.clerk_user_id and status = 'active'
    ) then
      raise exception 'active_membership_exists';
    end if;

    v_term_end := add_calendar_months_clamped(v_now, 12);

    insert into memberships (
      clerk_user_id, plan_id, status, started_at, term_index,
      current_term_start, current_term_end, paddle_subscription_id,
      billing_model, price_paid, price_currency, payment_order_id
    ) values (
      v_o.clerk_user_id, v_o.plan_id, 'active', v_now, 0,
      v_now, v_term_end, null,
      'one_time_12m', v_o.amount, v_o.currency, v_o.order_id
    )
    returning id into v_membership_id;

    insert into membership_term_grants (membership_id, term_index, grant_type)
      values (v_membership_id, 0, 'welcome_gift_coupons');

    for i in 1..2 loop
      v_code := 'GIFT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      insert into gift_personal_coupons (code, issued_to_clerk_user_id, membership_id, expires_at)
        values (v_code, v_o.clerk_user_id, v_membership_id, v_term_end);
    end loop;

    insert into membership_term_grants (membership_id, term_index, grant_type)
      values (v_membership_id, 0, 'term_personal_credit')
      returning id into v_grant_id;
    -- One-time membership: the included Personal credit ends with the term.
    perform grant_credit_lot(v_o.clerk_user_id, 'personal', 1, 'membership', v_grant_id, v_term_end);

  elsif v_o.plan_id like 'us\_%' then
    select * into v_r from process_us_purchase(
      v_o.clerk_user_id, v_o.plan_id, v_txn, 'toss:' || v_o.plan_id, v_o.currency, null
    );
    v_already := coalesce(v_r.already_processed, false);
    update us_purchase_grants set payment_provider = 'toss'
      where paddle_transaction_id = v_txn and payment_provider <> 'toss';

  elsif v_o.plan_id like 'kr\_%' then
    select * into v_r from process_kr_purchase(
      v_o.clerk_user_id, v_o.plan_id, v_txn, 'toss:' || v_o.plan_id, v_o.currency, 'toss'
    );
    v_already := coalesce(v_r.already_processed, false);

  else
    raise exception 'unsupported plan for toss: %', v_o.plan_id;
  end if;

  update toss_payment_orders set status = 'granted', last_error = null, updated_at = now() where id = v_o.id;
  return query select true, v_already;
end;
$$;

revoke all on function public.claim_toss_order_for_confirm(text, text, text, numeric) from public;
revoke all on function public.mark_toss_order_paid(text, text, text, timestamptz) from public;
revoke all on function public.mark_toss_order_failed(text, text) from public;
revoke all on function public.mark_toss_order_canceled(text, text) from public;
revoke all on function public.process_toss_order(text) from public;
grant execute on function public.claim_toss_order_for_confirm(text, text, text, numeric) to service_role;
grant execute on function public.mark_toss_order_paid(text, text, text, timestamptz) to service_role;
grant execute on function public.mark_toss_order_failed(text, text) to service_role;
grant execute on function public.mark_toss_order_canceled(text, text) to service_role;
grant execute on function public.process_toss_order(text) to service_role;

-- -----------------------------------------------------------------------------
-- 4. Gift coupons: membership-bound expiry for one-time memberships.
--    Legacy coupons (expires_at IS NULL) keep the exact 2026-09-28 rule.
-- -----------------------------------------------------------------------------
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
  v_issued_to text;
  v_created_at timestamptz;
  v_expires_at timestamptz;
  v_lot_expires timestamptz;
  v_lot_id uuid;
begin
  select id, issued_to_clerk_user_id, created_at, expires_at
    into v_coupon_id, v_issued_to, v_created_at, v_expires_at
    from gift_personal_coupons
    where code = p_code
    for update;

  if v_coupon_id is null then
    return query select false, 'not_found';
    return;
  end if;

  if v_issued_to = p_redeemed_by_clerk_user_id then
    return query select false, 'cannot_claim_own_gift';
    return;
  end if;

  if v_expires_at is not null then
    -- One-time membership coupon: claimable only until the membership ends,
    -- and the claimed credit ends at the same instant.
    if v_expires_at <= now() then
      return query select false, 'expired';
      return;
    end if;
    v_lot_expires := v_expires_at;
  else
    -- Legacy rule (unchanged): code valid 1 year from issue, credit valid
    -- 1 year from claim.
    if v_created_at + interval '1 year' <= now() then
      return query select false, 'expired';
      return;
    end if;
    v_lot_expires := now() + interval '1 year';
  end if;

  update gift_personal_coupons
    set status = 'redeemed',
        redeemed_by_clerk_user_id = p_redeemed_by_clerk_user_id,
        redeemed_at = now()
    where id = v_coupon_id and status = 'unredeemed'
    returning id into v_coupon_id;

  if v_coupon_id is null then
    return query select false, 'already_redeemed_or_revoked';
    return;
  end if;

  select g.lot_id into v_lot_id from grant_credit_lot(
    p_redeemed_by_clerk_user_id, 'personal', 1, 'promo', v_coupon_id, v_lot_expires
  ) g;

  update gift_personal_coupons set redeemed_lot_id = v_lot_id where id = v_coupon_id;

  return query select true, null::text;
end;
$$;

revoke all on function public.redeem_gift_personal_coupon(text, text) from public;
grant execute on function public.redeem_gift_personal_coupon(text, text) to service_role;

-- -----------------------------------------------------------------------------
-- 5. Operator refunds (one-time memberships only)
-- -----------------------------------------------------------------------------

-- Ends every membership-bound benefit. Credits already CONSUMED (reports
-- already generated) are untouched by construction -- only `remaining` is
-- zeroed. Separately purchased credits (one_time_purchase /
-- additional_purchase lots) are never referenced by these grant ids and are
-- not touched. Lots are also hard-expired so an in-flight generation that
-- later RELEASES its hold cannot resurrect a usable credit.
create or replace function public.end_one_time_membership_benefits(
  p_membership_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref record;
begin
  for v_ref in
    select id from membership_term_grants where membership_id = p_membership_id
    union all
    select id from membership_monthly_grants where membership_id = p_membership_id
    union all
    -- Gift credits already claimed but not yet used (lot.reference_id =
    -- coupon id, see redeem_gift_personal_coupon) -- policy: canceled.
    select id from gift_personal_coupons where membership_id = p_membership_id and status = 'redeemed'
  loop
    perform revoke_remaining_credit_for_grant(v_ref.id);
    update credit_lots
      set expires_at = least(coalesce(expires_at, now()), now())
      where reference_id = v_ref.id;
  end loop;

  update gift_personal_coupons
    set status = 'revoked'
    where membership_id = p_membership_id and status = 'unredeemed';

  update memberships
    set status = 'refunded', refunded_at = now(), cancel_at_period_end = false, updated_at = now()
    where id = p_membership_id and status <> 'refunded';
end;
$$;

-- Read-only quote, used by both the preview API and open_membership_refund
-- so the amount shown to the operator is exactly the amount refunded.
create or replace function public.quote_membership_refund(
  p_membership_id uuid,
  p_request_received_on date
)
returns table(
  eligible boolean,
  reason text,
  price_paid numeric,
  currency text,
  total_days integer,
  unused_days integer,
  prorated_amount numeric,
  within_7_days boolean,
  benefits_used_detected boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_m record;
  v_start date;
  v_end date;
  v_total integer;
  v_unused integer;
  v_used boolean;
begin
  select * into v_m from memberships where id = p_membership_id;
  if not found then
    return query select false, 'not_found', null::numeric, null::text, null::int, null::int, null::numeric, null::boolean, null::boolean;
    return;
  end if;
  if v_m.billing_model <> 'one_time_12m' or v_m.payment_order_id is null or v_m.price_paid is null then
    return query select false, 'legacy_membership', null::numeric, null::text, null::int, null::int, null::numeric, null::boolean, null::boolean;
    return;
  end if;
  if v_m.status = 'refunded' then
    return query select false, 'already_refunded', null::numeric, null::text, null::int, null::int, null::numeric, null::boolean, null::boolean;
    return;
  end if;

  v_start := (v_m.started_at at time zone 'UTC')::date;
  v_end := (v_m.current_term_end at time zone 'UTC')::date;

  if p_request_received_on < v_start then
    return query select false, 'request_before_start', null::numeric, null::text, null::int, null::int, null::numeric, null::boolean, null::boolean;
    return;
  end if;

  v_total := greatest(v_end - v_start, 1);
  v_unused := least(greatest(v_end - p_request_received_on, 0), v_total);

  select
    exists (
      select 1 from credit_lots cl
      where cl.reference_id in (
        select id from membership_term_grants where membership_id = v_m.id
        union all
        select id from membership_monthly_grants where membership_id = v_m.id
      )
      and cl.remaining < cl.amount
    )
    or exists (
      select 1 from gift_personal_coupons where membership_id = v_m.id and status = 'redeemed'
    )
  into v_used;

  return query select
    true,
    null::text,
    v_m.price_paid,
    v_m.price_currency,
    v_total,
    v_unused,
    case when v_m.price_currency = 'KRW'
      then round(v_m.price_paid * v_unused / v_total, 0)
      else round(v_m.price_paid * v_unused / v_total, 2)
    end,
    (p_request_received_on - v_start) < 7,
    v_used;
end;
$$;

-- Opens (or returns the existing) refund request for a membership.
-- Idempotent: one request per membership; a second call returns the same
-- row unchanged. The full-refund mode is refused when it doesn't qualify.
create or replace function public.open_membership_refund(
  p_membership_id uuid,
  p_request_received_on date,
  p_mode text,
  p_operator text,
  p_note text default null
)
returns table(request_id uuid, created boolean, status text, refund_amount numeric, currency text, error text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_m record;
  v_q record;
  v_existing record;
  v_amount numeric;
  v_id uuid;
begin
  if p_mode not in ('full_within_7_days', 'prorated') then
    return query select null::uuid, false, null::text, null::numeric, null::text, 'invalid_mode';
    return;
  end if;

  select * into v_m from memberships where id = p_membership_id for update;
  if not found then
    return query select null::uuid, false, null::text, null::numeric, null::text, 'not_found';
    return;
  end if;

  select * into v_existing from membership_refund_requests where membership_id = p_membership_id;
  if found then
    return query select v_existing.id, false, v_existing.status, v_existing.refund_amount, v_existing.currency, null::text;
    return;
  end if;

  select * into v_q from quote_membership_refund(p_membership_id, p_request_received_on);
  if not v_q.eligible then
    return query select null::uuid, false, null::text, null::numeric, null::text, v_q.reason;
    return;
  end if;

  if p_mode = 'full_within_7_days' then
    if not v_q.within_7_days then
      return query select null::uuid, false, null::text, null::numeric, null::text, 'not_within_7_days';
      return;
    end if;
    if v_q.benefits_used_detected then
      return query select null::uuid, false, null::text, null::numeric, null::text, 'benefits_used';
      return;
    end if;
    v_amount := v_q.price_paid;
  else
    v_amount := v_q.prorated_amount;
  end if;

  if v_amount <= 0 then
    return query select null::uuid, false, null::text, null::numeric, null::text, 'nothing_to_refund';
    return;
  end if;

  insert into membership_refund_requests (
    membership_id, clerk_user_id, payment_order_id, request_received_on, mode,
    price_paid, currency, total_days, unused_days, refund_amount, benefits_used_detected,
    operator, note
  ) values (
    v_m.id, v_m.clerk_user_id, v_m.payment_order_id, p_request_received_on, p_mode,
    v_q.price_paid, v_q.currency, v_q.total_days, v_q.unused_days, v_amount, v_q.benefits_used_detected,
    p_operator, p_note
  )
  returning id into v_id;

  return query select v_id, true, 'pending'::text, v_amount, v_q.currency, null::text;
end;
$$;

-- Claims one refund attempt. 'claimed' -> call Toss cancel now with
-- Idempotency-Key = request id. A crashed attempt left in 'processing' can
-- be re-claimed after 2 minutes; Toss returns the original result for the
-- same Idempotency-Key, so the money can never move twice.
create or replace function public.begin_membership_refund_attempt(
  p_request_id uuid
)
returns table(result text, payment_key text, refund_amount numeric, currency text, membership_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_r record;
  v_key text;
begin
  select * into v_r from membership_refund_requests where id = p_request_id for update;
  if not found then
    return query select 'not_found'::text, null::text, null::numeric, null::text, null::uuid;
    return;
  end if;

  if v_r.status = 'succeeded' then
    return query select 'already_succeeded'::text, null::text, v_r.refund_amount, v_r.currency, v_r.membership_id;
    return;
  end if;

  if v_r.status = 'processing' and v_r.updated_at > now() - interval '2 minutes' then
    return query select 'in_progress'::text, null::text, v_r.refund_amount, v_r.currency, v_r.membership_id;
    return;
  end if;

  select o.payment_key into v_key from toss_payment_orders o where o.order_id = v_r.payment_order_id;
  if v_key is null then
    return query select 'missing_payment'::text, null::text, v_r.refund_amount, v_r.currency, v_r.membership_id;
    return;
  end if;

  update membership_refund_requests
    set status = 'processing', attempts = attempts + 1, updated_at = now()
    where id = v_r.id;

  return query select 'claimed'::text, v_key, v_r.refund_amount, v_r.currency, v_r.membership_id;
end;
$$;

-- Provider confirmed the refund: record it and end the membership's
-- benefits in the SAME transaction. Idempotent.
create or replace function public.complete_membership_refund(
  p_request_id uuid,
  p_provider_reference text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_r record;
begin
  select * into v_r from membership_refund_requests where id = p_request_id for update;
  if not found then
    return false;
  end if;
  if v_r.status = 'succeeded' then
    return true;
  end if;

  update membership_refund_requests
    set status = 'succeeded', provider_reference = p_provider_reference,
        last_error = null, succeeded_at = now(), updated_at = now()
    where id = v_r.id;

  if v_r.membership_id is not null then
    perform end_one_time_membership_benefits(v_r.membership_id);
  end if;

  update toss_payment_orders set status = 'refunded', updated_at = now()
    where order_id = v_r.payment_order_id and status = 'granted';

  return true;
end;
$$;

-- Provider rejected/errored: record it, change NO benefits. The request
-- stays retryable (begin_membership_refund_attempt accepts 'failed').
create or replace function public.fail_membership_refund(
  p_request_id uuid,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update membership_refund_requests
    set status = 'failed', last_error = left(p_error, 500), updated_at = now()
    where id = p_request_id and status <> 'succeeded';
end;
$$;

revoke all on function public.end_one_time_membership_benefits(uuid) from public;
revoke all on function public.quote_membership_refund(uuid, date) from public;
revoke all on function public.open_membership_refund(uuid, date, text, text, text) from public;
revoke all on function public.begin_membership_refund_attempt(uuid) from public;
revoke all on function public.complete_membership_refund(uuid, text) from public;
revoke all on function public.fail_membership_refund(uuid, text) from public;
grant execute on function public.end_one_time_membership_benefits(uuid) to service_role;
grant execute on function public.quote_membership_refund(uuid, date) to service_role;
grant execute on function public.open_membership_refund(uuid, date, text, text, text) to service_role;
grant execute on function public.begin_membership_refund_attempt(uuid) to service_role;
grant execute on function public.complete_membership_refund(uuid, text) to service_role;
grant execute on function public.fail_membership_refund(uuid, text) to service_role;

-- -----------------------------------------------------------------------------
-- 6. Account deletion: keep the new financial records, anonymized.
--    Steps 1-6 copied verbatim from 20260922070000; step 7 is new.
-- -----------------------------------------------------------------------------
create or replace function public.cleanup_account_entitlement_data(p_clerk_user_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update gift_personal_coupons
  set redeemed_by_clerk_user_id = null,
      redeemed_lot_id = null
  where redeemed_by_clerk_user_id = p_clerk_user_id
    and membership_id not in (
      select id from memberships where clerk_user_id = p_clerk_user_id
    );

  delete from memberships where clerk_user_id = p_clerk_user_id;

  delete from credit_reservations where clerk_user_id = p_clerk_user_id;

  delete from credit_lots where clerk_user_id = p_clerk_user_id;

  delete from credit_ledger where clerk_user_id = p_clerk_user_id;
  delete from credit_accounts where clerk_user_id = p_clerk_user_id;

  update us_purchase_grants
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;

  update kr_purchase_grants
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;

  update beta_purchase_grants
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;

  -- 7. (2026-10-07) Toss orders + membership refund records: retained,
  -- anonymized. membership_refund_requests.membership_id is already set
  -- null by its FK when the membership row is deleted above.
  update toss_payment_orders
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;

  update membership_refund_requests
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;
end;
$$;

revoke all on function public.cleanup_account_entitlement_data(text) from public;
grant execute on function public.cleanup_account_entitlement_data(text) to service_role;

-- Verification (read-only)
select
  (to_regclass('public.toss_payment_orders') is not null) as has_toss_payment_orders,
  (to_regclass('public.membership_refund_requests') is not null) as has_membership_refund_requests,
  (to_regprocedure('public.process_toss_order(text)') is not null) as has_process_toss_order,
  (select count(*) from public.memberships where billing_model = 'paddle_recurring') as legacy_memberships_kept;
