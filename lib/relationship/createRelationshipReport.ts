import type { SupabaseClient } from "@supabase/supabase-js";
import { sortReportPair } from "./sortReportPair";
import { invalidateRelationshipMapCache } from "./map/computeRelationshipMap";

/**
 * relationship_reports 행이 없으면 basic 으로 생성.
 * 같은 쌍이 이미 있으면 해당 id 반환.
 */
export async function ensureRelationshipReport(
  supabase: SupabaseClient,
  reportIdA: string,
  reportIdB: string,
): Promise<{ relationshipReportId: string; created: boolean }> {
  const { report_id_a, report_id_b } = sortReportPair(reportIdA, reportIdB);

  const { data: existing } = await supabase
    .from("relationship_reports")
    .select("id")
    .eq("report_id_a", report_id_a)
    .eq("report_id_b", report_id_b)
    .maybeSingle();

  if (existing?.id) {
    return { relationshipReportId: existing.id, created: false };
  }

  const { data: inserted, error } = await supabase
    .from("relationship_reports")
    .insert({
      report_id_a,
      report_id_b,
      analysis_type: "basic",
    })
    .select("id")
    .single();

  if (error) throw error;
  if (!inserted?.id) {
    throw new Error("relationship_reports insert returned no id");
  }

  // A brand-new connection changes both sides' Relationship Map — bust the
  // short-TTL cache for both instead of leaving them to see stale counts.
  invalidateRelationshipMapCache(report_id_a);
  invalidateRelationshipMapCache(report_id_b);

  return { relationshipReportId: inserted.id, created: true };
}
