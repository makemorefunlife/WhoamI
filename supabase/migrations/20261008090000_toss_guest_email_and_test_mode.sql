-- =============================================================================
-- Toss guest checkout: purchase-guide email queue, claim-link nonce, order
-- locale, Toss receipt URL, and test-payment marking.
--
-- Additive: new nullable / defaulted columns, one more allowed order status
-- ('test_completed'), new functions. Existing rows keep their meaning
-- (is_test = false, no email state).
--
--   locale                    'ko-KR' | 'en-US' -- purchase language
--   is_test                   created with a Toss TEST secret key (no real charge)
--   receipt_url               Toss's own receipt page (payment.receipt.url)
--   claim_token_nonce         per-order nonce; the claim-link token is
--                             HMAC(server secret, order_id:nonce),
--                             never stored. Identifies the order / prefills
--                             the sign-in email only -- grants nothing.
--   claim_token_expires_at    claim-LINK expiry (30 days). NOT the pass expiry:
--                             an expired link only means "request a new link";
--                             the paid order and its pass are unaffected.
--   guest_email_*             purchase-guide email queue:
--       status   pending -> sending -> sent
--                         \-> retry (transient error / 429, next_attempt_at)
--                         \-> failed (permanent error or attempts exhausted)
--                skipped (not to be sent, e.g. a public test payment)
--       generation  bumped on every operator re-send / new-link request; part
--                   of the Resend Idempotency-Key, so one generation is
--                   delivered at most once even across crashes and retries.
--   status 'test_completed'   a TEST payment on a public deployment that was
--                             not turned into an entitlement (recorded as a
--                             completed test, kept apart from real purchases;
--                             not cancelled at Toss -- test keys move no money).
-- =============================================================================

