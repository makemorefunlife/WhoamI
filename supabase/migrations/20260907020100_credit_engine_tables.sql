-- =============================================================================
-- Credit engine — shared by personal and relationship generation (only
-- relationship is wired to it yet; personal keeps its existing binary
-- entitlement gate for now and can adopt the same tables/RPCs later without
-- a schema change).
--
-- credit_accounts   — cached current balance per (clerk_user_id, credit_type).
-- credit_reservations — one row per in-flight generation attempt holding a
--   credit. Keyed by generation_request_id (an immutable id the caller
--   mints once per HTTP request attempt) — NOT by generation_lock_id, since
--   a stale-lock steal reuses the same lock row id for a new owner.
-- credit_ledger     — append-only. Every balance-affecting event (reserve,
--   consume, release, grant) writes exactly one row here, so the full
--   history of any account's balance can always be reconstructed from this
--   table alone (sum(delta) where enforced = true). Rows also get written
--   during beta (enforced = false) with the same deltas, for usage
--   analytics, without ever touching the real balance — see
--   creditEnforcementPolicy.ts.
--
-- RLS enabled + service_role GRANT in this same migration (not deferred),
-- matching the established pattern in this schema.
-- =============================================================================

create table if not exists public.credit_accounts (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  credit_type text not null check (credit_type in ('personal', 'relationship')),
  balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists credit_accounts_user_type_key
  on public.credit_accounts (clerk_user_id, credit_type);

create table if not exists public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  credit_type text not null check (credit_type in ('personal', 'relationship')),
  relationship_report_id uuid references public.relationship_reports(id) on delete cascade,
  kind text check (kind in ('romantic', 'work', 'cohabitation', 'friendship', 'family')),
  locale text check (locale in ('en-US', 'ko-KR')),
  generation_lock_id uuid,
  generation_request_id uuid not null,
  enforced boolean not null,
  reserved_at timestamptz not null default now()
);

create unique index if not exists credit_reservations_request_key
  on public.credit_reservations (generation_request_id);

create index if not exists credit_reservations_reserved_at_idx
  on public.credit_reservations (reserved_at);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  credit_type text not null check (credit_type in ('personal', 'relationship')),
  delta integer not null,
  reason text not null check (reason in (
    'reservation_hold', 'consumption', 'reservation_release',
    'membership_grant', 'one_time_purchase', 'additional_purchase', 'promo', 'admin_grant'
  )),
  source text check (source in ('membership', 'one_time_purchase', 'additional_purchase', 'promo', 'admin')),
  reference_id uuid,
  balance_after integer not null,
  enforced boolean not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_type_idx
  on public.credit_ledger (clerk_user_id, credit_type, created_at desc);

-- Terminal-once guard: at most one of {consumption, reservation_release} may
-- ever exist per reservation (reference_id). This is the hard DB-level
-- backstop behind the reservation-row-existence check in the RPCs — even if
-- consume and release somehow both ran concurrently for the same
-- reservation, only one ledger row can win; the loser's RPC catches the
-- unique_violation and treats it as an idempotent no-op.
create unique index if not exists credit_ledger_terminal_once
  on public.credit_ledger (reference_id)
  where reason in ('consumption', 'reservation_release');

alter table public.credit_accounts enable row level security;
alter table public.credit_reservations enable row level security;
alter table public.credit_ledger enable row level security;

comment on table public.credit_accounts is
  'RLS enabled; service-role API only. Cached current balance per (clerk_user_id, credit_type) — credit_ledger is the source of truth, this is a fast-path cache kept in sync by the reserve/consume/release/grant RPCs.';
comment on table public.credit_reservations is
  'RLS enabled; service-role API only. One row = a credit held for one in-flight generation attempt. Keyed by generation_request_id, not by lock id — see relationshipPremiumGenerationLock.ts.';
comment on table public.credit_ledger is
  'RLS enabled; service-role API only. Append-only. Every reserve/consume/release/grant writes exactly one row; enforced=true rows sum to the real balance, all rows together are the full usage history including unenforced beta usage.';

grant select, insert, update, delete on table public.credit_accounts to service_role;
grant select, insert, update, delete on table public.credit_reservations to service_role;
grant select, insert, update, delete on table public.credit_ledger to service_role;
