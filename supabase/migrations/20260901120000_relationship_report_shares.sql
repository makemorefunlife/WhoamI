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
--
-- Database-safety review pass (pre-apply): patched two issues found before
-- this ever touched a live database —
--   1. The uniqueness comment ("one row per relationship_report_id+kind")
--      was not actually enforced; a race between two concurrent "Share"
--      clicks (create/route.ts's revoke-then-insert is not atomic) could
--      have produced two ACTIVE rows for the same surface. Now a real
--      partial unique index, scoped to status='active' so re-sharing after
--      a revoke (which intentionally keeps the old row as history) still
--      works.
--   2. owner_report_id/recipient_report_id had no ON DELETE behavior,
--      which defaults to RESTRICT — a lingering share row would have
--      BLOCKED /api/account/delete's `DELETE FROM reports ...` for either
--      party. Added ON DELETE CASCADE on both, matching the ownership
--      semantics (a share with no owner or no recipient left is
--      meaningless, not something to preserve).
--   3. `kind` had no CHECK constraint. Traced the actual allowed values
--      from lib/relationship/relationshipKind.ts's RELATIONSHIP_KINDS —
--      the only 5 values this column is ever written with in current code
--      (ReportShareSection.tsx only renders for premium kinds, never
--      "basic", so "basic" was never a real value despite an earlier
--      comment implying it might be — verified, not guessed).

create table if not exists public.relationship_report_shares (
  id uuid primary key default gen_random_uuid(),
  relationship_report_id uuid not null references public.relationship_reports(id) on delete cascade,
  -- One of the 5 canonical RelationshipKind values (lib/relationship/relationshipKind.ts).
  -- One share row per (relationship_report_id, kind) surface — enforced by
  -- the partial unique index below, not just by convention.
  kind text not null check (kind in ('romantic', 'work', 'cohabitation', 'friendship', 'family')),
  owner_report_id uuid not null references public.reports(id) on delete cascade,
  recipient_report_id uuid not null references public.reports(id) on delete cascade,
  share_token text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists relationship_report_shares_token_key
  on public.relationship_report_shares (share_token);

-- Real uniqueness contract: at most one ACTIVE share per
-- (relationship_report_id, kind). Revoked rows are intentionally excluded
-- from this index so re-sharing after a revoke (create/route.ts) can
-- always insert a fresh row without colliding with its own history.
create unique index if not exists relationship_report_shares_active_unique
  on public.relationship_report_shares (relationship_report_id, kind)
  where status = 'active';

create index if not exists relationship_report_shares_by_recipient
  on public.relationship_report_shares (recipient_report_id, status);

alter table public.relationship_report_shares enable row level security;

comment on table public.relationship_report_shares is
  'RLS enabled; service-role API only (no anon/authenticated policies). A row = the owner explicitly clicked Share for that (relationship_report_id, kind); no row = private, the default. At most one active row per (relationship_report_id, kind), enforced by relationship_report_shares_active_unique.';
