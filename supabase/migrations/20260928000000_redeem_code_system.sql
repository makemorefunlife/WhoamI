-- =============================================================================
-- Redeem Code system: Annual Membership Personal gifts + manually-issued
-- tester/beta Personal codes.
--
-- Deliberately reuses the existing entitlement engine end to end -- a
-- successful redemption of either kind always ends in a normal
-- grant_credit_lot(..., 'personal', ...) call, same as every other Personal
-- credit source. No second credit system is introduced.
--
-- ANNUAL GIFTS: gift_personal_coupons already existed (20260922040200_us_
-- memberships.sql) and process_us_purchase's us_annual_membership branch
-- already creates exactly 2 of them on first activation only, guarded by
-- membership_term_grants' unique (membership_id, term_index, grant_type)
-- with grant_type='welcome_gift_coupons' (term_index=0 only -- never
-- repeated by process_us_annual_renewal, never re-triggered by a webhook
-- retry or duplicate Paddle event, both of which are stopped even earlier
-- by us_purchase_grants' unique paddle_transaction_id check). Cancellation
-- (mark_membership_refunded) already revokes only still-'unredeemed'
-- coupons, leaving any already-'redeemed' one untouched. None of that is
-- changed here.
--
-- redeem_gift_personal_coupon (defined in 20260922040300_us_membership_
-- functions.sql) already existed too, with atomic claim-by-UPDATE, but had
-- two gaps against the current product spec and, per grep, precisely ZERO
-- callers anywhere in the app -- so both are safe, uncalled-path fixes:
--   1. It never checked that the redeemer isn't the coupon's own sender.
--   2. It granted a PERMANENT credit_lot (expires_at = null). The new spec
--      wants the claimed credit to expire 1 year after claim. This
--      CREATE OR REPLACE only changes what a NEW redemption grants going
--      forward -- an already-redeemed coupon's already-permanent lot is
--      untouched (nothing here updates existing credit_lots rows).
--
-- The gift CODE's own expiry (1 year after ISSUE, not claim) is computed
-- at read/redeem time from gift_personal_coupons.created_at, the same
-- style already used for Decision Journal's pass-window
-- (lib/entitlements/decisionJournalAccess.ts) -- no new column needed
-- since every gift coupon shares the identical fixed 1-year rule.
--
-- TESTER CODES are new: no prior gift/coupon/promo-code infrastructure
-- existed for a manually-issued, possibly multi-use code, so
-- tester_personal_codes / tester_personal_code_redemptions are introduced
-- below, mirroring gift_personal_coupons' own conventions (plain-text
-- code + unique index, not hashed -- see the migration-level note in
-- tester_personal_codes' comment for why that matches this codebase's
-- existing choice rather than introducing a new pattern).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. redeem_gift_personal_coupon: add the sender-check, switch the granted
--    credit to a 1-year expiry. Same signature as before (CREATE OR REPLACE),
--    so nothing needs to change at any call site (there are none yet).
-- -----------------------------------------------------------------------------
create or replace function public.redeem_gift_personal_coupon(
  p_code text,
  p_redeemed_by_clerk_user_id text
)
returns table(ok boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon_id uuid;
  v_issued_to text;
  v_created_at timestamptz;
  v_lot_id uuid;
begin
  -- Lock the row up front so the sender-check and the claim below observe
  -- the exact same row state, and a concurrent redeemer blocks here
  -- (rather than racing the UPDATE ... WHERE status = 'unredeemed' below)
  -- until this transaction commits or rolls back.
  select id, issued_to_clerk_user_id, created_at
    into v_coupon_id, v_issued_to, v_created_at
    from gift_personal_coupons
    where code = p_code
    for update;

  if v_coupon_id is null then
    return query select false, 'not_found';
    return;
  end if;

  if v_issued_to = p_redeemed_by_clerk_user_id then
    return query select false, 'cannot_claim_own_gift';
    return;
  end if;

  -- The gift code itself expires 1 year after it was ISSUED (created_at),
  -- distinct from the 1-year window the resulting credit gets after CLAIM.
  if v_created_at + interval '1 year' <= now() then
    return query select false, 'expired';
    return;
  end if;

  update gift_personal_coupons
    set status = 'redeemed',
        redeemed_by_clerk_user_id = p_redeemed_by_clerk_user_id,
        redeemed_at = now()
    where id = v_coupon_id and status = 'unredeemed'
    returning id into v_coupon_id;

  if v_coupon_id is null then
    return query select false, 'already_redeemed_or_revoked';
    return;
  end if;

  select g.lot_id into v_lot_id from grant_credit_lot(
    p_redeemed_by_clerk_user_id, 'personal', 1, 'promo', v_coupon_id, now() + interval '1 year'
  ) g;

  update gift_personal_coupons set redeemed_lot_id = v_lot_id where id = v_coupon_id;

  return query select true, null::text;
end;
$$;

revoke all on function public.redeem_gift_personal_coupon(text, text) from public;
grant execute on function public.redeem_gift_personal_coupon(text, text) to service_role;

-- -----------------------------------------------------------------------------
-- 2. Tester / beta Personal codes -- manually issued (service-role only;
--    see scripts/create-tester-code.ts), optionally multi-use.
--
-- Codes are stored in plain text with a unique index, not hashed --
-- matching gift_personal_coupons' own existing convention in this same
-- codebase rather than introducing a second pattern. This is judged
-- acceptable because: (a) the code space is high-entropy random (not
-- sequential/guessable -- see the generator in scripts/create-tester-code.ts),
-- (b) the worst outcome from a guessed code is one free Personal analysis
-- credit, not account access or payment data, and (c) the redeem API route
-- rate-limits attempts per signed-in user (lib/security/rateLimit.ts's new
-- "redeem_code" bucket), so brute-forcing is impractical. If codes are ever
-- reused for something higher-value, hash them (code_hash + a short
-- non-secret display prefix) instead.
-- -----------------------------------------------------------------------------
create table if not exists public.tester_personal_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  max_redemptions integer not null default 1 check (max_redemptions > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  -- Free-text internal label only (e.g. "Discord beta wave 3") -- never
  -- shown to a redeemer, purely for whoever issues codes to tell them apart.
  note text,
  created_at timestamptz not null default now()
);

create unique index if not exists tester_personal_codes_code_key
  on public.tester_personal_codes (code);

-- One row per successful redemption. The unique constraint is what makes
-- "must never grant twice to the same redemption event" concrete: the same
-- user can never redeem the same code a second time, and a retried/duplicate
-- client request for an already-completed redemption hits this constraint
-- (mapped to a clean "already_redeemed" reason) instead of granting again.
create table if not exists public.tester_personal_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  tester_code_id uuid not null references public.tester_personal_codes(id) on delete cascade,
  redeemed_by_clerk_user_id text not null,
  redeemed_at timestamptz not null default now(),
  lot_id uuid references public.credit_lots(id),
  unique (tester_code_id, redeemed_by_clerk_user_id)
);

