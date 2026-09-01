-- My Relationship Map — premium report sharing (spec sections 32-37).
-- Additive only: one new table, no changes to existing report/relationship
-- tables. Reports stay PRIVATE by default (no row here == not shared).
--
-- Access model matches the rest of the relationship system: RLS on, no
-- anon/authenticated policies — every read/write goes through service-role
-- API routes (lib/report/assertOwnedReportAccess-style ownership checks),
-- never direct client-side Supabase access.
--
-- NOTE: this migration is additive and safe to apply, but has not been
-- applied by the agent that wrote it — creating this file does not touch
-- the live database. Run it deliberately (e.g. via the project's normal
-- `supabase db push` / apply-supabase-migration.mjs flow) when ready.

create table if not exists public.relationship_report_shares (
  id uuid primary key default gen_random_uuid(),
  relationship_report_id uuid not null references public.relationship_reports(id) on delete cascade,
  -- 'basic' or a relationship_kind (romantic/work/cohabitation/friendship/family) —
  -- one share row per (relationship_report_id, kind), so each report surface
  -- has its own independent share/revoke state.
  kind text not null,
  owner_report_id uuid not null references public.reports(id),
  recipient_report_id uuid not null references public.reports(id),
  share_token text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists relationship_report_shares_token_key
  on public.relationship_report_shares (share_token);

create index if not exists relationship_report_shares_by_report_kind
  on public.relationship_report_shares (relationship_report_id, kind);

create index if not exists relationship_report_shares_by_recipient
  on public.relationship_report_shares (recipient_report_id, status);

alter table public.relationship_report_shares enable row level security;

comment on table public.relationship_report_shares is
  'RLS enabled; service-role API only (no anon/authenticated policies). A row = the owner explicitly clicked Share for that (relationship_report_id, kind); no row = private, the default.';
