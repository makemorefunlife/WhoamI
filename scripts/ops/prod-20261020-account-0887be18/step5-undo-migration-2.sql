-- =============================================================================
-- UNDO of migration 2 (credit lot market scope) on PRODUCTION.
-- Restores the previous credit_lots_set_locale and reserve_credit bodies
-- (exact copies of what prod ran before 2026-10-20), removes the new
-- triggers and grant_credit_lot_scoped. The new columns (scope_basis,
-- market_scope) are KEPT: they are unused by the previous code, and dropping
-- them would erase which scope newer coupons/codes/lots were given.
-- No credit_lots row is changed: lots keep their locale.
-- One transaction.
-- =============================================================================
begin;
set local lock_timeout = '5s';

drop trigger if exists gift_personal_coupons_set_scope on public.gift_personal_coupons;
drop trigger if exists tester_personal_codes_require_scope on public.tester_personal_codes;
drop function if exists public.gift_personal_coupons_set_scope();
drop function if exists public.tester_personal_codes_require_scope();
drop function if exists public.grant_credit_lot_scoped(text, text, integer, text, text, uuid, timestamptz);

create or replace function public.credit_lots_set_locale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.locale is not null or new.reference_id is null then
    return new;
  end if;

  if to_regclass('public.kr_purchase_grants') is not null
     and exists (select 1 from kr_purchase_grants where id = new.reference_id) then
    new.locale := 'ko-KR';
  elsif to_regclass('public.us_purchase_grants') is not null
     and exists (select 1 from us_purchase_grants where id = new.reference_id) then
    new.locale := 'en-US';
  elsif to_regclass('public.membership_monthly_grants') is not null
     and exists (
       select 1 from membership_monthly_grants g join memberships m on m.id = g.membership_id
        where g.id = new.reference_id and m.plan_id like 'us\_%'
     ) then
    new.locale := 'en-US';
  elsif to_regclass('public.membership_term_grants') is not null
     and exists (
       select 1 from membership_term_grants g join memberships m on m.id = g.membership_id
        where g.id = new.reference_id and m.plan_id like 'us\_%'
     ) then
    new.locale := 'en-US';
  end if;
  return new;
end;
$$;

-- reserve_credit: previous body (no locale guard)
create or replace function public.reserve_credit(
  p_clerk_user_id text,
  p_credit_type text,
  p_relationship_report_id uuid,
  p_kind text,
  p_locale text,
  p_generation_lock_id uuid,
  p_generation_request_id uuid,
  p_enforced boolean
)
returns table(reservation_id uuid, ok boolean, balance_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_reservation_id uuid;
  v_lot_id uuid;
begin
  if p_credit_type not in ('personal', 'relationship') then
    raise exception 'invalid credit_type: %', p_credit_type;
  end if;

  perform expire_credit_lots(p_clerk_user_id, p_credit_type);

  if p_enforced then
    select id into v_lot_id
      from credit_lots
      where clerk_user_id = p_clerk_user_id
        and credit_type = p_credit_type
        and remaining >= 1
        and (expires_at is null or expires_at > now())
        and (p_locale is null or locale is null or locale = p_locale)
      order by expires_at asc nulls last, (locale is null) asc, created_at asc
      limit 1
      for update skip locked;

    if v_lot_id is null then
      return query select null::uuid, false, null::integer;
      return;
    end if;

    update credit_lots set remaining = remaining - 1 where id = v_lot_id;

    update credit_accounts
      set balance = balance - 1, updated_at = now()
      where clerk_user_id = p_clerk_user_id and credit_type = p_credit_type
      returning balance into v_balance;
  else
    select balance into v_balance
      from credit_accounts
      where clerk_user_id = p_clerk_user_id and credit_type = p_credit_type;
    v_balance := coalesce(v_balance, 0);
  end if;

  insert into credit_reservations (
    clerk_user_id, credit_type, relationship_report_id, kind, locale,
    generation_lock_id, generation_request_id, enforced, credit_lot_id
  ) values (
    p_clerk_user_id, p_credit_type, p_relationship_report_id, p_kind, p_locale,
    p_generation_lock_id, p_generation_request_id, p_enforced, v_lot_id
  )
  returning id into v_reservation_id;

  insert into credit_ledger (
    clerk_user_id, credit_type, delta, reason, reference_id, balance_after, enforced
  ) values (
    p_clerk_user_id, p_credit_type, -1, 'reservation_hold', v_reservation_id, v_balance, p_enforced
  );

  return query select v_reservation_id, true, v_balance;
end;
$$;

revoke all on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) from public;
grant execute on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) to service_role;

commit;
