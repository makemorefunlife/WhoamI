-- =============================================================================
-- UNDO for step 4 (migration 1) -- ONLY if asked to. Removes exactly what
-- 20261020090000_account_self_report_grouping.sql added. Safe only while no
-- account has been grouped: it refuses to run if any report is grouped or if
-- any account_profile_events row exists.
-- =============================================================================
begin;
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reports' and column_name = 'merged_into_report_id')
     and exists (select 1 from public.reports where merged_into_report_id is not null) then
    raise exception 'refused: an account is already grouped (ungroup first)';
  end if;
  if to_regclass('public.account_profile_events') is not null and exists (select 1 from public.account_profile_events) then
    raise exception 'refused: account_profile_events has rows';
  end if;
end $$;
drop function if exists public.unfill_main_report(uuid, text);
drop function if exists public.fill_main_report_from_grouped(uuid, boolean, text);
drop function if exists public.ungroup_account_self_reports(text, text);
drop function if exists public.group_account_self_reports(text, uuid, boolean, text);
drop function if exists public.survey_answers_signature(jsonb);
drop function if exists public.survey_answers_complete(jsonb);
drop table if exists public.account_profile_events;
drop table if exists public.report_birth_history;
drop trigger if exists reports_merged_into_guard on public.reports;
drop function if exists public.reports_merged_into_guard();
drop index if exists public.reports_merged_into_report_id_idx;
alter table public.reports drop column if exists merged_into_report_id;
commit;
