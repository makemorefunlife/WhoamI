-- =============================================================================
-- DEV ONLY, READ-ONLY -- ahaitsme-dev. Run BEFORE and AFTER
-- DEV_APPLY_20261009c_PERSONAL_LOCALE.sql. Changes nothing.
-- =============================================================================

-- 1) Is the migration applied?
select
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'credit_lots' and column_name = 'locale') as credit_lots_has_locale,
  to_regclass('public.report_analysis_history') is not null as has_history_table,
  to_regprocedure('public.save_personal_deep_analysis(uuid,text,text,jsonb,text)') is not null as has_save_fn,
  (select pg_get_constraintdef(oid) from pg_constraint where conname = 'report_analyses_type_check') as type_check;

-- 2) Personal deep rows by type and recorded language (no content shown)
select analysis_type,
       case
         when content ~ '^\s*\{\s*"locale"\s*:\s*"ko-KR"' then 'ko-KR'
         when content ~ '^\s*\{\s*"locale"\s*:\s*"en-US"' then 'en-US'
         else '(unknown -- kept as original)'
       end as recorded_locale,
       count(*) as rows
  from report_analyses
 where analysis_type like 'deep_essence_structured%'
 group by 1, 2
 order by 1, 2;

-- rows whose content is not JSON (kept as-is, shown as "previous report")
select count(*) as non_json_deep_rows
  from report_analyses
 where analysis_type like 'deep_essence_structured%' and content !~ '^\s*\{';

-- 3) Credit lots by type / language / validity (counts only)
select credit_type,
       coalesce(to_jsonb(cl) ->> 'locale', '(none)') as locale,
       count(*) as lots,
       sum(remaining) as remaining,
       sum(remaining) filter (where expires_at is null or expires_at > now()) as remaining_valid
  from credit_lots cl
 group by 1, 2
 order by 1, 2;

-- 4) Open reservations (should be 0 when nothing is generating)
select credit_type, enforced, count(*) from credit_reservations group by 1, 2;
