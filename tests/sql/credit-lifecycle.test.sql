-- Credit lifecycle against the REAL credit/purchase SQL functions (QA/QC #2).
-- Run via tests/scripts/run-credit-lifecycle-sql.sh (throwaway local
-- Postgres with the credit migrations applied). Never run against prod.
-- Raises (non-zero exit with ON_ERROR_STOP) on the first failed assertion.

create or replace function pg_temp.remaining(u text, ty text) returns integer language sql as $$
  select coalesce(sum(remaining), 0)::integer from credit_lots
   where clerk_user_id = u and credit_type = ty
     and (expires_at is null or expires_at > now())
$$;

do $$
declare r record;
begin
  -- Three separate US single Relationship purchases (production pattern)
  perform process_us_purchase('t_user', 'us_relationship_premium', 't_txn_rel_1', 'pri_rel', 'USD');
  perform process_us_purchase('t_user', 'us_relationship_premium', 't_txn_rel_2', 'pri_rel', 'USD');
  perform process_us_purchase('t_user', 'us_relationship_premium', 't_txn_rel_3', 'pri_rel', 'USD');
  assert (select count(*) from credit_lots where clerk_user_id = 't_user' and credit_type = 'relationship' and amount = 1) = 3,
    'each single purchase creates one lot of amount 1';
  assert pg_temp.remaining('t_user', 'relationship') = 3, 'three single purchases must sum to 3';
  raise notice 'ok - multiple single Relationship purchases sum correctly (3 lots x 1 = 3)';

  -- Duplicate delivery of one of those transactions (webhook + /complete)
  select * into r from process_us_purchase('t_user', 'us_relationship_premium', 't_txn_rel_2', 'pri_rel', 'USD');
  assert r.already_processed, 'duplicate delivery must be a no-op';
  assert pg_temp.remaining('t_user', 'relationship') = 3, 'duplicate delivery must not add credits';
  raise notice 'ok - duplicate delivery of a purchase does not double-grant';

  -- One Relationship generation consumes exactly one credit
  select * into r from reserve_credit('t_user', 'relationship', null, 'romantic', 'en-US', null, 'aaaaaaaa-0000-0000-0000-000000000001', true);
  assert r.ok, 'reserve with credits available must succeed (no checkout)';
  perform consume_credit('aaaaaaaa-0000-0000-0000-000000000001');
  assert pg_temp.remaining('t_user', 'relationship') = 2, 'one generation must consume exactly one credit';
  perform consume_credit('aaaaaaaa-0000-0000-0000-000000000001');
  perform release_credit('aaaaaaaa-0000-0000-0000-000000000001');
  assert pg_temp.remaining('t_user', 'relationship') = 2, 'retrying the same request must not consume again';
  raise notice 'ok - one Relationship generation consumes exactly one credit (retry-safe)';

  -- Use the rest, then reserve must refuse (-> 402 -> checkout)
  perform reserve_credit('t_user', 'relationship', null, 'friendship', 'en-US', null, 'aaaaaaaa-0000-0000-0000-000000000002', true);
  perform consume_credit('aaaaaaaa-0000-0000-0000-000000000002');
  perform reserve_credit('t_user', 'relationship', null, 'work', 'en-US', null, 'aaaaaaaa-0000-0000-0000-000000000003', true);
  perform consume_credit('aaaaaaaa-0000-0000-0000-000000000003');
  assert pg_temp.remaining('t_user', 'relationship') = 0, 'three generations use all three credits';
  select * into r from reserve_credit('t_user', 'relationship', null, 'family', 'en-US', null, 'aaaaaaaa-0000-0000-0000-000000000004', true);
  assert not r.ok, 'reserve at 0 Relationship credits must refuse (route returns 402 -> checkout)';
  raise notice 'ok - Relationship remaining = 0 -> reserve refused (checkout)';

  -- Personal: one purchase, one generation, exactly one credit; types isolated
  perform process_us_purchase('t_user', 'us_personal_premium', 't_txn_personal_1', 'pri_personal', 'USD');
  assert pg_temp.remaining('t_user', 'personal') = 1, 'personal purchase grants 1';
  select * into r from reserve_credit('t_user', 'relationship', null, 'family', 'en-US', null, 'aaaaaaaa-0000-0000-0000-000000000005', true);
  assert not r.ok, 'a Personal credit must not be spendable on Relationship';
  select * into r from reserve_credit('t_user', 'personal', null, null, 'en-US', null, 'aaaaaaaa-0000-0000-0000-000000000006', true);
  assert r.ok, 'personal reserve with 1 credit succeeds (no checkout)';
  perform consume_credit('aaaaaaaa-0000-0000-0000-000000000006');
  assert pg_temp.remaining('t_user', 'personal') = 0, 'one Personal generation consumes exactly one Personal credit';
  select * into r from reserve_credit('t_user', 'personal', null, null, 'en-US', null, 'aaaaaaaa-0000-0000-0000-000000000007', true);
  assert not r.ok, 'personal reserve at 0 must refuse (checkout)';
  raise notice 'ok - Personal: one generation = one credit; Personal and Relationship isolated';

  -- Failed generation gives its credit back
  perform process_us_purchase('t_user', 'us_relationship_premium', 't_txn_rel_4', 'pri_rel', 'USD');
  perform reserve_credit('t_user', 'relationship', null, 'romantic', 'en-US', null, 'aaaaaaaa-0000-0000-0000-000000000008', true);
  perform release_credit('aaaaaaaa-0000-0000-0000-000000000008');
  assert pg_temp.remaining('t_user', 'relationship') = 1, 'failed generation must release its reservation';
  raise notice 'ok - failed generation releases its credit';
end $$;

-- Paddle quantity guard: a held transaction is recorded once, grants nothing.
do $$
begin
  insert into payment_manual_reviews (provider_transaction_id, plan_id, quantity, clerk_user_id, reason, source)
    values ('t_txn_qty2', 'us_relationship_premium', 2, 't_qty', 'quantity_not_one', 'checkout_complete')
    on conflict (provider, provider_transaction_id) do nothing;
  insert into payment_manual_reviews (provider_transaction_id, plan_id, quantity, clerk_user_id, reason, source)
    values ('t_txn_qty2', 'us_relationship_premium', 2, 't_qty', 'quantity_not_one', 'webhook')
    on conflict (provider, provider_transaction_id) do nothing;
  assert (select count(*) from payment_manual_reviews where provider_transaction_id = 't_txn_qty2') = 1,
    'webhook + /complete must produce exactly one review row';
  assert pg_temp.remaining('t_qty', 'relationship') = 0, 'a held transaction grants nothing';
  assert (select count(*) from us_purchase_grants where paddle_transaction_id = 't_txn_qty2') = 0, 'no grant row either';
  raise notice 'ok - quantity-held transaction: one review row, zero credits granted';
end $$;
