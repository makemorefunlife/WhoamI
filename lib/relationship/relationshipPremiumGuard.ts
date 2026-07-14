import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { logServerEvent, maskId } from "@/lib/security/safeLog";

export const RELATIONSHIP_PREMIUM_SAVE_FAILED_MESSAGE =
  "분석 결과를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.";

export const RELATIONSHIP_PREMIUM_STREAM_ABORTED_MESSAGE =
  "요청이 중단되었어요.";

export const RELATIONSHIP_PREMIUM_ANALYSIS_FAILED_MESSAGE =
  "관계 심화 분석에 실패했어요. 잠시 후 다시 시도해 주세요.";

type ParticipantGuardMessages = {
  missing?: string;
  forbidden?: string;
};

/** viewer가 관계 리포트 참여자(report_id_a | report_id_b)인지 검증 */
export function assertRelationshipViewerParticipant(
  viewerReportId: unknown,
  reportIdA: string,
  reportIdB: string,
  messages?: ParticipantGuardMessages,
): NextResponse | null {
  const id = typeof viewerReportId === "string" ? viewerReportId.trim() : "";
  if (!id) {
    return NextResponse.json(
      { error: messages?.missing ?? "viewer_report_id가 필요합니다." },
      { status: 400 },
    );
  }
  if (id !== reportIdA && id !== reportIdB) {
    return NextResponse.json(
      { error: messages?.forbidden ?? "권한 없음" },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Viewer report ownership for relationship routes.
 * Guest UUID capability is fail-closed (no signed guest session yet).
 * Does not claim or mutate ownership.
 */
export async function assertViewerReportUpgradeAccess(
  supabase: SupabaseClient,
  viewerReportId: string,
  userId: string | null,
): Promise<NextResponse | null> {
  const access = await assertOwnedReportAccess(
    supabase,
    viewerReportId,
    userId,
  );
  return access.error ?? null;
}

/**
 * 관계 심화 LLM 호출 직전 프리미엄 슬롯 재검증.
 * assertPremiumLlmAccess(개인 리포트 결제)와 동등한 역할 — relationship_reports.analysis_type.
 */
export async function assertRelationshipPremiumLlmAccess(
  supabase: SupabaseClient,
  relationshipReportId: string,
): Promise<NextResponse | null> {
  const id = relationshipReportId.trim();
  if (!id) {
    return NextResponse.json(
      { error: "relationship_report_id가 필요합니다." },
      { status: 400 },
    );
  }

  const { data: row, error } = await supabase
    .from("relationship_reports")
    .select("analysis_type")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    logServerEvent("premium-pipeline", "relationship_llm_payment_guard", {
      relationshipReportId: maskId(id),
      hasPremium: false,
      reason: error ? "db_error" : "not_found",
    });
    return NextResponse.json(
      { error: "관계 분석을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const hasPremium = row.analysis_type === "premium";
  logServerEvent("premium-pipeline", "relationship_llm_payment_guard", {
    relationshipReportId: maskId(id),
    hasPremium,
  });

  if (!hasPremium) {
    return NextResponse.json(
      {
        error: "심화 분석은 결제·업그레이드 후에 실행할 수 있습니다.",
      },
      { status: 403 },
    );
  }

  return null;
}
