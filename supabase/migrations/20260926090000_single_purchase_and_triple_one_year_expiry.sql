-- =============================================================================
-- Phase 2 product rule: single-purchase Personal/Relationship credits and the
-- KR Relationship Triple pack now expire 1 year after purchase, instead of
-- being permanent (expires_at = null). The 30-Day Insight Pass already
-- expires correctly (process_us_purchase / process_kr_purchase's
-- us_insight_pass_30d / kr_insight_pass_30d branches, unchanged here).
--
-- ADDITIVE / FORWARD-ONLY: this only changes what a NEW purchase grants going
-- forward. It does not touch any existing credit_lots row -- an already-
-- granted permanent lot (expires_at = null) stays permanent; nothing here
-- updates/backfills existing rows. Not applied to Production by this
-- migration file itself (prepared for review + Sera's own `supabase db push`
-- or dashboard apply).
--
-- CREATE OR REPLACE with an unchanged function signature -- no DROP needed,
-- and every other branch of both functions (30-Day Pass, Annual Membership,
-- Additional Relationship top-up, idempotency guard, welcome-gift coupons)
-- is copied verbatim, unchanged, from the current definitions in
-- 20260922040300_us_membership_functions.sql and
-- 20260922060000_kr_purchase_grants_provider_agnostic.sql.
--
-- Left deliberately untouched (out of this Phase 2 rule's stated scope):
--   - us_annual_membership's per-term Personal credit (term_personal_credit)
--     -- that credit's lifecycle is tied to the membership term, not to a
--     single purchase, and the product rules for Phase 2 name only
--     "Personal single" / "Relationship single" / "KR Relationship Triple".
--   - us_additional_relationship (the $9.99 members-only top-up) -- also not
--     named in the Phase 2 rules; left permanent as it is today.
-- =============================================================================

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
    -- Phase 2: single-purchase credits now expire 1 year after purchase
    -- (was: permanent / expires_at = null).
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, v_now + interval '1 year');

  elsif p_plan_id = 'us_relationship_premium' then
    -- Phase 2: single-purchase credits now expire 1 year after purchase
    -- (was: permanent / expires_at = null).
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, v_now + interval '1 year');

  elsif p_plan_id = 'us_insight_pass_30d' then
    -- Both credits AND Journal access share the same 30-day window from
    -- purchase -- credits are NOT permanent (see design note: do not let
    -- Journal be the only thing that expires). Unchanged by this migration.
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
    -- nothing granted. Left permanent -- not named in the Phase 2 rules.
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
    -- own idempotency slot. Left permanent -- tied to the membership term,
    -- not named as a "single purchase" in the Phase 2 rules.
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

revoke all on function public.process_us_purchase(text, text, text, text, text, text) from public;
grant execute on function public.process_us_purchase(text, text, text, text, text, text) to service_role;

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
    -- Phase 2: single-purchase credits now expire 1 year after purchase
    -- (was: permanent / expires_at = null).
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, v_now + interval '1 year');

  elsif p_plan_id = 'kr_relationship_premium' then
    -- Phase 2: single-purchase credits now expire 1 year after purchase
    -- (was: permanent / expires_at = null).
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, v_now + interval '1 year');

  elsif p_plan_id = 'kr_insight_pass_30d' then
    -- Same rule as the US pass: credits AND Journal access share the same
    -- 30-day window from purchase, credits are not permanent. Unchanged by
    -- this migration.
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');

  elsif p_plan_id = 'kr_relationship_triple' then
    -- Phase 2: now expires 1 year after purchase (was: permanent). Still a
    -- single lot of 3 relationship credits -- reserve_credit's existing
    -- expires_at asc nulls last ordering already spends this lot before any
    -- permanent relationship lot, and within the lot itself
    -- grant_credit_lot's amount=3 decrements the same lot's `remaining` on
    -- each of the 3 consumptions, so no schema change is needed for
    -- "remaining count" -- credit_lots.remaining already tracks it.
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 3, 'one_time_purchase', v_grant_id, v_now + interval '1 year');
  end if;

  return query select true, false;
end;
$$;

revoke all on function public.process_kr_purchase(text, text, text, text, text, text) from public;
grant execute on function public.process_kr_purchase(text, text, text, text, text, text) to service_role;
