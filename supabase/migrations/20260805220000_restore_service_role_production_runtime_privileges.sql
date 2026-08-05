-- =============================================================================
-- FINAL Production service_role privilege SSOT (idempotent follow-up).
-- Closes remaining gaps after:
--   20260805200000_restore_service_role_relationship_privileges.sql
--   20260805213000_restore_service_role_person_core_privileges.sql
--
-- Gaps closed here (static full-app audit):
--   1) report_analyses SIUD — /api/my/report + /api/report/birth
--   2) relationship_favorites UPDATE — PostgREST upsert = ON CONFLICT DO UPDATE
--   3) person_core_blueprints DELETE — invalidatePersonCoreBlueprint +
--      account-delete FK CASCADE from reports
--
-- Also re-asserts the complete Production runtime GRANT set so one paste
-- finishes the privilege-repair cycle even if prior grants drifted.
-- Does NOT grant to anon or authenticated. Does NOT alter RLS or schemas.
-- Does NOT use GRANT ALL ON ALL TABLES.
-- =============================================================================

grant usage on schema public to service_role;

-- Core identity / survey / analyses
grant select, insert, update, delete
  on table public.reports
  to service_role;

grant select, insert, update, delete
  on table public.survey_responses
  to service_role;

grant select, insert, update, delete
  on table public.report_analyses
  to service_role;

grant select, insert, update, delete
  on table public.person_core_blueprints
  to service_role;

-- Relationship hub + analysis persistence
grant select, insert, update, delete
  on table public.relationship_reports
  to service_role;

grant select, insert, update, delete
  on table public.relationship_analysis_logs
  to service_role;

grant select, insert, update, delete
  on table public.relationship_favorites
  to service_role;

grant select, insert, update, delete
  on table public.invites
  to service_role;

-- RPCs (function bodies live in earlier migrations; EXECUTE re-asserted here)
grant execute on function public.merge_relationship_premium_by_kind(uuid, text, jsonb, text)
  to service_role;

grant execute on function public.delete_owned_partner_manual_relationship(uuid, uuid, text)
  to service_role;
