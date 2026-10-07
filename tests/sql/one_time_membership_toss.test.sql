-- Manual verification for 20261007120000_one_time_membership_toss_and_refunds.sql.
-- Run against a LOCAL / DEV database only (everything is rolled back):
--   psql "$DEV_DB_URL" -v ON_ERROR_STOP=1 -f tests/sql/one_time_membership_toss.test.sql
-- Any failed expectation raises and aborts.

begin;

create or replace function pg_temp.expect(cond boolean, label text) returns void
language plpgsql as $$
begin
  if cond is distinct from true then
    raise exception 'FAILED: %', label;
  end if;
  raise notice 'ok: %', label;
end $$;

-- ---------------------------------------------------------------- fixtures
-- A legacy recurring member (pre-migration shape) must keep its terms.
insert into memberships (clerk_user_id, plan_id, status, started_at, current_term_start, current_term_end, paddle_subscription_id)
values ('user_legacy', 'us_annual_membership', 'active', now() - interval '2 months', now() - interval '2 months', now() + interval '10 months', 'sub_legacy');

insert into toss_payment_orders (order_id, clerk_user_id, plan_id, amount, currency, order_name)
values ('aha_order_member_1', 'user_a', 'us_annual_membership', 280.00, 'USD', '12-Month Membership');

-- ---------------------------------------------------------------- confirm claim
select pg_temp.expect((select result from claim_toss_order_for_confirm('aha_order_member_1', 'user_b', 'pk_1', 280.00)) = 'mismatch', 'other user cannot claim order');
select pg_temp.expect((select result from claim_toss_order_for_confirm('aha_order_member_1', 'user_a', 'pk_1', 1.00)) = 'mismatch', 'tampered amount rejected');
select pg_temp.expect((select result from claim_toss_order_for_confirm('aha_order_member_1', 'user_a', 'pk_1', 280.00)) = 'claimed', 'owner claims order');
select pg_temp.expect((select result from claim_toss_order_for_confirm('aha_order_member_1', 'user_a', 'pk_1', 280.00)) = 'in_progress', 'concurrent confirm blocked');
select pg_temp.expect((select result from claim_toss_order_for_confirm('aha_order_member_1', 'user_a', 'pk_OTHER', 280.00)) = 'mismatch', 'different paymentKey rejected');

-- grant before paid must fail
do $$ begin
  perform process_toss_order('aha_order_member_1');
  raise exception 'should not grant unpaid order';
exception when others then
  if sqlerrm not like 'toss order not paid%' then raise; end if;
end $$;

select mark_toss_order_paid('aha_order_member_1', 'pk_1', '카드', now());
select pg_temp.expect((select already_processed from process_toss_order('aha_order_member_1')) = false, 'membership granted');
select pg_temp.expect((select already_processed from process_toss_order('aha_order_member_1')) = true, 'second grant is idempotent');
select pg_temp.expect((select result from claim_toss_order_for_confirm('aha_order_member_1', 'user_a', 'pk_1', 280.00)) = 'granted', 'claim after grant reports granted');

select pg_temp.expect((select count(*) from memberships where clerk_user_id = 'user_a') = 1, 'exactly one membership row');
select pg_temp.expect(
  (select billing_model = 'one_time_12m' and paddle_subscription_id is null and price_paid = 280.00
     and current_term_end = add_calendar_months_clamped(started_at, 12)
   from memberships where clerk_user_id = 'user_a'),
  'one-time membership: no subscription, 12 months, price recorded');
select pg_temp.expect(
  (select bool_and(cl.expires_at = m.current_term_end)
   from credit_lots cl join membership_term_grants g on g.id = cl.reference_id
   join memberships m on m.id = g.membership_id where m.clerk_user_id = 'user_a'),
  'term Personal credit expires at membership end');
select pg_temp.expect(
  (select count(*) = 2 and bool_and(c.expires_at = m.current_term_end)
   from gift_personal_coupons c join memberships m on m.id = c.membership_id where m.clerk_user_id = 'user_a'),
  '2 gift coupons expiring at membership end');
select pg_temp.expect((select payment_provider from us_purchase_grants where paddle_transaction_id = 'toss:pk_1') = 'toss', 'purchase grant recorded as toss');

-- ---------------------------------------------------------------- legacy kept
select pg_temp.expect((select billing_model from memberships where clerk_user_id = 'user_legacy') = 'paddle_recurring', 'legacy membership back-filled as recurring');
do $$ begin
  perform process_us_purchase('user_c', 'us_annual_membership', 'txn_new_paddle', 'pri_x', 'USD', 'sub_new');
  raise exception 'paddle membership path should be retired';
exception when others then
  if sqlerrm <> 'membership_paddle_path_retired' then raise; end if;
end $$;

