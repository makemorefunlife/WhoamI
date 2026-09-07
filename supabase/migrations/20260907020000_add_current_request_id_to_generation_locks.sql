-- =============================================================================
-- relationship_premium_generation_locks.current_request_id
--
-- The credit engine needs a fencing token to tell "the request that
-- currently holds this lock" apart from "a request that used to hold it and
-- got stale-stolen". The lock row's own `id` cannot serve this purpose — a
-- steal is an UPDATE on the same row (not a delete+insert), so the row id
-- stays identical across owners. current_request_id is set on both a clean
-- acquire and a steal, and is the value every release/ownership-check must
-- match before touching the row or the credit reservation tied to it.
--
-- Backfill: existing rows get a fresh random id (they're ephemeral —
-- released within seconds to minutes in normal operation — so there is
-- nothing meaningful to preserve for any row that happens to exist at
-- migration time).
-- =============================================================================

alter table public.relationship_premium_generation_locks
  add column if not exists current_request_id uuid not null default gen_random_uuid();

comment on column public.relationship_premium_generation_locks.current_request_id is
  'Fencing token: the generation_request_id of whichever request currently holds this lock. Set on acquire and on steal. Release and the pre-merge ownership check both require this to match the caller''s own request id.';
