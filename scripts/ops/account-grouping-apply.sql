-- =============================================================================
-- Account grouping -- APPLY (production, ONLY after approval).
-- Requires migrations 20261020090000 / 20261020100000 / 20261020110000.
--
-- Run section by section in the Supabase SQL Editor. Section 1 changes
-- nothing; read its output before running section 2. Every change is logged
-- in account_profile_events (no birth values, no survey answers).
--
-- What it does, per account that has more than one "self" report:
--   * the main report = the one the app already treats as main (complete
--     survey first, then most relationships, then saved birth, then newest)
--   * every other self report is marked "grouped into" the main report
--     (nothing moved or deleted; relationships, invites, links, reports and
--     purchases stay where they are)
--   * the main report's EMPTY birth details / survey are filled from the
--     grouped reports ONLY when they all agree (otherwise the person chooses)
--
-- Undo (any time, per account):
--   select * from unfill_main_report('<main report id>'::uuid);
--   select ungroup_account_self_reports('<clerk user id>');
-- =============================================================================

-- 1) DRY RUN -- what would happen (read only) -----------------------------------
begin transaction read only;
with self_r as (
  select r.id, r.clerk_user_id, r.created_at, r.birth_date
  from public.reports r
  where r.report_type = 'self' and r.merged_into_report_id is null
),
ranked as (
  select s.*,
         public.survey_answers_complete((select sr.answers from public.survey_responses sr
                                          where sr.report_id = s.id order by sr.created_at desc, sr.id desc limit 1)) as has_survey,
         (select count(*) from public.relationship_reports rr where rr.report_id_a = s.id or rr.report_id_b = s.id) as rels
  from self_r s
),
mains as (
  select distinct on (clerk_user_id) clerk_user_id, id as main_id
  from ranked
  where clerk_user_id in (select clerk_user_id from ranked group by clerk_user_id having count(*) > 1)
  order by clerk_user_id, has_survey desc, rels desc, (birth_date is not null) desc, created_at desc
)
select left(md5(m.clerk_user_id), 8) as account_hash,
       left(m.main_id::text, 8) as main_report,
       (select count(*) from public.group_account_self_reports(m.clerk_user_id, m.main_id, false)) as reports_to_group
from mains m
order by 1;
rollback;

-- 2) APPLY -- one account at a time (replace both values) -----------------------
-- begin;
-- select * from public.group_account_self_reports('<clerk user id>', '<main report id>'::uuid, true, 'ops');
-- select * from public.fill_main_report_from_grouped('<main report id>'::uuid, true, 'ops');
-- -- check the two results above, then:
-- commit;   -- or: rollback;

-- 3) CHECK -- after applying ------------------------------------------------------
-- select event, actor, count(*) from public.account_profile_events group by 1, 2 order by 1, 2;
