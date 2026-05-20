-- RLS remediation: enable row level security without breaking current flows.
-- Clerk auth is app-layer; client uses anon key with capability-style report UUID access.
-- Server APIs use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).

-- ---------------------------------------------------------------------------
-- 1) Drop existing policies on tables we replace (dashboard-created invites, etc.)
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'invites',
        'reports',
        'survey_responses',
        'report_results',
        'saju_charts',
        'generated_images',
        'users',
        'launch_settings',
        'pattern_base',
        'relationship_reports',
        'report_analyses'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      r.policyname,
      r.schemaname,
      r.tablename
    );
  end loop;
end $$;

-- ref_* lookup tables (dynamic policy drops)
do $$
declare
  tbl record;
  pol record;
begin
  for tbl in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename like 'ref\_%' escape '\'
  loop
    for pol in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = tbl.tablename
    loop
      execute format(
        'drop policy if exists %I on public.%I',
        pol.policyname,
        tbl.tablename
      );
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Enable RLS (idempotent)
-- ---------------------------------------------------------------------------
alter table if exists public.reports enable row level security;
alter table if exists public.survey_responses enable row level security;
alter table if exists public.report_results enable row level security;
alter table if exists public.saju_charts enable row level security;
alter table if exists public.invites enable row level security;
alter table if exists public.pattern_base enable row level security;
alter table if exists public.relationship_reports enable row level security;
alter table if exists public.report_analyses enable row level security;

alter table if exists public.users enable row level security;
alter table if exists public.generated_images enable row level security;
alter table if exists public.launch_settings enable row level security;

do $$
declare
  tbl record;
begin
  for tbl in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename like 'ref\_%' escape '\'
  loop
    execute format(
      'alter table public.%I enable row level security',
      tbl.tablename
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Lookup / template tables — public read-only (anon + authenticated)
-- ---------------------------------------------------------------------------
do $$
declare
  tbl record;
begin
  for tbl in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and (
        tablename like 'ref\_%' escape '\'
        or tablename = 'pattern_base'
      )
  loop
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      tbl.tablename || '_public_read',
      tbl.tablename
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4) reports — client anon: insert new report, read by known report id (UUID)
-- ---------------------------------------------------------------------------
create policy reports_anon_select
  on public.reports
  for select
  to anon, authenticated
  using (true);

create policy reports_anon_insert
  on public.reports
  for insert
  to anon, authenticated
  with check (true);

-- No anon update/delete: birth, claim, payment via service-role API routes.

-- ---------------------------------------------------------------------------
-- 5) survey_responses — client anon: read answers for a report_id
-- ---------------------------------------------------------------------------
create policy survey_responses_anon_select
  on public.survey_responses
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.reports r
      where r.id = survey_responses.report_id
    )
  );

-- Insert/update/delete: service-role API only (submit, reset).

-- ---------------------------------------------------------------------------
-- 6) User-data tables — no anon/authenticated policies (service role only)
-- ---------------------------------------------------------------------------
-- report_results, saju_charts, generated_images, users, launch_settings,
-- relationship_reports, invites, report_analyses

comment on table public.invites is
  'RLS enabled; access via service-role API routes (no anon policies).';
