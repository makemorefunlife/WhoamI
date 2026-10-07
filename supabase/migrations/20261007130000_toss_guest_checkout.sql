-- =============================================================================
-- Toss guest (non-member) checkout: pay without signing in, then claim the
-- purchase into an account after proving ownership of the order email.
--
-- Flow:
--   1. Guest order: toss_payment_orders row with clerk_user_id NULL and a
--      normalized guest_email (KR one-time plans only -- see
--      lib/payment/tossCatalog.ts guestCheckout).
--   2. claim_guest_toss_order_for_confirm -> Toss confirm -> mark_toss_order_paid.
--      The order stays 'paid' (money captured, nothing granted yet).
--   3. The buyer signs in / signs up. claim_paid_guest_toss_order attaches
--      the order to that Clerk user ONLY IF one of the user's verified email
--      addresses (passed in by the server from Clerk, never from the client)
--      equals guest_email, then grants through process_toss_order.
--      Validity windows are re-anchored to the PAYMENT time (approved_at), so
--      "12 months / 30 days from purchase" holds no matter when the claim
--      happens.
--
-- Additive and forward-only. Depends on 20261007120000.
-- =============================================================================

alter table public.toss_payment_orders alter column clerk_user_id drop not null;
alter table public.toss_payment_orders add column if not exists guest_email text;
alter table public.toss_payment_orders add column if not exists claimed_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'toss_payment_orders_owner_check') then
    alter table public.toss_payment_orders
      add constraint toss_payment_orders_owner_check
      check (clerk_user_id is not null or guest_email is not null);
  end if;
end $$;

create index if not exists toss_payment_orders_guest_claim_idx
  on public.toss_payment_orders (guest_email)
  where clerk_user_id is null and status = 'paid';

comment on column public.toss_payment_orders.guest_email is
  'Guest checkout only: lower-cased, trimmed buyer email. The order can be claimed only by a Clerk user holding this address as a VERIFIED email. Kept for the transaction record; nulled on account deletion of the claimer.';

-- Guest variant of claim_toss_order_for_confirm: no account to match, so the
-- order must be an unclaimed guest order; amount + paymentKey checks are the
-- same.
create or replace function public.claim_guest_toss_order_for_confirm(
  p_order_id text,
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

  if v_o.guest_email is null or v_o.amount <> p_amount
     or (v_o.payment_key is not null and v_o.payment_key <> p_payment_key) then
    return query select 'mismatch'::text, v_o.plan_id, v_o.amount, v_o.currency;
    return;
  end if;

  if v_o.status = 'ready' then
    update toss_payment_orders
      set status = 'confirming', payment_key = p_payment_key, updated_at = now()
      where id = v_o.id;
    return query select 'claimed'::text, v_o.plan_id, v_o.amount, v_o.currency;
  elsif v_o.status = 'confirming' then
    if v_o.updated_at < now() - interval '2 minutes' then
      update toss_payment_orders set updated_at = now() where id = v_o.id;
      return query select 'claimed'::text, v_o.plan_id, v_o.amount, v_o.currency;
    else
      return query select 'in_progress'::text, v_o.plan_id, v_o.amount, v_o.currency;
    end if;
  elsif v_o.status = 'paid' and v_o.clerk_user_id is null then
    return query select 'awaiting_claim'::text, v_o.plan_id, v_o.amount, v_o.currency;
  else
    -- 'paid' + claimed, 'granted', 'failed', 'canceled', 'refunded'
    return query select v_o.status::text, v_o.plan_id, v_o.amount, v_o.currency;
  end if;
end;
$$;

-- Attaches a paid guest order to a Clerk user after email-ownership proof
-- and grants it. Idempotent: re-claiming your own order returns
-- already_processed; another account can never take it over.
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

  update toss_payment_orders
    set clerk_user_id = p_clerk_user_id, claimed_at = now(), updated_at = now()
    where id = v_o.id;

  select * into v_r from process_toss_order(p_order_id);

  -- Re-anchor every window to the payment time: the grant functions start
  -- windows at now() (= the claim), the policy says "from purchase".
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
  end if;

  return query select 'claimed'::text, coalesce(v_r.already_processed, false);
end;
$$;

revoke all on function public.claim_guest_toss_order_for_confirm(text, text, numeric) from public;
revoke all on function public.claim_paid_guest_toss_order(text, text, text[]) from public;
grant execute on function public.claim_guest_toss_order_for_confirm(text, text, numeric) to service_role;
grant execute on function public.claim_paid_guest_toss_order(text, text, text[]) to service_role;

-- Account deletion: also drop the guest email from orders the user claimed.
-- Steps 1-7 copied verbatim from 20261007120000; step 8 is new.
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

  -- 8. (2026-10-07 guest checkout) claimed guest orders lose the email too.
  update toss_payment_orders
  set clerk_user_id = 'deleted:' || id::text,
      guest_email = case when guest_email is not null then 'deleted' else null end
  where clerk_user_id = p_clerk_user_id;

  update membership_refund_requests
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;
end;
$$;

revoke all on function public.cleanup_account_entitlement_data(text) from public;
grant execute on function public.cleanup_account_entitlement_data(text) to service_role;

select
  (to_regprocedure('public.claim_paid_guest_toss_order(text,text,text[])') is not null) as has_guest_claim;
