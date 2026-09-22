-- =============================================================================
-- credit_lots — turns credit_accounts.balance from one opaque counter into
-- a set of individually-tracked grant "lots", each with its own optional
-- expiry. This is what makes two things possible that a single balance
-- column cannot express:
--
--   1. FIFO-by-expiry consumption: reserve_credit (next migration) spends
--      from the soonest-to-expire lot first, so a time-boxed grant (a
--      membership's monthly relationship credits, a 30-Day Pass's
--      credits) is drawn down before a permanent one — see
--      lib/credits/creditEngine.ts.
--   2. "Did this specific grant get used" checks — e.g. US Annual
--      membership eligibility for the $9.99 Additional Relationship
--      add-on depends on whether THIS cycle's 2 included credits are
--      gone, not the user's total relationship balance (which may also
--      hold an unrelated one-time purchase).
--
-- credit_accounts.balance remains the fast-path cache (unchanged
-- semantics for every existing caller); credit_lots + credit_ledger
-- together are the source of truth. Expired lots are zeroed lazily by
-- expire_credit_lots() (called at the top of reserve_credit and any
-- balance read that needs to be exact) — no cron/pg_cron dependency.
-- =============================================================================

create table if not exists public.credit_lots (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  credit_type text not null check (credit_type in ('personal', 'relationship')),
  amount integer not null check (amount > 0),
  remaining integer not null check (remaining >= 0),
  source text not null check (source in ('membership', 'one_time_purchase', 'additional_purchase', 'promo', 'admin')),
  reference_id uuid,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists credit_lots_spend_order_idx
  on public.credit_lots (clerk_user_id, credit_type, expires_at asc nulls last, created_at asc)
  where remaining > 0;

create index if not exists credit_lots_expiry_sweep_idx
  on public.credit_lots (clerk_user_id, credit_type)
  where remaining > 0 and expires_at is not null;

alter table public.credit_lots enable row level security;
grant select, insert, update, delete on table public.credit_lots to service_role;

comment on table public.credit_lots is
  'RLS enabled; service-role API only. One row per grant event, independently spendable/expirable. Source of truth for FIFO-by-expiry consumption and per-grant "was this specific lot used up" checks; credit_accounts.balance is a cached sum kept in sync by grant_credit_lot/reserve_credit/release_credit/expire_credit_lots.';

-- reserve_credit now records which lot a reservation drew from, so
-- release_credit can credit the SAME lot back (not just the aggregate
-- balance) if the generation attempt fails.
alter table public.credit_reservations
  add column if not exists credit_lot_id uuid references public.credit_lots(id);

-- expire_credit_lots (next migration) writes one 'expiration' ledger row
-- per sweep that actually zeroed something.
alter table public.credit_ledger drop constraint if exists credit_ledger_reason_check;
alter table public.credit_ledger add constraint credit_ledger_reason_check
  check (reason in (
    'reservation_hold', 'consumption', 'reservation_release',
    'membership_grant', 'one_time_purchase', 'additional_purchase', 'promo', 'admin_grant',
    'expiration'
  ));
