-- =============================================================================
-- Personal premium generation lock — one row per (report_id, locale)
-- currently in flight across all Vercel serverless instances.
-- Prevents concurrent requests from calling OpenAI or reserving credit
-- for the exact same personal generation target.
-- =============================================================================

create table if not exists public.personal_premium_generation_locks (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  locale text not null check (locale in ('en-US', 'ko-KR')),
  current_request_id uuid not null default gen_random_uuid(),
  started_at timestamptz not null default now()
);

create unique index if not exists personal_premium_generation_locks_key
  on public.personal_premium_generation_locks (report_id, locale);

create index if not exists personal_premium_generation_locks_started_at_idx
  on public.personal_premium_generation_locks (started_at);

alter table public.personal_premium_generation_locks enable row level security;

comment on table public.personal_premium_generation_locks is
  'RLS enabled; service-role API only. One row = an in-flight personal premium generation for (report_id, locale). Multi-instance atomic lock.';

grant select, insert, update, delete
  on table public.personal_premium_generation_locks
  to service_role;
