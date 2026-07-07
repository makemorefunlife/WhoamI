-- report_id + analysis_type 별 LLM 결과 저장 (basic / premium / integrated / relationship)

create table public.report_analyses (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  analysis_type text not null,
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_analyses_type_check check (
    analysis_type in ('basic', 'premium', 'integrated', 'relationship')
  ),
  constraint report_analyses_report_type_unique unique (report_id, analysis_type)
);

comment on table public.report_analyses is '리포트별 LLM 분석 본문 (유형별 1행, upsert 재사용)';
comment on column public.report_analyses.analysis_type is 'basic | premium | integrated | relationship';
comment on column public.report_analyses.content is 'LLM 생성 텍스트 (basic: 4문단 평문 등)';
comment on column public.report_analyses.metadata is '모델명, prompt 버전 등 선택 메타';

create index report_analyses_report_id_idx on public.report_analyses (report_id);

alter table public.report_analyses enable row level security;

-- API는 service role로만 접근. 클라이언트 직접 읽기 정책은 추후 추가 가능.

-- 기존 report_results.analysis_result → basic 이관 (테이블이 있을 때만)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'report_results'
  ) then
    insert into public.report_analyses (report_id, analysis_type, content)
    select rr.report_id, 'basic', trim(rr.analysis_result)
    from public.report_results rr
    where rr.analysis_result is not null
      and trim(rr.analysis_result) <> ''
    on conflict (report_id, analysis_type) do nothing;
  end if;
end $$;
