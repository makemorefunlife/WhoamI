import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 관계가 이미 있는데 relationship_report_id 없는 open 초대는
 * 게스트 테스트 찌꺼기로 간주하고 삭제한다.
 */
export async function cleanupStaleOpenInvites(
  supabase: SupabaseClient,
  viewerReportId: string,
): Promise<number> {
  const rid = viewerReportId.trim();
  if (!rid) return 0;

  const { count: relCount, error: relErr } = await supabase
    .from("relationship_reports")
    .select("id", { count: "exact", head: true })
    .or(`report_id_a.eq.${rid},report_id_b.eq.${rid}`);

  if (relErr || !relCount || relCount < 1) return 0;

  const { data: deleted, error } = await supabase
    .from("invites")
    .delete()
    .eq("from_report_id", rid)
    .eq("status", "open")
    .is("relationship_report_id", null)
    .select("id");

  if (error) {
    console.error("cleanupStaleOpenInvites:", error.message);
    return 0;
  }

  return deleted?.length ?? 0;
}
