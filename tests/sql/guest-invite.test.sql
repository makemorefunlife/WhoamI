-- Guest invite participation SQL (20261011130000). Throwaway DB only.
do $$
declare inv uuid; inv2 uuid; r record; g uuid := gen_random_uuid(); g2 uuid := gen_random_uuid();
  inviter uuid := gen_random_uuid(); rr uuid; rr2 uuid; pid uuid := gen_random_uuid(); pid2 uuid := gen_random_uuid();
begin
  insert into reports(id, clerk_user_id, report_type) values (inviter, 'user_inviter', 'self');
  insert into invites(id, from_report_id, invite_token, status) values (gen_random_uuid(), inviter, 'tok1', 'open') returning id into inv;
  insert into invites(id, from_report_id, invite_token, status, created_at) values (gen_random_uuid(), inviter, 'tok_old', 'open', now() - interval '31 days');

  -- claim once
  select * into r from claim_invite_for_guest('tok1');
  assert r.invite_id = inv, 'claimed';
  select * into r from claim_invite_for_guest('tok1');
  assert r.invite_id is null, 'second claim gets nothing';
  select * into r from claim_invite_for_guest('tok_old');
  assert r.invite_id is null, 'expired invite cannot be claimed';
  raise notice 'ok - an open invite is claimed once; used/expired invites are refused';

  -- release only when no participant exists
  perform release_guest_invite_claim(inv);
  assert (select status from invites where id = inv) = 'open', 'released';
  perform claim_invite_for_guest('tok1');
  insert into reports(id, clerk_user_id, report_type, name, birth_date) values (g, 'guest_invite:'||pid, 'guest_invitee', 'G', '1995-05-05');
  insert into relationship_reports(id, report_id_a, report_id_b) values (gen_random_uuid(), inviter, g) returning id into rr;
  insert into guest_invite_participants(id, invite_id, report_id, relationship_report_id, inviter_report_id, locale, consent, expires_at)
    values (pid, inv, g, rr, inviter, 'ko-KR', '{"privacy":true}', now() + interval '30 days');
  perform release_guest_invite_claim(inv);
  assert (select status from invites where id = inv) = 'guest_joined', 'not released once a participant exists';
  raise notice 'ok - a claim is undone only if the join did not finish';

  -- purge after 30 days, no paid report -> guest profile + relationship deleted
  insert into survey_responses(report_id, answers) values (g, '{}');
  update guest_invite_participants set expires_at = now() - interval '1 minute', email = 'a@b.c' where id = pid;
  assert purge_guest_invite_data() = 1, 'one purged';
  assert not exists (select 1 from reports where id = g), 'guest profile removed';
  assert (select status from guest_invite_participants where id = pid) = 'expired', 'marked expired';
  assert (select email from guest_invite_participants where id = pid) is null, 'email removed';
  raise notice 'ok - after 30 days the guest data is removed (no paid report)';

  -- purge with a paid report on the relationship -> keep row, blank the inputs
  insert into invites(id, from_report_id, invite_token, status) values (gen_random_uuid(), inviter, 'tok2', 'guest_joined') returning id into inv2;
  insert into reports(id, clerk_user_id, report_type, name, birth_date) values (g2, 'guest_invite:'||pid2, 'guest_invitee', 'G2', '1990-01-01');
  insert into relationship_reports(id, report_id_a, report_id_b) values (gen_random_uuid(), inviter, g2) returning id into rr2;
  insert into relationship_premium_reports(relationship_report_id, owner_report_id, owner_clerk_user_id, kind, locale, payload)
    values (rr2, inviter, 'user_inviter', 'friendship', 'ko-KR', '{"x":1}');
  insert into guest_invite_participants(id, invite_id, report_id, relationship_report_id, inviter_report_id, locale, consent, expires_at)
    values (pid2, inv2, g2, rr2, inviter, 'ko-KR', '{"privacy":true}', now() - interval '1 minute');
  perform purge_guest_invite_data();
  assert exists (select 1 from reports where id = g2), 'kept because the inviter has a paid report';
  assert (select birth_date from reports where id = g2) is null and (select name from reports where id = g2) is null, 'inputs blanked';
  assert exists (select 1 from relationship_premium_reports where relationship_report_id = rr2), 'paid report kept';
  raise notice 'ok - a paid report on the relationship is never deleted; the guest inputs are still removed';

  -- constraints
  begin
    insert into reports(clerk_user_id, report_type) values ('x', 'other_type');
    raise exception 'must fail';
  exception when check_violation then null;
  end;
  raise notice 'ok - report_type / invite status constraints extended only by the new values';
end $$;