-- ---------------------------------------------------------------- additional relationship 12 months
select process_us_purchase('user_a', 'us_additional_relationship', 'txn_addl_1', 'pri_addl', 'USD', null);
select pg_temp.expect(
  (select expires_at between now() + interval '1 year' - interval '1 minute' and now() + interval '1 year' + interval '1 minute'
   from credit_lots where source = 'additional_purchase' and clerk_user_id = 'user_a'),
  'additional Relationship credit expires 12 months after purchase');

-- ---------------------------------------------------------------- gift coupons
do $$
declare v_code text; v_end timestamptz; r record;
begin
  select c.code, c.expires_at into v_code, v_end from gift_personal_coupons c
    join memberships m on m.id = c.membership_id where m.clerk_user_id = 'user_a' order by c.code limit 1;
  select * into r from redeem_gift_personal_coupon(v_code, 'user_a');
  perform pg_temp.expect(r.reason = 'cannot_claim_own_gift', 'owner cannot claim own gift');
  select * into r from redeem_gift_personal_coupon(v_code, 'friend_1');
  perform pg_temp.expect(r.ok, 'friend claims gift');
  perform pg_temp.expect(
    (select expires_at = v_end from credit_lots where clerk_user_id = 'friend_1' and source = 'promo'),
    'claimed gift credit expires at membership end');
end $$;

-- legacy coupon (expires_at null) keeps the old 1-year-from-claim rule
insert into gift_personal_coupons (code, issued_to_clerk_user_id, membership_id)
select 'GIFT-LEGACY001', 'user_legacy', id from memberships where clerk_user_id = 'user_legacy';
select pg_temp.expect((select ok from redeem_gift_personal_coupon('GIFT-LEGACY001', 'friend_2')), 'legacy coupon redeemable');
select pg_temp.expect(
  (select expires_at > now() + interval '364 days' from credit_lots where clerk_user_id = 'friend_2' and source = 'promo'),
  'legacy coupon credit keeps 1-year-from-claim expiry');

-- expired one-time coupon
update gift_personal_coupons set expires_at = now() - interval '1 second'
  where status = 'unredeemed' and membership_id in (select id from memberships where clerk_user_id = 'user_a');
select pg_temp.expect(
  (select reason from redeem_gift_personal_coupon(
     (select code from gift_personal_coupons where status = 'unredeemed' and membership_id in (select id from memberships where clerk_user_id = 'user_a') limit 1),
     'friend_3')) = 'expired',
  'coupon unusable after membership end');
update gift_personal_coupons c set expires_at = m.current_term_end
  from memberships m where m.id = c.membership_id and m.clerk_user_id = 'user_a';

-- ---------------------------------------------------------------- refunds
-- separately purchased credit must survive the refund
select process_us_purchase('user_a', 'us_relationship_premium', 'txn_single_1', 'pri_rel', 'USD', null);

do $$
declare v_m uuid; q record; r record; a record;
begin
  select id into v_m from memberships where clerk_user_id = 'user_a';

  -- benefit used (gift claimed above) -> full refund refused
  select * into r from open_membership_refund(v_m, current_date, 'full_within_7_days', 'op@test', null);
  perform pg_temp.expect(r.error = 'benefits_used', 'full refund refused after benefit use');

  select * into q from quote_membership_refund(v_m, current_date + 100);
  perform pg_temp.expect(
    q.prorated_amount = round(280.00 * q.unused_days / q.total_days, 2),
    format('prorated = 280 x %s / %s = %s', q.unused_days, q.total_days, q.prorated_amount));

  select * into r from open_membership_refund(v_m, current_date + 100, 'prorated', 'op@test', 'customer email 2026-10-07');
  perform pg_temp.expect(r.created and r.refund_amount = q.prorated_amount, 'prorated request opened');
  perform pg_temp.expect(
    (select request_id from open_membership_refund(v_m, current_date + 5, 'prorated', 'op@test', null)) = r.request_id,
    'second open returns the same request (no duplicate)');

  select * into a from begin_membership_refund_attempt(r.request_id);
  perform pg_temp.expect(a.result = 'claimed' and a.payment_key = 'pk_1', 'attempt claimed');
  perform pg_temp.expect((select result from begin_membership_refund_attempt(r.request_id)) = 'in_progress', 'concurrent attempt blocked');

  -- provider failure: nothing ends
  perform fail_membership_refund(r.request_id, 'PROVIDER_ERROR: timeout');
  perform pg_temp.expect((select status from memberships where id = v_m) = 'active', 'failed refund leaves membership active');
  perform pg_temp.expect((select remaining from credit_lots cl join membership_term_grants g on g.id = cl.reference_id where g.membership_id = v_m) = 1, 'failed refund leaves credits');

  -- retry succeeds
  perform pg_temp.expect((select result from begin_membership_refund_attempt(r.request_id)) = 'claimed', 'failed refund can be retried');
  perform pg_temp.expect(complete_membership_refund(r.request_id, 'tx_cancel_1'), 'refund completed');
  perform pg_temp.expect(complete_membership_refund(r.request_id, 'tx_cancel_1'), 'complete is idempotent');
  perform pg_temp.expect((select result from begin_membership_refund_attempt(r.request_id)) = 'already_succeeded', 'no attempt after success');

  perform pg_temp.expect((select status from memberships where id = v_m) = 'refunded', 'membership ended');
  perform pg_temp.expect((select remaining from credit_lots cl join membership_term_grants g on g.id = cl.reference_id where g.membership_id = v_m) = 0, 'term credit revoked');
  perform pg_temp.expect((select count(*) from gift_personal_coupons where membership_id = v_m and status = 'unredeemed') = 0, 'unredeemed coupons revoked');
  perform pg_temp.expect((select remaining from credit_lots where clerk_user_id = 'friend_1' and source = 'promo') = 0, 'claimed-but-unused gift credit canceled');
  perform pg_temp.expect((select remaining from credit_lots where clerk_user_id = 'user_a' and source = 'one_time_purchase') = 1, 'separately purchased credit kept');
  perform pg_temp.expect((select remaining from credit_lots where clerk_user_id = 'user_a' and source = 'additional_purchase') = 1, 'additional purchase credit kept');
  perform pg_temp.expect((select status from toss_payment_orders where order_id = 'aha_order_member_1') = 'refunded', 'order marked refunded');
