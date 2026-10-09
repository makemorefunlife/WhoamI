-- =============================================================================
-- DEV ONLY -- ahaitsme-dev. Read-only check for ONE test account during the
-- CREDIT_ENFORCEMENT=true verification. Replace the user id below (Clerk
-- user id of your own DEV test account, "user_..."). Changes nothing.
-- =============================================================================
with u as (select 'user_REPLACE_ME'::text as id)

-- 1) Lots: language, remaining, expiry
select 'lot' as kind, cl.credit_type, cl.locale, cl.amount, cl.remaining, cl.source,
       cl.expires_at, (cl.expires_at is not null and cl.expires_at <= now()) as expired, cl.created_at
  from credit_lots cl, u
 where cl.clerk_user_id = u.id
 order by cl.created_at desc;

-- 2) Ledger (last 20): reservation_hold -1 / consume / release +1
select l.created_at, l.credit_type, l.delta, l.reason, l.enforced, l.balance_after
  from credit_ledger l
 where l.clerk_user_id = 'user_REPLACE_ME'
 order by l.created_at desc
 limit 20;

-- 3) Open reservations (should be 0 after every generation finishes or fails)
select r.reserved_at, r.credit_type, r.locale, r.enforced, r.credit_lot_id
  from credit_reservations r
 where r.clerk_user_id = 'user_REPLACE_ME';

-- 4) Personal deep rows of this account by language (+ archived copies)
select ra.report_id, ra.analysis_type, ra.updated_at,
       (select count(*) from report_analysis_history h
         where h.report_id = ra.report_id and h.analysis_type = ra.analysis_type) as archived_copies
  from report_analyses ra
  join reports r on r.id = ra.report_id
 where r.clerk_user_id = 'user_REPLACE_ME'
   and ra.analysis_type like 'deep_essence_structured%'
 order by ra.updated_at desc;
