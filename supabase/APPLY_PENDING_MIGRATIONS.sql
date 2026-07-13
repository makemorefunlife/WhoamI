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

-- 5) PersonCore blueprint 스냅샷 (사주 + 11축 psych SSOT)
--    파일: supabase/migrations/20260713110000_person_core_blueprints.sql
create table if not exists public.person_core_blueprints (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  schema_version text not null default 'person_core_blueprint_v1',
  input_fingerprint text not null,
  engine_version text not null default 'calculateSajuBundle_v2',
  built_at timestamptz not null,
  user_meta jsonb not null,
  saju_master_json jsonb not null,
  psych_master_json jsonb not null,
  source_survey_response_id uuid references public.survey_responses (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint person_core_blueprints_report_id_unique unique (report_id),
  constraint person_core_blueprints_user_meta_schema check (
    (user_meta ->> 'schema_version') = 'user_meta_v1'
  ),
  constraint person_core_blueprints_saju_schema check (
    (saju_master_json ->> 'schema_version') = 'saju_master_v1'
  ),
  constraint person_core_blueprints_psych_schema check (
    (psych_master_json ->> 'schema_version') = 'psych_master_v1'
  )
);

create index if not exists person_core_blueprints_report_id_idx
  on public.person_core_blueprints (report_id);

create index if not exists person_core_blueprints_input_fingerprint_idx
  on public.person_core_blueprints (input_fingerprint);

create index if not exists person_core_blueprints_built_at_idx
  on public.person_core_blueprints (built_at desc);

create index if not exists person_core_blueprints_psych_axes_gin
  on public.person_core_blueprints
  using gin ((psych_master_json -> 'secondary_axes'));

alter table public.person_core_blueprints enable row level security;
