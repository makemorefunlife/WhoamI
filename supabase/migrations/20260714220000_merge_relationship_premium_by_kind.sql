-- =============================================================================
-- Atomic merge for relationship_reports.result_premium_by_kind[kind]
-- Prevents concurrent kind regenerations from overwriting sibling keys.
-- Safe on Dev baseline and legacy DBs (CREATE OR REPLACE).
-- =============================================================================

create or replace function public.merge_relationship_premium_by_kind(
  p_relationship_report_id uuid,
  p_kind text,
  p_payload jsonb,
  p_relationship_kind text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind is null
     or p_kind not in (
       'romantic',
       'family',
       'work',
       'friendship',
       'cohabitation'
     )
  then
    raise exception 'invalid relationship premium kind: %', p_kind;
  end if;

  update public.relationship_reports
  set
    result_premium_by_kind =
      coalesce(result_premium_by_kind, '{}'::jsonb)
      || jsonb_build_object(p_kind, p_payload),
    relationship_kind = coalesce(p_relationship_kind, relationship_kind),
    updated_at = now()
  where id = p_relationship_report_id;

  if not found then
    raise exception 'relationship_reports row not found: %', p_relationship_report_id;
  end if;
end;
$$;

revoke all on function public.merge_relationship_premium_by_kind(uuid, text, jsonb, text)
  from public;
grant execute on function public.merge_relationship_premium_by_kind(uuid, text, jsonb, text)
  to service_role;
