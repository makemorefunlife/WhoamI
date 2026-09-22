-- =============================================================================
-- Credit engine RPCs, rewritten to be lot-aware (see credit_lots migration).
-- Every existing call site (reserveRelationshipCredit, reservePersonalCredit,
-- consumeCredit, releaseCredit, grantCredits in lib/credits/creditEngine.ts)
-- keeps its exact signature and return shape — only the internal spending
-- order and bookkeeping change. consume_credit is untouched (a reservation's
-- lot was already decremented at reserve time; finalizing never re-touches
-- the lot).
-- =============================================================================

-- Zeroes out any of this user's lots (of this credit_type) whose expires_at
-- has passed and still has remaining > 0, decrements the cached balance by
-- the total zeroed, and writes one 'expiration' ledger row for that total.
-- This is what makes "no rollover" actually true: an expired lot's unused
-- remainder is never available to reserve_credit again, with no cron job —
-- it's swept lazily, right before every spend/read that needs to be exact.
create or replace function public.expire_credit_lots(
  p_clerk_user_id text,
  p_credit_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_total integer;
  v_balance integer;
begin
  with victims as (
    select id, remaining
      from credit_lots
      where clerk_user_id = p_clerk_user_id
        and credit_type = p_credit_type
        and remaining > 0
        and expires_at is not null
        and expires_at <= now()
      for update
  ),
  zeroed as (
    update credit_lots cl
      set remaining = 0
      from victims v
      where cl.id = v.id
      returning v.remaining as expired_amount
  )
  select coalesce(sum(expired_amount), 0) into v_expired_total from zeroed;

  if v_expired_total > 0 then
    update credit_accounts
      set balance = greatest(balance - v_expired_total, 0), updated_at = now()
      where clerk_user_id = p_clerk_user_id and credit_type = p_credit_type
      returning balance into v_balance;

    insert into credit_ledger (
      clerk_user_id, credit_type, delta, reason, balance_after, enforced
    ) values (
      p_clerk_user_id, p_credit_type, -v_expired_total, 'expiration', coalesce(v_balance, 0), true
    );
  end if;
end;
$$;

-- Same grant as before, plus: creates the credit_lots row and returns its
-- id. grant_credit (below) becomes a thin wrapper over this for backward
-- compatibility — no existing caller needs to change.
create or replace function public.grant_credit_lot(
  p_clerk_user_id text,
  p_credit_type text,
  p_amount integer,
  p_source text,
  p_reference_id uuid default null,
  p_expires_at timestamptz default null
)
returns table(balance integer, lot_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_reason text;
  v_lot_id uuid;
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

  insert into credit_lots (
    clerk_user_id, credit_type, amount, remaining, source, reference_id, expires_at
  ) values (
    p_clerk_user_id, p_credit_type, p_amount, p_amount, p_source, p_reference_id, p_expires_at
  ) returning id into v_lot_id;

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

  return query select v_balance, v_lot_id;
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
begin
  select g.balance into v_balance from grant_credit_lot(
    p_clerk_user_id, p_credit_type, p_amount, p_source, p_reference_id, p_expires_at
  ) g;
  return v_balance;
end;
$$;

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
    -- Spend the soonest-to-expire lot first (expires_at ASC NULLS LAST):
    -- time-boxed grants (membership monthly credits, 30-Day Pass credits)
    -- get used before permanent ones, so a user's permanent credits are
    -- never stranded behind an about-to-expire lot they didn't get to.
    select id into v_lot_id
      from credit_lots
      where clerk_user_id = p_clerk_user_id
        and credit_type = p_credit_type
        and remaining >= 1
        and (expires_at is null or expires_at > now())
      order by expires_at asc nulls last, created_at asc
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
    return true; -- already finalized (or never existed) -- idempotent no-op
  end if;

  if v_res.enforced then
    if v_res.credit_lot_id is not null then
      -- Credit back to the SAME lot it was drawn from, not just the
      -- aggregate balance, so that lot's remaining stays accurate for
      -- FIFO ordering and per-lot "was this used up" checks. If the lot
      -- has since expired, this is harmless: expire_credit_lots will
      -- zero it again (and correct the cached balance) the next time
      -- anything touches this user's lots.
      update credit_lots set remaining = remaining + 1 where id = v_res.credit_lot_id;
    end if;
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

revoke all on function public.expire_credit_lots(text, text) from public;
revoke all on function public.grant_credit_lot(text, text, integer, text, uuid, timestamptz) from public;
revoke all on function public.grant_credit(text, text, integer, text, uuid, timestamptz) from public;
revoke all on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) from public;
revoke all on function public.release_credit(uuid) from public;

grant execute on function public.expire_credit_lots(text, text) to service_role;
grant execute on function public.grant_credit_lot(text, text, integer, text, uuid, timestamptz) to service_role;
grant execute on function public.grant_credit(text, text, integer, text, uuid, timestamptz) to service_role;
grant execute on function public.reserve_credit(text, text, uuid, text, text, uuid, uuid, boolean) to service_role;
grant execute on function public.release_credit(uuid) to service_role;
