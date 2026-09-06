-- =============================================================================
-- Optimistic-concurrency version counter for
-- relationship_reports.result_premium_by_kind.
--
-- mergeRelationshipPremiumByKind's locale-aware path was a plain
-- fetch -> merge-in-JS -> blind UPDATE with no compare-and-swap: two
-- concurrent generations for different kinds/locales on the SAME
-- relationship_reports row could race, with the second write silently
-- discarding whatever the first had just persisted (a real lost-update,
-- not theoretical — the two writes only conflict on this one shared JSONB
-- column, so no per-kind/per-locale lock alone prevents it).
--
-- premium_merge_version turns that write into a CAS: every UPDATE now also
-- checks `where premium_merge_version = :expected` and bumps it by one; a
-- 0-row result means someone else wrote first, and the caller re-fetches
-- and retries. See mergeRelationshipPremiumByKind for the retry loop.
--
-- Additive only — default 0, no backfill needed, no other column/table
-- affected, safe to roll back with a plain DROP COLUMN if ever needed.
-- =============================================================================

alter table public.relationship_reports
  add column if not exists premium_merge_version integer not null default 0;
