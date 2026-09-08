-- =============================================================================
-- beta_purchase_grants — idempotency guard for the 1-week Beta's Paddle
-- sandbox purchase flow.
--
-- credit_ledger_terminal_once (from the credit engine migration) only
-- de-duplicates the TERMINAL side of a reservation (consumption /
-- reservation_release) — it does nothing for a GRANT. Nothing in the
-- existing schema stops the same Paddle transaction_id from being granted
-- twice if the client's success callback fires more than once (page
-- refresh after redirect, double-click, retry). This table is that guard:
-- one row per (paddle_transaction_id), unique. The route claims a row here
-- via INSERT *before* calling grant_credit; a unique_violation on that
-- insert means this transaction was already processed, so the route
-- no-ops instead of granting again.
--
-- Deliberately NOT a general billing/subscription table — no period,
-- no renewal_date, no status lifecycle. Just a flat, append-only receipt
-- log keyed by the one external id (Paddle's transaction id) that can
-- actually repeat.
-- =============================================================================

create table public.beta_purchase_grants (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  plan_id text not null
    check (plan_id in ('personal_premium', 'relationship_premium', 'membership_beta', 'additional_relationship')),
  paddle_transaction_id text not null,
  paddle_price_id text not null,
  currency_code text not null,
  created_at timestamptz not null default now()
);

create unique index beta_purchase_grants_txn_key
  on public.beta_purchase_grants (paddle_transaction_id);

create index beta_purchase_grants_user_idx
  on public.beta_purchase_grants (clerk_user_id, created_at desc);

alter table public.beta_purchase_grants enable row level security;

comment on table public.beta_purchase_grants is
  'RLS enabled; service-role API only. One row per successfully-verified Paddle sandbox transaction — the unique index on paddle_transaction_id is what makes granting credits/entitlement for a Beta purchase idempotent under retry/duplicate callback.';

grant select, insert
  on table public.beta_purchase_grants
  to service_role;
