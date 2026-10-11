-- =============================================================================
-- DEV ONLY, READ-ONLY -- ahaitsme-dev. Run before and after
-- DEV_APPLY_20261011_RELATIONSHIP_OWNERSHIP.sql. Changes nothing. Shows counts
-- and ids only, never report content.
-- =============================================================================

-- 1) Migration applied?
select
  to_regclass('public.relationship_premium_reports') is not null as has_premium_reports,
  exists (select 1 from information_schema.columns where table_schema='public'
           and table_name='relationship_report_shares' and column_name='premium_report_id') as shares_have_report_link,
  to_regprocedure('public.save_relationship_premium_report(uuid,uuid,text,text,text,jsonb,text)') is not null as has_save_fn,
  exists (select 1 from pg_indexes where indexname = 'relationship_premium_generation_locks_owner_key') as lock_per_creator;

-- 2) Legacy deep reports (creator unknown): relationships x kinds that have one
select k.kind, count(*) as legacy_slots
  from relationship_reports rr,
       lateral jsonb_object_keys(coalesce(rr.result_premium_by_kind, '{}'::jsonb)) as k(kind)
 group by 1 order by 1;

-- 3) Creator candidates from generation logs (relationship_analysis_logs is
--    written by analyze/premium with the requesting, ownership-verified
--    viewer report). Only a CANDIDATE: logs are best-effort and a later
--    regeneration by the other participant could have replaced the content.
with legacy as (
  select rr.id as rr_id, k.kind
    from relationship_reports rr,
         lateral jsonb_object_keys(coalesce(rr.result_premium_by_kind, '{}'::jsonb)) as k(kind)
), req as (
  select l.rr_id, l.kind, count(distinct g.viewer_report_id) as requesters
    from legacy l
    left join relationship_analysis_logs g
      on g.relationship_report_id = l.rr_id
     and g.relationship_kind = l.kind
     and g.analysis_level = 'premium'
   group by 1, 2
)
select case requesters when 0 then 'A_no_record' when 1 then 'B_single_requester' else 'C_both_requested' end as class,
       count(*) as slots
  from req group by 1 order by 1;

-- 4) Existing share rows (all are legacy until the migration; after it,
--    new shares carry premium_report_id)
select status,
       (to_jsonb(s) ->> 'premium_report_id') is not null as linked_to_report,
       count(*)
  from relationship_report_shares s
 group by 1, 2 order by 1, 2;
