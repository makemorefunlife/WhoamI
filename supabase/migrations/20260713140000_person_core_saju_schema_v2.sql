-- PersonCore saju_master_json — v1·v2 전환 기간 CHECK 완화
--
-- 배경: 앱(schemaVersion.ts)은 saju_master_v2(+ domain_signals)를 upsert하나,
-- 기존 제약은 saju_master_v1만 허용 → person_core_blueprints_saju_schema 위반.
-- 전환 기간 동안 v1 캐시 행과 v2 신규 빌드를 모두 허용.
-- (v2 전량 전환 후 v1-only 제약으로 다시 좁히는 후속 마이그레이션 권장)

alter table public.person_core_blueprints
  drop constraint if exists person_core_blueprints_saju_schema;

alter table public.person_core_blueprints
  add constraint person_core_blueprints_saju_schema check (
    (saju_master_json ->> 'schema_version') in ('saju_master_v1', 'saju_master_v2')
  );

comment on column public.person_core_blueprints.saju_master_json is
  '만세력·십성·신살·합충·12운성·조후·domain_signals (saju_master_v1 | saju_master_v2 — 전환 중)';
