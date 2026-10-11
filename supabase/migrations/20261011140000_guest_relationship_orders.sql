-- =============================================================================
-- Guest (non-member) single Relationship purchase (IA v2 §3, kr_relationship_premium).
--
-- Reuses the guest Personal machinery (purchase verification, guest access
-- sessions, toss_payment_orders.guest_use_status reserve / used). Flow:
-- verify purchase -> my info + the other person's info (with consent) ->
-- explicit generate -> result.
--   * Generating, re-viewing and temporary storage: purchase (approved_at)
--     + 12 months in total. Guest Personal retention is NOT changed.
--   * Signing up in time (verified order email) saves the SAME report to
--     the account -- no regeneration, no extra credit.
--   * Guests cannot create invite links (no account / no profile for that).
--   * An order is used once: either as a guest (guest_use_status) or claimed
--     to an account as a credit (claim_paid_guest_toss_order already refuses
--     a guest-used order; a claimed order cannot be used as a guest).
--
-- The two people are stored as reports rows (report_type 'guest_purchase',
-- clerk_user_id 'guest_order:<order id>' -- never a Clerk id) so the existing
-- relationship engine and the per-creator report table work unchanged.
-- Additive and re-runnable.
-- =============================================================================

-- Guest use is decided per ORDER: only orders created after this release
-- (flag set at order creation) are used without an account. Earlier guest
-- Relationship orders keep the account-link flow they were sold with.
alter table public.toss_payment_orders add column if not exists guest_use_enabled boolean;
comment on column public.toss_payment_orders.guest_use_enabled is
  'true = this guest order can be used without an account (set at creation for guest-usable plans). NULL on older orders: Personal is guest-usable by plan; Relationship keeps the account flow.';

alter table public.reports drop constraint if exists reports_report_type_check;
alter table public.reports
  add constraint reports_report_type_check
  check (report_type in ('self', 'partner_manual', 'guest_invitee', 'guest_purchase'));

