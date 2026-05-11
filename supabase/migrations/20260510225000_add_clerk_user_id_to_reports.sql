alter table public.reports
add column if not exists clerk_user_id text;

create index if not exists reports_clerk_user_id_created_at_idx
on public.reports (clerk_user_id, created_at desc);
