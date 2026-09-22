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