create table if not exists public.guest_relationship_orders (
  order_id text primary key references public.toss_payment_orders (order_id) on delete cascade,
  locale text not null check (locale in ('ko-KR', 'en-US')),
  self_report_id uuid references public.reports (id) on delete set null,
  partner_report_id uuid references public.reports (id) on delete set null,
  relationship_report_id uuid references public.relationship_reports (id) on delete set null,
  kind text check (kind is null or kind in ('romantic', 'work', 'cohabitation', 'friendship', 'family')),
  -- {third_party_info: true, at, locale, version}
  partner_consent jsonb,
  -- family only: {parent_type: mother|father, child_is_viewer: bool}
  family_options jsonb,
  expires_at timestamptz not null,
  generated_at timestamptz,
  migrated_clerk_user_id text,
  migrated_at timestamptz,
  purged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.guest_relationship_orders add column if not exists family_options jsonb;
alter table public.guest_relationship_orders enable row level security;
revoke all on table public.guest_relationship_orders from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.guest_relationship_orders from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.guest_relationship_orders from authenticated';
  end if;
end $$;
grant select, insert, update, delete on table public.guest_relationship_orders to service_role;

comment on table public.guest_relationship_orders is
  'Guest single Relationship purchase: both people (reports rows, type guest_purchase), the relationship and the generated report. Purchase + 12 months; saved to an account on sign-up (verified order email). Service-role only.';

-- Locks the order and confirms the guest may (re)enter input now. Creates
-- the order's row on first use (expires = purchase + 12 months).
--   result: ok | not_eligible | claimed | locked | expired
create or replace function public.prepare_guest_relationship_input(p_order_id text, p_locale text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o toss_payment_orders;
  v_g guest_relationship_orders;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found or v_o.guest_email is null or v_o.plan_id <> 'kr_relationship_premium'
     or v_o.guest_use_enabled is distinct from true then
    return 'not_eligible';
  end if;
  if v_o.clerk_user_id is not null then return 'claimed'; end if;
  if v_o.status <> 'paid' or v_o.approved_at is null then return 'not_eligible'; end if;
  if v_o.approved_at + interval '12 months' <= now() then return 'expired'; end if;
  if v_o.guest_use_status is not null then return 'locked'; end if;
  select * into v_g from guest_relationship_orders where order_id = p_order_id for update;
  if found then
    if v_g.generated_at is not null or v_g.purged_at is not null then return 'locked'; end if;
  else
    insert into guest_relationship_orders (order_id, locale, expires_at)
      values (p_order_id, case when p_locale = 'en-US' then 'en-US' else 'ko-KR' end,
              v_o.approved_at + interval '12 months');
  end if;
  return 'ok';
end;
$$;

-- Reserve the order's single use for one generation (same columns as guest Personal).
--   result: reserved | already_used | in_progress | expired | claimed | not_eligible | no_input
create or replace function public.reserve_guest_relationship_use(p_order_id text, p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o toss_payment_orders;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found or v_o.guest_email is null or v_o.plan_id <> 'kr_relationship_premium'
     or v_o.guest_use_enabled is distinct from true then
    return 'not_eligible';
  end if;
  if v_o.clerk_user_id is not null then return 'claimed'; end if;
  if v_o.status <> 'paid' or v_o.approved_at is null then return 'not_eligible'; end if;
  if v_o.guest_use_status = 'used' then return 'already_used'; end if;
  if v_o.guest_use_status = 'reserved' and v_o.guest_use_reserved_at > now() - interval '10 minutes' then
    return 'in_progress';
  end if;
  if v_o.approved_at + interval '12 months' <= now() then return 'expired'; end if;
  if not exists (
    select 1 from guest_relationship_orders g
     where g.order_id = p_order_id and g.relationship_report_id is not null and g.kind is not null
       and g.partner_consent is not null
  ) then
    return 'no_input';
  end if;
  update toss_payment_orders
     set guest_use_status = 'reserved', guest_use_request_id = p_request_id,
         guest_use_reserved_at = now(), updated_at = now()
   where id = v_o.id;
  return 'reserved';
end;
$$;

-- Marks the order used -- only for the request holding the reservation, and
-- only after the report was saved (caller checks the save first).
create or replace function public.complete_guest_relationship_use(p_order_id text, p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update toss_payment_orders
     set guest_use_status = 'used', updated_at = now()
   where order_id = p_order_id and guest_use_status = 'reserved' and guest_use_request_id = p_request_id
     and clerk_user_id is null
  returning id into v_id;
  if v_id is null then return false; end if;
  update guest_relationship_orders set generated_at = now(), updated_at = now() where order_id = p_order_id;
  return true;
end;
$$;

create or replace function public.release_guest_relationship_use(p_order_id text, p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update toss_payment_orders
     set guest_use_status = null, guest_use_request_id = null, guest_use_reserved_at = null, updated_at = now()
   where order_id = p_order_id and guest_use_status = 'reserved' and guest_use_request_id = p_request_id;
end;
$$;

-- Saves a USED guest Relationship order into the signed-in account whose
-- Clerk-verified email equals the order email. The generated report moves
-- as it is (no regeneration, no credit).
--   * account without a profile: the guest "me" becomes their profile;
--   * account with a profile: the relationship is re-pointed to that profile
--     (their saved info is kept) and the temporary "me" row is removed.
-- The other person becomes a manual person in the account.
--   result: saved | already_saved | email_mismatch | claimed_by_other | not_used | not_found
create or replace function public.save_guest_relationship_to_account(
  p_order_id text,
  p_clerk_user_id text,
  p_verified_emails text[]
)
returns table(result text, report_id uuid, relationship_report_id uuid)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_o toss_payment_orders;
  v_g guest_relationship_orders;
  v_self uuid;
  v_me uuid;
  v_rr relationship_reports;
  v_a uuid;
  v_b uuid;
begin
  select * into v_o from toss_payment_orders where order_id = p_order_id for update;
  if not found or v_o.guest_email is null then
    return query select 'not_found'::text, null::uuid, null::uuid; return;
  end if;
  select * into v_g from guest_relationship_orders where order_id = p_order_id for update;
  if v_o.clerk_user_id is not null then
    if v_o.clerk_user_id = p_clerk_user_id and v_g.migrated_at is not null then
      return query select 'already_saved'::text, v_g.self_report_id, v_g.relationship_report_id;
    elsif v_o.clerk_user_id = p_clerk_user_id then
      return query select 'not_used'::text, null::uuid, null::uuid;
    else
      return query select 'claimed_by_other'::text, null::uuid, null::uuid;
    end if;
    return;
  end if;
  if not exists (select 1 from unnest(coalesce(p_verified_emails, '{}'::text[])) e where lower(trim(e)) = v_o.guest_email) then
    return query select 'email_mismatch'::text, null::uuid, null::uuid; return;
  end if;
  if v_o.guest_use_status is distinct from 'used' or v_g.order_id is null or v_g.relationship_report_id is null then
    return query select 'not_used'::text, null::uuid, null::uuid; return;
  end if;

  select id into v_self from reports
   where clerk_user_id = p_clerk_user_id and report_type = 'self'
   order by created_at asc limit 1;

  if v_self is null then
    update reports set clerk_user_id = p_clerk_user_id, report_type = 'self' where id = v_g.self_report_id;
    v_me := v_g.self_report_id;
  else
    v_me := v_self;
    select * into v_rr from relationship_reports where id = v_g.relationship_report_id for update;
    -- keep the pair sorted the same way the app does (plain uuid text order)
    if (v_me::text collate "C") <= (v_g.partner_report_id::text collate "C") then
      v_a := v_me; v_b := v_g.partner_report_id;
    else
      v_a := v_g.partner_report_id; v_b := v_me;
    end if;
    update relationship_reports set report_id_a = v_a, report_id_b = v_b, updated_at = now() where id = v_rr.id;
    if to_regclass('public.relationship_premium_reports') is not null then
      update relationship_premium_reports
         set owner_report_id = v_me, owner_clerk_user_id = p_clerk_user_id, updated_at = now()
       where relationship_report_id = v_rr.id and owner_report_id = v_g.self_report_id;
    end if;
    delete from reports where id = v_g.self_report_id and report_type = 'guest_purchase';
  end if;

  if to_regclass('public.relationship_premium_reports') is not null then
    update relationship_premium_reports
       set owner_clerk_user_id = p_clerk_user_id, updated_at = now()
     where relationship_report_id = v_g.relationship_report_id and owner_report_id = v_me;
  end if;
  update reports set clerk_user_id = p_clerk_user_id, report_type = 'partner_manual'
   where id = v_g.partner_report_id and report_type = 'guest_purchase';

  if to_regclass('public.relationship_map_memberships') is not null then
    insert into relationship_map_memberships (relationship_report_id, viewer_report_id, other_report_id, status, responded_at)
      values (v_g.relationship_report_id, v_me, v_g.partner_report_id, 'accepted', now())
    on conflict (relationship_report_id, viewer_report_id) do nothing;
  end if;

  update toss_payment_orders
     set clerk_user_id = p_clerk_user_id, claimed_at = now(), status = 'granted', updated_at = now()
   where id = v_o.id;
  update guest_relationship_orders
     set migrated_clerk_user_id = p_clerk_user_id, migrated_at = now(),
         self_report_id = v_me, updated_at = now()
   where order_id = p_order_id;
  if to_regclass('public.guest_access_sessions') is not null then
    update guest_access_sessions set revoked_at = now() where order_id = p_order_id and revoked_at is null;
  end if;
  return query select 'saved'::text, v_me, v_g.relationship_report_id;
end;
$$;

-- Retention: purchase + 12 months (or at once for refunded / cancelled /
-- test orders, or orders claimed to an account as a credit without a guest
-- generation). Deleting the two guest rows removes the relationship and its
-- report (cascade). Saved-to-account orders are not touched.
create or replace function public.purge_guest_relationship_data()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_g record;
  v_n integer := 0;
begin
  for v_g in
    select g.*, o.status as order_status, o.approved_at, o.clerk_user_id as order_owner, o.is_test
      from guest_relationship_orders g
      join toss_payment_orders o on o.order_id = g.order_id
     where g.migrated_at is null and g.purged_at is null
       and (
         g.expires_at <= now()
         or o.status in ('refunded', 'canceled', 'cancelled', 'failed', 'test_completed')
         or (o.clerk_user_id is not null)
       )
     for update of g skip locked
  loop
    delete from reports where id in (v_g.self_report_id, v_g.partner_report_id) and report_type = 'guest_purchase';
    update guest_relationship_orders
       set purged_at = now(), partner_consent = null, self_report_id = null, partner_report_id = null,
           relationship_report_id = null, updated_at = now()
     where order_id = v_g.order_id;
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

revoke all on function public.prepare_guest_relationship_input(text, text) from public;
revoke all on function public.reserve_guest_relationship_use(text, uuid) from public;
revoke all on function public.complete_guest_relationship_use(text, uuid) from public;
revoke all on function public.release_guest_relationship_use(text, uuid) from public;
revoke all on function public.save_guest_relationship_to_account(text, text, text[]) from public;
revoke all on function public.purge_guest_relationship_data() from public;
grant execute on function public.prepare_guest_relationship_input(text, text) to service_role;
grant execute on function public.reserve_guest_relationship_use(text, uuid) to service_role;
grant execute on function public.complete_guest_relationship_use(text, uuid) to service_role;
grant execute on function public.release_guest_relationship_use(text, uuid) to service_role;
grant execute on function public.save_guest_relationship_to_account(text, text, text[]) to service_role;
grant execute on function public.purge_guest_relationship_data() to service_role;
