-- 관계 분석 이력 + 즐겨찾기

create table public.relationship_analysis_logs (
  id uuid primary key default gen_random_uuid(),
  relationship_report_id uuid not null references public.relationship_reports (id) on delete cascade,
  viewer_report_id uuid not null references public.reports (id) on delete cascade,
  relationship_kind text not null default 'unspecified'
    check (relationship_kind in ('romantic', 'family', 'work', 'friendship', 'unspecified')),
  analysis_level text not null check (analysis_level in ('basic', 'premium')),
  result_format text not null,
  result_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index relationship_analysis_logs_rr_viewer_idx
  on public.relationship_analysis_logs (relationship_report_id, viewer_report_id, created_at desc);

comment on table public.relationship_analysis_logs is
  '관계 분석 생성 이력 — 유형·등급별 스냅샷';

create table public.relationship_favorites (
  viewer_report_id uuid not null references public.reports (id) on delete cascade,
  relationship_report_id uuid not null references public.relationship_reports (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (viewer_report_id, relationship_report_id)
);

comment on table public.relationship_favorites is
  '사용자(뷰어 리포트)별 즐겨찾는 관계 분석 쌍';
