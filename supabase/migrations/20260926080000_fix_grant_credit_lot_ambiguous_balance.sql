-- =============================================================================
-- HIGH-CONFIDENCE fix for grant_credit_lot's RETURNS TABLE(balance, lot_id)
-- introduced in 20260922040100_credit_engine_lot_functions.sql. Static code
-- audit only -- the exact production error text (Postgres code/message/
-- details/hint) was not independently re-verified against a live Vercel log
-- line, so this is not asserted as a 100%-confirmed root cause.
--
-- What the audit found: grant_credit_lot's RETURNS TABLE(balance integer,
-- lot_id uuid) makes `balance` and `lot_id` implicit PL/pgSQL variable
-- names throughout the function body (see
-- https://www.postgresql.org/docs/current/plpgsql-implementation.html#PLPGSQL-VAR-SUBST).
-- The line
--   returning balance into v_balance;
-- right after the credit_accounts upsert is a bare, unqualified reference
-- to a column also named `balance` on the table just written to. This is
-- the exact, well-documented shape of a Postgres 42702 "column reference
-- is ambiguous" error (DETAIL: "It could refer to either a PL/pgSQL
-- variable or a table column."). It is the only such unqualified
-- collision found anywhere in the Sep22 migration batch -- every other
-- function with a matching OUT-column/table-column name (e.g.
-- ensure_monthly_relationship_grant's cycle_index/lot_id) already
-- qualifies every reference with a table alias.
--
-- If this diagnosis is correct, it breaks EVERY credit grant in the app,
-- since grant_credit (its thin wrapper) and grant_credit_lot are the sole
-- path used by process_us_purchase, process_us_annual_renewal,
-- process_kr_purchase, process_beta_purchase,
-- ensure_monthly_relationship_grant, and redeem_gift_personal_coupon.
--
-- Fix: qualify that one RETURNING reference with the table name, exactly
-- like the SET clause two lines above it already does
-- (`credit_accounts.balance + excluded.balance`). No other line changes --
-- this is a byte-for-byte copy of grant_credit_lot from
-- 20260922040100_credit_engine_lot_functions.sql with only that one
-- qualification added, so it is safe to apply even if this diagnosis
-- turns out to be wrong: qualifying an already-unambiguous reference is a
-- no-op.
-- =============================================================================

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
  returning credit_accounts.balance into v_balance;

  insert into credit_ledger (
    clerk_user_id, credit_type, delta, reason, source, reference_id, balance_after, enforced, expires_at
  ) values (
    p_clerk_user_id, p_credit_type, p_amount, v_reason, p_source, p_reference_id, v_balance, true, p_expires_at
  );

  return query select v_balance, v_lot_id;
end;
$$;

-- Ownership/grants are unchanged by CREATE OR REPLACE (same owner, same
-- signature) -- re-stating them is not required, but doesn't hurt and
-- matches the original migration's own defensive style.
revoke all on function public.grant_credit_lot(text, text, integer, text, uuid, timestamptz) from public;
grant execute on function public.grant_credit_lot(text, text, integer, text, uuid, timestamptz) to service_role;

-- Verification: confirm the function still resolves with the exact same
-- signature (no accidental overload created) and that PostgREST will see
-- it as before.
select
  (to_regprocedure('public.grant_credit_lot(text,text,integer,text,uuid,timestamptz)') is not null)
    as has_grant_credit_lot;
