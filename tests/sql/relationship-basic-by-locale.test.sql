-- DEV ONLY (local PostgreSQL with migrations applied): free relationship result per language.
-- Ends with ROLLBACK.
begin;
do $$
declare v_a uuid := gen_random_uuid(); v_b uuid := gen_random_uuid(); v_rr uuid;
begin
  insert into reports (id, clerk_user_id, report_type) values (v_a, 'u_a', 'self'), (v_b, 'u_b', 'self');
  insert into relationship_reports (report_id_a, report_id_b, result_basic)
    values (v_a, v_b, '{"locale":"ko-KR","perspectives":{"x":1}}') returning id into v_rr;

  perform save_relationship_basic_result(v_rr, 'en-US', '{"locale":"en-US","perspectives":{"y":1}}', 'created_in_locale');
  assert (select result ->> 'locale' from relationship_basic_results where relationship_report_id = v_rr and locale = 'en-US') = 'en-US', 'en-US row saved';
  assert (select result_basic ->> 'locale' from relationship_reports where id = v_rr) = 'ko-KR', 'original untouched';
  raise notice 'ok - a result in another language is stored separately; the original is untouched';

  perform save_relationship_basic_result(v_rr, 'en-US', '{"locale":"en-US","perspectives":{"y":2}}', 'regenerated');
  assert (select count(*) from relationship_basic_results where relationship_report_id = v_rr) = 1, 'one row per language';
  assert (select count(*) from relationship_basic_result_history where relationship_report_id = v_rr) = 1, 'previous copy archived';
  raise notice 'ok - replacing a language row archives the previous copy first';

  begin
    perform save_relationship_basic_result(v_rr, 'ja-JP', '{}', 'x');
    raise exception 'unknown locale accepted';
  exception when others then
    if sqlerrm = 'unknown locale accepted' then raise; end if;
  end;
  raise notice 'ok - only ko-KR / en-US';
end $$;
rollback;
