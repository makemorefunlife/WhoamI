-- =============================================================================
-- PROD ONE-OFF (2026-10-12): reopen the test buyer's guest TEST orders that the
-- public site closed as "not allowlisted", so the purchase-guide email and the
-- no-account use flow work without buying again.
--
-- Run ONLY after:
--   (a) Vercel Production TOSS_TEST_ALLOWLIST contains the test email, and
--   (b) the code fix (proof of email before use + per-email limit) is deployed.
--   (c) you checked in the Toss (test) console that these payments were NOT
--       cancelled. A cancelled payment must stay closed — skip it.
-- Touches only: is_test orders of <TEST_EMAIL>, status 'test_completed',
-- blocked as 'not_allowlisted', not linked to an account, newest first,
-- at most TOSS_TEST_GRANT_LIMIT (default 3) together with already-open ones.
-- Replace <TEST_EMAIL> (lower case) in BOTH places.
-- =============================================================================

-- Preview (read-only)
select left(order_id, 12) || '…' as order_ref, plan_id, status, test_grant_blocked_reason, approved_at
  from public.toss_payment_orders
 where lower(guest_email) = lower('<TEST_EMAIL>') and is_test and clerk_user_id is null
   and status = 'test_completed' and test_grant_blocked_reason = 'not_allowlisted' and payment_key is not null
 order by created_at desc;

-- Reopen (run after checking the preview)
begin;
do $$
declare
  v_limit int := 3;   -- = TOSS_TEST_GRANT_LIMIT
  v_open int;
  r record;
begin
  select count(*) into v_open from public.toss_payment_orders
   where lower(guest_email) = lower('<TEST_EMAIL>') and is_test and status in ('paid', 'granted');
  for r in
    select order_id from public.toss_payment_orders
     where lower(guest_email) = lower('<TEST_EMAIL>') and is_test and clerk_user_id is null
       and status = 'test_completed' and test_grant_blocked_reason = 'not_allowlisted' and payment_key is not null
     order by created_at desc
  loop
    exit when v_open >= v_limit;
    update public.toss_payment_orders
       set status = 'paid', test_grant_blocked_reason = null,
           guest_email_status = null, guest_email_next_attempt_at = null, updated_at = now()
     where order_id = r.order_id and status = 'test_completed';
    perform public.queue_guest_purchase_email(r.order_id);
    v_open := v_open + 1;
    raise notice 'reopened %…', left(r.order_id, 12);
  end loop;
end $$;
commit;
-- The queued guide emails go out on the next confirm / claim-info request or a
-- maintenance run (no scheduler yet): open /checkout/toss/use and use
-- "구매 안내 메일 다시 받기", or run scripts/ops/run-guest-maintenance.mjs with ALLOW_PROD=1.
