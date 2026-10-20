-- =============================================================================
-- UNDO of migration 4 (explicit privileges) on PRODUCTION: puts back the
-- access rights PROD had before it (read on 2026-10-21):
--   tables    service_role: + truncate, references, trigger, maintain
--   functions trigger/helper functions executable by everyone (PUBLIC)
-- The server RPCs were service_role-only before and stay so. No row changes.
-- One transaction.
-- =============================================================================
begin;
set local lock_timeout = '5s';

grant truncate, references, trigger on table public.account_profile_events to service_role;
grant truncate, references, trigger on table public.report_birth_history to service_role;
grant truncate, references, trigger on table public.relationship_basic_results to service_role;
grant truncate, references, trigger on table public.relationship_basic_result_history to service_role;
do $$
begin
  -- MAINTAIN exists from PostgreSQL 17 (PROD runs 17).
  if current_setting('server_version_num')::int >= 170000 then
    execute 'grant maintain on table public.account_profile_events, public.report_birth_history, public.relationship_basic_results, public.relationship_basic_result_history to service_role';
  end if;
end $$;

grant execute on function public.reports_merged_into_guard() to public;
grant execute on function public.gift_personal_coupons_set_scope() to public;
grant execute on function public.tester_personal_codes_require_scope() to public;
grant execute on function public.credit_lots_set_locale() to public;
grant execute on function public.survey_answers_complete(jsonb) to public;
grant execute on function public.survey_answers_signature(jsonb) to public;

commit;
