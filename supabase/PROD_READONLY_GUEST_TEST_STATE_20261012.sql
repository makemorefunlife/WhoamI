-- =============================================================================
-- PROD READ-ONLY CHECK (2026-10-12) — guest test purchases, mail queue, schema
-- Changes nothing. Safe when tables/columns are missing (reports "missing").
-- Replace <TEST_EMAIL> below with the purchase email (lower case) before running.
-- Output never shows full emails, payment keys or tokens.
-- =============================================================================

-- 1) Schema needed by the deployed code (true = present)
select obj, present from (values
  ('table toss_payment_orders',                    to_regclass('public.toss_payment_orders') is not null),
  ('col toss_payment_orders.guest_email',           exists (select 1 from information_schema.columns where table_schema='public' and table_name='toss_payment_orders' and column_name='guest_email')),
  ('col toss_payment_orders.is_test',               exists (select 1 from information_schema.columns where table_schema='public' and table_name='toss_payment_orders' and column_name='is_test')),
  ('col toss_payment_orders.guest_use_status',      exists (select 1 from information_schema.columns where table_schema='public' and table_name='toss_payment_orders' and column_name='guest_use_status')),
  ('col toss_payment_orders.guest_use_enabled',     exists (select 1 from information_schema.columns where table_schema='public' and table_name='toss_payment_orders' and column_name='guest_use_enabled')),
  ('table guest_access_sessions',                   to_regclass('public.guest_access_sessions') is not null),
  ('table guest_personal_profiles',                 to_regclass('public.guest_personal_profiles') is not null),
  ('col credit_lots.locale',                        exists (select 1 from information_schema.columns where table_schema='public' and table_name='credit_lots' and column_name='locale')),
  ('table relationship_premium_reports',            to_regclass('public.relationship_premium_reports') is not null),
  ('col relationship_premium_reports.input_snapshot', exists (select 1 from information_schema.columns where table_schema='public' and table_name='relationship_premium_reports' and column_name='input_snapshot')),
  ('table guest_invite_participants',               to_regclass('public.guest_invite_participants') is not null),
  ('table guest_relationship_orders',               to_regclass('public.guest_relationship_orders') is not null),
  ('table decision_journal_entries',                to_regclass('public.decision_journal_entries') is not null),
  ('fn complete_toss_test_without_grant',           exists (select 1 from pg_proc where proname='complete_toss_test_without_grant')),
  ('fn queue_guest_purchase_email',                 exists (select 1 from pg_proc where proname='queue_guest_purchase_email')),
  ('fn reserve_guest_personal_use',                 exists (select 1 from pg_proc where proname='reserve_guest_personal_use')),
  ('fn reserve_guest_relationship_use',             exists (select 1 from pg_proc where proname='reserve_guest_relationship_use'))
) v(obj, present);

-- 2) Recent guest orders (last 7 days): status, test flag, block reason, mail queue state
--    (counts only; no emails / keys). Needs the toss_payment_orders columns above.
select o.plan_id, o.is_test, o.status, coalesce(o.test_grant_blocked_reason, '-') as blocked_reason,
       coalesce(o.guest_email_status, '-') as mail_status, left(coalesce(o.guest_email_last_error, '-'), 60) as mail_error,
       count(*) as orders, max(o.updated_at) as last_update
  from public.toss_payment_orders o
 where o.guest_email is not null and o.created_at > now() - interval '7 days'
 group by 1,2,3,4,5,6 order by last_update desc;

-- 3) The test buyer's orders (masked): what happened to each
select left(o.order_id, 12) || '…' as order_ref, o.plan_id, o.is_test, o.status,
       coalesce(o.test_grant_blocked_reason, '-') as blocked_reason, coalesce(o.guest_email_status, '-') as mail_status,
       o.approved_at, o.guest_email_sent_at, (o.payment_key is not null) as has_payment_key
  from public.toss_payment_orders o
 where lower(o.guest_email) = lower('<TEST_EMAIL>')
 order by o.created_at desc limit 20;
