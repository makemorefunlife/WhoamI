-- =============================================================================
-- Account integration -- prerequisites + one account's credit baseline (READ ONLY).
--
-- Run BEFORE and AFTER applying the three migrations
--   20261020090000_account_self_report_grouping.sql
--   20261020100000_credit_lot_market_scope.sql
--   20261020110000_relationship_basic_results_by_locale.sql
-- Replace REPORT_ID (one place) with the main report id of the account.
--
-- Output: one table (item, value). Object names and counts only -- no ids,
-- names, emails or birth data. READ ONLY transaction + ROLLBACK.
-- =============================================================================
begin transaction read only;

with acct as (
  select clerk_user_id from public.reports where id = 'REPORT_ID'::uuid
),
has_col as (
  select table_name || '.' || column_name as c
  from information_schema.columns
  where table_schema = 'public'
)
select item, value from (
  -- needed before (must all be 'yes')
  select 10 as o, 'needed: reports' as item, case when to_regclass('public.reports') is null then 'NO' else 'yes' end as value
  union all select 11, 'needed: survey_responses', case when to_regclass('public.survey_responses') is null then 'NO' else 'yes' end
  union all select 12, 'needed: relationship_reports', case when to_regclass('public.relationship_reports') is null then 'NO' else 'yes' end
  union all select 13, 'needed: credit_lots.locale', case when exists (select 1 from has_col where c = 'credit_lots.locale') then 'yes' else 'NO' end
  union all select 14, 'needed: kr_purchase_grants', case when to_regclass('public.kr_purchase_grants') is null then 'NO' else 'yes' end
  union all select 15, 'needed: us_purchase_grants', case when to_regclass('public.us_purchase_grants') is null then 'NO' else 'yes' end
  union all select 16, 'needed: memberships / membership_term_grants / membership_monthly_grants',
    case when to_regclass('public.memberships') is null or to_regclass('public.membership_term_grants') is null
              or to_regclass('public.membership_monthly_grants') is null then 'NO' else 'yes' end
  union all select 17, 'needed: gift_personal_coupons', case when to_regclass('public.gift_personal_coupons') is null then 'NO' else 'yes' end
  union all select 18, 'needed: tester_personal_codes / _redemptions',
    case when to_regclass('public.tester_personal_codes') is null or to_regclass('public.tester_personal_code_redemptions') is null then 'NO' else 'yes' end
  union all select 19, 'needed: reserve_credit(8 args, with p_locale)',
    case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                       where n.nspname = 'public' and p.proname = 'reserve_credit'
                         and pg_get_function_identity_arguments(p.oid) like '%p_locale text%') then 'yes' else 'NO' end
  union all select 20, 'needed: grant_credit_lot', case when exists (select 1 from pg_proc where proname = 'grant_credit_lot') then 'yes' else 'NO' end
  union all select 21, 'needed: credit_lots_set_locale trigger',
    case when exists (select 1 from pg_trigger where tgname = 'credit_lots_set_locale') then 'yes' else 'NO' end
  -- added by the three migrations ('no' before, 'yes' after)
  union all select 30, 'new: reports.merged_into_report_id', case when exists (select 1 from has_col where c = 'reports.merged_into_report_id') then 'yes' else 'no' end
  union all select 31, 'new: account_profile_events', case when to_regclass('public.account_profile_events') is null then 'no' else 'yes' end
  union all select 32, 'new: report_birth_history', case when to_regclass('public.report_birth_history') is null then 'no' else 'yes' end
  union all select 33, 'new: credit_lots.scope_basis', case when exists (select 1 from has_col where c = 'credit_lots.scope_basis') then 'yes' else 'no' end
  union all select 34, 'new: grant_credit_lot_scoped', case when exists (select 1 from pg_proc where proname = 'grant_credit_lot_scoped') then 'yes' else 'no' end
  union all select 35, 'new: relationship_basic_results', case when to_regclass('public.relationship_basic_results') is null then 'no' else 'yes' end
  -- this account (counts only): must be identical before / after
  union all select 50, 'account found', case when exists (select 1 from acct) then 'yes' else 'NO (check REPORT_ID)' end
  union all select 51, 'account self reports', (select count(*)::text from public.reports r join acct using (clerk_user_id) where r.report_type = 'self')
  union all select 52, 'account credit lots ko-KR (remaining>0)', (select count(*)::text from public.credit_lots l join acct using (clerk_user_id) where l.remaining > 0 and l.locale = 'ko-KR')
  union all select 53, 'account credit lots en-US (remaining>0)', (select count(*)::text from public.credit_lots l join acct using (clerk_user_id) where l.remaining > 0 and l.locale = 'en-US')
  union all select 54, 'account credit lots both sites (remaining>0)', (select count(*)::text from public.credit_lots l join acct using (clerk_user_id) where l.remaining > 0 and l.locale is null)
  union all select 55, 'account credits remaining total', (select coalesce(sum(l.remaining), 0)::text from public.credit_lots l join acct using (clerk_user_id))
) t
order by o;

rollback;
