/** 심화(integrated) 파이프라인 단계별 진단 로그 — dev / NEXT_PUBLIC_DEBUG_FIRST_ENTRY=1 */
export type PremiumPipelineStage =
  | "start"
  | "meta_fetch"
  | "meta_cache_hit"
  | "birth_incomplete"
  | "saju_request"
  | "saju_ok"
  | "saju_fail"
  | "astrology_request"
  | "astrology_ok"
  | "astrology_skip"
  | "relationship_ok"
  | "relationship_empty"
  | "detailed_survey_reuse"
  | "detailed_survey_llm"
  | "detailed_survey_ok"
  | "detailed_survey_fail"
  | "integrated_llm_start"
  | "integrated_llm_ok"
  | "integrated_llm_fail"
  | "integrated_persist"
  | "integrated_persist_fail"
  | "abort_saju";

export type PremiumPipelineStageDetail = Record<string, string | number | boolean | null>;

function diagnosticsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEBUG_FIRST_ENTRY === "1"
  );
}

export function logPremiumPipelineStage(
  reportId: string,
  stage: PremiumPipelineStage,
  detail?: PremiumPipelineStageDetail,
): void {
  if (!diagnosticsEnabled()) return;
  const id = reportId.trim() || "unknown";
  const payload = detail && Object.keys(detail).length > 0 ? detail : undefined;
  if (payload) {
    console.info(`[premium-pipeline] reportId=${id} stage=${stage}`, payload);
  } else {
    console.info(`[premium-pipeline] reportId=${id} stage=${stage}`);
  }
}
