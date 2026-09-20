-- Relationship Discovery Flow V1 — per-viewer "have they seen this new
-- connection yet" state, added to the existing directional membership
-- table rather than a new table (relationship_map_memberships already
-- stores one row per (relationship_report, viewer), so a nullable
-- timestamp here is naturally already split per-viewer/per-direction).
--
-- Semantics:
--   NULL     -> this viewer has not yet been shown this connection as a
--               "discovery" (owner side of a fresh personal-link join,
--               or the inviter side of a fresh one-time invite).
--   non-NULL -> already shown/confirmed. Set once, at INSERT time, for
--               the joiner/accepter side (they were just present when the
--               connection formed, so there is nothing to "discover"
--               later) or later via POST /api/connect/discoveries/:id/seen
--               once the owner/inviter actually views it.
--
-- Legacy connections (pairs with no relationship_map_memberships row at
-- all — manual adds, pre-personal-link invites) are unaffected: the
-- discovery query below only ever matches rows that exist, and no code
-- path creates a membership row for those pairs (see
-- lib/relationship/map/directionalMembership.ts).
alter table public.relationship_map_memberships
  add column if not exists discovered_seen_at timestamptz;

comment on column public.relationship_map_memberships.discovered_seen_at is
  'NULL = this viewer has not yet seen/confirmed this connection as a new discovery. Set once and never cleared back to NULL.';

-- Backfill: rows that already existed before this migration ran predate the
-- Discovery Flow entirely — their viewers already reached them through the
-- old Hub UI, so there is nothing new to "discover". Without this, every
-- pre-existing accepted membership would read as NULL and flood every
-- existing user with a false "new discovery" for every existing connection
-- on their first post-deploy Hub visit.
--
-- This is a one-time UPDATE, not a column DEFAULT, so it only ever touches
-- rows present at migration-apply time. Any row inserted after this
-- statement runs (i.e. by the app's current connect/complete and
-- invite/complete code) is untouched by it and keeps that code's own
-- discovered_seen_at behavior as-is (joiner/invitee = now() at insert;
-- owner/inviter = left NULL until actually viewed).
--
-- Value used: relationship_map_memberships has exactly two existing
-- timestamp columns (see 20260902090000_personal_connect_and_map_membership.sql)
-- — created_at (not null, set at row insert) and responded_at (nullable,
-- set when a viewer accepts/declines that row). responded_at is the more
-- accurate "this viewer already engaged with this row" moment where it is
-- set; created_at (always present) is the safe fallback where it isn't, so
-- every pre-existing row is backfilled to a real past timestamp rather than
-- a fabricated or arbitrary one.
update public.relationship_map_memberships
  set discovered_seen_at = coalesce(responded_at, created_at)
  where discovered_seen_at is null;

-- Discovery inbox read pattern: "my own rows that are accepted and still
-- unseen" — same shape as relationship_map_memberships_by_viewer
-- (viewer_report_id, status) but narrowed further, so a dedicated partial
-- index keeps that lookup cheap without duplicating the existing one.
create index if not exists relationship_map_memberships_unseen_by_viewer
  on public.relationship_map_memberships (viewer_report_id)
  where status = 'accepted' and discovered_seen_at is null;
