-- =============================================================================
-- DEV ONLY -- ahaitsme-dev. Do NOT run on production.
-- Applies supabase/migrations/20261011130000_guest_invite_participants.sql:
-- non-member invite participation (30-day retention, sessions, email codes,
-- purge). Needs DEV_APPLY_20261011_RELATIONSHIP_OWNERSHIP.sql first.
-- Changes only the allowed values of reports.report_type (+ 'guest_invitee')
-- and invites.status (+ 'guest_joined'); no existing row is changed.
-- =============================================================================
begin;
do $$
begin
  if to_regclass('public.invites') is null or to_regclass('public.reports') is null then
    raise exception 'STOP: invites/reports missing -- wrong database?';
  end if;
  if to_regclass('public.relationship_premium_reports') is null then
    raise exception 'STOP: run DEV_APPLY_20261011_RELATIONSHIP_OWNERSHIP.sql first';
  end if;
  if exists (select 1 from reports where report_type not in ('self','partner_manual','guest_invitee')) then
    raise exception 'STOP: reports has report_type values outside the expected set -- report before changing the constraint';
  end if;
  if exists (select 1 from invites where status not in ('open','complete','guest_joined')) then
    raise exception 'STOP: invites has status values outside the expected set -- report before changing the constraint';
  end if;
end $$;
-- 1) Allowed values ---------------------------------------------------------------
alter table public.reports drop constraint if exists reports_report_type_check;
alter table public.reports
  add constraint reports_report_type_check
  check (report_type in ('self', 'partner_manual', 'guest_invitee'));

alter table public.invites drop constraint if exists invites_status_check;
alter table public.invites
  add constraint invites_status_check
  check (status in ('open', 'complete', 'guest_joined'));

