-- 관계 분석: 두 개인 리포트 쌍당 한 행 (basic → premium 업그레이드)
-- report_id_a / report_id_b 순서와 무관하게 동일 쌍은 하나만 허용 (LEAST/GREATEST 유니크)

create table public.relationship_reports (
  id uuid primary key default gen_random_uuid(),
  report_id_a uuid not null references public.reports (id) on delete cascade,
  report_id_b uuid not null references public.reports (id) on delete cascade,
  analysis_type text not null check (analysis_type in ('basic', 'premium')),
  result_basic jsonb,
  result_premium jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationship_reports_distinct_participants check (report_id_a <> report_id_b)
);

comment on table public.relationship_reports is '두 리포트 간 관계 분석 (무료 basic / 유료 premium)';
comment on column public.relationship_reports.analysis_type is 'basic: 18문항 4축, premium: 사주·점성 포함 심화';
comment on column public.relationship_reports.result_basic is 'LLM JSON (4축: emotional_sensitivity 등)';
comment on column public.relationship_reports.result_premium is '유료(LLM) 결과 JSON';

-- (A,B) 와 (B,A) 를 동일 쌍으로 취급
create unique index relationship_reports_pair_unique
  on public.relationship_reports (
    least (report_id_a, report_id_b),
    greatest (report_id_a, report_id_b)
  );

create index relationship_reports_report_id_a_idx on public.relationship_reports (report_id_a);
create index relationship_reports_report_id_b_idx on public.relationship_reports (report_id_b);

-- invites: 초대 수락 후 생성된 관계 분석 행을 연결 (선택)
alter table public.invites
  add column if not exists relationship_report_id uuid references public.relationship_reports (id) on delete set null;

create index if not exists invites_relationship_report_id_idx on public.invites (relationship_report_id);

comment on column public.invites.relationship_report_id is 'relationship_reports.id (같은 초대 쌍의 관계 분석 행)';
