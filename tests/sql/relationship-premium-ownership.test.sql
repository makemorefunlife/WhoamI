-- Relationship deep ownership + selective share, against the REAL SQL
-- (20261011090000_relationship_premium_ownership + existing share/lock/credit
-- migrations). Run via tests/scripts/run-relationship-ownership-sql.sh.
-- Throwaway local database only.

do $$
declare
  ra uuid := gen_random_uuid(); rb uuid := gen_random_uuid(); rc uuid := gen_random_uuid();
  rr uuid := gen_random_uuid();
  a_id uuid; b_id uuid; a2 uuid; s1 uuid; v_n int; r record;
begin
  insert into reports (id, clerk_user_id) values (ra, 'user_a'), (rb, 'user_b'), (rc, 'user_c');
  insert into relationship_reports (id, report_id_a, report_id_b, analysis_type, result_premium_by_kind)
    values (rr, ra, rb, 'premium', '{"romantic":{"byLocale":{"ko-KR":{"format":"legacy","report":{"x":1}}}}}');
  -- an existing (legacy) share row created before the migration is simulated below

  -- 1) Each creator gets their own row; no overwrite
  a_id := save_relationship_premium_report(rr, ra, 'user_a', 'romantic', 'ko-KR', '{"v":"A1"}', 'first_generation');
  b_id := save_relationship_premium_report(rr, rb, 'user_b', 'romantic', 'ko-KR', '{"v":"B1"}', 'first_generation');
  assert a_id <> b_id, 'separate ids';
  assert (select payload->>'v' from relationship_premium_reports where id = a_id) = 'A1', 'A kept';
  assert (select payload->>'v' from relationship_premium_reports where id = b_id) = 'B1', 'B kept';
  assert (select result_premium_by_kind::text from relationship_reports where id = rr) like '%legacy%', 'legacy row untouched';
  raise notice 'ok - A and B each have their own report (distinct ids), neither overwrites the other or the legacy row';

  -- 2) Regenerate replaces only the creator's own copy and archives it
  a2 := save_relationship_premium_report(rr, ra, 'user_a', 'romantic', 'ko-KR', '{"v":"A2"}', 'user_regenerate');
  assert a2 = a_id, 'same id on regenerate';
  assert (select payload->>'v' from relationship_premium_reports where id = a_id) = 'A2', 'A replaced';
  assert (select payload->>'v' from relationship_premium_reports where id = b_id) = 'B1', 'B untouched';
  assert (select count(*) from relationship_premium_report_history where premium_report_id = a_id and payload->>'v' = 'A1') = 1, 'A1 archived';
  raise notice 'ok - regenerate replaces only the creator''s copy; previous copy archived';

  -- 3) Other language = separate report
  perform save_relationship_premium_report(rr, ra, 'user_a', 'romantic', 'en-US', '{"v":"A-en"}', 'first_generation');
  assert (select count(*) from relationship_premium_reports where owner_report_id = ra) = 2, 'ko + en';
  raise notice 'ok - another language is a separate report';

  -- 4) Wrong owner / non-participant refused
  begin
    perform save_relationship_premium_report(rr, ra, 'user_b', 'work', 'ko-KR', '{}', 'first_generation');
    raise exception 'must fail';
  exception when raise_exception then
    if sqlerrm <> 'owner report not owned by caller' then raise; end if;
  end;
  begin
    perform save_relationship_premium_report(rr, rc, 'user_c', 'work', 'ko-KR', '{}', 'first_generation');
    raise exception 'must fail';
  exception when raise_exception then
    if sqlerrm <> 'owner report is not a participant' then raise; end if;
  end;
  raise notice 'ok - saving as another user or as a non-participant is refused';

  -- 5) Shares: both may share their own report of the same kind; one active per report
  insert into relationship_report_shares (relationship_report_id, kind, owner_report_id, recipient_report_id, share_token, status, premium_report_id)
    values (rr, 'romantic', ra, rb, 'tok_a', 'active', a_id) returning id into s1;
  insert into relationship_report_shares (relationship_report_id, kind, owner_report_id, recipient_report_id, share_token, status, premium_report_id)
    values (rr, 'romantic', rb, ra, 'tok_b', 'active', b_id);
  begin
    insert into relationship_report_shares (relationship_report_id, kind, owner_report_id, recipient_report_id, share_token, status, premium_report_id)
      values (rr, 'romantic', ra, rb, 'tok_a2', 'active', a_id);
    raise exception 'dup active must fail';
  exception when unique_violation then null;
  end;
  update relationship_report_shares set status = 'revoked', revoked_at = now() where id = s1;
  insert into relationship_report_shares (relationship_report_id, kind, owner_report_id, recipient_report_id, share_token, status, premium_report_id)
    values (rr, 'romantic', ra, rb, 'tok_a3', 'active', a_id);
  assert (select count(*) from relationship_report_shares where premium_report_id = a_id) = 2, 'history kept + new active';
  raise notice 'ok - each creator shares their own report; one active share per report; revoke keeps history; re-share works';

  -- 6) Generation lock: A and B do not block each other; same creator twice does
  insert into relationship_premium_generation_locks (relationship_report_id, kind, locale, requested_by_report_id)
    values (rr, 'work', 'ko-KR', ra), (rr, 'work', 'ko-KR', rb);
  begin
    insert into relationship_premium_generation_locks (relationship_report_id, kind, locale, requested_by_report_id)
      values (rr, 'work', 'ko-KR', ra);
    raise exception 'dup lock must fail';
  exception when unique_violation then null;
  end;
  raise notice 'ok - lock is per creator: A and B generate in parallel; a double click by A is blocked';

  -- 7) Credits: A and B each pay once from their own lots; A's retry is not charged twice
  perform process_kr_purchase('user_a', 'kr_relationship_premium', 'toss:rel_a', 'toss:kr_relationship_premium', 'KRW', 'toss');
  perform process_kr_purchase('user_b', 'kr_relationship_premium', 'toss:rel_b', 'toss:kr_relationship_premium', 'KRW', 'toss');
  select * into r from reserve_credit('user_a', 'relationship', rr, 'work', 'ko-KR', null, 'dddddddd-0000-0000-0000-000000000001', true);
  assert r.ok, 'A reserve';
  perform consume_credit('dddddddd-0000-0000-0000-000000000001');
  perform consume_credit('dddddddd-0000-0000-0000-000000000001');
  select * into r from reserve_credit('user_b', 'relationship', rr, 'work', 'ko-KR', null, 'dddddddd-0000-0000-0000-000000000002', true);
  assert r.ok, 'B reserve (own lot)';
  perform consume_credit('dddddddd-0000-0000-0000-000000000002');
  select coalesce(sum(remaining),0) into v_n from credit_lots where clerk_user_id in ('user_a','user_b') and credit_type = 'relationship';
  assert v_n = 0, 'one credit each';
  select * into r from reserve_credit('user_a', 'relationship', rr, 'work', 'ko-KR', null, 'dddddddd-0000-0000-0000-000000000003', true);
  assert not r.ok, 'A has nothing left';
  raise notice 'ok - A and B each use exactly one of their own credits; nothing is charged twice';
end $$;
