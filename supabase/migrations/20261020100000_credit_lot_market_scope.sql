-- =============================================================================
-- Credit lots: market scope is explicit from now on (2026-10-20, decisions 4/6).
--
-- Rules
--   * A lot bought for a market stays that market's (credit_lots.locale from
--     the server-verified order, unchanged since 20261009120000).
--   * Lots that could be used on both sites keep that right: existing rows are
--     NOT changed (locale NULL stays NULL = both). No backfill.
--   * NEW lots must say where they can be used:
--       - purchases: the order's market (kr_/us_ grant row). If it cannot be
--         found, the grant is stopped instead of creating an any-site lot.
--       - US membership gift coupons: English site only (coupons issued from
--         now on; coupons issued before keep both).
--       - tester / redeem codes: each NEW code must name ko-KR, en-US or both.
--       - admin grants: only through grant_credit_lot_scoped(..., scope).
--   * credit_lots.scope_basis records why: order | issuer | legacy.
--     NULL on rows created before this migration (= legacy).
--   * reserve_credit: the request must name its language (all callers do).
-- Additive and re-runnable. Applying it changes no existing row.
-- =============================================================================

-- 1) columns -----------------------------------------------------------------
alter table public.credit_lots add column if not exists scope_basis text;
alter table public.credit_lots drop constraint if exists credit_lots_scope_basis_check;
alter table public.credit_lots
  add constraint credit_lots_scope_basis_check check (scope_basis is null or scope_basis in ('order', 'issuer', 'legacy'));
comment on column public.credit_lots.scope_basis is
  'Why the lot has its locale: order (server-verified order market), issuer (coupon/code/admin chose ko-KR, en-US or both=NULL locale), legacy (code issued before scopes). NULL = created before 2026-10-20.';

alter table public.gift_personal_coupons add column if not exists market_scope text;
alter table public.gift_personal_coupons drop constraint if exists gift_personal_coupons_market_scope_check;
alter table public.gift_personal_coupons
  add constraint gift_personal_coupons_market_scope_check check (market_scope is null or market_scope in ('ko-KR', 'en-US', 'both'));
comment on column public.gift_personal_coupons.market_scope is
  'Where the redeemed credit can be used. Set on issue from the membership''s market. NULL = issued before 2026-10-20 (both sites, kept).';

alter table public.tester_personal_codes add column if not exists market_scope text;
alter table public.tester_personal_codes drop constraint if exists tester_personal_codes_market_scope_check;
alter table public.tester_personal_codes
  add constraint tester_personal_codes_market_scope_check check (market_scope is null or market_scope in ('ko-KR', 'en-US', 'both'));
comment on column public.tester_personal_codes.market_scope is
  'Where the redeemed credit can be used (ko-KR, en-US or both). Required for codes created from 2026-10-20; NULL = older code (both, kept).';

-- 2) coupons / codes get a scope when created ------------------------------------
create or replace function public.gift_personal_coupons_set_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  if new.market_scope is not null then
    return new;
  end if;
  select plan_id into v_plan from memberships where id = new.membership_id;
  if v_plan like 'us\_%' then
    new.market_scope := 'en-US';
  elsif v_plan like 'kr\_%' then
    new.market_scope := 'ko-KR';
  else
    raise exception 'gift_coupon_market_unresolved';
  end if;
  return new;
end;
$$;
drop trigger if exists gift_personal_coupons_set_scope on public.gift_personal_coupons;
create trigger gift_personal_coupons_set_scope
  before insert on public.gift_personal_coupons
  for each row execute function public.gift_personal_coupons_set_scope();

create or replace function public.tester_personal_codes_require_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.market_scope is null then
    raise exception 'tester_code_market_scope_required (ko-KR, en-US or both)';
  end if;
  return new;
end;
$$;
drop trigger if exists tester_personal_codes_require_scope on public.tester_personal_codes;
create trigger tester_personal_codes_require_scope
  before insert on public.tester_personal_codes
  for each row execute function public.tester_personal_codes_require_scope();

-- 3) lot scope on insert ------------------------------------------------------------
-- Replaces 20261009120000's credit_lots_set_locale (same trigger name).
create or replace function public.credit_lots_set_locale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issuer_scope text := nullif(current_setting('aha.lot_scope', true), '');
  v_scope text;
