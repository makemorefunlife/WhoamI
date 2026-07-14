-- relationship_analysis_logs / relationship_favorites: RLS on, no anon/authenticated policies.
-- Access via service-role API routes only (createRouteSupabaseClient).

alter table public.relationship_analysis_logs enable row level security;
alter table public.relationship_favorites enable row level security;

comment on table public.relationship_analysis_logs is
  'RLS enabled; service-role API only (no anon/authenticated policies).';

comment on table public.relationship_favorites is
  'RLS enabled; service-role API only (no anon/authenticated policies).';
