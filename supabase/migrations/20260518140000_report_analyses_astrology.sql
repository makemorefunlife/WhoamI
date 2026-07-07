-- report_analyses: astrology (integrated 입력용 점성 맥락 텍스트)

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
      'astrology'
    )
  );

comment on column public.report_analyses.analysis_type is
  'basic | premium | integrated | relationship | detailed_survey | astrology';