-- 2) Participants -------------------------------------------------------------------
create table if not exists public.guest_invite_participants (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null unique references public.invites (id) on delete cascade,
  report_id uuid references public.reports (id) on delete set null,
  relationship_report_id uuid references public.relationship_reports (id) on delete set null,
  inviter_report_id uuid,
  locale text not null check (locale in ('ko-KR', 'en-US')),
  -- Optional, for recovery on another browser. Only stored once verified.
  email text,
  email_verified_at timestamptz,
  -- {age, privacy, at, locale, version}
  consent jsonb not null,
  status text not null default 'active' check (status in ('active', 'linked', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  linked_clerk_user_id text,
  linked_report_id uuid,
  linked_at timestamptz
);
create index if not exists guest_invite_participants_email_idx
  on public.guest_invite_participants (lower(email))
  where email is not null and status = 'active';
create index if not exists guest_invite_participants_expiry_idx
  on public.guest_invite_participants (status, expires_at);

create table if not exists public.guest_invite_sessions (
  session_hash text primary key,
  participant_id uuid not null references public.guest_invite_participants (id) on delete cascade,
  via text not null check (via in ('join', 'code')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table if not exists public.guest_invite_codes (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.guest_invite_participants (id) on delete cascade,
  -- 'verify' = confirm an email for this participant; 'recover' = open a session by email
  purpose text not null check (purpose in ('verify', 'recover')),
  email text not null,
  code_hash text not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
create index if not exists guest_invite_codes_lookup_idx
  on public.guest_invite_codes (lower(email), purpose, created_at desc);

alter table public.guest_invite_participants enable row level security;
alter table public.guest_invite_sessions enable row level security;
alter table public.guest_invite_codes enable row level security;
revoke all on table public.guest_invite_participants, public.guest_invite_sessions, public.guest_invite_codes from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.guest_invite_participants, public.guest_invite_sessions, public.guest_invite_codes from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.guest_invite_participants, public.guest_invite_sessions, public.guest_invite_codes from authenticated';
  end if;
end $$;
grant select, insert, update, delete on table public.guest_invite_participants to service_role;
grant select, insert, update, delete on table public.guest_invite_sessions to service_role;
grant select, insert, update, delete on table public.guest_invite_codes to service_role;

comment on table public.guest_invite_participants is
  'Non-member invite participation. Kept 30 days (expires_at); linked to an account on sign-up within that time; purged by purge_guest_invite_data(). Service-role only.';

-- 3) Atomic claim of an open invite by a guest -------------------------------------
-- Only an OPEN, unexpired (30 days), not-yet-used invite can be claimed, once.
-- Returns the invite id + inviter report id, or nothing.
create or replace function public.claim_invite_for_guest(p_invite_token text)
returns table(invite_id uuid, from_report_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    update invites i
       set status = 'guest_joined', updated_at = now()
     where i.invite_token = p_invite_token
       and i.status = 'open'
       and i.created_at > now() - interval '30 days'
     returning i.id, i.from_report_id;
end;
$$;

-- Undo a claim when the join could not be finished (no participant row yet).
create or replace function public.release_guest_invite_claim(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update invites set status = 'open', updated_at = now()
   where id = p_invite_id and status = 'guest_joined'
     and not exists (select 1 from guest_invite_participants p where p.invite_id = p_invite_id);
end;
$$;

-- 4) Retention: participation info 30 days ------------------------------------------
-- After expiry: the guest's own inputs are removed (birth data, name, survey,
-- email, sessions, codes). The relationship row itself is NOT deleted when
-- the inviter has a paid report on it (creator-owned, must not be lost);
-- otherwise the guest profile and its relationship are deleted.
create or replace function public.purge_guest_invite_data()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p record;
  v_n integer := 0;
  v_has_paid boolean;
begin
  for v_p in
    select * from guest_invite_participants
     where status = 'active' and expires_at <= now()
     for update skip locked
  loop
    v_has_paid := false;
    if v_p.relationship_report_id is not null then
      select exists (
        select 1 from relationship_reports rr
         where rr.id = v_p.relationship_report_id
           and coalesce(rr.result_premium_by_kind, '{}'::jsonb) <> '{}'::jsonb
      ) into v_has_paid;
      if not v_has_paid and to_regclass('public.relationship_premium_reports') is not null then
        execute 'select exists (select 1 from relationship_premium_reports where relationship_report_id = $1)'
          into v_has_paid using v_p.relationship_report_id;
      end if;
    end if;

    if v_p.report_id is not null then
      delete from survey_responses where report_id = v_p.report_id;
      if v_has_paid then
        update reports
           set name = null, birth_date = null, birth_time = null, birth_place = null,
               birth_latitude = null, birth_longitude = null, birth_timezone = null
         where id = v_p.report_id and report_type = 'guest_invitee';
      else
        delete from reports where id = v_p.report_id and report_type = 'guest_invitee';
      end if;
    end if;

    update guest_invite_participants
       set status = 'expired', email = null, email_verified_at = null,
           consent = jsonb_build_object('purged_at', now())
     where id = v_p.id;
    delete from guest_invite_sessions where participant_id = v_p.id;
    delete from guest_invite_codes where participant_id = v_p.id;
    v_n := v_n + 1;
  end loop;

  delete from guest_invite_sessions where expires_at < now() - interval '1 day' or revoked_at is not null;
  delete from guest_invite_codes where expires_at < now() - interval '1 day';
  return v_n;
end;
$$;

revoke all on function public.claim_invite_for_guest(text) from public;
revoke all on function public.release_guest_invite_claim(uuid) from public;
revoke all on function public.purge_guest_invite_data() from public;
grant execute on function public.claim_invite_for_guest(text) to service_role;
grant execute on function public.release_guest_invite_claim(uuid) to service_role;
grant execute on function public.purge_guest_invite_data() to service_role;
commit;

-- Verification (expected: true, true, true, true)
select
  to_regclass('public.guest_invite_participants') is not null as has_participants,
  to_regprocedure('public.claim_invite_for_guest(text)') is not null as has_claim,
  to_regprocedure('public.purge_guest_invite_data()') is not null as has_purge,
  (select pg_get_constraintdef(oid) from pg_constraint where conname = 'invites_status_check') like '%guest_joined%' as invites_status_ok;
