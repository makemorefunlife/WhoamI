-- =============================================================================
-- PRODUCTION (gncjslondpvysjaytagd) payment schema + entitlement status
-- READ ONLY. Changes nothing (no insert/update/delete/DDL, no function calls
-- that write). Never references a table directly, so a missing table is
-- reported as "not present" / "missing" instead of raising an error.
--
-- Run in: Supabase Dashboard -> the PRODUCTION project (ref gncjslondpvysjaytagd,
--         check the URL bar) -> SQL Editor. Export the grid as CSV and share it.
--
-- One result grid:
--   0 prereq    : app tables the credit engine depends on
--   1 migration : each payment migration file -> applied / PARTIAL / missing
--   2 data      : row counts of payment tables that exist
--   3 risk      : balances that would become unspendable without a carry-over
--   4 balance   : existing entitlement (credit) balances to preserve
--   5 purchases : existing grants / memberships / orders to preserve
--   9 env       : database identity (to confirm this is the right project)
-- =============================================================================
with checks(migration, kind, obj, extra) as (
  values
('00 prerequisite (app tables)',                       'table',  'relationship_reports', null),
  ('00 prerequisite (app tables)',                       'table',  'reports', null),
  ('20260907020100_credit_engine_tables',                'table',  'credit_accounts', null),
  ('20260907020100_credit_engine_tables',                'table',  'credit_ledger', null),
  ('20260907020100_credit_engine_tables',                'table',  'credit_reservations', null),
  ('20260907020200_credit_engine_functions',             'func',   'reserve_credit', null),
  ('20260907020200_credit_engine_functions',             'func',   'consume_credit', null),
  ('20260907020200_credit_engine_functions',             'func',   'release_credit', null),
  ('20260907020200_credit_engine_functions',             'func',   'grant_credit', null),
  ('20260907030000_beta_purchase_grants',                'table',  'beta_purchase_grants', null),
  ('20260907030100_process_beta_purchase_function',      'func',   'process_beta_purchase', null),
  ('20260922040000_credit_lots',                         'table',  'credit_lots', null),
  ('20260922040000_credit_lots',                         'column', 'credit_reservations', 'credit_lot_id'),
  ('20260922040100_credit_engine_lot_functions',         'func',   'grant_credit_lot', null),
  ('20260922040100_credit_engine_lot_functions',         'func',   'expire_credit_lots', null),
  ('20260922040200_us_memberships',                      'table',  'memberships', null),
  ('20260922040200_us_memberships',                      'table',  'membership_monthly_grants', null),
  ('20260922040200_us_memberships',                      'table',  'membership_term_grants', null),
  ('20260922040200_us_memberships',                      'table',  'gift_personal_coupons', null),
  ('20260922040200_us_memberships',                      'table',  'us_purchase_grants', null),
  ('20260922040300_us_membership_functions',             'func',   'add_calendar_months_clamped', null),
  ('20260922040300_us_membership_functions',             'func',   'membership_cycle_at', null),
  ('20260922040300_us_membership_functions',             'func',   'ensure_monthly_relationship_grant', null),
  ('20260922040300_us_membership_functions',             'func',   'additional_relationship_eligible', null),
  ('20260922040300_us_membership_functions',             'func',   'process_us_purchase', null),
  ('20260922040300_us_membership_functions',             'func',   'process_us_annual_renewal', null),
  ('20260922050000_kr_purchase_grants',                  'table',  'kr_purchase_grants', null),
  ('20260922050000_kr_purchase_grants',                  'func',   'process_kr_purchase', null),
  ('20260922060000_kr_purchase_grants_provider_agnostic','column', 'kr_purchase_grants', 'payment_provider'),
  ('20260922070000_account_deletion_entitlement_cleanup','func',   'cleanup_account_entitlement_data', null),
  ('20260922080000_paddle_webhooks_and_cancellation',    'table',  'paddle_webhook_events', null),
  ('20260922080000_paddle_webhooks_and_cancellation',    'column', 'memberships', 'cancel_at_period_end'),
  ('20260922080000_paddle_webhooks_and_cancellation',    'func',   'revoke_remaining_credit_for_grant', null),
  ('20260922080000_paddle_webhooks_and_cancellation',    'func',   'mark_membership_refunded', null),
  ('20260923000000_paddle_webhook_idempotency_and_ordering','column','paddle_webhook_events', 'attempt_count'),
  ('20260923000000_paddle_webhook_idempotency_and_ordering','func', 'mark_paddle_webhook_event_failed', null),
  ('20260923010000_paddle_adjustment_idempotency',       'table',  'processed_paddle_adjustments', null),
  ('20260926080000_fix_grant_credit_lot_ambiguous_balance','src',  'grant_credit_lot', 'returning credit_accounts.balance into v_balance'),
  ('20260926090000_single_purchase_and_triple_one_year_expiry','src','process_kr_purchase', 'kr_relationship_triple%interval ''1 year'''),
  ('20260928000000_redeem_code_system',                  'table',  'tester_personal_codes', null),
  ('20260928000000_redeem_code_system',                  'func',   'redeem_tester_personal_code', null),
  ('20260928120000_payment_manual_reviews',              'table',  'payment_manual_reviews', null),
  ('20261007120000_one_time_membership_toss_and_refunds','table',  'toss_payment_orders', null),
  ('20261007120000_one_time_membership_toss_and_refunds','table',  'membership_refund_requests', null),
  ('20261007120000_one_time_membership_toss_and_refunds','column', 'memberships', 'billing_model'),
  ('20261007120000_one_time_membership_toss_and_refunds','column', 'gift_personal_coupons', 'expires_at'),
  ('20261007120000_one_time_membership_toss_and_refunds','column', 'us_purchase_grants', 'payment_provider'),
  ('20261007120000_one_time_membership_toss_and_refunds','func',   'process_toss_order', null),
  ('20261007120000_one_time_membership_toss_and_refunds','func',   'claim_toss_order_for_confirm', null),
  ('20261007120000_one_time_membership_toss_and_refunds','func',   'open_membership_refund', null),
  ('20261007130000_toss_guest_checkout',                 'column', 'toss_payment_orders', 'guest_email'),
  ('20261007130000_toss_guest_checkout',                 'func',   'claim_guest_toss_order_for_confirm', null),
  ('20261007130000_toss_guest_checkout',                 'func',   'claim_paid_guest_toss_order', null)
),
evaluated as (
  select migration, obj, extra,
    case kind
      when 'table'  then to_regclass('public.' || obj) is not null
      when 'column' then exists (select 1 from information_schema.columns
                                  where table_schema = 'public' and table_name = obj and column_name = extra)
      when 'func'   then exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                  where n.nspname = 'public' and p.proname = obj)
      when 'src'    then exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                  where n.nspname = 'public' and p.proname = obj and p.prosrc like '%' || extra || '%')
    end as present,
    case kind when 'column' then obj || '.' || extra
              when 'src' then obj || '() new body'
              else obj end as label
  from checks
),
per_migration as (
  select migration,
    case when bool_and(present) then 'applied'
         when bool_or(present) then 'PARTIAL'
         else 'missing' end as status,
    coalesce(string_agg(label, ', ') filter (where not present), '') as missing_items
  from evaluated
  group by migration
),
report as (
select case when migration like '00 %' then '0 prereq' else '1 migration' end as section,
       migration as name, status, missing_items as detail
from per_migration
union all
select '2 data' as section, 'credit_accounts' as name,
       case when to_regclass('public.credit_accounts') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.credit_accounts', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'credit_ledger' as name,
       case when to_regclass('public.credit_ledger') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.credit_ledger', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'credit_reservations' as name,
       case when to_regclass('public.credit_reservations') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.credit_reservations', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'credit_lots' as name,
       case when to_regclass('public.credit_lots') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.credit_lots', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'beta_purchase_grants' as name,
       case when to_regclass('public.beta_purchase_grants') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.beta_purchase_grants', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'memberships' as name,
       case when to_regclass('public.memberships') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.memberships', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'membership_monthly_grants' as name,
       case when to_regclass('public.membership_monthly_grants') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.membership_monthly_grants', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'membership_term_grants' as name,
       case when to_regclass('public.membership_term_grants') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.membership_term_grants', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'gift_personal_coupons' as name,
       case when to_regclass('public.gift_personal_coupons') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.gift_personal_coupons', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'us_purchase_grants' as name,
       case when to_regclass('public.us_purchase_grants') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.us_purchase_grants', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'kr_purchase_grants' as name,
       case when to_regclass('public.kr_purchase_grants') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.kr_purchase_grants', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'paddle_webhook_events' as name,
       case when to_regclass('public.paddle_webhook_events') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.paddle_webhook_events', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'processed_paddle_adjustments' as name,
       case when to_regclass('public.processed_paddle_adjustments') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.processed_paddle_adjustments', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'tester_personal_codes' as name,
       case when to_regclass('public.tester_personal_codes') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.tester_personal_codes', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'tester_personal_code_redemptions' as name,
       case when to_regclass('public.tester_personal_code_redemptions') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.tester_personal_code_redemptions', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'payment_manual_reviews' as name,
       case when to_regclass('public.payment_manual_reviews') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.payment_manual_reviews', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'toss_payment_orders' as name,
       case when to_regclass('public.toss_payment_orders') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.toss_payment_orders', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '2 data' as section, 'membership_refund_requests' as name,
       case when to_regclass('public.membership_refund_requests') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text || '' rows'' as c from public.membership_refund_requests', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '4 balance' as section, 'personal credits held (accounts / total)' as name,
       case when to_regclass('public.credit_accounts') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*) filter (where balance > 0)::text || '' accounts / '' || coalesce(sum(balance) filter (where balance > 0), 0)::text || '' credits'' as c from public.credit_accounts where credit_type = ''personal''', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '4 balance' as section, 'relationship credits held (accounts / total)' as name,
       case when to_regclass('public.credit_accounts') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*) filter (where balance > 0)::text || '' accounts / '' || coalesce(sum(balance) filter (where balance > 0), 0)::text || '' credits'' as c from public.credit_accounts where credit_type = ''relationship''', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '4 balance' as section, 'credit types present' as name,
       case when to_regclass('public.credit_accounts') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select coalesce(string_agg(distinct credit_type, '', ''), ''(none)'') as c from public.credit_accounts', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '4 balance' as section, 'in-flight reservations (analysis generating now)' as name,
       case when to_regclass('public.credit_reservations') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*)::text as c from public.credit_reservations', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '4 balance' as section, 'lots remaining: no expiry / with expiry / already expired' as name,
       case when to_regclass('public.credit_lots') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select coalesce(sum(remaining) filter (where expires_at is null),0)::text || '' / '' || coalesce(sum(remaining) filter (where expires_at > now()),0)::text || '' / '' || coalesce(sum(remaining) filter (where expires_at <= now()),0)::text as c from public.credit_lots where remaining > 0', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '4 balance' as section, 'lots by source (remaining)' as name,
       case when to_regclass('public.credit_lots') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select coalesce(string_agg(source || ''='' || s, '', '' order by source), ''(none)'') as c from (select source, sum(remaining)::text as s from public.credit_lots where remaining > 0 group by source) x', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '5 purchases' as section, 'memberships by status' as name,
       case when to_regclass('public.memberships') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select coalesce(string_agg(status || ''='' || n, '', '' order by status), ''(none)'') as c from (select status, count(*)::text as n from public.memberships group by status) x', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '5 purchases' as section, 'beta grants by plan' as name,
       case when to_regclass('public.beta_purchase_grants') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select coalesce(string_agg(plan_id || ''='' || n, '', '' order by plan_id), ''(none)'') as c from (select plan_id, count(*)::text as n from public.beta_purchase_grants group by plan_id) x', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '5 purchases' as section, 'KR grants by plan' as name,
       case when to_regclass('public.kr_purchase_grants') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select coalesce(string_agg(plan_id || ''='' || n, '', '' order by plan_id), ''(none)'') as c from (select plan_id, count(*)::text as n from public.kr_purchase_grants group by plan_id) x', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '5 purchases' as section, 'US grants by plan' as name,
       case when to_regclass('public.us_purchase_grants') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select coalesce(string_agg(plan_id || ''='' || n, '', '' order by plan_id), ''(none)'') as c from (select plan_id, count(*)::text as n from public.us_purchase_grants group by plan_id) x', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '5 purchases' as section, 'unredeemed gift coupons' as name,
       case when to_regclass('public.gift_personal_coupons') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select count(*) filter (where status = ''unredeemed'')::text as c from public.gift_personal_coupons', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '5 purchases' as section, 'toss orders by status' as name,
       case when to_regclass('public.toss_payment_orders') is null then 'not present'
            else (xpath('/row/c/text()', query_to_xml('select coalesce(string_agg(status || ''='' || n, '', '' order by status), ''(none)'') as c from (select status, count(*)::text as n from public.toss_payment_orders group by status) x', false, true, '')))[1]::text end as status,
       '' as detail
union all
select '3 risk', 'credit balance not covered by credit_lots',
       case
         when to_regclass('public.credit_accounts') is null then 'n/a (no credit_accounts)'
         when to_regclass('public.credit_lots') is null then
           (xpath('/row/c/text()', query_to_xml(
              'select count(*) as c from public.credit_accounts where balance > 0', false, true, '')))[1]::text
           || ' accounts with balance > 0 (credit_lots missing -> must be carried over)'
         else
           (xpath('/row/c/text()', query_to_xml(
              'select count(*) as c from public.credit_accounts a where a.balance > coalesce((select sum(l.remaining) from public.credit_lots l where l.clerk_user_id = a.clerk_user_id and l.credit_type = a.credit_type and (l.expires_at is null or l.expires_at > now())), 0)',
              false, true, '')))[1]::text || ' accounts whose balance exceeds their lots'
       end,
       'credits granted before credit_lots existed -- keep them spendable'
union all
select '9 env', 'database / server version', current_database(), split_part(version(), ' on ', 1)
)
select * from report order by section, name;
