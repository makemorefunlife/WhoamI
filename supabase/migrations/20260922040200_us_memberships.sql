-- =============================================================================
-- US Annual Membership schema. Deliberately generic (no "us_" in table
-- names) so KR can adopt the same membership shape later without a second
-- schema -- only lib/payment/usPricing.ts's plan ids are US-specific.
--
-- Paddle sends no monthly-cycle event for an annual subscription -- only
-- the initial purchase and each yearly renewal are real Paddle
-- transactions. The 2/month relationship-credit entitlement inside a term
-- is therefore NOT webhook-driven: it's computed on demand from
-- memberships.started_at (see membership_cycle_at + ensure_monthly_
-- relationship_grant in the next migration) using calendar-month
-- arithmetic anchored to the original signup day-of-month (not drifting
-- through short months -- Jan 31 -> Feb 28 -> Mar 31 -> Apr 30).
-- =============================================================================

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  plan_id text not null,
  status text not null check (status in ('active', 'cancelled', 'refunded', 'ended')),
  -- Original signup instant -- the permanent anchor for monthly-cycle
  -- day-of-month math. Never changes across renewals.
  started_at timestamptz not null,
  -- How many annual renewals have landed (0 = original term). Bumped by
  -- process_us_annual_renewal.
  term_index integer not null default 0,
  current_term_start timestamptz not null,
  current_term_end timestamptz not null,
  paddle_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one ACTIVE membership per user (a cancelled/refunded/ended one
-- doesn't block a fresh signup from creating a new row).
create unique index if not exists memberships_one_active_per_user
  on public.memberships (clerk_user_id)
  where status = 'active';

create unique index if not exists memberships_paddle_subscription_key
  on public.memberships (paddle_subscription_id)
  where paddle_subscription_id is not null;

-- Idempotency + record of each lazily-granted monthly relationship-credit
-- cycle. (membership_id, cycle_index) unique is what makes
-- ensure_monthly_relationship_grant safe to call as often as needed
-- (every balance check, every generation attempt) without ever
-- double-granting a cycle.
create table if not exists public.membership_monthly_grants (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete cascade,
  cycle_index integer not null,
  cycle_start timestamptz not null,
  cycle_end timestamptz not null,
  -- The credit_lots row this cycle's +2 relationship grant created. Also
  -- what additional_relationship_eligible() checks the remaining balance
  -- of, so eligibility is "this cycle's included credits are gone", not
  -- "total relationship balance is zero".
  lot_id uuid references public.credit_lots(id),
  granted_at timestamptz not null default now(),
  unique (membership_id, cycle_index)
);

-- Idempotency + record for the two per-term grants that are NOT monthly:
-- the welcome gift (2x Gift Personal coupons, term_index = 0 ONLY) and the
-- member's own +1 Personal credit (every term, including renewals).
create table if not exists public.membership_term_grants (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete cascade,
  term_index integer not null,
  grant_type text not null check (grant_type in ('welcome_gift_coupons', 'term_personal_credit')),
  lot_id uuid references public.credit_lots(id),
  granted_at timestamptz not null default now(),
  unique (membership_id, term_index, grant_type)
);

-- Gift Personal coupons -- a personal-analysis credit issued to be handed
-- to someone else, not spent by the annual member themselves. Redemption
-- (redeem_gift_personal_coupon, next migration) grants a normal permanent
-- personal credit_lot to whoever redeems the code.
create table if not exists public.gift_personal_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  issued_to_clerk_user_id text not null,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  status text not null default 'unredeemed' check (status in ('unredeemed', 'redeemed', 'revoked')),
  redeemed_by_clerk_user_id text,
  redeemed_at timestamptz,
  redeemed_lot_id uuid references public.credit_lots(id),
  created_at timestamptz not null default now()
);

create unique index if not exists gift_personal_coupons_code_key
  on public.gift_personal_coupons (code);

-- One row per successfully-verified US Paddle transaction (initial
-- purchase of any of the 5 US plans, or an annual renewal transaction).
-- Mirrors beta_purchase_grants' pattern exactly (unique on
-- paddle_transaction_id is the idempotency guard -- see
-- app/api/beta/checkout/complete/route.ts for why re-fetching the
-- transaction server-side, keyed by its id, is the trust boundary here,
-- not the client's callback or a webhook). Kept separate from
-- beta_purchase_grants because its plan_id set and event_kind concept
-- (initial vs renewal) are specific to the US catalog.
create table if not exists public.us_purchase_grants (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  plan_id text not null check (plan_id in (
    'us_personal_premium', 'us_relationship_premium', 'us_insight_pass_30d',
    'us_annual_membership', 'us_additional_relationship'
  )),
  event_kind text not null default 'initial' check (event_kind in ('initial', 'renewal')),
  paddle_transaction_id text not null,
  paddle_price_id text not null,
  currency_code text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists us_purchase_grants_txn_key
  on public.us_purchase_grants (paddle_transaction_id);

create index if not exists us_purchase_grants_user_idx
  on public.us_purchase_grants (clerk_user_id, created_at desc);

alter table public.memberships enable row level security;
alter table public.membership_monthly_grants enable row level security;
alter table public.membership_term_grants enable row level security;
alter table public.gift_personal_coupons enable row level security;
alter table public.us_purchase_grants enable row level security;

grant select, insert, update, delete on table public.memberships to service_role;
grant select, insert, update, delete on table public.membership_monthly_grants to service_role;
grant select, insert, update, delete on table public.membership_term_grants to service_role;
grant select, insert, update, delete on table public.gift_personal_coupons to service_role;
grant select, insert on table public.us_purchase_grants to service_role;
