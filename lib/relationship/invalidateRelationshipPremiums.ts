import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";

/**
 * 출생 정보 변경 시 — 해당 reportId가 참여한 관계 심화 캐시 무효화.
 * (옛 사주·provenance로 생성된 premium JSON 재사용 방지)
 */
export async function invalidateRelationshipPremiumsForReport(
  supabase: SupabaseClient,
  reportId: string,
): Promise<number> {
  const rid = reportId.trim();
  if (!rid) return 0;

  const { data, error } = await supabase
    .from("relationship_reports")
    .select("id")
    .or(`report_id_a.eq.${rid},report_id_b.eq.${rid}`);

  if (error) {
    logServerError("invalidateRelPremiums", error, "db_select_failed");
    return 0;
  }

  const ids = (data ?? []).map((r) => r.id).filter(Boolean);
  if (ids.length === 0) return 0;

  const { error: upErr } = await supabase
    .from("relationship_reports")
    .update({
      result_premium: null,
      result_premium_by_kind: null,
    })
    .in("id", ids);

  if (upErr) {
    logServerError("invalidateRelPremiums", upErr, "db_update_failed");
    return 0;
  }

  return ids.length;
}
