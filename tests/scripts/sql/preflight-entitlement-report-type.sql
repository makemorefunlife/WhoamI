-- Read-only preflight (no DDL)
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'reports'
  and column_name in ('entitlement', 'report_type', 'payment_status', 'plan_type')
order by column_name;

select count(*)::int as reports_row_count from public.reports;

select count(distinct clerk_user_id)::int as distinct_clerk_users
from public.reports
where clerk_user_id is not null and btrim(clerk_user_id) <> '';

-- Legacy paid probe (0 expected for disposable test DB)
select count(*)::int as legacy_paid_rows
from public.reports
where (
  exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'reports'
      and c.column_name = 'payment_status'
  )
  and payment_status = 'paid'
)
or (
  exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'reports'
      and c.column_name = 'plan_type'
  )
  and plan_type = 'paid'
);
