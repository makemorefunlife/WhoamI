-- =============================================================================
-- STEP 7 / migration 4 -- PRODUCTION copy of
--   supabase/migrations/20261021090000_account_integration_explicit_privileges.sql
-- wrapped in ONE transaction. Changes no row; only access rights.
-- Effect on PROD (checked 2026-10-21, read-only):
--   * the 4 new tables: service_role keeps select/insert(/update) and loses
--     truncate, references, trigger, maintain (never used by the app);
--     anon/authenticated already have nothing.
--   * 6 trigger/helper functions: execute is no longer open to everyone
--     (PUBLIC). Triggers keep firing; the helpers are only used inside
--     security-definer functions.
--   * the 7 server RPCs: already service_role-only on PROD -> unchanged.
-- Run in Supabase SQL Editor of ahaitsme-prod (URL contains gncjslondpvysjaytagd).
-- Expected: "Success. No rows returned".  Undo: step7-undo-migration-4.sql
-- =============================================================================
begin;
set local lock_timeout = '5s';

-- =============================================================================
-- Account integration objects: access rights written out in full (2026-10-21).
--
-- Why: from 2026-10-30 Supabase no longer auto-grants Data API rights on new
-- public tables (new projects, Preview branches, `supabase db reset`), while
-- older databases still apply the old default privileges (anon /
-- authenticated / service_role get everything, functions are executable by
-- them). The three account-integration migrations (20261020090000/100000/
-- 110000) only revoked from PUBLIC/anon/authenticated and granted to
-- service_role, so the resulting rights depended on the database:
--   * security-definer RPCs (group/fill/unfill/ungroup, grant_credit_lot_scoped,
--     reserve_credit, save_relationship_basic_result) were executable by anon
--     and authenticated where the old function defaults apply;
--   * service_role got delete/truncate/... on the new tables where the old
--     table defaults apply.
-- This migration makes the rights identical everywhere. No row is changed.
--
-- Rights (the app talks to these objects only from the server, service_role):
--   tables    -- RLS on, no policies; anon/authenticated: nothing;
--                service_role: exactly what the server code does.
--   functions -- PUBLIC/anon/authenticated: no execute; service_role executes
--                only the RPCs the server calls. Trigger functions and the
--                helpers used inside security-definer functions need no
--                caller rights (triggers fire regardless; definer functions
--                run as the owner).
-- Re-runnable.
-- =============================================================================

-- 1) tables ---------------------------------------------------------------------
alter table public.account_profile_events enable row level security;
alter table public.report_birth_history enable row level security;
alter table public.relationship_basic_results enable row level security;
alter table public.relationship_basic_result_history enable row level security;

revoke all on table public.account_profile_events from public, anon, authenticated, service_role;
revoke all on table public.report_birth_history from public, anon, authenticated, service_role;
revoke all on table public.relationship_basic_results from public, anon, authenticated, service_role;
revoke all on table public.relationship_basic_result_history from public, anon, authenticated, service_role;

-- server inserts (lib/account/profileChoices.ts, lib/report/restoreBirthFromOwnedReports.ts);
-- select kept for server-side reads of the log (same as 20261020090000)
grant select, insert on table public.account_profile_events to service_role;
-- server inserts the previous birth details (lib/account/profileChoices.ts); select as above
grant select, insert on table public.report_birth_history to service_role;
-- lib/relationship/basicResultByLocale.ts (read); writes go through
-- save_relationship_basic_result. update kept for an explicit regenerate.
grant select, insert, update on table public.relationship_basic_results to service_role;
grant select, insert on table public.relationship_basic_result_history to service_role;

-- 2) functions ------------------------------------------------------------------
-- RPCs called by the server (service_role only).
revoke all on function public.group_account_self_reports(text, uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.ungroup_account_self_reports(text, text) from public, anon, authenticated;
revoke all on function public.fill_main_report_from_grouped(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.unfill_main_report(uuid, text) from public, anon, authenticated;
revoke all on function public.grant_credit_lot_scoped(text, text, integer, text, text, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function public.save_relationship_basic_result(uuid, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.group_account_self_reports(text, uuid, boolean, text) to service_role;
grant execute on function public.ungroup_account_self_reports(text, text) to service_role;
grant execute on function public.fill_main_report_from_grouped(uuid, boolean, text) to service_role;
grant execute on function public.unfill_main_report(uuid, text) to service_role;
grant execute on function public.grant_credit_lot_scoped(text, text, integer, text, text, uuid, timestamptz) to service_role;
grant execute on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) to service_role;
grant execute on function public.save_relationship_basic_result(uuid, text, jsonb, text) to service_role;

-- Trigger functions and internal helpers: no caller needs them.
revoke all on function public.reports_merged_into_guard() from public, anon, authenticated, service_role;
revoke all on function public.gift_personal_coupons_set_scope() from public, anon, authenticated, service_role;
revoke all on function public.tester_personal_codes_require_scope() from public, anon, authenticated, service_role;
revoke all on function public.credit_lots_set_locale() from public, anon, authenticated, service_role;
revoke all on function public.survey_answers_complete(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.survey_answers_signature(jsonb) from public, anon, authenticated, service_role;

commit;
