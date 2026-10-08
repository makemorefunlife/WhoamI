-- =============================================================================
-- DEV ONLY -- ahaitsme-dev (alcknxpemdjytwvnschq). Do NOT run on production.
-- For a dev DB that already ran DEV_APPLY_20261009_GUEST_PERSONAL.sql:
-- allows guest access sessions opened by the buyer's own browser right after
-- paying (via = 'purchase'). Re-runnable; keeps all existing rows.
-- =============================================================================
begin;
do $$
begin
  if to_regclass('public.guest_access_sessions') is null then
    raise exception 'STOP: guest_access_sessions missing -- run DEV_APPLY_20261009_GUEST_PERSONAL.sql first';
  end if;
end $$;
alter table public.guest_access_sessions drop constraint if exists guest_access_sessions_via_check;
alter table public.guest_access_sessions
  add constraint guest_access_sessions_via_check check (via in ('link', 'code', 'purchase'));
commit;

select pg_get_constraintdef(oid) as via_check
from pg_constraint
where conname = 'guest_access_sessions_via_check';
