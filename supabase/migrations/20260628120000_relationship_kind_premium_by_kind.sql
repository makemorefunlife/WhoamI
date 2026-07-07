-- 심화 관계 분석: 유형별 결과 캐시 (연인·가족·동료·친구)
alter table public.relationship_reports
  add column if not exists relationship_kind text not null default 'friendship'
    check (relationship_kind in ('romantic', 'family', 'work', 'friendship'));

alter table public.relationship_reports
  add column if not exists result_premium_by_kind jsonb not null default '{}'::jsonb;

comment on column public.relationship_reports.relationship_kind is
  '기본 선택 관계 유형 (UI 탭·생성 시 기본값)';
comment on column public.relationship_reports.result_premium_by_kind is
  '심화 분석 JSON — kind 키별 perspectives (romantic|family|work|friendship)';
