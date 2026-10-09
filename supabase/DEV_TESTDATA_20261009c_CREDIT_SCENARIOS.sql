-- =============================================================================
-- DEV ONLY -- ahaitsme-dev. Test data for YOUR OWN DEV test account only.
-- Run each block only when the verification step asks for it. Never run on
-- production. Replace 'user_REPLACE_ME' with the DEV test account's Clerk id.
-- =============================================================================

-- [A] "Other language" check needs a credit usable in en-US. US checkout stays
-- disabled, so grant ONE language-less test credit (behaves like an existing
-- pre-2026-10-09 credit: usable in any language). Source 'admin' = test grant.
select * from grant_credit_lot('user_REPLACE_ME', 'personal', 1, 'admin', null, null);

-- [B] Pass expiry: move ONLY this account's 30-day pass lots into the past.
-- (Pass lots = the two lots granted together with a kr_insight_pass_30d grant.)
update credit_lots cl
   set expires_at = now() - interval '1 minute'
  from kr_purchase_grants g
 where cl.reference_id = g.id
   and g.plan_id = 'kr_insight_pass_30d'
   and cl.clerk_user_id = 'user_REPLACE_ME'
   and g.clerk_user_id = 'user_REPLACE_ME';
