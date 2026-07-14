-- =============================================================================
-- Legacy DB harden: drop open anon/authenticated full-access policies
-- =============================================================================
-- Target: databases that applied 20260519120000_enable_rls_remediation.sql
--          (created reports_anon_select / reports_anon_insert /
--           survey_responses_anon_select with using/with check true).
--
-- Safe on Dev baseline (20260714140000): those policies were never created;
-- DROP IF EXISTS is a no-op.
--
-- Intentionally NOT in this migration:
--   - RLS ENABLE (already in prior migrations / baseline)
--   - authenticated / JWT policies (see docs/database/RLS_JWT_BRIDGE_POLICIES_DRAFT.md)
--   - entitlement column logic
--   - saju_charts / report_results
-- =============================================================================

BEGIN;

drop policy if exists reports_anon_select on public.reports;
drop policy if exists reports_anon_insert on public.reports;
drop policy if exists survey_responses_anon_select on public.survey_responses;

COMMIT;
