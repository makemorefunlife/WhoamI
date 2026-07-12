-- Supabase Dashboard → SQL Editor 에 붙여넣고 Run
-- (관계 유형·심화 캐시 + 분석 기록 + 즐겨찾기)

-- 1) relationship_reports 확장
alter table public.relationship_reports
  add column if not exists relationship_kind text not null default 'friendship'
    check (relationship_kind in ('romantic', 'family', 'work', 'friendship'));

alter table public.relationship_reports
  add column if not exists result_premium_by_kind jsonb not null default '{}'::jsonb;

-- 2) 분석 이력
create table if not exists public.relationship_analysis_logs (
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

create index if not exists relationship_analysis_logs_rr_viewer_idx
  on public.relationship_analysis_logs (relationship_report_id, viewer_report_id, created_at desc);

-- 3) 즐겨찾기
create table if not exists public.relationship_favorites (
  viewer_report_id uuid not null references public.reports (id) on delete cascade,
  relationship_report_id uuid not null references public.relationship_reports (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (viewer_report_id, relationship_report_id)
);

-- 4) 동거·결혼(cohabitation) 관계 유형
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

-- 4) 생년월일 1회 수정 시각 (개인정보 화면)
alter table public.reports
  add column if not exists birth_date_correction_used_at timestamptz;
