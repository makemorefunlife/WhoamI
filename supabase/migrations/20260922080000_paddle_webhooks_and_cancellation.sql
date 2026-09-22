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
