-- DEV ONLY (local PostgreSQL with migrations applied): market scope of credit lots.
-- Run: psql -v ON_ERROR_STOP=1 -d <local test db> -f tests/sql/credit-lot-market-scope.test.sql
-- Ends with ROLLBACK; raises on the first failed expectation.
begin;

create or replace function pg_temp.expect(cond boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'FAILED: %', what; end if;
  raise notice 'ok - %', what;
end $$;
create or replace function pg_temp.expect_error(sql text, what text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'ok - % (refused: %)', what, sqlerrm;
    return;
  end;
  raise exception 'FAILED (not refused): %', what;
end $$;

-- a lot that existed before (no language) -- must stay usable on both sites
insert into credit_lots (clerk_user_id, credit_type, amount, remaining, source, scope_basis, locale)
  values ('u_old', 'personal', 1, 1, 'one_time_purchase', 'legacy', null);
update credit_lots set scope_basis = null where clerk_user_id = 'u_old';  -- as an untouched pre-migration row
insert into credit_accounts (clerk_user_id, credit_type, balance) values ('u_old', 'personal', 1);

-- purchases keep their market
select * from process_kr_purchase('u1', 'kr_personal_premium', 'tx-kr-1', 'p', 'KRW', 'toss');
select * from process_us_purchase('u1', 'us_personal_premium', 'tx-us-1', 'p', 'USD', null);
select pg_temp.expect((select count(*) = 1 from credit_lots where clerk_user_id='u1' and locale='ko-KR' and scope_basis='order'), 'KR purchase -> ko-KR lot (order)');
select pg_temp.expect((select count(*) = 1 from credit_lots where clerk_user_id='u1' and locale='en-US' and scope_basis='order'), 'US purchase -> en-US lot (order)');

-- US membership: its gift coupons are English-site only
insert into toss_payment_orders (order_id, clerk_user_id, plan_id, amount, currency, order_name, status, payment_key)
  values ('aha_test_member', 'u2', 'us_annual_membership', 99, 'USD', 'Annual', 'paid', 'pk_test_member');
select * from process_toss_order('aha_test_member');
select pg_temp.expect((select count(*) >= 1 from gift_personal_coupons where issued_to_clerk_user_id='u2' and market_scope='en-US'), 'new US membership gift coupons are en-US');
select pg_temp.expect((select bool_and(locale = 'en-US') from credit_lots where clerk_user_id='u2'), 'US membership credits are en-US');
select * from redeem_gift_personal_coupon((select code from gift_personal_coupons where issued_to_clerk_user_id='u2' limit 1), 'u3');
select pg_temp.expect((select count(*) = 1 from credit_lots where clerk_user_id='u3' and source='promo' and locale='en-US' and scope_basis='issuer'), 'redeemed gift -> en-US lot');

-- a coupon issued before scopes (NULL) still gives a both-sites credit
update gift_personal_coupons set market_scope = null where id = (select id from gift_personal_coupons where status='unredeemed' and issued_to_clerk_user_id='u2' limit 1);
select * from redeem_gift_personal_coupon((select code from gift_personal_coupons where status='unredeemed' and market_scope is null limit 1), 'u4');
select pg_temp.expect((select count(*) = 1 from credit_lots where clerk_user_id='u4' and locale is null and scope_basis='legacy'), 'old coupon keeps both-sites right');

-- tester codes must name a scope
select pg_temp.expect_error($$insert into tester_personal_codes (code) values ('T-NOSCOPE')$$, 'new tester code without scope');
insert into tester_personal_codes (code, market_scope, max_redemptions) values ('T-KR', 'ko-KR', 5), ('T-BOTH', 'both', 5);
select * from redeem_tester_personal_code('T-KR', 'u5');
select * from redeem_tester_personal_code('T-BOTH', 'u6');
select pg_temp.expect((select locale = 'ko-KR' and scope_basis = 'issuer' from credit_lots where clerk_user_id='u5'), 'ko-KR tester code -> ko-KR lot');
select pg_temp.expect((select locale is null and scope_basis = 'issuer' from credit_lots where clerk_user_id='u6'), 'both tester code -> both-sites lot');

-- admin grants: only with an explicit scope
select pg_temp.expect_error($$select * from grant_credit_lot('u7', 'personal', 1, 'admin', null, null)$$, 'admin grant without scope');
select pg_temp.expect_error($$select * from grant_credit_lot_scoped('u7', 'personal', 1, 'admin', 'jp', null, null)$$, 'admin grant with an unknown scope');
select * from grant_credit_lot_scoped('u7', 'personal', 1, 'admin', 'en-US', null, null);
select * from grant_credit_lot_scoped('u7', 'relationship', 1, 'admin', 'both', null, null);
select pg_temp.expect((select locale = 'en-US' from credit_lots where clerk_user_id='u7' and credit_type='personal'), 'admin en-US grant');
select pg_temp.expect((select locale is null and scope_basis='issuer' from credit_lots where clerk_user_id='u7' and credit_type='relationship'), 'admin both grant');
select pg_temp.expect(nullif(current_setting('aha.lot_scope', true), '') is null, 'scope setting cleared after the grant');

-- a purchase whose market cannot be found is stopped (no any-site lot)
select pg_temp.expect_error($$select * from grant_credit_lot('u8', 'personal', 1, 'one_time_purchase', gen_random_uuid(), null)$$, 'purchase lot without an order market');

-- spending: language required; a market lot is never spent on the other site
select pg_temp.expect_error($$select * from reserve_credit('u1', 'personal', null, null, null, null, gen_random_uuid(), true)$$, 'reserve without a language');
select pg_temp.expect((select ok from reserve_credit('u1', 'personal', null, null, 'en-US', null, gen_random_uuid(), true)), 'en-US spend works');
select pg_temp.expect((select remaining = 0 from credit_lots where clerk_user_id='u1' and locale='en-US'), 'en-US spend used the en-US lot');
select pg_temp.expect((select remaining = 1 from credit_lots where clerk_user_id='u1' and locale='ko-KR'), 'ko-KR lot untouched by en-US spend');
select pg_temp.expect((select not ok from reserve_credit('u1', 'personal', null, null, 'en-US', null, gen_random_uuid(), true)), 'no en-US lot left -> refused (ko-KR lot not used)');
select pg_temp.expect((select ok from reserve_credit('u_old', 'personal', null, null, 'ko-KR', null, gen_random_uuid(), true)), 'pre-existing no-language lot still usable');

rollback;
