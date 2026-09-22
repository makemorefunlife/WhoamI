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
