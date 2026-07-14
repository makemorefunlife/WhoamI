-- =============================================================================
-- Ah, It's Me — Development DB Baseline (SSOT)
-- =============================================================================
-- Source of truth: docs/database/DB_ARCHITECTURE.md
-- Target: empty Supabase Development project only (e.g. ahaitsme-dev)
--
-- DO NOT apply to Production.
-- DO NOT apply until reviewed (this commit writes SQL only — no apply).
--
-- Intentionally absent (vs legacy DBs / older migrations):
--   report_results, saju_charts, users, generated_images, launch_settings,
--   ref_*, pattern_base, payment_status, plan_type, result_premium,
--   guest/orphan/merge columns, RLS policies (fail-closed: ENABLE only)
-- =============================================================================

BEGIN;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Enum / domain checks are applied as table CHECK constraints below
--    (text + CHECK keeps app-side enums flexible without Postgres ENUM lock-in)
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 2. Helper: updated_at trigger
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE — sets NEW.updated_at = now()';

-- -----------------------------------------------------------------------------
-- 3. reports
-- -----------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  name text null,
  birth_date date null,
  birth_time text null,
  birth_place text null,
  birth_latitude double precision null,
  birth_longitude double precision null,
  birth_timezone real null,
  birth_date_correction_used_at timestamptz null,
  report_type text not null default 'self'
    constraint reports_report_type_check
      check (report_type in ('self', 'partner_manual')),
  entitlement text not null default 'free'
    constraint reports_entitlement_check
      check (entitlement in ('free', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reports is
  'Person profile ledger — owned by Clerk userId; no guest null owners';
comment on column public.reports.clerk_user_id is
  'Clerk user id (NOT NULL — guest reports forbidden)';
comment on column public.reports.entitlement is
  'Server-only product entitlement (replaces payment_status + plan_type)';

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. survey_responses
-- -----------------------------------------------------------------------------

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  answers jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.survey_responses is
  'Post-login v2 survey answers; never written before Clerk session';

create trigger survey_responses_set_updated_at
  before update on public.survey_responses
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. report_analyses
-- -----------------------------------------------------------------------------

create table public.report_analyses (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  analysis_type text not null
    constraint report_analyses_type_check
      check (
        analysis_type in (
          'basic',
          'integrated',
          'detailed_survey',
          'astrology'
        )
      ),
  content text not null,
  metadata jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_analyses_report_type_unique unique (report_id, analysis_type)
);

comment on table public.report_analyses is
  'Per-report AI/chart result cache (solo analyses, not relationship)';

create trigger report_analyses_set_updated_at
  before update on public.report_analyses
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. relationship_reports
-- -----------------------------------------------------------------------------

create table public.relationship_reports (
  id uuid primary key default gen_random_uuid(),
  report_id_a uuid not null,
  report_id_b uuid not null,
  analysis_type text not null default 'basic'
    constraint relationship_reports_analysis_type_check
      check (analysis_type in ('basic', 'premium')),
  relationship_kind text not null default 'friendship'
    constraint relationship_reports_kind_check
      check (
        relationship_kind in (
          'romantic',
          'family',
          'work',
          'friendship',
          'cohabitation'
        )
      ),
  result_basic jsonb null,
  result_premium_by_kind jsonb not null default '{}'::jsonb,
  analysis_version text not null default 'relationship_analysis_v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationship_reports_distinct_participants
    check (report_id_a <> report_id_b)
);

comment on table public.relationship_reports is
  'Pair relationship ledger — premium payloads live only in result_premium_by_kind';
comment on column public.relationship_reports.result_premium_by_kind is
  'Map of RelationshipKind -> premium payload (no legacy result_premium column)';
comment on column public.relationship_reports.analysis_version is
  'Pipeline/format version for basic+premium results';

create trigger relationship_reports_set_updated_at
  before update on public.relationship_reports
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. invites
-- -----------------------------------------------------------------------------

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  from_report_id uuid not null,
  invite_token text not null,
  invite_type text not null default 'relationship'
    constraint invites_invite_type_check
      check (invite_type in ('relationship')),
  status text not null default 'open'
    constraint invites_status_check
      check (status in ('open', 'complete')),
  accepted_report_id uuid null,
  relationship_report_id uuid null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invites_invite_token_unique unique (invite_token)
);

comment on table public.invites is
  'Relationship invite state machine; token is secret-like';
comment on column public.invites.expires_at is
  'Optional expiry; null = no expiry yet (enforced in app when set)';

create trigger invites_set_updated_at
  before update on public.invites
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 8. relationship_analysis_logs
-- -----------------------------------------------------------------------------

create table public.relationship_analysis_logs (
  id uuid primary key default gen_random_uuid(),
  relationship_report_id uuid not null,
  viewer_report_id uuid not null,
  relationship_kind text not null default 'unspecified'
    constraint relationship_analysis_logs_kind_check
      check (
        relationship_kind in (
          'romantic',
          'family',
          'work',
          'friendship',
          'cohabitation',
          'unspecified'
        )
      ),
  analysis_level text not null
    constraint relationship_analysis_logs_level_check
      check (analysis_level in ('basic', 'premium')),
  result_format text not null,
  result_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.relationship_analysis_logs is
  'Append-ish analysis snapshots for hub history and audit';

create trigger relationship_analysis_logs_set_updated_at
  before update on public.relationship_analysis_logs
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 9. relationship_favorites
-- -----------------------------------------------------------------------------

create table public.relationship_favorites (
  viewer_report_id uuid not null,
  relationship_report_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (viewer_report_id, relationship_report_id)
);

comment on table public.relationship_favorites is
  'Viewer-scoped favorites for relationship hub';

create trigger relationship_favorites_set_updated_at
  before update on public.relationship_favorites
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 10. person_core_blueprints
-- -----------------------------------------------------------------------------

create table public.person_core_blueprints (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  schema_version text not null default 'person_core_blueprint_v1',
  input_fingerprint text not null,
  engine_version text not null default 'calculateSajuBundle_v2',
  built_at timestamptz not null,
  user_meta jsonb not null,
  saju_master_json jsonb not null,
  psych_master_json jsonb not null,
  source_survey_response_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint person_core_blueprints_report_id_unique unique (report_id),
  constraint person_core_blueprints_user_meta_schema check (
    (user_meta ->> 'schema_version') = 'user_meta_v1'
  ),
  constraint person_core_blueprints_saju_schema check (
    (saju_master_json ->> 'schema_version') in ('saju_master_v1', 'saju_master_v2')
  ),
  constraint person_core_blueprints_psych_schema check (
    (psych_master_json ->> 'schema_version') = 'psych_master_v1'
  )
);

comment on table public.person_core_blueprints is
  '1:1 PersonCore cache per report — blueprint version in schema_version';
comment on column public.person_core_blueprints.schema_version is
  'Blueprint document version (person_core_blueprint_v1+)';
comment on column public.person_core_blueprints.source_survey_response_id is
  'Build-time survey row; ON DELETE SET NULL';

create trigger person_core_blueprints_set_updated_at
  before update on public.person_core_blueprints
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 11. Indexes (lookup + every FK column)
-- -----------------------------------------------------------------------------

create index reports_clerk_user_id_created_at_idx
  on public.reports (clerk_user_id, created_at desc);

create index survey_responses_report_id_created_at_idx
  on public.survey_responses (report_id, created_at desc);

create index report_analyses_report_id_idx
  on public.report_analyses (report_id);

create unique index relationship_reports_pair_unique
  on public.relationship_reports (
    least(report_id_a, report_id_b),
    greatest(report_id_a, report_id_b)
  );

create index relationship_reports_report_id_a_idx
  on public.relationship_reports (report_id_a);

create index relationship_reports_report_id_b_idx
  on public.relationship_reports (report_id_b);

create index invites_from_report_id_status_idx
  on public.invites (from_report_id, status);

create index invites_accepted_report_id_idx
  on public.invites (accepted_report_id);

create index invites_relationship_report_id_idx
  on public.invites (relationship_report_id);

create index invites_expires_at_idx
  on public.invites (expires_at)
  where expires_at is not null;

create index relationship_analysis_logs_rr_viewer_idx
  on public.relationship_analysis_logs (
    relationship_report_id,
    viewer_report_id,
    created_at desc
  );

create index relationship_analysis_logs_viewer_report_id_idx
  on public.relationship_analysis_logs (viewer_report_id);

create index relationship_favorites_relationship_report_id_idx
  on public.relationship_favorites (relationship_report_id);

create index person_core_blueprints_input_fingerprint_idx
  on public.person_core_blueprints (input_fingerprint);

create index person_core_blueprints_built_at_idx
  on public.person_core_blueprints (built_at desc);

create index person_core_blueprints_source_survey_response_id_idx
  on public.person_core_blueprints (source_survey_response_id);

create index person_core_blueprints_psych_axes_gin
  on public.person_core_blueprints
  using gin ((psych_master_json -> 'secondary_axes'));

-- note: person_core report_id already UNIQUE → index
-- note: invites.invite_token already UNIQUE → index
-- note: favorites PK covers viewer_report_id leading column

-- -----------------------------------------------------------------------------
-- 12. Foreign keys
-- -----------------------------------------------------------------------------

alter table public.survey_responses
  add constraint survey_responses_report_id_fkey
  foreign key (report_id) references public.reports (id) on delete cascade;

alter table public.report_analyses
  add constraint report_analyses_report_id_fkey
  foreign key (report_id) references public.reports (id) on delete cascade;

alter table public.relationship_reports
  add constraint relationship_reports_report_id_a_fkey
  foreign key (report_id_a) references public.reports (id) on delete cascade;

alter table public.relationship_reports
  add constraint relationship_reports_report_id_b_fkey
  foreign key (report_id_b) references public.reports (id) on delete cascade;

alter table public.invites
  add constraint invites_from_report_id_fkey
  foreign key (from_report_id) references public.reports (id) on delete cascade;

alter table public.invites
  add constraint invites_accepted_report_id_fkey
  foreign key (accepted_report_id) references public.reports (id) on delete set null;

alter table public.invites
  add constraint invites_relationship_report_id_fkey
  foreign key (relationship_report_id) references public.relationship_reports (id)
  on delete set null;

alter table public.relationship_analysis_logs
  add constraint relationship_analysis_logs_rr_fkey
  foreign key (relationship_report_id) references public.relationship_reports (id)
  on delete cascade;

alter table public.relationship_analysis_logs
  add constraint relationship_analysis_logs_viewer_fkey
  foreign key (viewer_report_id) references public.reports (id) on delete cascade;

alter table public.relationship_favorites
  add constraint relationship_favorites_viewer_fkey
  foreign key (viewer_report_id) references public.reports (id) on delete cascade;

alter table public.relationship_favorites
  add constraint relationship_favorites_rr_fkey
  foreign key (relationship_report_id) references public.relationship_reports (id)
  on delete cascade;

alter table public.person_core_blueprints
  add constraint person_core_blueprints_report_id_fkey
  foreign key (report_id) references public.reports (id) on delete cascade;

alter table public.person_core_blueprints
  add constraint person_core_blueprints_source_survey_fkey
  foreign key (source_survey_response_id) references public.survey_responses (id)
  on delete set null;

-- -----------------------------------------------------------------------------
-- 13. RLS enable — NO policies (fail-closed for anon/authenticated JWT)
--     service_role bypasses RLS. Client policies are a later phase.
-- -----------------------------------------------------------------------------

alter table public.reports enable row level security;
alter table public.survey_responses enable row level security;
alter table public.report_analyses enable row level security;
alter table public.relationship_reports enable row level security;
alter table public.invites enable row level security;
alter table public.relationship_analysis_logs enable row level security;
alter table public.relationship_favorites enable row level security;
alter table public.person_core_blueprints enable row level security;

COMMIT;
