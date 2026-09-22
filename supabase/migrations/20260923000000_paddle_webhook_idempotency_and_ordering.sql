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
