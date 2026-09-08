-- =============================================================================
-- process_beta_purchase — atomizes the Beta's entire "verified Paddle
-- transaction -> grant credit" step into ONE Postgres transaction.
--
-- The app-side version of this (insert into beta_purchase_grants, THEN loop
-- calling grant_credit once per credit type) was two-or-three separate
-- round trips: a Membership purchase could succeed at claiming the
-- transaction + granting the personal credit, then fail before granting
-- the relationship credit — leaving a partial grant with the transaction_id
-- already marked processed, so a retry would silently no-op forever
-- instead of finishing the grant. A single plpgsql function call is one
-- transaction: if ANY step raises, EVERYTHING in this function — including
-- the beta_purchase_grants insert itself — rolls back together, so a
-- retry with the same transaction_id starts clean instead of being wrongly
-- treated as already-processed.
--
-- Reuses grant_credit(...) as-is (no duplicated balance/ledger logic) —
-- nested function calls inside one SECURITY DEFINER plpgsql function run in
-- the same transaction as the outer call, so this composes safely.
--
-- reference_id passed to grant_credit is this purchase's own
-- beta_purchase_grants.id (a real uuid) rather than the Paddle transaction
-- id (a non-uuid string like "txn_...") — credit_ledger.reference_id is
-- uuid-typed, and beta_purchase_grants.id already correlates 1:1 with this
-- exact purchase event, so it's a natural, valid reference. A
-- membership_beta purchase's two grant_credit calls (personal + relationship)
-- deliberately share that same reference_id — both trace back to one
-- purchase.
-- =============================================================================

create or replace function public.process_beta_purchase(
  p_clerk_user_id text,
  p_plan_id text,
  p_paddle_transaction_id text,
  p_paddle_price_id text,
  p_currency_code text
)
returns table(ok boolean, already_processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant_id uuid;
begin
  if p_plan_id not in (
    'personal_premium', 'relationship_premium', 'membership_beta', 'additional_relationship'
  ) then
    raise exception 'invalid plan_id: %', p_plan_id;
  end if;

  begin
    insert into beta_purchase_grants (
      clerk_user_id, plan_id, paddle_transaction_id, paddle_price_id, currency_code
    ) values (
      p_clerk_user_id, p_plan_id, p_paddle_transaction_id, p_paddle_price_id, p_currency_code
    )
    returning id into v_grant_id;
  exception when unique_violation then
    -- Same transaction already fully processed (or currently mid-flight in
    -- a concurrent call that will finish or roll back on its own) — no-op.
    return query select true, true;
    return;
  end;

  if p_plan_id = 'personal_premium' then
    perform grant_credit(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, null);
  elsif p_plan_id = 'relationship_premium' then
    perform grant_credit(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, null);
  elsif p_plan_id = 'additional_relationship' then
    perform grant_credit(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, null);
  elsif p_plan_id = 'membership_beta' then
    perform grant_credit(p_clerk_user_id, 'personal', 1, 'membership', v_grant_id, null);
    perform grant_credit(p_clerk_user_id, 'relationship', 2, 'membership', v_grant_id, null);
  end if;

  return query select true, false;
end;
$$;

revoke all on function public.process_beta_purchase(text, text, text, text, text) from public;
grant execute on function public.process_beta_purchase(text, text, text, text, text) to service_role;
