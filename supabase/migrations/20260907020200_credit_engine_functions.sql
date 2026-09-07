-- =============================================================================
-- Credit engine RPCs — reserve / consume / release / grant.
-- Each is ONE function = ONE transaction: balance, credit_reservations, and
-- credit_ledger are never touched by separate app-side round trips, so a
-- crash between steps can never leave them inconsistent with each other.
--
-- consume_credit and release_credit are idempotent twice over:
--   1) if the reservation row is already gone (already finalized, or a
--      stale-lock steal already cleaned it up), they no-op and return true.
--   2) even if two finalizers somehow both pass check (1) concurrently,
--      credit_ledger_terminal_once (the partial unique index from the
--      previous migration) lets only one of their ledger inserts succeed;
--      the loser catches unique_violation and also treats it as success.
-- =============================================================================

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
begin
  if p_credit_type not in ('personal', 'relationship') then
    raise exception 'invalid credit_type: %', p_credit_type;
  end if;

  if p_enforced then
    update credit_accounts
      set balance = balance - 1, updated_at = now()
      where clerk_user_id = p_clerk_user_id
        and credit_type = p_credit_type
        and balance >= 1
      returning balance into v_balance;

    if not found then
      return query select null::uuid, false, null::integer;
      return;
    end if;
  else
    select balance into v_balance
      from credit_accounts
      where clerk_user_id = p_clerk_user_id and credit_type = p_credit_type;
    v_balance := coalesce(v_balance, 0);
  end if;

  insert into credit_reservations (
    clerk_user_id, credit_type, relationship_report_id, kind, locale,
    generation_lock_id, generation_request_id, enforced
  ) values (
    p_clerk_user_id, p_credit_type, p_relationship_report_id, p_kind, p_locale,
    p_generation_lock_id, p_generation_request_id, p_enforced
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

create or replace function public.consume_credit(
  p_generation_request_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res record;
  v_balance integer;
begin
  select * into v_res from credit_reservations
    where generation_request_id = p_generation_request_id;

  if not found then
    return true; -- already finalized (or never existed) — idempotent no-op
  end if;

  select balance into v_balance
    from credit_accounts
    where clerk_user_id = v_res.clerk_user_id and credit_type = v_res.credit_type;

  begin
    insert into credit_ledger (
      clerk_user_id, credit_type, delta, reason, reference_id, balance_after, enforced
    ) values (
      v_res.clerk_user_id, v_res.credit_type, 0, 'consumption', v_res.id, coalesce(v_balance, 0), v_res.enforced
    );
  exception when unique_violation then
    -- release_credit already won the race for this reservation.
    delete from credit_reservations where id = v_res.id;
    return true;
  end;

  delete from credit_reservations where id = v_res.id;
  return true;
end;
$$;

create or replace function public.release_credit(
  p_generation_request_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res record;
  v_balance integer;
begin
  select * into v_res from credit_reservations
    where generation_request_id = p_generation_request_id;

  if not found then
    return true; -- already finalized (or never existed) — idempotent no-op
  end if;

  if v_res.enforced then
    update credit_accounts
      set balance = balance + 1, updated_at = now()
      where clerk_user_id = v_res.clerk_user_id and credit_type = v_res.credit_type
      returning balance into v_balance;
  else
    select balance into v_balance
      from credit_accounts
      where clerk_user_id = v_res.clerk_user_id and credit_type = v_res.credit_type;
  end if;

  begin
    insert into credit_ledger (
      clerk_user_id, credit_type, delta, reason, reference_id, balance_after, enforced
    ) values (
      v_res.clerk_user_id, v_res.credit_type, 1, 'reservation_release', v_res.id, coalesce(v_balance, 0), v_res.enforced
    );
  exception when unique_violation then
    -- consume_credit already won the race for this reservation.
    delete from credit_reservations where id = v_res.id;
    return true;
  end;

  delete from credit_reservations where id = v_res.id;
  return true;
end;
$$;

create or replace function public.grant_credit(
  p_clerk_user_id text,
  p_credit_type text,
  p_amount integer,
  p_source text,
  p_reference_id uuid default null,
  p_expires_at timestamptz default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_reason text;
begin
  if p_credit_type not in ('personal', 'relationship') then
    raise exception 'invalid credit_type: %', p_credit_type;
  end if;
  if p_amount <= 0 then
    raise exception 'grant amount must be positive: %', p_amount;
  end if;

  v_reason := case p_source
    when 'membership' then 'membership_grant'
    when 'one_time_purchase' then 'one_time_purchase'
    when 'additional_purchase' then 'additional_purchase'
    when 'promo' then 'promo'
    when 'admin' then 'admin_grant'
    else null
  end;
  if v_reason is null then
    raise exception 'invalid grant source: %', p_source;
  end if;

  insert into credit_accounts (clerk_user_id, credit_type, balance)
    values (p_clerk_user_id, p_credit_type, p_amount)
  on conflict (clerk_user_id, credit_type)
    do update set balance = credit_accounts.balance + excluded.balance, updated_at = now()
  returning balance into v_balance;

  insert into credit_ledger (
    clerk_user_id, credit_type, delta, reason, source, reference_id, balance_after, enforced, expires_at
  ) values (
    p_clerk_user_id, p_credit_type, p_amount, v_reason, p_source, p_reference_id, v_balance, true, p_expires_at
  );

  return v_balance;
end;
$$;

revoke all on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) from public;
revoke all on function public.consume_credit(uuid) from public;
revoke all on function public.release_credit(uuid) from public;
revoke all on function public.grant_credit(text, text, integer, text, uuid, timestamptz) from public;

grant execute on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) to service_role;
grant execute on function public.consume_credit(uuid) to service_role;
grant execute on function public.release_credit(uuid) to service_role;
grant execute on function public.grant_credit(text, text, integer, text, uuid, timestamptz) to service_role;
