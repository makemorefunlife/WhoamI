-- =============================================================================
-- Restore least-privilege service_role grants for Relationship Hub + deletion.
-- Idempotent: safe to re-run on Production after pause/restore privilege loss.
-- Does NOT grant to anon or authenticated. Does NOT alter RLS or schemas.
-- =============================================================================

grant usage on schema public to service_role;

-- Hub list / manual create / rename / account delete / invite cancel
grant select, insert, update, delete
  on table public.reports
  to service_role;

grant select, insert, update, delete
  on table public.survey_responses
  to service_role;

grant select, insert, update, delete
  on table public.relationship_reports
  to service_role;

grant select, insert, update, delete
  on table public.invites
  to service_role;

-- Analysis feed + list snapshots (insert from analyze paths; delete via cascade)
grant select, insert, update, delete
  on table public.relationship_analysis_logs
  to service_role;

-- Favorites: upsert + delete (no update path in app code)
grant select, insert, delete
  on table public.relationship_favorites
  to service_role;

-- -----------------------------------------------------------------------------
-- Atomic partner_manual relationship removal (RR + partner report in one txn).
-- Ownership checks are enforced inside the function; callers still must auth.
-- -----------------------------------------------------------------------------
create or replace function public.delete_owned_partner_manual_relationship(
  p_relationship_report_id uuid,
  p_viewer_report_id uuid,
  p_clerk_user_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewer_clerk text;
  v_report_id_a uuid;
  v_report_id_b uuid;
  v_partner_id uuid;
  v_partner_type text;
  v_partner_clerk text;
begin
  if p_clerk_user_id is null or length(trim(p_clerk_user_id)) = 0 then
    raise exception 'unauthorized'
      using errcode = '42501';
  end if;

  select r.clerk_user_id
    into v_viewer_clerk
  from public.reports r
  where r.id = p_viewer_report_id
  for update;

  if not found then
    raise exception 'viewer_not_found'
      using errcode = 'P0002';
  end if;

  if v_viewer_clerk is distinct from p_clerk_user_id then
    raise exception 'viewer_forbidden'
      using errcode = '42501';
  end if;

  select rr.report_id_a, rr.report_id_b
    into v_report_id_a, v_report_id_b
  from public.relationship_reports rr
  where rr.id = p_relationship_report_id
  for update;

  if not found then
    raise exception 'relationship_not_found'
      using errcode = 'P0002';
  end if;

  if v_report_id_a is distinct from p_viewer_report_id
     and v_report_id_b is distinct from p_viewer_report_id then
    raise exception 'not_participant'
      using errcode = '42501';
  end if;

  v_partner_id := case
    when v_report_id_a = p_viewer_report_id then v_report_id_b
    else v_report_id_a
  end;

  select r.report_type, r.clerk_user_id
    into v_partner_type, v_partner_clerk
  from public.reports r
  where r.id = v_partner_id
  for update;

  if not found then
    raise exception 'partner_not_found'
      using errcode = 'P0002';
  end if;

  if v_partner_type is distinct from 'partner_manual' then
    raise exception 'not_partner_manual'
      using errcode = '22023';
  end if;

  -- Allow partner_manual reports owned by the viewer, guest-created (guest_...), or unassigned (null)
  if v_partner_clerk is not null
     and v_partner_clerk not like 'guest_%'
     and v_partner_clerk is distinct from p_clerk_user_id then
    raise exception 'partner_forbidden'
      using errcode = '42501';
  end if;

  -- Delete dependent share links if table exists
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'relationship_report_shares'
  ) then
    execute 'delete from public.relationship_report_shares where relationship_report_id = $1 or owner_report_id = $2 or recipient_report_id = $2'
      using p_relationship_report_id, v_partner_id;
  end if;

  -- Delete dependent relationship logs if table exists
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'relationship_logs'
  ) then
    execute 'delete from public.relationship_logs where relationship_report_id = $1 or viewer_report_id = $2'
      using p_relationship_report_id, v_partner_id;
  end if;

  -- Delete dependent relationship log favorites if table exists
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'relationship_log_favorites'
  ) then
    execute 'delete from public.relationship_log_favorites where relationship_report_id = $1 or viewer_report_id = $2'
      using p_relationship_report_id, v_partner_id;
  end if;

  -- Delete dependent map edges if table exists
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'relationship_map_edges'
  ) then
    execute 'delete from public.relationship_map_edges where relationship_report_id = $1 or viewer_report_id = $2 or other_report_id = $2'
      using p_relationship_report_id, v_partner_id;
  end if;

  delete from public.relationship_reports
  where id = p_relationship_report_id;

  delete from public.reports
  where id = v_partner_id;
end;
$$;

revoke all on function public.delete_owned_partner_manual_relationship(uuid, uuid, text)
  from public;
revoke all on function public.delete_owned_partner_manual_relationship(uuid, uuid, text)
  from anon;
revoke all on function public.delete_owned_partner_manual_relationship(uuid, uuid, text)
  from authenticated;

grant execute on function public.delete_owned_partner_manual_relationship(uuid, uuid, text)
  to service_role;
