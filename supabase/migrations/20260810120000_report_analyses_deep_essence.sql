-- report_analyses: deep_essence_structured (Slim V1 "심화 통합 분석" — Part 01~05 +
-- 부록, lib/v1/slim/runSlimIntegratedReport.ts). Previously this paid report was
-- never persisted server-side (client localStorage only), forcing a full LLM
-- regeneration on every view. Adds a dedicated analysis_type so it can reuse the
-- existing report_analyses read-before-generate / upsert pattern.

alter table public.report_analyses
  drop constraint if exists report_analyses_type_check;

alter table public.report_analyses
  add constraint report_analyses_type_check check (
    analysis_type in (
      'basic',
      'premium',
      'integrated',
      'relationship',
      'detailed_survey',
      'astrology',
      'deep_essence_structured'
    )
  );

comment on column public.report_analyses.analysis_type is
  'basic | premium | integrated | relationship | detailed_survey | astrology | deep_essence_structured';
