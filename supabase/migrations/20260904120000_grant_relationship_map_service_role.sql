-- =============================================================================
-- service_role grants for the Relationship Map / Personal Connect tables.
-- No prior migration grants these — 20260901120000_relationship_report_shares.sql
-- and 20260902090000_personal_connect_and_map_membership.sql create the tables
-- and enable RLS, but never grant table privileges, so service_role (which
-- bypasses RLS but still needs the underlying GRANT) had no access at all.
-- Idempotent. Does NOT grant to anon or authenticated. Does NOT alter RLS.
-- Mirrors the exact pattern used for every other table in
-- 20260805200000_restore_service_role_relationship_privileges.sql.
-- =============================================================================

grant select, insert, update, delete
  on table public.relationship_report_shares
  to service_role;

grant select, insert, update, delete
  on table public.personal_connect_links
  to service_role;

grant select, insert, update, delete
  on table public.personal_connect_link_uses
  to service_role;

grant select, insert, update, delete
  on table public.relationship_map_memberships
  to service_role;
