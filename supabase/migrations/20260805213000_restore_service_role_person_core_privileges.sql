-- =============================================================================
-- Follow-up: service_role privileges for PersonCore (Romantic/Partner premium).
-- Idempotent. Prior migration 20260805200000 covered hub/relationship tables.
-- Does NOT grant to anon or authenticated. Does NOT alter RLS or schemas.
-- Does NOT grant DELETE on person_core_blueprints (premium uses upsert; account
-- deletion cascades from reports; survey/birth invalidate soft-fails and
-- fingerprint-stale rebuild covers correctness without DELETE privilege).
-- =============================================================================

grant usage on schema public to service_role;

-- Proven failure: person_core_blueprints upsert during Romantic/Partner analyze
grant select, insert, update
  on table public.person_core_blueprints
  to service_role;

-- Romantic/Partner premium already needs these (re-assert idempotently; no broaden):
-- reports              SELECT (ownership, birth, PersonCore fingerprint)
-- survey_responses     SELECT (PersonCore build + romantic self profile)
-- relationship_reports SELECT/UPDATE (+ INSERT elsewhere)
-- relationship_analysis_logs INSERT
-- RPC merge_relationship_premium_by_kind EXECUTE (locale-less fallback)
-- Covered by 20260805200000_restore_service_role_relationship_privileges.sql
-- and 20260714220000_merge_relationship_premium_by_kind.sql

-- Explicitly NOT granted here (not on Romantic/Partner premium runtime path):
-- report_analyses, relationship_favorites, invites, person_core_blueprints DELETE
