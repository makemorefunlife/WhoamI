-- Individual Saju SSOT — canonical JSON column (dual-write with saju_master_json)
-- Batch 2: additive only. Do not drop legacy columns.

alter table public.person_core_blueprints
  add column if not exists individual_saju_json jsonb;

comment on column public.person_core_blueprints.individual_saju_json is
  'Canonical IndividualSajuChart (individual_saju_chart_v1) — pure fact model; dual-write with saju_master_json';

-- Soft check: allow null (legacy rows) or v1 schema
alter table public.person_core_blueprints
  drop constraint if exists person_core_blueprints_individual_saju_schema;

alter table public.person_core_blueprints
  add constraint person_core_blueprints_individual_saju_schema check (
    individual_saju_json is null
    or (individual_saju_json -> 'engine' ->> 'schema_version') = 'individual_saju_chart_v1'
  );
