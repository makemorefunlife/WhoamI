-- =============================================================================
-- Account integration -- STEP 2: one account in detail (READ ONLY).
--
-- Replace REPORT_ID (one place, below) with any report id of the account,
-- e.g. 0887be18-af3b-4329-9e06-aeeecee52660 for the A/B account.
--
-- One row per "self" report of that account, in the order the app ranks them
-- (rank 1 = the report that stays the main one). Report ids are shortened to
-- 8 characters; no names, birth values or emails are printed -- only whether
-- each value exists and whether it matches the main report's value.
-- Runs inside a READ ONLY transaction and ends with ROLLBACK.
-- =============================================================================
begin transaction read only;

with target as (
  select clerk_user_id from public.reports where id = 'REPORT_ID'::uuid
),
self_r as (
  select r.* from public.reports r join target t using (clerk_user_id) where r.report_type = 'self'
),
latest_survey as (
  select distinct on (s.report_id) s.report_id, s.created_at,
         case when jsonb_typeof(s.answers) = 'string' then (s.answers #>> '{}')::jsonb else s.answers end as a
  from public.survey_responses s join self_r on self_r.id = s.report_id
  order by s.report_id, s.created_at desc, s.id desc
),
ls_c as (
  select l.*,
    (a ->> 'survey_source' = 'v2_10q' or jsonb_typeof(a -> 'v2_profile') = 'object'
     or (select bool_and(upper(coalesce(a ->> q, '')) in ('A','B','C','D'))
           from unnest(array['q1','q2','q3','q4','q5','q6','q7','q8','q9']) q)
        and coalesce(a ->> 'q10', '') in ('1','2','3','4','5')) as complete
  from latest_survey l
),
rels as (
  select x.rid, count(*) as n from (
    select report_id_a as rid from public.relationship_reports union all select report_id_b from public.relationship_reports
  ) x group by x.rid
),
ranked as (
  select r.id, r.created_at, r.birth_date, r.birth_time, r.birth_place, r.birth_date_correction_used_at,
         ls.a as survey, ls.created_at as survey_at,
         ls.complete as survey_complete,
         coalesce(rl.n, 0) as relationships,
         row_number() over (order by
           ls.complete desc nulls last,
           coalesce(rl.n, 0) desc, (r.birth_date is not null) desc, r.created_at desc) as rank_in_account
  from self_r r
  left join ls_c ls on ls.report_id = r.id
  left join rels rl on rl.rid = r.id
),
p as (select * from ranked where rank_in_account = 1)
select
  k.rank_in_account,
  left(k.id::text, 8) as report,
  to_char(k.created_at, 'YYYY-MM-DD') as created,
  (k.birth_date is not null) as has_birth,
  case when k.rank_in_account = 1 or k.birth_date is null or p.birth_date is null then null
       else (k.birth_date, k.birth_time, k.birth_place) is not distinct from (p.birth_date, p.birth_time, p.birth_place) end
    as birth_same_as_main,
  (k.birth_date_correction_used_at is not null) as correction_used,
  coalesce(k.survey_complete, false) as has_survey,
  to_char(k.survey_at, 'YYYY-MM-DD') as survey_date,
  case when k.rank_in_account = 1 or not coalesce(k.survey_complete, false) or not coalesce(p.survey_complete, false) then null
       else (select string_agg(coalesce(k.survey ->> q, ''), '|') from unnest(array['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10']) q)
          = (select string_agg(coalesce(p.survey ->> q, ''), '|') from unnest(array['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10']) q) end
    as survey_same_as_main,
  k.relationships,
  (select count(*) from public.relationship_reports rr
     where (rr.report_id_a = k.id or rr.report_id_b = k.id) and k.rank_in_account > 1
       and exists (select 1 from public.relationship_reports r2
                   where (r2.report_id_a = p.id and r2.report_id_b = case when rr.report_id_a = k.id then rr.report_id_b else rr.report_id_a end)
                      or (r2.report_id_b = p.id and r2.report_id_a = case when rr.report_id_a = k.id then rr.report_id_b else rr.report_id_a end)))
    as relationships_also_on_main,
  (select count(*) from public.invites i where i.from_report_id = k.id) as invites_sent,
  (select string_agg(ra.analysis_type, ', ' order by ra.analysis_type) from public.report_analyses ra
     where ra.report_id = k.id and ra.analysis_type like 'deep_essence_structured%') as personal_deep_reports
from ranked k cross join p
order by k.rank_in_account;

rollback;
