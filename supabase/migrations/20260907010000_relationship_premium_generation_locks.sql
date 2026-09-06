-- =============================================================================
-- Relationship premium generation lock — one row per (relationship_report_id,
-- kind, locale) currently in flight. Prevents two concurrent requests from
-- both calling OpenAI for the exact same generation target (double-click,
-- two tabs, two participants triggering the same kind near-simultaneously)
-- without blocking other kinds/locales for the same relationship — a
-- different kind or locale acquires its own, independent lock row.
--
-- kind/locale values are the app's canonical values only (RelationshipKind /
-- Locale) — enforced by CHECK constraints here as a second line of defense
-- in case an uncanonicalized value (e.g. "marriage" instead of
-- "cohabitation") is ever passed by a caller.
--
-- Acquire: INSERT ... ON CONFLICT (relationship_report_id, kind, locale)
-- DO NOTHING — atomic CAS via the unique index below, no read-then-write.
-- Release: DELETE ... WHERE id = :lockId (by lock id, not by key, so a
-- stolen-and-reacquired lock is never deleted by the original holder).
-- Stale-lock recovery: a lock older than the app's own timeout budget is
-- considered abandoned (crashed/timed-out request that never released) and
-- may be atomically "stolen" via a conditional UPDATE ... WHERE started_at <
-- cutoff, which is itself race-free under Postgres row locking.
--
-- RLS enabled, no anon/authenticated policies — service-role API only,
-- matching every other table in this schema. GRANT included in this same
-- migration (not deferred to a follow-up) — a prior table
-- (relationship_report_shares et al.) shipped RLS without the base GRANT,
-- which silently blocked service-role access until
-- 20260904120000_grant_relationship_map_service_role.sql fixed it; not
-- repeating that here.
-- =============================================================================

create table if not exists public.relationship_premium_generation_locks (
  id uuid primary key default gen_random_uuid(),
  relationship_report_id uuid not null references public.relationship_reports(id) on delete cascade,
  kind text not null check (kind in ('romantic', 'work', 'cohabitation', 'friendship', 'family')),
  locale text not null check (locale in ('en-US', 'ko-KR')),
  started_at timestamptz not null default now(),
  requested_by_report_id uuid not null references public.reports(id) on delete cascade
);

create unique index if not exists relationship_premium_generation_locks_key
  on public.relationship_premium_generation_locks (relationship_report_id, kind, locale);

create index if not exists relationship_premium_generation_locks_started_at_idx
  on public.relationship_premium_generation_locks (started_at);

alter table public.relationship_premium_generation_locks enable row level security;

comment on table public.relationship_premium_generation_locks is
  'RLS enabled; service-role API only (no anon/authenticated policies). One row = an in-flight premium generation for (relationship_report_id, kind, locale). Acquired via INSERT ... ON CONFLICT DO NOTHING; released via DELETE by id; abandoned rows may be atomically stolen via a conditional UPDATE on started_at.';

grant select, insert, update, delete
  on table public.relationship_premium_generation_locks
  to service_role;