alter table public.toss_payment_orders add column if not exists locale text;
alter table public.toss_payment_orders add column if not exists is_test boolean not null default false;
alter table public.toss_payment_orders add column if not exists receipt_url text;
alter table public.toss_payment_orders add column if not exists claim_token_nonce text;
alter table public.toss_payment_orders add column if not exists claim_token_expires_at timestamptz;
alter table public.toss_payment_orders add column if not exists guest_email_status text;
alter table public.toss_payment_orders add column if not exists guest_email_attempts integer not null default 0;
alter table public.toss_payment_orders add column if not exists guest_email_generation integer not null default 0;
alter table public.toss_payment_orders add column if not exists guest_email_next_attempt_at timestamptz;
alter table public.toss_payment_orders add column if not exists guest_email_last_error text;
alter table public.toss_payment_orders add column if not exists guest_email_sent_at timestamptz;
alter table public.toss_payment_orders add column if not exists guest_email_message_id text;
alter table public.toss_payment_orders add column if not exists guest_email_locked_at timestamptz;
alter table public.toss_payment_orders add column if not exists test_grant_blocked_reason text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'toss_payment_orders_locale_check') then
    alter table public.toss_payment_orders
      add constraint toss_payment_orders_locale_check
      check (locale is null or locale in ('ko-KR', 'en-US'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'toss_payment_orders_guest_email_status_check') then
    alter table public.toss_payment_orders
      add constraint toss_payment_orders_guest_email_status_check
      check (guest_email_status is null or guest_email_status in ('pending', 'sending', 'sent', 'retry', 'failed', 'skipped'));
  end if;
end $$;

-- One more order status: 'test_completed'.
alter table public.toss_payment_orders drop constraint if exists toss_payment_orders_status_check;
alter table public.toss_payment_orders
  add constraint toss_payment_orders_status_check
  check (status in ('ready', 'confirming', 'paid', 'granted', 'failed', 'canceled', 'refunded', 'test_completed'));

create index if not exists toss_payment_orders_test_grants_idx
  on public.toss_payment_orders (clerk_user_id)
  where is_test and status = 'granted';
create index if not exists toss_payment_orders_email_queue_idx
  on public.toss_payment_orders (guest_email_next_attempt_at)
  where guest_email_status in ('pending', 'retry', 'sending');

comment on column public.toss_payment_orders.is_test is
  'Created with a Toss TEST secret key (no real charge). On public deployments a test order becomes an entitlement only for server-side allowlisted accounts within a quantity limit; otherwise status = test_completed.';
comment on column public.toss_payment_orders.claim_token_expires_at is
  'Expiry of the emailed claim LINK only. The order and its pass are unaffected; a new link can be requested (sent to the order email).';

-- Stores Toss's receipt URL once (first value wins).
create or replace function public.set_toss_order_receipt(p_order_id text, p_receipt_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update toss_payment_orders
    set receipt_url = left(p_receipt_url, 1000), updated_at = now()
    where order_id = p_order_id and receipt_url is null and p_receipt_url is not null;
end;
$$;

-- Queues the purchase-guide email of a paid guest order (once).
create or replace function public.queue_guest_purchase_email(p_order_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update toss_payment_orders
    set guest_email_status = 'pending', guest_email_next_attempt_at = now(), updated_at = now()
    where order_id = p_order_id
      and guest_email is not null
      and clerk_user_id is null
      and status = 'paid'
      and guest_email_status is null;
end;
$$;

-- Claims one send attempt. Exactly one caller gets 'claimed' at a time
-- (row lock + 'sending' lease of 2 minutes); returns the generation that
-- forms the provider idempotency key.
create or replace function public.claim_guest_purchase_email(
  p_order_id text,
  p_max_attempts integer default 6
)
returns table(result text, attempts integer, generation integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o record;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found then
    return query select 'not_found'::text, 0, 0;
    return;
  end if;
  if v_o.guest_email is null then
    return query select 'not_guest'::text, v_o.guest_email_attempts, v_o.guest_email_generation;
    return;
  end if;
  if v_o.status <> 'paid' or v_o.approved_at is null then
    return query select 'not_paid'::text, v_o.guest_email_attempts, v_o.guest_email_generation;
    return;
  end if;
  if v_o.clerk_user_id is not null then
    return query select 'already_claimed'::text, v_o.guest_email_attempts, v_o.guest_email_generation;
    return;
  end if;
  if v_o.guest_email_status is null or v_o.guest_email_status in ('sent', 'failed', 'skipped') then
    return query select coalesce(v_o.guest_email_status, 'not_queued')::text, v_o.guest_email_attempts, v_o.guest_email_generation;
    return;
  end if;
  if v_o.guest_email_status = 'sending' and v_o.guest_email_locked_at > now() - interval '2 minutes' then
    return query select 'in_progress'::text, v_o.guest_email_attempts, v_o.guest_email_generation;
    return;
  end if;
  if v_o.guest_email_status = 'retry' and v_o.guest_email_next_attempt_at > now() then
    return query select 'not_due'::text, v_o.guest_email_attempts, v_o.guest_email_generation;
    return;
  end if;
  if v_o.guest_email_attempts >= greatest(p_max_attempts, 1) then
    update toss_payment_orders
      set guest_email_status = 'failed', guest_email_last_error = coalesce(guest_email_last_error, 'max_attempts'),
          guest_email_locked_at = null, updated_at = now()
      where id = v_o.id;
    return query select 'failed'::text, v_o.guest_email_attempts, v_o.guest_email_generation;
    return;
  end if;
  update toss_payment_orders
    set guest_email_status = 'sending',
        guest_email_attempts = guest_email_attempts + 1,
        guest_email_locked_at = now(),
        updated_at = now()
    where id = v_o.id;
  return query select 'claimed'::text, v_o.guest_email_attempts + 1, v_o.guest_email_generation;
end;
$$;

-- Records an attempt: 'sent' | 'retry' (with p_retry_after_seconds) | 'failed' | 'skipped'.
create or replace function public.finish_guest_purchase_email(
  p_order_id text,
  p_outcome text,
  p_message_id text default null,
  p_error text default null,
  p_retry_after_seconds integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_outcome not in ('sent', 'retry', 'failed', 'skipped') then
    raise exception 'invalid outcome: %', p_outcome;
  end if;
  update toss_payment_orders
    set guest_email_status = p_outcome,
        guest_email_message_id = case when p_outcome = 'sent' then left(p_message_id, 200) else guest_email_message_id end,
        guest_email_sent_at = case when p_outcome = 'sent' then now() else guest_email_sent_at end,
        guest_email_last_error = case when p_outcome = 'sent' then null else left(p_error, 300) end,
        -- retry: provider-requested delay, else exponential backoff
        -- (1, 2, 4, 8, 16 ... minutes, capped at 6 hours)
        guest_email_next_attempt_at = case
          when p_outcome = 'retry' then now() + make_interval(secs => greatest(
            coalesce(p_retry_after_seconds, 0),
            least(60 * power(2, greatest(guest_email_attempts - 1, 0)), 21600)::integer))
          else null end,
        guest_email_locked_at = null,
        updated_at = now()
    where order_id = p_order_id
      and guest_email is not null
      and coalesce(guest_email_status, '') <> 'sent';
end;
$$;

-- Order ids whose purchase-guide email is due (for the background processor).
create or replace function public.due_guest_purchase_emails(p_limit integer default 20)
returns table(order_id text)
language sql
stable
security definer
set search_path = public
as $$
  select o.order_id from toss_payment_orders o
  where o.guest_email is not null
    and o.clerk_user_id is null
    and o.status = 'paid'
    and (
      (o.guest_email_status in ('pending', 'retry') and coalesce(o.guest_email_next_attempt_at, now()) <= now())
      or (o.guest_email_status = 'sending' and o.guest_email_locked_at <= now() - interval '2 minutes')
    )
  order by coalesce(o.guest_email_next_attempt_at, o.updated_at)
  limit greatest(least(p_limit, 100), 1);
$$;

-- New generation of the purchase-guide email: operator re-send, or a new
-- claim link requested by the buyer (always delivered to the ORDER email).
-- p_new_nonce rotates the link (old links stop working); p_min_interval
-- throttles buyer requests. Never touches the payment or the pass.
create or replace function public.reissue_guest_purchase_email(
  p_order_id text,
  p_new_nonce text default null,
  p_new_expires_at timestamptz default null,
  p_min_interval_seconds integer default 0
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o record;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found or v_o.guest_email is null then
    return 'not_found';
  end if;
  if v_o.clerk_user_id is not null then
    return 'already_claimed';
  end if;
  if v_o.status <> 'paid' then
    return 'not_paid';
  end if;
  if v_o.guest_email_status = 'sending' and v_o.guest_email_locked_at > now() - interval '2 minutes' then
    return 'in_progress';
  end if;
  if p_min_interval_seconds > 0 and v_o.guest_email_sent_at is not null
     and v_o.guest_email_sent_at > now() - make_interval(secs => p_min_interval_seconds) then
    return 'too_soon';
  end if;
  update toss_payment_orders
    set guest_email_status = 'pending',
        guest_email_attempts = 0,
        guest_email_generation = guest_email_generation + 1,
        guest_email_next_attempt_at = now(),
        guest_email_locked_at = null,
        claim_token_nonce = coalesce(p_new_nonce, claim_token_nonce),
        claim_token_expires_at = coalesce(p_new_expires_at, claim_token_expires_at),
        updated_at = now()
    where id = v_o.id;
  return 'reissued';
end;
$$;

-- Number of TEST orders already granted to an account (allowlisted testers'
-- quantity limit on public deployments).
create or replace function public.count_toss_test_grants(p_clerk_user_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from toss_payment_orders
  where is_test and clerk_user_id = p_clerk_user_id and status = 'granted';
$$;

-- A paid TEST order that must not become an entitlement: closes it as
-- 'test_completed' (kept apart from real purchases), records why, and stops
-- any pending purchase-guide email. Only ever applies to is_test orders.
create or replace function public.complete_toss_test_without_grant(p_order_id text, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update toss_payment_orders
    set status = 'test_completed',
        test_grant_blocked_reason = left(p_reason, 100),
        guest_email_status = case
          when guest_email is not null and coalesce(guest_email_status, '') not in ('sent', 'sending') then 'skipped'
          else guest_email_status end,
        guest_email_next_attempt_at = null,
        updated_at = now()
    where order_id = p_order_id and is_test and status = 'paid'
    returning id into v_id;
  return v_id is not null;
end;
$$;

revoke all on function public.set_toss_order_receipt(text, text) from public;
revoke all on function public.queue_guest_purchase_email(text) from public;
revoke all on function public.claim_guest_purchase_email(text, integer) from public;
revoke all on function public.finish_guest_purchase_email(text, text, text, text, integer) from public;
revoke all on function public.due_guest_purchase_emails(integer) from public;
revoke all on function public.reissue_guest_purchase_email(text, text, timestamptz, integer) from public;
revoke all on function public.count_toss_test_grants(text) from public;
revoke all on function public.complete_toss_test_without_grant(text, text) from public;
grant execute on function public.set_toss_order_receipt(text, text) to service_role;
grant execute on function public.queue_guest_purchase_email(text) to service_role;
grant execute on function public.claim_guest_purchase_email(text, integer) to service_role;
grant execute on function public.finish_guest_purchase_email(text, text, text, text, integer) to service_role;
grant execute on function public.due_guest_purchase_emails(integer) to service_role;
grant execute on function public.reissue_guest_purchase_email(text, text, timestamptz, integer) to service_role;
grant execute on function public.count_toss_test_grants(text) to service_role;
grant execute on function public.complete_toss_test_without_grant(text, text) to service_role;
