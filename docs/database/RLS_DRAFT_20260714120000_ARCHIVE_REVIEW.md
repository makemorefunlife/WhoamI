# Archive review — `20260714120000_reports_rls_fail_closed_draft.sql`

> **Reviewed:** 2026-07-14  
> **Original:** `supabase/migrations/20260714120000_reports_rls_fail_closed_draft.sql` (still present; not deleted in this split)  
> **Split outputs:**
> - Legacy migration: `supabase/migrations/20260714150000_drop_open_anon_policies_legacy.sql`
> - JWT future draft: `docs/database/RLS_JWT_BRIDGE_POLICIES_DRAFT.md`

## Statement classification

| # | Original draft content | Classification | Disposition |
|---|------------------------|----------------|-------------|
| 1 | Header: DRAFT ONLY / goals / Clerk JWT not wired / service-role / guest fail-closed | Safe to delete (as migration) | Intent preserved in this review + JWT draft notes / DEV setup docs |
| 2 | `drop policy if exists reports_anon_select` | Kept → **legacy migration** | `20260714150000_…sql` |
| 3 | `drop policy if exists reports_anon_insert` | Kept → **legacy migration** | same |
| 4 | `drop policy if exists survey_responses_anon_select` | Kept → **legacy migration** | same |
| 5 | `alter table … reports enable row level security` | Already implemented | `20260519120000`, Dev baseline `20260714140000` — **omit** |
| 6 | `… survey_responses enable row level security` | Already implemented | same — **omit** |
| 7 | `… relationship_reports enable row level security` | Already implemented | same — **omit** |
| 8 | `… relationship_analysis_logs enable row level security` | Already implemented | `20260713180000`, baseline — **omit** |
| 9 | `… relationship_favorites enable row level security` | Already implemented | same — **omit** |
| 10 | `… invites enable row level security` | Already implemented | `20260519120000`, baseline — **omit** |
| 11 | `… report_analyses enable row level security` | Already implemented | `20260516130000` / `20260519120000`, baseline — **omit** |
| 12 | `… saju_charts enable row level security` | No longer applicable (SSOT Dev) | Table not in baseline; no app `.from` — **omit** |
| 13 | `… report_results enable row level security` | No longer applicable (SSOT Dev) | same — **omit** |
| 14 | `create policy reports_authenticated_select_own` | Kept in **future JWT draft** | `docs/database/RLS_JWT_BRIDGE_POLICIES_DRAFT.md` (verbatim) |
| 15 | `create policy reports_authenticated_update_own_non_entitlement` (`payment_status`/`plan_type` locks) | Kept in **future JWT draft** | same (verbatim; redesign later for `entitlement`) |
| 16 | Comments: no authenticated INSERT / no anon policies | Kept in **future JWT draft** | same |
| 17 | `create policy survey_responses_authenticated_select_own` | Kept in **future JWT draft** | same |
| 18 | Note: relationship_*/invites/analyses deny without policies | Already implemented (design) | Baseline + `20260519` service-role-only tables — **omit** as SQL |
| 19 | `comment on` reports / survey_responses (JWT-oriented) | Kept in **future JWT draft** | preserved with JWT SQL block |
| 20 | `comment on` relationship_analysis_logs / favorites | Already implemented | `20260713180000` — **omit** |

## Useful content checklist (before deleting original)

| Useful content | Migrated / intentional discard? |
|----------------|----------------------------------|
| Drop 3 open policies | Yes → `20260714150000_drop_open_anon_policies_legacy.sql` |
| JWT authenticated policies + related comments | Yes → `RLS_JWT_BRIDGE_POLICIES_DRAFT.md` (no rewrite) |
| RLS ENABLE idempotent lines | Discard as SQL — already elsewhere |
| saju_charts / report_results ENABLE | Discard — no longer SSOT |
| Full-file DRAFT banner narrative | Discard as migration — intent in docs |

## Can the original draft file be safely deleted?

**Yes — after you confirm this split is accepted.**

Every useful statement is either:

- in the legacy DROP migration, or  
- preserved verbatim in the JWT future draft, or  
- intentionally discarded as already implemented / no longer applicable (this table).

Recommended delete path (human, after review):

```text
git rm supabase/migrations/20260714120000_reports_rls_fail_closed_draft.sql
```

Do **not** delete until reviewers acknowledge JWT draft + legacy migration are in place. This archival review documents the mapping so deletion does not lose intent.
