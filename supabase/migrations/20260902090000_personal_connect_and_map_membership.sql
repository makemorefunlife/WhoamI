-- My Relationship Map — persistent personal invite link + directional map
-- membership (spec: "RELATIONSHIP LAB — FINAL MAP + CONNECTION UX
-- IMPLEMENTATION", sections 6-11). Additive only: three new tables, no
-- changes to `invites`, `relationship_reports`, or any existing table.
--
-- NOTE: written this pass but NOT applied and NOT wired into
-- /api/invite/create or /api/invite/complete yet — see the implementation
-- report's forensic/design sections for why. Applying this file alone is
-- safe (it creates nothing anything else reads yet); it only becomes live
-- once the invite endpoints are updated to use it.
--
-- Database-safety review pass (pre-apply): every FK to reports(id) or
-- relationship_reports(id) below now has an explicit ON DELETE action.
-- Without one, Postgres defaults to RESTRICT, and a lingering row in any
-- of these tables would have BLOCKED /api/account/delete's
-- `DELETE FROM reports WHERE clerk_user_id = ...` for either party —
-- these tables must never be able to hold a real user's account deletion
-- hostage. Chose CASCADE everywhere here because every row's entire
-- meaning is "a fact about this specific pair/report" — once either side
-- is gone, the fact is void, not something worth preserving as an orphan.
-- The one exception is personal_connect_link_uses.relationship_report_id,
-- which is an optional cross-reference (already nullable) rather than
-- part of the row's identity, so it gets SET NULL instead: losing the
-- linked report shouldn't erase the historical fact that a join happened.

-- Persistent, reusable personal connection link — one per report, distinct
-- from the existing single-use `invites` table (which stays untouched and
-- keeps its own single-accept semantics for whatever else may use it).
create table if not exists public.personal_connect_links (
  report_id uuid primary key references public.reports(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  reset_at timestamptz
);

create unique index if not exists personal_connect_links_token_key
  on public.personal_connect_links (token);

-- One row per person who has ever joined through a given personal link —
-- required because, unlike `invites.accepted_report_id`, a reusable link
-- can be used by more than one person. The `unique (report_id,
-- accepted_report_id)` constraint is the multi-use contract's other half:
-- many distinct users may use one link, but the same user can only ever
-- produce one use-record for it (re-visiting the link is a no-op, not a
-- second row).
create table if not exists public.personal_connect_link_uses (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade, -- link owner
  accepted_report_id uuid not null references public.reports(id) on delete cascade, -- person who joined
  relationship_report_id uuid references public.relationship_reports(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (report_id, accepted_report_id)
);

-- Directional map-membership / consent — spec sections 9-11. A row here
-- means `viewer_report_id`'s own Relationship Map has an opinion about
-- showing `other_report_id`; the ABSENCE of a row for an existing
-- relationship_reports pair is intentionally treated as "legacy, still
-- visible" by the application layer (see
-- lib/relationship/map/directionalMembership.ts) so applying this
-- migration can never make an existing user's map go empty. Only
-- connections created through the new personal-link flow are expected to
-- get real rows here.
--
-- Directional contract this schema supports (verified against
-- directionalMembership.ts's test suite): B joins through A's link -> one
-- row (viewer=B, other=A, status='accepted') and one row (viewer=A,
-- other=B, status='pending') are written. B requesting reciprocity and A
-- accepting/declining is just an UPDATE of that second row's status —
-- the unique(relationship_report_id, viewer_report_id) constraint ensures
-- there is always exactly one row to update, never a second pending
-- request piling up.
create table if not exists public.relationship_map_memberships (
  id uuid primary key default gen_random_uuid(),
  relationship_report_id uuid not null references public.relationship_reports(id) on delete cascade,
  viewer_report_id uuid not null references public.reports(id) on delete cascade,
  other_report_id uuid not null references public.reports(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (relationship_report_id, viewer_report_id)
);

create index if not exists relationship_map_memberships_by_viewer
  on public.relationship_map_memberships (viewer_report_id, status);

alter table public.personal_connect_links enable row level security;
alter table public.personal_connect_link_uses enable row level security;
alter table public.relationship_map_memberships enable row level security;

comment on table public.personal_connect_links is
  'RLS enabled; service-role API only. One persistent, resettable connect token per report. Rotating `token` (UPDATE, not a new row) makes the previous URL unusable immediately — nothing else references the token value, so personal_connect_link_uses history is untouched by a reset.';
comment on table public.personal_connect_link_uses is
  'RLS enabled; service-role API only. One row per person who has joined through a given personal link — unique(report_id, accepted_report_id) prevents the same user from producing duplicate use-records.';
comment on table public.relationship_map_memberships is
  'RLS enabled; service-role API only. Directional per-viewer map visibility; a missing row for an existing relationship_reports pair means "legacy, still visible" at the application layer, not "hidden".';
