import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * DEPRECATED (2026-10-11) -- intentionally does nothing.
 *
 * It used to empty relationship_reports.result_premium_by_kind for every
 * relationship of a person whose birth/survey changed. That deleted paid
 * reports (also the other person's view) and contradicts the rule
 * "정보가 바뀌어도 이전 보고서는 보존". Reports are now kept as made and the
 * screen says they reflect the info at generation time (input snapshot,
 * lib/report/inputSnapshot.ts). A new report is made only by an explicit
 * generate / regenerate.
 */
export async function invalidateRelationshipPremiumsForReport(
  _supabase: SupabaseClient,
  _reportId: string,
): Promise<number> {
  return 0;
}
