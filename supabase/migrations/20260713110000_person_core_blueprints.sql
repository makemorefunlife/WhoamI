-- PersonCoreBlueprint 스냅샷 저장 (신규 SSOT 레이어 — 레거시 미연결)
--
-- 전략: report_id 당 최신 1행 (upsert). 출생·설문 fingerprint 변경 시 재빌드.
-- API는 service role로만 접근 (기존 report_analyses·relationship_reports 패턴).

create table public.person_core_blueprints (
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

comment on table public.person_core_blueprints is
  '1인 PersonCoreBlueprint 스냅샷 — 사주·11축 psych·홈라이프 DNA·표시 메타 (재계산 방지 캐시)';

comment on column public.person_core_blueprints.report_id is
  'reports.id — 1 report : 1 최신 blueprint (upsert)';

comment on column public.person_core_blueprints.input_fingerprint is
  'birth + survey 입력 해시 — 원본 변경 시 재빌드 판단';

comment on column public.person_core_blueprints.user_meta is
  'displayName, clerk_user_id 등 (user_meta_v1)';

comment on column public.person_core_blueprints.saju_master_json is
  '만세력·십성·신살·합충·12운성·조후 (saju_master_v1)';

comment on column public.person_core_blueprints.psych_master_json is
  '11축 점수 + 홈라이프 DNA 태그 (psych_master_v1)';

comment on column public.person_core_blueprints.source_survey_response_id is
  '빌드 시점 survey_responses 행 (추적·무효화용)';

create index person_core_blueprints_report_id_idx
  on public.person_core_blueprints (report_id);

create index person_core_blueprints_input_fingerprint_idx
  on public.person_core_blueprints (input_fingerprint);

create index person_core_blueprints_built_at_idx
  on public.person_core_blueprints (built_at desc);

-- JSONB 내부 조회 (관리·디버그용 — 11축 단일 축 예시)
create index person_core_blueprints_psych_axes_gin
  on public.person_core_blueprints
  using gin ((psych_master_json -> 'secondary_axes'));

alter table public.person_core_blueprints enable row level security;

-- 클라이언트 직접 접근 없음. 서버 service role 전용 (RLS bypass).
