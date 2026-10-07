-- =============================================================================
-- READ-ONLY status check for the payment/entitlement migrations on PROD.
-- Paste into the Supabase Dashboard SQL Editor (PROD project). Changes
-- nothing: SELECTs only.
--
-- What each column means:
--   one_year_expiry_applied      20260926090000 (single Personal/Relationship
--                                + KR Triple expire 1 year after purchase)
--   redeem_code_system_applied   20260928000000
--   manual_reviews_applied       20260928120000
--   one_time_membership_applied  20261007120000 (this change set)
-- =============================================================================

select
  -- 20260926090000: the new process_us_purchase / process_kr_purchase bodies
  -- grant single purchases with "interval '1 year'".
  coalesce((select prosrc like '%us_personal_premium%interval ''1 year''%'
            from pg_proc where oid = to_regprocedure('public.process_us_purchase(text,text,text,text,text,text)')), false)
    and coalesce((select prosrc like '%kr_relationship_triple%interval ''1 year''%'
            from pg_proc where oid = to_regprocedure('public.process_kr_purchase(text,text,text,text,text,text)')), false)
    as one_year_expiry_applied,
  (to_regclass('public.tester_personal_codes') is not null) as redeem_code_system_applied,
  (to_regclass('public.payment_manual_reviews') is not null) as manual_reviews_applied,
  (to_regclass('public.toss_payment_orders') is not null) as one_time_membership_applied;

-- Evidence from data: purchases made AFTER the expiry migration should have
-- expires_at set; permanent (NULL) lots created recently would mean the old
-- function was still live when they were granted.
select
  cl.source,
  cl.credit_type,
  count(*) filter (where cl.expires_at is null) as permanent_lots,
  count(*) filter (where cl.expires_at is not null) as expiring_lots,
  max(cl.created_at) filter (where cl.expires_at is null) as last_permanent_grant_at,
  min(cl.created_at) filter (where cl.expires_at is not null
                              and cl.expires_at > cl.created_at + interval '300 days') as first_one_year_grant_at
from public.credit_lots cl
where cl.source in ('one_time_purchase', 'additional_purchase', 'membership', 'promo')
group by 1, 2
order by 1, 2;

-- Who the 20261007120000 migration would classify as LEGACY recurring members
-- (their terms are kept unchanged): every existing membership row.
select status, count(*) as memberships, min(started_at) as first_started, max(started_at) as last_started
from public.memberships
group by status
order by status;