alter table public.tester_personal_codes enable row level security;
alter table public.tester_personal_code_redemptions enable row level security;

-- Redeems a tester/beta code: validates active/expiry/remaining-uses,
-- atomically reserves one redemption slot, and grants a personal credit_lot
-- expiring 1 year from redemption. Concurrency-safe the same way
-- redeem_gift_personal_coupon is: the INSERT's unique constraint stops a
-- double-redeem by the same user, and the UPDATE ... WHERE redemption_count
-- < max_redemptions is the atomic gate against exceeding max uses under
-- concurrent redemptions (Postgres row-level locking on the UPDATE means
-- only as many concurrent transactions as there are remaining slots can
-- ever see redemption_count < max_redemptions evaluate true).
create or replace function public.redeem_tester_personal_code(
  p_code text,
  p_redeemed_by_clerk_user_id text
)
returns table(ok boolean, reason text, lot_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code_id uuid;
  v_active boolean;
  v_expires_at timestamptz;
  v_max integer;
  v_count integer;
  v_redemption_id uuid;
  v_claimed_id uuid;
  v_lot_id uuid;
begin
  select id, active, expires_at, max_redemptions, redemption_count
    into v_code_id, v_active, v_expires_at, v_max, v_count
    from tester_personal_codes
    where code = p_code
    for update;

  if v_code_id is null then
    return query select false, 'not_found', null::uuid;
    return;
  end if;

  if not v_active then
    return query select false, 'inactive', null::uuid;
    return;
  end if;

  if v_expires_at is not null and v_expires_at <= now() then
    return query select false, 'expired', null::uuid;
    return;
  end if;

  if v_count >= v_max then
    return query select false, 'exhausted', null::uuid;
    return;
  end if;

  begin
    insert into tester_personal_code_redemptions (tester_code_id, redeemed_by_clerk_user_id)
      values (v_code_id, p_redeemed_by_clerk_user_id)
      returning id into v_redemption_id;
  exception when unique_violation then
    return query select false, 'already_redeemed', null::uuid;
    return;
  end;

  -- Real concurrency gate (the pre-checks above are for a friendly error
  -- message on the common path; this atomic, row-locked UPDATE is what
  -- actually prevents exceeding max_redemptions when multiple redemptions
  -- race each other -- the row was already locked by the `for update`
  -- select above, so this is safe within the same transaction).
  update tester_personal_codes
    set redemption_count = redemption_count + 1
    where id = v_code_id
      and active = true
      and (expires_at is null or expires_at > now())
      and redemption_count < max_redemptions
    returning id into v_claimed_id;

  if v_claimed_id is null then
    delete from tester_personal_code_redemptions where id = v_redemption_id;
    return query select false, 'exhausted', null::uuid;
    return;
  end if;

  select g.lot_id into v_lot_id from grant_credit_lot(
    p_redeemed_by_clerk_user_id, 'personal', 1, 'promo', v_redemption_id, now() + interval '1 year'
  ) g;

  update tester_personal_code_redemptions set lot_id = v_lot_id where id = v_redemption_id;

  return query select true, null::text, v_lot_id;
end;
$$;

revoke all on function public.redeem_tester_personal_code(text, text) from public;
grant execute on function public.redeem_tester_personal_code(text, text) to service_role;
