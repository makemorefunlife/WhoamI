# RLS JWT Bridge Policies — Future Draft ONLY

> **STATUS:** DRAFT — DO NOT APPLY  
> **Prerequisite:** Clerk JWT → Supabase Auth / `authenticated` role bridge  
> **Source:** Extracted verbatim from `supabase/migrations/20260714120000_reports_rls_fail_closed_draft.sql` (authenticated policy sections)  
> **Extracted:** 2026-07-14  
> **SSOT:** `docs/database/DB_ARCHITECTURE.md` — JWT RLS is explicitly a later step; do not ship these policies until the bridge exists.

## Why this file exists

The fail-closed draft mixed two concerns:

1. Dropping dangerous open anon policies (now a real migration: `20260714150000_drop_open_anon_policies_legacy.sql`)
2. Adding `authenticated` policies that assume `auth.jwt() ->> 'sub'` matches `reports.clerk_user_id`

Concern (2) is preserved here **without rewrite** as design notes for after the Clerk JWT bridge.

## Known obsolescence (do not “fix” here — rewrite in a future PR)

When these policies are eventually redesigned:

- WITH CHECK locks `payment_status` / `plan_type` — Dev SSOT uses `entitlement` instead (`20260714140000_dev_baseline_ssot.sql`).
- Target schema forbids JWT policies **without** a Clerk bridge.

## Preserved SQL (verbatim from draft §3 + comments)

```sql
-- ---------------------------------------------------------------------------
-- 3) Authenticated policies (requires Supabase Auth / Clerk JWT bridge).
-- Until JWT bridge exists, these policies match no session → deny by default.
-- Server service-role paths remain unaffected.
-- ---------------------------------------------------------------------------

-- Own reports only (clerk_user_id stored as text matching JWT sub when bridged)
create policy reports_authenticated_select_own
  on public.reports
  for select
  to authenticated
  using (clerk_user_id is not null and clerk_user_id = auth.jwt() ->> 'sub');

create policy reports_authenticated_update_own_non_entitlement
  on public.reports
  for update
  to authenticated
  using (clerk_user_id is not null and clerk_user_id = auth.jwt() ->> 'sub')
  with check (
    clerk_user_id is not null
    and clerk_user_id = auth.jwt() ->> 'sub'
    -- entitlement / ownership fields must not change via client
    and payment_status is not distinct from (
      select r.payment_status from public.reports r where r.id = reports.id
    )
    and plan_type is not distinct from (
      select r.plan_type from public.reports r where r.id = reports.id
    )
    and clerk_user_id is not distinct from (
      select r.clerk_user_id from public.reports r where r.id = reports.id
    )
  );

-- No authenticated INSERT on reports — create via service-role API only.
-- No anon policies — anonymous clients cannot enumerate or write reports.

-- survey_responses: only for reports owned by JWT subject
create policy survey_responses_authenticated_select_own
  on public.survey_responses
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.reports r
      where r.id = survey_responses.report_id
        and r.clerk_user_id is not null
        and r.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- relationship_* / invites / analyses: no anon/authenticated policies →
-- deny all direct client access; service-role API only.

comment on table public.reports is
  'RLS fail-closed for anon; authenticated own-row only when Clerk JWT bridged; entitlement via service role.';

comment on table public.survey_responses is
  'RLS: authenticated select only for owned reports; writes via service-role API.';
```

## Implementation gate checklist (before promoting to a real migration)

- [ ] Clerk JWT is accepted by Supabase as `authenticated` with `sub` = Clerk `userId`
- [ ] Rewrite WITH CHECK to lock `entitlement` (not `payment_status` / `plan_type`)
- [ ] Confirm browser never needs direct `reports`/`survey_responses` writes
- [ ] Explicit product + security review decision recorded under `docs/dev/decisions/`
