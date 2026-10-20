-- =============================================================================
-- UNDO of migration 3 (free relationship result per language) on PRODUCTION.
-- Removes the 2 new tables and the function ONLY while they are still empty:
-- if any result in another language was already created, it stops with an
-- error and changes nothing (those results would otherwise be lost).
-- relationship_reports.result_basic is never touched. One transaction.
-- =============================================================================
begin;
set local lock_timeout = '5s';

do $$
declare
  v_has boolean;
begin
  -- dynamic SQL so this also runs (as a no-op) when the tables are already gone
  if to_regclass('public.relationship_basic_results') is not null then
    execute 'select exists (select 1 from public.relationship_basic_results)' into v_has;
    if v_has then
      raise exception 'relationship_basic_results has rows -- not undoing (would lose created results)';
    end if;
  end if;
  if to_regclass('public.relationship_basic_result_history') is not null then
    execute 'select exists (select 1 from public.relationship_basic_result_history)' into v_has;
    if v_has then
      raise exception 'relationship_basic_result_history has rows -- not undoing';
    end if;
  end if;
end $$;

drop function if exists public.save_relationship_basic_result(uuid, text, jsonb, text);
drop table if exists public.relationship_basic_result_history;
drop table if exists public.relationship_basic_results;

commit;
