-- =============================================================================
-- DEV ONLY -- ahaitsme-dev. Do NOT run on production.
-- Applies supabase/migrations/20261011120000_relationship_premium_input_snapshot.sql
-- (needs DEV_APPLY_20261011_RELATIONSHIP_OWNERSHIP.sql first). Additive,
-- re-runnable, no existing value is changed.
-- =============================================================================
begin;
do $$
begin
  if to_regclass('public.relationship_premium_reports') is null then
    raise exception 'STOP: run DEV_APPLY_20261011_RELATIONSHIP_OWNERSHIP.sql first';
  end if;
end $$;
alter table public.relationship_premium_reports
  add column if not exists input_snapshot jsonb;
comment on column public.relationship_premium_reports.input_snapshot is
  '{v, captured_at, fp, has_survey[]} -- fingerprint of both participants'' inputs at generation (no raw data).';
commit;

-- Verification (expected: true; report_analysis_history must also exist for the
-- archive-before-delete rule, from DEV_APPLY_20261009c_PERSONAL_LOCALE.sql)
select
  exists (select 1 from information_schema.columns where table_schema='public'
           and table_name='relationship_premium_reports' and column_name='input_snapshot') as has_input_snapshot,
  to_regclass('public.report_analysis_history') is not null as has_report_analysis_history;
