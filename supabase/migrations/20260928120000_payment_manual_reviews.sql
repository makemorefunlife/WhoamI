-- =============================================================================
-- payment_manual_reviews -- durable flag for completed Paddle transactions
-- that must NOT be auto-fulfilled.
--
-- Our catalog is fixed products at quantity 1 (a pack such as
-- kr_relationship_triple is its own product, still bought at quantity 1).
-- process_us_purchase / process_kr_purchase grant a fixed amount per plan
-- and have no quantity concept, so a transaction whose final Paddle
-- quantity is not exactly 1 (the customer changed it inside the Paddle
-- overlay) would otherwise be charged N and granted 1. Instead, both
-- fulfillment paths (app/api/webhooks/paddle and
-- app/api/pricing/checkout/complete) grant NOTHING for such a transaction
-- and record it here for a human to resolve (grant N via grant_credit, or
-- refund in Paddle). Unique on (provider, provider_transaction_id) so the
-- webhook and the client /complete call -- or Paddle retries -- never
-- create duplicate review rows.
--
-- ADDITIVE ONLY: new table, no change to any existing table or function.
-- =============================================================================

create table if not exists public.payment_manual_reviews (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paddle',
  provider_transaction_id text not null,
  region text,
  plan_id text,
  price_id text,
  quantity integer,
  clerk_user_id text,
  reason text not null,
  source text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_note text
);

create unique index if not exists payment_manual_reviews_txn_key
  on public.payment_manual_reviews (provider, provider_transaction_id);

create index if not exists payment_manual_reviews_open_idx
  on public.payment_manual_reviews (created_at)
  where resolved_at is null;

alter table public.payment_manual_reviews enable row level security;
grant select, insert, update on table public.payment_manual_reviews to service_role;

comment on table public.payment_manual_reviews is
  'RLS enabled; service-role API only. One row per completed payment that was deliberately NOT auto-fulfilled (e.g. final Paddle quantity != 1). Resolve by granting via grant_credit or refunding in Paddle, then set resolved_at + resolution_note.';
