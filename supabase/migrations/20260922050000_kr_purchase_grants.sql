-- =============================================================================
-- KR regional Paddle sandbox catalog (Personal/DEEPSELF, Relationship
-- Single, 30-Day Insight Pass, Relationship Triple) -- deliberately its own
-- table + function, completely separate from us_purchase_grants /
-- process_us_purchase and from the pre-existing beta_purchase_grants /
-- process_beta_purchase:
--
--   - plan_id namespaces never overlap ('kr_*' here vs 'us_*' in
--     us_purchase_grants vs the un-prefixed beta ids in
--     beta_purchase_grants), so there is no code path, migration, or
--     query that could resolve a KR plan id against the US table or vice
--     versa -- the separation is physical, not just a convention.
--   - Grants land in the exact same shared credit_lots / credit_accounts /
--     credit_ledger tables as every other catalog (grant_credit_lot is
--     reused as-is) -- one entitlement engine underneath three separate,
--     never-mixed purchase-grant ledgers on top.
--
-- No membership/annual concept exists in the KR catalog (not part of this
-- request), so nothing here touches memberships/membership_*_grants.
-- =============================================================================

create table if not exists public.kr_purchase_grants (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  plan_id text not null check (plan_id in (
    'kr_personal_premium', 'kr_relationship_premium', 'kr_insight_pass_30d', 'kr_relationship_triple'
  )),
  paddle_transaction_id text not null,
  paddle_price_id text not null,
  currency_code text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists kr_purchase_grants_txn_key
  on public.kr_purchase_grants (paddle_transaction_id);

create index if not exists kr_purchase_grants_user_idx
  on public.kr_purchase_grants (clerk_user_id, created_at desc);

alter table public.kr_purchase_grants enable row level security;
grant select, insert on table public.kr_purchase_grants to service_role;

comment on table public.kr_purchase_grants is
  'RLS enabled; service-role API only. One row per successfully-verified KR-catalog Paddle sandbox transaction -- unique on paddle_transaction_id is the idempotency guard, same pattern as beta_purchase_grants / us_purchase_grants. KR-only plan_id namespace, kept in its own table so it can never be queried/joined against the US or Beta grant tables by accident.';

-- Idempotent on paddle_transaction_id, same contract as process_us_purchase
-- and process_beta_purchase: a unique_violation on the grants insert means
-- this exact transaction already ran (or is mid-flight concurrently), so
-- this no-ops instead of granting twice.
create or replace function public.process_kr_purchase(
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
  v_now timestamptz := now();
begin
  if p_plan_id not in (
    'kr_personal_premium', 'kr_relationship_premium', 'kr_insight_pass_30d', 'kr_relationship_triple'
  ) then
    raise exception 'invalid plan_id: %', p_plan_id;
  end if;

  begin
    insert into kr_purchase_grants (
      clerk_user_id, plan_id, paddle_transaction_id, paddle_price_id, currency_code
    ) values (
      p_clerk_user_id, p_plan_id, p_paddle_transaction_id, p_paddle_price_id, p_currency_code
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

revoke all on function public.process_kr_purchase(text, text, text, text, text) from public;
grant execute on function public.process_kr_purchase(text, text, text, text, text) to service_role;
