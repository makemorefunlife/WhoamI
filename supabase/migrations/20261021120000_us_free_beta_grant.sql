-- =============================================================================
-- us_free_beta_grants / process_us_free_beta_grant — temporary stand-in for
-- the disabled US/English checkout (see lib/payment/usFreeBeta.ts and
-- lib/payment/tossCatalog.ts's isCheckoutEnabled: US Toss is off pending the
-- USD contract, Paddle is disconnected pending re-approval). Only the two
-- Personal/Relationship Premium plans that gate the English "Analyze ->
-- paywall -> unlock" flow are covered -- every other US plan (membership,
-- 30-Day Pass, additional relationship) stays fully disabled.
--
-- A signed-in en-US buyer who clicks the existing Purchase button gets the
-- credit granted immediately -- no payment window -- but the grant is:
--   * never recorded as revenue: source = 'promo' (same source the credit
--     engine already uses for coupons/tester codes), not
--     'one_time_purchase'.
--   * scoped to the English site only: granted through
--     grant_credit_lot_scoped(..., 'en-US') (see 20261020100000's market
--     scope rules), so it can never surface as a KR-site credit and KR's
--     own credit_lots rows/behavior are untouched.
--   * idempotent per click: one row per request_id (a fresh id the client
--     generates for each Purchase click) -- a retried/duplicated request for
--     the SAME click cannot grant twice. A later, separate click is a new
--     request_id and grants again, same as a real repeat purchase would.
--
-- Swapping this back to a real payment step later (Toss USD once the
-- contract lands, or Paddle once reconnected) means restoring the normal
-- checkout call in handleCheckout and leaving this table/function in place
-- unused -- the surrounding screens, copy and buttons never change.
-- =============================================================================

create table public.us_free_beta_grants (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  plan_id text not null check (plan_id in ('us_personal_premium', 'us_relationship_premium')),
  request_id uuid not null,
  created_at timestamptz not null default now()
);

create unique index us_free_beta_grants_request_key
  on public.us_free_beta_grants (request_id);

create index us_free_beta_grants_user_idx
  on public.us_free_beta_grants (clerk_user_id, created_at desc);

alter table public.us_free_beta_grants enable row level security;
revoke all on table public.us_free_beta_grants from public, anon, authenticated, service_role;
grant select, insert on table public.us_free_beta_grants to service_role;

comment on table public.us_free_beta_grants is
  'RLS enabled; service-role API only. One row per free-beta grant ATTEMPT (request_id is a client-generated id, fresh per Purchase click) -- the unique index on request_id is what makes granting a Personal/Relationship credit idempotent under a retried/duplicated click. Temporary stand-in for the disabled US checkout (see lib/payment/usFreeBeta.ts); credits granted here use source=''promo'' scoped to en-US and are never counted as real purchase revenue.';

create or replace function public.process_us_free_beta_grant(
  p_clerk_user_id text,
  p_plan_id text,
  p_request_id uuid
)
returns table(ok boolean, already_processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant_id uuid;
  v_credit_type text;
begin
  if p_plan_id = 'us_personal_premium' then
    v_credit_type := 'personal';
  elsif p_plan_id = 'us_relationship_premium' then
    v_credit_type := 'relationship';
  else
    raise exception 'invalid plan_id: %', p_plan_id;
  end if;

  begin
    insert into us_free_beta_grants (clerk_user_id, plan_id, request_id)
    values (p_clerk_user_id, p_plan_id, p_request_id)
    returning id into v_grant_id;
  exception when unique_violation then
    -- Same click already processed (or mid-flight in a concurrent call that
    -- will finish or roll back on its own) -- no-op.
    return query select true, true;
    return;
  end;

  -- Matches the real plan's own grant (usPricing.ts: "+1, expires 1 year
  -- after purchase"), just not counted as a purchase. 'en-US' scope keeps
  -- this lot unusable from the KR site (see 20261020100000).
  perform grant_credit_lot_scoped(
    p_clerk_user_id, v_credit_type, 1, 'promo', 'en-US', v_grant_id, now() + interval '1 year'
  );

  return query select true, false;
end;
$$;

revoke all on function public.process_us_free_beta_grant(text, text, uuid) from public, anon, authenticated;
grant execute on function public.process_us_free_beta_grant(text, text, uuid) to service_role;
