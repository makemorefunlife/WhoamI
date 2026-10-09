-- Language-scoped credit lots + per-language Personal deep rows, against the
-- REAL SQL functions (20261009120000_personal_locale_reports_and_credit_locale).
-- Run via tests/scripts/run-personal-locale-sql.sh (throwaway local Postgres).
-- Never run against a shared or production database.

create or replace function pg_temp.rem(u text, ty text, loc text) returns integer language sql as $$
  select coalesce(sum(remaining), 0)::integer from credit_lots
   where clerk_user_id = u and credit_type = ty
     and (expires_at is null or expires_at > now())
     and (loc is null or locale is null or locale = loc)
$$;

do $$
declare r record; v_lot uuid; v_old_lot uuid;
begin
  -- 1) New KR purchase lots carry ko-KR (trigger from kr_purchase_grants)
  perform process_kr_purchase('u_kr', 'kr_personal_premium', 'toss:kr_p_1', 'toss:kr_personal_premium', 'KRW', 'toss');
  assert (select locale from credit_lots where clerk_user_id = 'u_kr' and credit_type = 'personal') = 'ko-KR',
    'KR purchase lot must be ko-KR';
  raise notice 'ok - KR purchase lot is tagged ko-KR';

  -- 2) Other language cannot spend it (enforced)
  select * into r from reserve_credit('u_kr', 'personal', null, null, 'en-US', null, 'bbbbbbbb-0000-0000-0000-000000000001', true);
  assert not r.ok, 'ko-KR lot must not be spent on an en-US report';
  assert pg_temp.rem('u_kr', 'personal', null) = 1, 'refused reserve must not touch the lot';
  raise notice 'ok - ko-KR lot refused for en-US (insufficient for that language)';

  -- 3) Same language spends exactly one
  select * into r from reserve_credit('u_kr', 'personal', null, null, 'ko-KR', null, 'bbbbbbbb-0000-0000-0000-000000000002', true);
  assert r.ok, 'ko-KR reserve must succeed';
  perform consume_credit('bbbbbbbb-0000-0000-0000-000000000002');
  assert pg_temp.rem('u_kr', 'personal', null) = 0, 'one generation consumes one';
  select * into r from reserve_credit('u_kr', 'personal', null, null, 'ko-KR', null, 'bbbbbbbb-0000-0000-0000-000000000003', true);
  assert not r.ok, 'balance 0 must refuse';
  raise notice 'ok - ko-KR generation consumes 1, then insufficient balance is refused';

  -- 4) Legacy NULL lot (pre-existing credit) keeps full scope: both languages
  insert into credit_lots (clerk_user_id, credit_type, amount, remaining, source, reference_id, expires_at)
    values ('u_legacy', 'personal', 2, 2, 'admin', null, null) returning id into v_old_lot;
  assert (select locale from credit_lots where id = v_old_lot) is null, 'lot without a purchase grant stays NULL';
  insert into credit_accounts (clerk_user_id, credit_type, balance) values ('u_legacy', 'personal', 2);
  select * into r from reserve_credit('u_legacy', 'personal', null, null, 'en-US', null, 'bbbbbbbb-0000-0000-0000-000000000004', true);
  assert r.ok, 'NULL lot usable for en-US';
  perform consume_credit('bbbbbbbb-0000-0000-0000-000000000004');
  select * into r from reserve_credit('u_legacy', 'personal', null, null, 'ko-KR', null, 'bbbbbbbb-0000-0000-0000-000000000005', true);
  assert r.ok, 'NULL lot usable for ko-KR';
  perform consume_credit('bbbbbbbb-0000-0000-0000-000000000005');
  assert pg_temp.rem('u_legacy', 'personal', null) = 0, 'NULL lot: 2 uses across both languages';
  raise notice 'ok - existing language-less credit keeps its scope (both languages)';

  -- 5) Exact-language lot is preferred over a universal lot with the same expiry
  insert into credit_lots (clerk_user_id, credit_type, amount, remaining, source, reference_id, expires_at)
    values ('u_mix', 'personal', 1, 1, 'admin', null, null);
  perform process_kr_purchase('u_mix', 'kr_personal_premium', 'toss:kr_p_mix', 'toss:kr_personal_premium', 'KRW', 'toss');
  -- KR single now has a 1-year expiry, so it is spent first anyway (soonest expiry rule kept).
  select * into r from reserve_credit('u_mix', 'personal', null, null, 'ko-KR', null, 'bbbbbbbb-0000-0000-0000-000000000006', true);
  select credit_lot_id into v_lot from credit_reservations where generation_request_id = 'bbbbbbbb-0000-0000-0000-000000000006';
  assert (select locale from credit_lots where id = v_lot) = 'ko-KR', 'ko-KR lot (sooner expiry) spent first';
  perform consume_credit('bbbbbbbb-0000-0000-0000-000000000006');
  select * into r from reserve_credit('u_mix', 'personal', null, null, 'en-US', null, 'bbbbbbbb-0000-0000-0000-000000000007', true);
  assert r.ok, 'universal lot still available for en-US';
  perform consume_credit('bbbbbbbb-0000-0000-0000-000000000007');
  raise notice 'ok - soonest-expiry order kept; universal lot remains for the other language';

  -- 6) Failure path: release returns the credit to the same lot, idempotently
  perform process_kr_purchase('u_fail', 'kr_personal_premium', 'toss:kr_p_fail', 'toss:kr_personal_premium', 'KRW', 'toss');
  select * into r from reserve_credit('u_fail', 'personal', null, null, 'ko-KR', null, 'bbbbbbbb-0000-0000-0000-000000000008', true);
  assert r.ok and pg_temp.rem('u_fail', 'personal', null) = 0, 'reserved';
  perform release_credit('bbbbbbbb-0000-0000-0000-000000000008');
  perform release_credit('bbbbbbbb-0000-0000-0000-000000000008');
  assert pg_temp.rem('u_fail', 'personal', null) = 1, 'failed generation returns exactly one credit (release twice = once)';
  raise notice 'ok - generation failure releases the credit once';

  -- 7) Triple: one ko-KR relationship lot of 3, three uses, then refused
  perform process_kr_purchase('u_tri', 'kr_relationship_triple', 'toss:kr_tri', 'toss:kr_relationship_triple', 'KRW', 'toss');
  assert (select locale from credit_lots where clerk_user_id = 'u_tri') = 'ko-KR', 'triple lot is ko-KR';
  select * into r from reserve_credit('u_tri', 'relationship', null, 'friendship', 'en-US', null, 'bbbbbbbb-0000-0000-0000-000000000009', true);
  assert not r.ok, 'KR triple not spendable on en-US';
  perform reserve_credit('u_tri', 'relationship', null, 'friendship', 'ko-KR', null, 'bbbbbbbb-0000-0000-0000-000000000010', true);
  perform consume_credit('bbbbbbbb-0000-0000-0000-000000000010');
  perform reserve_credit('u_tri', 'relationship', null, 'work', 'ko-KR', null, 'bbbbbbbb-0000-0000-0000-000000000011', true);
  perform consume_credit('bbbbbbbb-0000-0000-0000-000000000011');
  perform reserve_credit('u_tri', 'relationship', null, 'family', 'ko-KR', null, 'bbbbbbbb-0000-0000-0000-000000000012', true);
  perform consume_credit('bbbbbbbb-0000-0000-0000-000000000012');
  assert pg_temp.rem('u_tri', 'relationship', null) = 0, 'triple = 3 uses';
  select * into r from reserve_credit('u_tri', 'relationship', null, 'romantic', 'ko-KR', null, 'bbbbbbbb-0000-0000-0000-000000000013', true);
  assert not r.ok, '4th use refused';
  raise notice 'ok - Triple: 3 ko-KR uses then refused; not usable for en-US';

  -- 8) Pass expiry: expired 30-day lots cannot be spent
  perform process_kr_purchase('u_pass', 'kr_insight_pass_30d', 'toss:kr_pass', 'toss:kr_insight_pass_30d', 'KRW', 'toss');
  assert (select count(*) from credit_lots where clerk_user_id = 'u_pass' and locale = 'ko-KR') = 2, 'pass lots tagged ko-KR';
  update credit_lots set expires_at = now() - interval '1 minute' where clerk_user_id = 'u_pass';
  select * into r from reserve_credit('u_pass', 'personal', null, null, 'ko-KR', null, 'bbbbbbbb-0000-0000-0000-000000000014', true);
  assert not r.ok, 'expired pass personal lot refused';
  select * into r from reserve_credit('u_pass', 'relationship', null, 'work', 'ko-KR', null, 'bbbbbbbb-0000-0000-0000-000000000015', true);
  assert not r.ok, 'expired pass relationship lot refused';
  raise notice 'ok - expired pass lots are refused';

  -- 9) Enforcement off: nothing is decremented (beta behavior unchanged)
  perform process_kr_purchase('u_off', 'kr_personal_premium', 'toss:kr_off', 'toss:kr_personal_premium', 'KRW', 'toss');
  select * into r from reserve_credit('u_off', 'personal', null, null, 'en-US', null, 'bbbbbbbb-0000-0000-0000-000000000016', false);
  assert r.ok and pg_temp.rem('u_off', 'personal', null) = 1, 'enforcement off: record only, no decrement';
  raise notice 'ok - CREDIT_ENFORCEMENT off: reserve records only (no real charge)';

  -- 10) US purchase lot is en-US (function exists; US checkout itself stays disabled in the app)
  perform process_us_purchase('u_us', 'us_personal_premium', 'toss:us_p_1', 'toss:us_personal_premium', 'USD');
  assert (select locale from credit_lots where clerk_user_id = 'u_us') = 'en-US', 'US purchase lot is en-US';
  raise notice 'ok - US purchase lot is tagged en-US';
