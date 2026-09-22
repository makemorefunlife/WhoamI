-- =============================================================================
-- Account-deletion cleanup for entitlement/service-usage state, as distinct
-- from actual purchase/transaction evidence.
--
-- Classification (see the Privacy Policy audit this migration accompanies):
--
--   DELETE on account deletion (non-financial service-usage state, no
--   independent legal/accounting retention need):
--     - credit_accounts, credit_lots, credit_reservations, credit_ledger
--       (the entitlement engine's cached balances, individually-tracked
--       grant lots, in-flight reservation holds, and append-only usage
--       history -- none of these carry a currency amount or are
--       themselves evidence a specific payment happened)
--     - memberships, membership_monthly_grants, membership_term_grants,
--       gift_personal_coupons (membership/entitlement STATE -- the actual
--       evidence that a membership was purchased/renewed already lives
--       independently in us_purchase_grants, event_kind in
--       ('initial','renewal'), which this migration does NOT delete)
--
--   RETAIN, but anonymized (sever the direct link to the live Clerk user
--   id, per the "anonymized archival identifier" instruction -- the
--   deleted row's own primary key, which was never shown to the user, is
--   used as that identifier):
--     - us_purchase_grants, kr_purchase_grants, beta_purchase_grants --
--       these are the actual minimal transaction record (provider
--       transaction id, price id, currency, plan/product, timestamp)
--       kept for accounting / e-commerce recordkeeping. plan_id,
--       transaction id, price id, currency_code, created_at are left
--       untouched; only clerk_user_id is replaced with
--       'deleted:<row id>'.
--
-- Cross-user safety: a gift coupon a DIFFERENT (still-active) member
-- issued may have been redeemed BY the user being deleted. Deleting that
-- user's own credit_lots would otherwise violate
-- gift_personal_coupons.redeemed_lot_id's FK (it has no ON DELETE clause,
-- default RESTRICT) and would leave the issuer's coupon row pointing at
-- the deleted user's raw clerk_user_id. So redeemed_by_clerk_user_id /
-- redeemed_lot_id on any coupon NOT owned by this user (i.e. not deleted
-- by the cascade in step 1 below) is cleared FIRST -- the issuer's own
-- coupon row and its 'redeemed' status are left intact; only the
-- redeemer's identity is anonymized away, exactly like every other
-- cross-reference to a deleted user here.
--
-- Order matters (FK dependencies, no ON DELETE clause = RESTRICT unless
-- noted):
--   1. Clear gift_personal_coupons.redeemed_by_clerk_user_id /
--      redeemed_lot_id wherever this user was the REDEEMER (not the
--      issuer -- the issuer's own coupons are removed by cascade in the
--      next step instead).
--   2. Delete memberships owned by this user -- cascades to
--      membership_monthly_grants, membership_term_grants, and any
--      gift_personal_coupons ISSUED under this user's own membership(s)
--      (all three have `references public.memberships(id) on delete
--      cascade`).
--   3. Delete credit_reservations (references credit_lots with no
--      cascade -- must go before credit_lots).
--   4. Delete credit_lots (now safe: step 1 cleared any external
--      redeemed_lot_id reference, step 2's cascade cleared this user's
--      own membership_monthly_grants/membership_term_grants.lot_id
--      references, step 3 cleared this user's own reservations).
--   5. Delete credit_ledger, credit_accounts (no incoming FKs referencing
--      them from elsewhere).
--   6. Anonymize (not delete) the purchase-grant tables.
--
-- Idempotent: safe to call more than once for the same id (every step is
-- a plain DELETE/UPDATE ... WHERE, not an INSERT), which matters because
-- account deletion should never fail-partial in a way that can't be
-- retried.
-- =============================================================================

create or replace function public.cleanup_account_entitlement_data(p_clerk_user_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Sever this user's REDEEMER identity from coupons issued by someone
  -- else (their own issued coupons are handled by the membership cascade
  -- in step 2 instead).
  update gift_personal_coupons
  set redeemed_by_clerk_user_id = null,
      redeemed_lot_id = null
  where redeemed_by_clerk_user_id = p_clerk_user_id
    and membership_id not in (
      select id from memberships where clerk_user_id = p_clerk_user_id
    );

  -- 2. Own memberships + cascaded monthly/term grants + own issued coupons.
  delete from memberships where clerk_user_id = p_clerk_user_id;

  -- 3. In-flight reservation holds.
  delete from credit_reservations where clerk_user_id = p_clerk_user_id;

  -- 4. Individually-tracked grant lots (now unreferenced).
  delete from credit_lots where clerk_user_id = p_clerk_user_id;

  -- 5. Append-only usage ledger + cached balance.
  delete from credit_ledger where clerk_user_id = p_clerk_user_id;
  delete from credit_accounts where clerk_user_id = p_clerk_user_id;

  -- 6. Anonymize (retain) minimal transaction evidence.
  update us_purchase_grants
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;

  update kr_purchase_grants
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;

  update beta_purchase_grants
  set clerk_user_id = 'deleted:' || id::text
  where clerk_user_id = p_clerk_user_id;
end;
$$;

revoke all on function public.cleanup_account_entitlement_data(text) from public;
grant execute on function public.cleanup_account_entitlement_data(text) to service_role;

comment on function public.cleanup_account_entitlement_data(text) is
  'Called from app/api/account/delete/route.ts alongside the existing reports-row delete. Deletes non-financial entitlement/service-usage state (credit engine + membership tables) and anonymizes (never deletes) the minimal purchase-grant transaction record kept for accounting/e-commerce recordkeeping, by replacing clerk_user_id with an opaque deleted:<row id> archival identifier. Idempotent.';
