-- 동거·결혼(cohabitation) 관계 유형 — DB check 제약 확장

alter table public.relationship_reports
  drop constraint if exists relationship_reports_relationship_kind_check;

alter table public.relationship_reports
  add constraint relationship_reports_relationship_kind_check
    check (relationship_kind in ('romantic', 'family', 'work', 'friendship', 'cohabitation'));

alter table public.relationship_analysis_logs
  drop constraint if exists relationship_analysis_logs_relationship_kind_check;

alter table public.relationship_analysis_logs
  add constraint relationship_analysis_logs_relationship_kind_check
    check (
      relationship_kind in (
        'romantic',
        'family',
        'work',
        'friendship',
        'cohabitation',
        'unspecified'
      )
    );
