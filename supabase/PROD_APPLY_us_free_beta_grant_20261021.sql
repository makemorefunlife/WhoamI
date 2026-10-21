-- =============================================================================
-- PROD APPLY: 20261021120000_us_free_beta_grant.sql
-- Target: Supabase PROD (gncjslondpvysjaytagd)
--
-- Adds ONE new table (us_free_beta_grants) and ONE new function
-- (process_us_free_beta_grant). Does not touch any existing table, column,
-- row, or function. Nothing here grants anything by itself -- the grant
-- only happens when the app calls process_us_free_beta_grant, which only
-- happens when:
--   1. NEXT_PUBLIC_US_FREE_BETA_ENABLED=true is set in Vercel (code also
--      deployed; leave this env var UNSET until you want the feature live),
--   AND
--   2. a signed-in en-US (English site) buyer clicks the existing Purchase
--      button for Personal or Relationship Premium while real checkout for
--      that plan is still off.
--
-- Credits granted this way use source='promo' (never counted as purchase
-- revenue) and are scoped to en-US only (see 20261020100000's market scope
-- rules -- a KR-site credit can never come from this path). Prerequisite:
-- 20261020100000_credit_lot_market_scope.sql and 20261021090000's
-- grant_credit_lot_scoped must already be applied to PROD (same function
-- this migration calls).
--
-- SAFETY & DATA PRESERVATION:
--   - CREATE TABLE (not IF NOT EXISTS -- run once; re-running is refused by
--     Postgres with "relation already exists" rather than silently no-op,
--     which is the correct behavior here since nothing should overwrite it).
--   - No existing table, column, or row is touched.
--   - Wrapped in a single BEGIN ... COMMIT transaction block.
--
-- VERIFY AFTER APPLYING (run as a separate read-only query):
--   select has_table_privilege('anon', 'public.us_free_beta_grants', 'select');      -- expect false
--   select has_table_privilege('authenticated', 'public.us_free_beta_grants', 'select'); -- expect false
--   select has_table_privilege('service_role', 'public.us_free_beta_grants', 'select');  -- expect true
--   select has_function_privilege('anon', 'public.process_us_free_beta_grant(text,text,uuid)', 'execute');  -- expect false
--   select has_function_privilege('service_role', 'public.process_us_free_beta_grant(text,text,uuid)', 'execute'); -- expect true
--
-- ROLLBACK (if needed before any row is ever inserted):
--   BEGIN;
--   DROP FUNCTION IF EXISTS public.process_us_free_beta_grant(text, text, uuid);
--   DROP TABLE IF EXISTS public.us_free_beta_grants;
--   COMMIT;
-- =============================================================================

BEGIN;

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
    return query select true, true;
    return;
  end;

  perform grant_credit_lot_scoped(
    p_clerk_user_id, v_credit_type, 1, 'promo', 'en-US', v_grant_id, now() + interval '1 year'
  );

  return query select true, false;
end;
$$;

revoke all on function public.process_us_free_beta_grant(text, text, uuid) from public, anon, authenticated;
grant execute on function public.process_us_free_beta_grant(text, text, uuid) to service_role;

COMMIT;
