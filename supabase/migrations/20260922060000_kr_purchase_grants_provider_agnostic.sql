-- =============================================================================
-- Makes kr_purchase_grants / process_kr_purchase payment-provider-agnostic.
--
-- WHY: both US and KR currently run on Paddle Sandbox while Paddle's domain
-- review is pending, but KR may switch to Toss Payments afterward based on
-- real operational data -- a decision made independently of the US side.
-- The KR entitlement/grant path must not have Paddle baked into its own
-- schema or RPC signature, so that a future Toss integration only has to
-- supply a different `payment_provider` value and its own transaction/price
-- identifiers -- it should never need to touch credit_lots, credit_accounts,
-- credit_ledger, or this table's grant logic at all.
--
-- This does NOT touch the US side (us_purchase_grants / process_us_purchase)
-- or the Beta side (beta_purchase_grants / process_beta_purchase) -- both
-- stay on Paddle only, unchanged, per the request. Only KR is made
-- provider-agnostic, since only KR has a real, stated future provider swap.
--
-- Renames, on the table created in 20260922050000_kr_purchase_grants.sql:
--   paddle_transaction_id -> provider_transaction_id
--   paddle_price_id       -> provider_price_id
-- Adds:
--   payment_provider text not null default 'paddle'
--     (every existing/new-until-switched row is explicitly 'paddle' --
--     never inferred, never nullable, so a future Toss row is required to
--     say so explicitly rather than silently defaulting forever)
--
-- process_kr_purchase is replaced (old 5-arg signature dropped) with a new
-- signature taking p_provider_transaction_id / p_provider_price_id /
-- p_payment_provider (default 'paddle', so every existing call site that
-- doesn't pass it keeps working unchanged). The unique idempotency index
-- moves with the column rename automatically (Postgres renames the index's
-- underlying column reference along with the column).
-- =============================================================================

alter table public.kr_purchase_grants
  rename column paddle_transaction_id to provider_transaction_id;

alter table public.kr_purchase_grants
  rename column paddle_price_id to provider_price_id;

alter table public.kr_purchase_grants
  add column if not exists payment_provider text not null default 'paddle';

comment on table public.kr_purchase_grants is
  'RLS enabled; service-role API only. One row per successfully-verified KR-catalog purchase transaction -- unique on provider_transaction_id is the idempotency guard, same pattern as beta_purchase_grants / us_purchase_grants. KR-only plan_id namespace, kept in its own table so it can never be queried/joined against the US or Beta grant tables by accident. payment_provider records which processor handled the transaction (''paddle'' today; KR may switch to ''toss'' later based on operational data -- the entitlement logic below has no Paddle-specific dependency, only opaque provider transaction/price identifiers).';

comment on column public.kr_purchase_grants.provider_transaction_id is
  'Opaque transaction id from whichever processor handled this purchase (Paddle sandbox transaction id today). Never assume Paddle''s id format.';

comment on column public.kr_purchase_grants.provider_price_id is
  'Opaque price/SKU id from whichever processor handled this purchase. Never assume Paddle''s id format.';

drop function if exists public.process_kr_purchase(text, text, text, text, text);

create or replace function public.process_kr_purchase(
  p_clerk_user_id text,
  p_plan_id text,
  p_provider_transaction_id text,
  p_provider_price_id text,
  p_currency_code text,
  p_payment_provider text default 'paddle'
)
returns table(ok boolean, already_processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant_id uuid;
  v_now timestamptz := now();
begin
  if p_plan_id not in (
    'kr_personal_premium', 'kr_relationship_premium', 'kr_insight_pass_30d', 'kr_relationship_triple'
  ) then
    raise exception 'invalid plan_id: %', p_plan_id;
  end if;

  begin
    insert into kr_purchase_grants (
      clerk_user_id, plan_id, provider_transaction_id, provider_price_id, currency_code, payment_provider
    ) values (
      p_clerk_user_id, p_plan_id, p_provider_transaction_id, p_provider_price_id, p_currency_code, p_payment_provider
    )
    returning id into v_grant_id;
  exception when unique_violation then
    return query select true, true;
    return;
  end;

  if p_plan_id = 'kr_personal_premium' then
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, null);

  elsif p_plan_id = 'kr_relationship_premium' then
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, null);

  elsif p_plan_id = 'kr_insight_pass_30d' then
    -- Same rule as the US pass: credits AND Journal access share the same
    -- 30-day window from purchase, credits are not permanent.
    perform grant_credit_lot(p_clerk_user_id, 'personal', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 1, 'one_time_purchase', v_grant_id, v_now + interval '30 days');

  elsif p_plan_id = 'kr_relationship_triple' then
    perform grant_credit_lot(p_clerk_user_id, 'relationship', 3, 'one_time_purchase', v_grant_id, null);
  end if;

  return query select true, false;
end;
$$;

revoke all on function public.process_kr_purchase(text, text, text, text, text, text) from public;
grant execute on function public.process_kr_purchase(text, text, text, text, text, text) to service_role;