end $$;

-- Per-language Personal deep rows
do $$
declare v_report uuid := gen_random_uuid(); v_legacy uuid := gen_random_uuid();
begin
  insert into reports (id, clerk_user_id, report_type) values (v_report, 'u_r', 'self'), (v_legacy, 'u_r', 'self');
  -- legacy row (unknown language) is never touched
  insert into report_analyses (report_id, analysis_type, content) values (v_legacy, 'deep_essence_structured', '{"slim_v1":{"report":"old"}}');

  perform save_personal_deep_analysis(v_report, 'deep_essence_structured_ko', '{"locale":"ko-KR","v":1}', '{"locale":"ko-KR"}', 'first');
  perform save_personal_deep_analysis(v_report, 'deep_essence_structured_en', '{"locale":"en-US","v":1}', '{"locale":"en-US"}', 'first');
  assert (select count(*) from report_analyses where report_id = v_report) = 2, 'one row per language';
  assert (select count(*) from report_analysis_history where report_id = v_report) = 0, 'no history on first save';

  perform save_personal_deep_analysis(v_report, 'deep_essence_structured_ko', '{"locale":"ko-KR","v":2}', '{"locale":"ko-KR"}', 'user_regenerate');
  assert (select content from report_analyses where report_id = v_report and analysis_type = 'deep_essence_structured_ko') = '{"locale":"ko-KR","v":2}', 'ko replaced';
  assert (select content from report_analyses where report_id = v_report and analysis_type = 'deep_essence_structured_en') = '{"locale":"en-US","v":1}', 'en untouched';
  assert (select content from report_analysis_history where report_id = v_report) = '{"locale":"ko-KR","v":1}', 'previous ko archived';
  assert (select content from report_analyses where report_id = v_legacy) = '{"slim_v1":{"report":"old"}}', 'legacy row preserved';

  begin
    perform save_personal_deep_analysis(v_report, 'deep_essence_structured', 'x', null, 'x');
    raise exception 'legacy type must not be writable';
  exception when raise_exception then
    if sqlerrm not like 'invalid personal deep analysis type%' then raise; end if;
  end;
  raise notice 'ok - per-language rows; regenerate archives the previous copy; legacy row untouched and not writable';
end $$;