begin
  -- Caller already decided (explicit locale + basis).
  if new.scope_basis is not null then
    return new;
  end if;

  -- grant_credit_lot_scoped(): the issuer named the scope.
  if v_issuer_scope is not null then
    new.locale := case when v_issuer_scope = 'both' then null else v_issuer_scope end;
    new.scope_basis := 'issuer';
    return new;
  end if;

  if new.reference_id is not null then
    -- Purchases: the server-verified order's market.
    if to_regclass('public.kr_purchase_grants') is not null
       and exists (select 1 from kr_purchase_grants where id = new.reference_id) then
      new.locale := 'ko-KR';
      new.scope_basis := 'order';
      return new;
    elsif to_regclass('public.us_purchase_grants') is not null
       and exists (select 1 from us_purchase_grants where id = new.reference_id) then
      new.locale := 'en-US';
      new.scope_basis := 'order';
      return new;
    elsif to_regclass('public.membership_monthly_grants') is not null
       and exists (
         select 1 from membership_monthly_grants g join memberships m on m.id = g.membership_id
          where g.id = new.reference_id and m.plan_id like 'us\_%'
       ) then
      new.locale := 'en-US';
      new.scope_basis := 'order';
      return new;
    elsif to_regclass('public.membership_term_grants') is not null
       and exists (
         select 1 from membership_term_grants g join memberships m on m.id = g.membership_id
          where g.id = new.reference_id and m.plan_id like 'us\_%'
       ) then
      new.locale := 'en-US';
      new.scope_basis := 'order';
      return new;
    end if;

    -- Coupons / codes: the scope written on the coupon or code.
    if new.source = 'promo' then
      if exists (select 1 from gift_personal_coupons where id = new.reference_id) then
        select market_scope into v_scope from gift_personal_coupons where id = new.reference_id;
      elsif exists (select 1 from tester_personal_code_redemptions where id = new.reference_id) then
        select c.market_scope into v_scope
          from tester_personal_code_redemptions r join tester_personal_codes c on c.id = r.tester_code_id
         where r.id = new.reference_id;
      else
        raise exception 'promo_lot_scope_unresolved';
      end if;
      if v_scope is null then
        -- Coupon / code issued before scopes existed: both sites, as before.
        new.locale := null;
        new.scope_basis := 'legacy';
      else
        new.locale := case when v_scope = 'both' then null else v_scope end;
        new.scope_basis := 'issuer';
      end if;
      return new;
    end if;
  end if;

  if new.locale is not null then
    -- An explicit language from a caller that is not an order/coupon path.
    new.scope_basis := 'issuer';
    return new;
  end if;

  if new.source in ('membership', 'one_time_purchase', 'additional_purchase') then
    raise exception 'purchase_lot_market_unresolved';
  end if;
  raise exception 'lot_scope_required (use grant_credit_lot_scoped)';
end;
$$;

drop trigger if exists credit_lots_set_locale on public.credit_lots;
create trigger credit_lots_set_locale
  before insert on public.credit_lots
  for each row execute function public.credit_lots_set_locale();

-- 4) grant_credit_lot_scoped -- admin / promo grants with an explicit scope ---------
create or replace function public.grant_credit_lot_scoped(
  p_clerk_user_id text,
  p_credit_type text,
  p_amount integer,
  p_source text,
  p_scope text,
  p_reference_id uuid default null,
  p_expires_at timestamptz default null
)
returns table(balance integer, lot_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_scope is null or p_scope not in ('ko-KR', 'en-US', 'both') then
    raise exception 'scope must be ko-KR, en-US or both';
  end if;
  perform set_config('aha.lot_scope', p_scope, true);
  return query select g.balance, g.lot_id
    from grant_credit_lot(p_clerk_user_id, p_credit_type, p_amount, p_source, p_reference_id, p_expires_at) g;
  perform set_config('aha.lot_scope', '', true);
end;
$$;
revoke all on function public.grant_credit_lot_scoped(text, text, integer, text, text, uuid, timestamptz) from public;
grant execute on function public.grant_credit_lot_scoped(text, text, integer, text, text, uuid, timestamptz) to service_role;

-- 5) reserve_credit: the request must name its language ------------------------------
-- Identical to 20261009120000 except the locale guard at the top.
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
  -- 2026-10-20: every spend names its market language; NULL used to mean
  -- "any lot" (all callers already pass one -- this only closes the gap).
  if p_locale is null or p_locale not in ('ko-KR', 'en-US') then
    raise exception 'reserve_credit_locale_required';
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
