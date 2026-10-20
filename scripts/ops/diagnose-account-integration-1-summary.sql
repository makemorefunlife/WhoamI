-- =============================================================================
-- Account integration -- STEP 1: summary counts (READ ONLY).
--
-- What it answers before any change is made:
--   * how many accounts have more than one "self" report (the A/B case)
--   * how many of those can be grouped without any choice (no conflict)
--   * how many have conflicting birth details or surveys
--   * duplicate relationships, invites / links on reports that would be grouped
--   * credit lots by language scope, outstanding coupons / codes
--   * free relationship results by recorded language
--
-- Output: one table (metric, value). Counts only -- no ids, names, emails or
-- birth data. Nothing is written: the whole script runs inside a READ ONLY
-- transaction and ends with ROLLBACK.
--
-- Run: Supabase dashboard -> SQL Editor -> paste the whole file -> Run.
-- =============================================================================
begin transaction read only;

with self_r as (
  select r.id, r.clerk_user_id, r.created_at,
         nullif(trim(coalesce(r.birth_date::text, '')), '') as bd,
         concat_ws('|', r.birth_date::text, nullif(trim(coalesce(r.birth_time, '')), ''),
                   nullif(trim(coalesce(r.birth_place, '')), '')) as birth_sig
  from public.reports r
  where r.report_type = 'self'
),
latest_survey as (
  select distinct on (s.report_id) s.report_id,
         case when jsonb_typeof(s.answers) = 'string' then (s.answers #>> '{}')::jsonb else s.answers end as a
  from public.survey_responses s
  join self_r on self_r.id = s.report_id
  order by s.report_id, s.created_at desc, s.id desc
),
survey as (
  select report_id,
         (a ->> 'survey_source' = 'v2_10q'
          or jsonb_typeof(a -> 'v2_profile') = 'object'
          or (upper(coalesce(a ->> 'q1', '')) in ('A','B','C','D') and upper(coalesce(a ->> 'q2', '')) in ('A','B','C','D')
              and upper(coalesce(a ->> 'q3', '')) in ('A','B','C','D') and upper(coalesce(a ->> 'q4', '')) in ('A','B','C','D')
              and upper(coalesce(a ->> 'q5', '')) in ('A','B','C','D') and upper(coalesce(a ->> 'q6', '')) in ('A','B','C','D')
              and upper(coalesce(a ->> 'q7', '')) in ('A','B','C','D') and upper(coalesce(a ->> 'q8', '')) in ('A','B','C','D')
              and upper(coalesce(a ->> 'q9', '')) in ('A','B','C','D') and coalesce(a ->> 'q10', '') in ('1','2','3','4','5'))
         ) as complete,
         concat_ws('|', a->>'q1', a->>'q2', a->>'q3', a->>'q4', a->>'q5', a->>'q6', a->>'q7', a->>'q8', a->>'q9', a->>'q10') as survey_sig
  from latest_survey
),
rel_count as (
  select x.rid, count(*) as n
  from (select report_id_a as rid from public.relationship_reports
        union all select report_id_b from public.relationship_reports) x
  group by x.rid
),
scored as (
  select s.*, coalesce(sv.complete, false) as has_survey, sv.survey_sig,
         coalesce(rc.n, 0) as rels,
         row_number() over (
           partition by s.clerk_user_id
           order by coalesce(sv.complete, false) desc, coalesce(rc.n, 0) desc, (s.bd is not null) desc, s.created_at desc
         ) as rank_in_account
  from self_r s
  left join survey sv on sv.report_id = s.id
  left join rel_count rc on rc.rid = s.id
),
multi as (
  select clerk_user_id from scored group by clerk_user_id having count(*) > 1
),
acct as (
  select m.clerk_user_id,
         p.id as primary_id,
         (p.bd is not null) as primary_has_birth,
         p.birth_sig as primary_birth_sig,
         p.has_survey as primary_has_survey,
         p.survey_sig as primary_survey_sig,
         (select count(distinct o.birth_sig) from scored o
            where o.clerk_user_id = m.clerk_user_id and o.rank_in_account > 1 and o.bd is not null) as other_birth_kinds,
         (select count(*) from scored o
            where o.clerk_user_id = m.clerk_user_id and o.rank_in_account > 1 and o.bd is not null
              and p.bd is not null and o.birth_sig <> p.birth_sig) as other_birth_differs,
         (select count(distinct o.survey_sig) from scored o
            where o.clerk_user_id = m.clerk_user_id and o.rank_in_account > 1 and o.has_survey) as other_survey_kinds,
         (select count(*) from scored o
            where o.clerk_user_id = m.clerk_user_id and o.rank_in_account > 1 and o.has_survey
              and p.has_survey and o.survey_sig <> p.survey_sig) as other_survey_differs
  from multi m
  join scored p on p.clerk_user_id = m.clerk_user_id and p.rank_in_account = 1
),
classified as (
  select a.*,
         case
           when not a.primary_has_birth and a.other_birth_kinds = 1 then 'fill'
           when not a.primary_has_birth and a.other_birth_kinds > 1 then 'conflict'
           when a.primary_has_birth and a.other_birth_differs > 0 then 'differs'
           else 'none'
         end as birth_case,
         case
           when not a.primary_has_survey and a.other_survey_kinds = 1 then 'fill'
           when not a.primary_has_survey and a.other_survey_kinds > 1 then 'conflict'
           when a.primary_has_survey and a.other_survey_differs > 0 then 'differs'
           else 'none'
         end as survey_case
  from acct a
),
member_reports as (
  select s.id from scored s join multi m using (clerk_user_id) where s.rank_in_account > 1
),
dup_counterparts as (
  -- the same other person linked to two or more self reports of one account
  select s.clerk_user_id, other_id
  from (
    select rr.report_id_a as self_id, rr.report_id_b as other_id from public.relationship_reports rr
    union all select rr.report_id_b, rr.report_id_a from public.relationship_reports rr
  ) x
  join scored s on s.id = x.self_id
  join multi m on m.clerk_user_id = s.clerk_user_id
  group by s.clerk_user_id, other_id
  having count(distinct x.self_id) > 1
),
dup_manual as (
  -- possibly the same friend added by hand twice (same owner, name, birth date)
  select r.clerk_user_id, lower(trim(coalesce(r.name, ''))) as nm, r.birth_date
  from public.reports r
  join multi m on m.clerk_user_id = r.clerk_user_id
  where r.report_type = 'partner_manual' and r.birth_date is not null
  group by r.clerk_user_id, lower(trim(coalesce(r.name, ''))), r.birth_date
  having count(*) > 1
)
select metric, value from (
  select 10 as o, 'accounts_total (with a self report)' as metric, (select count(distinct clerk_user_id) from self_r)::text as value
  union all select 11, 'accounts_with_multiple_self_reports', (select count(*) from multi)::text
  union all select 12, 'self_reports_in_those_accounts', (select count(*) from scored s join multi m using (clerk_user_id))::text
  union all select 13, 'max_self_reports_in_one_account', (select coalesce(max(c), 0)::text from (select count(*) c from self_r group by clerk_user_id) z)
  union all select 20, 'birth: primary empty, one saved value elsewhere (auto fill)', (select count(*) from classified where birth_case = 'fill')::text
  union all select 21, 'birth: primary empty, different values elsewhere (needs choice)', (select count(*) from classified where birth_case = 'conflict')::text
  union all select 22, 'birth: primary saved, another report differs (kept, optional choice)', (select count(*) from classified where birth_case = 'differs')::text
  union all select 23, 'birth: no action', (select count(*) from classified where birth_case = 'none')::text
  union all select 30, 'survey: primary empty, one complete survey elsewhere (auto fill)', (select count(*) from classified where survey_case = 'fill')::text
  union all select 31, 'survey: primary empty, different surveys elsewhere (needs choice)', (select count(*) from classified where survey_case = 'conflict')::text
  union all select 32, 'survey: primary complete, another differs (kept, optional choice)', (select count(*) from classified where survey_case = 'differs')::text
  union all select 33, 'survey: no action', (select count(*) from classified where survey_case = 'none')::text
  union all select 40, 'accounts groupable with no choice (birth+survey none/fill)',
    (select count(*) from classified where birth_case in ('none','fill') and survey_case in ('none','fill'))::text
  union all select 41, 'relationships on reports that would be grouped (members)',
    (select count(*) from public.relationship_reports rr where rr.report_id_a in (select id from member_reports) or rr.report_id_b in (select id from member_reports))::text
  union all select 42, 'duplicate counterparts (same person on 2+ self reports)', (select count(*) from dup_counterparts)::text
  union all select 43, 'accounts with duplicate counterparts', (select count(distinct clerk_user_id) from dup_counterparts)::text
  union all select 44, 'possible duplicate hand-added friends (same name+birth date)', (select count(*) from dup_manual)::text
  union all select 45, 'relationships between two self reports of the same account',
    (select count(*) from public.relationship_reports rr join self_r a on a.id = rr.report_id_a join self_r b on b.id = rr.report_id_b
      where a.clerk_user_id = b.clerk_user_id)::text
  union all select 46, 'invites sent from member reports', (select count(*) from public.invites i where i.from_report_id in (select id from member_reports))::text
  union all select 47, 'personal connect links on member reports',
    (select case when to_regclass('public.personal_connect_links') is null then 'table missing'
            else (select count(*) from public.personal_connect_links l where l.report_id in (select id from member_reports))::text end)
  union all select 48, 'personal deep reports on member reports',
    (select count(*) from public.report_analyses ra where ra.report_id in (select id from member_reports)
       and ra.analysis_type in ('deep_essence_structured', 'deep_essence_structured_ko', 'deep_essence_structured_en'))::text
  union all select 49, 'relationship deep reports owned by member reports',
    (select case when to_regclass('public.relationship_premium_reports') is null then 'table missing'
            else (select count(*) from public.relationship_premium_reports p where p.owner_report_id in (select id from member_reports))::text end)
  union all select 60, 'credit lots with remaining>0: ko-KR', (select count(*) from public.credit_lots where remaining > 0 and locale = 'ko-KR')::text
  union all select 61, 'credit lots with remaining>0: en-US', (select count(*) from public.credit_lots where remaining > 0 and locale = 'en-US')::text
  union all select 62, 'credit lots with remaining>0: no language (both, kept as is)', (select count(*) from public.credit_lots where remaining > 0 and locale is null)::text
  union all select 63, '  of which source=purchase/membership', (select count(*) from public.credit_lots where remaining > 0 and locale is null and source in ('membership','one_time_purchase','additional_purchase'))::text
  union all select 64, '  of which source=promo', (select count(*) from public.credit_lots where remaining > 0 and locale is null and source = 'promo')::text
  union all select 65, '  of which source=admin', (select count(*) from public.credit_lots where remaining > 0 and locale is null and source = 'admin')::text
  union all select 66, 'gift coupons unredeemed', (select count(*) from public.gift_personal_coupons where status = 'unredeemed')::text
  union all select 67, 'tester codes active', (select count(*) from public.tester_personal_codes where active)::text
  union all select 70, 'free relationship results: recorded ko-KR', (select count(*) from public.relationship_reports where result_basic is not null and result_basic ->> 'locale' = 'ko-KR')::text
  union all select 71, 'free relationship results: recorded en-US', (select count(*) from public.relationship_reports where result_basic is not null and result_basic ->> 'locale' = 'en-US')::text
  union all select 72, 'free relationship results: language not recorded', (select count(*) from public.relationship_reports where result_basic is not null and coalesce(result_basic ->> 'locale', '') not in ('ko-KR','en-US'))::text
) t
order by o;

rollback;
