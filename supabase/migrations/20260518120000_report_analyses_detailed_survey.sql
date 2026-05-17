-- report_analyses: detailed_survey 중간 산출물 (integrated 입력용)

alter table public.report_analyses
  drop constraint if exists report_analyses_type_check;

alter table public.report_analyses
  add constraint report_analyses_type_check check (
    analysis_type in (
      'basic',
      'premium',
      'integrated',
      'relationship',
      'detailed_survey'
    )
  );

comment on column public.report_analyses.analysis_type is
  'basic | premium | integrated | relationship | detailed_survey';