end $$;

-- legacy members are not refundable through this path
select pg_temp.expect(
  (select error from open_membership_refund((select id from memberships where clerk_user_id = 'user_legacy'), current_date, 'prorated', 'op', null)) = 'legacy_membership',
  'legacy recurring membership excluded from operator refund path');

-- ---------------------------------------------------------------- full refund within 7 days
insert into toss_payment_orders (order_id, clerk_user_id, plan_id, amount, currency, order_name, status, payment_key)
values ('aha_order_member_2', 'user_d', 'us_annual_membership', 280.00, 'USD', '12-Month Membership', 'paid', 'pk_2');
select process_toss_order('aha_order_member_2');
do $$
declare v_m uuid; r record;
begin
  select id into v_m from memberships where clerk_user_id = 'user_d';
  select * into r from open_membership_refund(v_m, current_date + 8, 'full_within_7_days', 'op', null);
  perform pg_temp.expect(r.error = 'not_within_7_days', 'full refund refused after 7 days');
  select * into r from open_membership_refund(v_m, current_date + 2, 'full_within_7_days', 'op', null);
  perform pg_temp.expect(r.created and r.refund_amount = 280.00, 'full refund within 7 days, no use');
end $$;

-- ---------------------------------------------------------------- active member cannot buy twice
insert into toss_payment_orders (order_id, clerk_user_id, plan_id, amount, currency, order_name, status, payment_key)
values ('aha_order_member_3', 'user_d', 'us_annual_membership', 280.00, 'USD', '12-Month Membership', 'paid', 'pk_3');
do $$ begin
  perform process_toss_order('aha_order_member_3');
  raise exception 'second active membership should be refused';
exception when others then
  if sqlerrm <> 'active_membership_exists' then raise; end if;
end $$;

-- expired one-time membership is closed and a new one can be bought
update memberships set current_term_end = now() - interval '1 day' where clerk_user_id = 'user_d';
select pg_temp.expect((select ok from process_toss_order('aha_order_member_3')), 'renewal purchase after term end');
select pg_temp.expect((select count(*) from memberships where clerk_user_id = 'user_d' and status = 'ended') = 1, 'old term closed as ended');

-- ---------------------------------------------------------------- KR via toss (future switch)
insert into toss_payment_orders (order_id, clerk_user_id, plan_id, amount, currency, order_name, status, payment_key)
values ('aha_order_kr_1', 'user_k', 'kr_relationship_triple', 33000, 'KRW', 'Relationship Triple', 'paid', 'pk_kr');
select process_toss_order('aha_order_kr_1');
select pg_temp.expect((select payment_provider from kr_purchase_grants where provider_transaction_id = 'toss:pk_kr') = 'toss', 'KR order granted via toss');

-- ---------------------------------------------------------------- account deletion keeps financial rows
select cleanup_account_entitlement_data('user_a');
select pg_temp.expect((select clerk_user_id like 'deleted:%' from toss_payment_orders where order_id = 'aha_order_member_1'), 'toss order anonymized, retained');
select pg_temp.expect((select count(*) = 1 and bool_and(clerk_user_id like 'deleted:%') from membership_refund_requests where payment_order_id = 'aha_order_member_1'), 'refund record anonymized, retained');

rollback;
