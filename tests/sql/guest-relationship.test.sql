-- Guest single Relationship SQL (20261011140000). Throwaway DB only.
do $$
declare
  o text := 'aha_' || md5('o1'); old text := 'aha_' || md5('old'); req uuid := gen_random_uuid(); req2 uuid := gen_random_uuid();
  me uuid := gen_random_uuid(); you uuid := gen_random_uuid(); rr uuid; r record; acct uuid := gen_random_uuid();
  pr uuid; pr3 uuid; o3 text := 'aha_' || md5('o3'); me3 uuid := gen_random_uuid(); you3 uuid := gen_random_uuid(); rr3 uuid;
  o2 text := 'aha_' || md5('o2'); me2 uuid := gen_random_uuid(); you2 uuid := gen_random_uuid(); rr2 uuid;
begin
  insert into toss_payment_orders(order_id, plan_id, status, guest_email, approved_at, locale, guest_use_enabled)
    values (o, 'kr_relationship_premium', 'paid', 'buyer@x.com', now() - interval '1 day', 'ko-KR', true);
  -- an order bought before the change (no flag) keeps the account flow
  insert into toss_payment_orders(order_id, plan_id, status, guest_email, approved_at, locale)
    values (old, 'kr_relationship_premium', 'paid', 'buyer@x.com', now() - interval '1 day', 'ko-KR');
  assert prepare_guest_relationship_input(old, 'ko-KR') = 'not_eligible', 'old order not guest-usable';
  assert reserve_guest_relationship_use(old, req) = 'not_eligible', 'old order cannot be used as guest';
  raise notice 'ok - only orders flagged at creation are used without an account (older orders unchanged)';

  assert prepare_guest_relationship_input(o, 'ko-KR') = 'ok', 'prepare';
  assert (select expires_at from guest_relationship_orders where order_id = o)
       = (select approved_at + interval '12 months' from toss_payment_orders where order_id = o), 'purchase + 12 months';
  assert reserve_guest_relationship_use(o, req) = 'no_input', 'no input yet';
  insert into reports(id, clerk_user_id, report_type, name, birth_date) values
    (me, 'guest_order:' || o, 'guest_purchase', 'Me', '1990-01-01'),
    (you, 'guest_order:' || o, 'guest_purchase', 'You', '1991-02-02');
  insert into relationship_reports(report_id_a, report_id_b) values (least(me, you), greatest(me, you)) returning id into rr;
  update guest_relationship_orders set self_report_id = me, partner_report_id = you, relationship_report_id = rr, kind = 'romantic' where order_id = o;
  assert reserve_guest_relationship_use(o, req) = 'no_input', 'consent required';
  update guest_relationship_orders set partner_consent = '{"third_party_info":true}' where order_id = o;
  raise notice 'ok - generation needs both people, the relationship and the consent';

  assert reserve_guest_relationship_use(o, req) = 'reserved', 'reserved';
  assert reserve_guest_relationship_use(o, req2) = 'in_progress', 'second request waits';
  assert prepare_guest_relationship_input(o, 'ko-KR') = 'locked', 'input locked while generating';
  perform release_guest_relationship_use(o, req2);
  assert (select guest_use_status from toss_payment_orders where order_id = o) = 'reserved', 'other request cannot release';
  perform release_guest_relationship_use(o, req);
  assert (select guest_use_status from toss_payment_orders where order_id = o) is null, 'released';
  assert reserve_guest_relationship_use(o, req2) = 'reserved', 'retry after failure';
  assert complete_guest_relationship_use(o, req) = false, 'only the holder completes';
  -- report saved by the per-creator function (owner = the order key)
  pr := save_relationship_premium_report(rr, me, 'guest_order:' || o, 'romantic', 'ko-KR', '{"format":"x"}', 'first_generation');
  assert complete_guest_relationship_use(o, req2) = true, 'used';
  assert reserve_guest_relationship_use(o, gen_random_uuid()) = 'already_used', 'one use only';
  assert prepare_guest_relationship_input(o, 'ko-KR') = 'locked', 'no edits after generation';
  assert (select generated_at from guest_relationship_orders where order_id = o) is not null, 'generated_at';
  raise notice 'ok - one use: reserve -> save -> used; failures release; no second use, no edits after';

  -- an account claim of a guest-used order is refused by the existing claim function (not in this stub DB);
  -- save to account: email must match a verified email
  select * into r from save_guest_relationship_to_account(o, 'user_x', array['other@x.com']);
  assert r.result = 'email_mismatch', 'email mismatch';
  -- account with an existing profile: keep it, re-point the relationship, drop the temporary me
  insert into reports(id, clerk_user_id, report_type, name, birth_date) values (acct, 'user_x', 'self', 'Account', '1980-05-05');
  select * into r from save_guest_relationship_to_account(o, 'user_x', array['Buyer@X.com']);
  assert r.result = 'saved' and r.report_id = acct and r.relationship_report_id = rr, 'saved';
  assert (select birth_date from reports where id = acct) = '1980-05-05', 'existing profile unchanged';
  assert not exists (select 1 from reports where id = me), 'temporary me removed';
  assert (select report_type || ':' || clerk_user_id from reports where id = you) = 'partner_manual:user_x', 'partner is a manual person';
  assert (select owner_report_id from relationship_premium_reports where id = pr) = acct, 'report moved';
  assert (select owner_clerk_user_id from relationship_premium_reports where id = pr) = 'user_x', 'report owner';
  assert exists (select 1 from relationship_reports where id = rr and acct in (report_id_a, report_id_b) and you in (report_id_a, report_id_b)), 'pair re-pointed';
  assert exists (select 1 from relationship_map_memberships where relationship_report_id = rr and viewer_report_id = acct and status = 'accepted'), 'on my map';
  assert (select status || ':' || clerk_user_id from toss_payment_orders where order_id = o) = 'granted:user_x', 'order granted';
  select * into r from save_guest_relationship_to_account(o, 'user_x', array['buyer@x.com']);
  assert r.result = 'already_saved', 'idempotent';
  select * into r from save_guest_relationship_to_account(o, 'user_y', array['buyer@x.com']);
  assert r.result = 'claimed_by_other', 'other account refused';
  raise notice 'ok - saved to the verified-email account without regeneration; existing profile kept';

  -- account WITHOUT a profile: the guest "me" becomes the profile
  insert into toss_payment_orders(order_id, plan_id, status, guest_email, approved_at, locale, guest_use_enabled, guest_use_status)
    values (o3, 'kr_relationship_premium', 'paid', 'b3@x.com', now() - interval '2 days', 'ko-KR', true, 'used');
  insert into reports(id, clerk_user_id, report_type, birth_date) values
    (me3, 'guest_order:' || o3, 'guest_purchase', '1992-01-01'), (you3, 'guest_order:' || o3, 'guest_purchase', '1993-01-01');
  insert into relationship_reports(report_id_a, report_id_b) values (least(me3, you3), greatest(me3, you3)) returning id into rr3;
  insert into guest_relationship_orders(order_id, locale, expires_at, self_report_id, partner_report_id, relationship_report_id, kind, partner_consent, generated_at)
    values (o3, 'ko-KR', now() + interval '11 months', me3, you3, rr3, 'friendship', '{"x":1}', now());
  pr3 := save_relationship_premium_report(rr3, me3, 'guest_order:' || o3, 'friendship', 'ko-KR', '{"format":"y"}', 'first_generation');
  select * into r from save_guest_relationship_to_account(o3, 'user_new', array['b3@x.com']);
  assert r.result = 'saved' and r.report_id = me3, 'adopted';
  assert (select report_type || ':' || clerk_user_id from reports where id = me3) = 'self:user_new', 'guest me is now the profile';
  assert (select owner_clerk_user_id from relationship_premium_reports where id = pr3) = 'user_new', 'report owner moved';
  raise notice 'ok - account without a profile: the guest info becomes the profile';

  -- retention: expired / refunded orders are purged, saved orders untouched
  insert into toss_payment_orders(order_id, plan_id, status, guest_email, approved_at, locale, guest_use_enabled)
    values (o2, 'kr_relationship_premium', 'paid', 'b2@x.com', now() - interval '13 months', 'ko-KR', true);
  assert prepare_guest_relationship_input(o2, 'ko-KR') = 'expired', 'expired order cannot take input';
  insert into guest_relationship_orders(order_id, locale, expires_at) values (o2, 'ko-KR', now() - interval '1 month');
  insert into reports(id, clerk_user_id, report_type, birth_date) values
    (me2, 'guest_order:' || o2, 'guest_purchase', '1990-01-01'), (you2, 'guest_order:' || o2, 'guest_purchase', '1991-01-01');
  insert into relationship_reports(report_id_a, report_id_b) values (least(me2, you2), greatest(me2, you2)) returning id into rr2;
  update guest_relationship_orders set self_report_id = me2, partner_report_id = you2, relationship_report_id = rr2,
    partner_consent = '{"x":1}' where order_id = o2;
  assert purge_guest_relationship_data() = 1, 'one purged';
  assert not exists (select 1 from reports where id in (me2, you2)), 'guest people deleted';
  assert not exists (select 1 from relationship_reports where id = rr2), 'relationship deleted';
  assert (select partner_consent is null and purged_at is not null from guest_relationship_orders where order_id = o2), 'row cleared';
  assert exists (select 1 from reports where id = you), 'saved order untouched';
  assert purge_guest_relationship_data() = 0, 'idempotent purge';
  raise notice 'ok - purchase + 12 months: guest data removed; saved-to-account data untouched';
end $$;
