export type PremiumPipelineFailure =
  | "birth_incomplete"
  | "meta_error"
  | "saju_failed"
  | "saju_timeout"
  | "survey_incomplete"
  | "detailed_survey_failed"
  | "integrated_empty"
  | "integrated_too_short"
  | "integrated_llm_failed"
  | "persist_failed"
  | "unknown";

const MESSAGES: Record<PremiumPipelineFailure, string> = {
  birth_incomplete:
    "심화 리포트를 만들려면 생년월일·시간·출생지가 필요해요. 기본 분석 탭에서 ‘심화 분석하기’로 입력해 주세요.",
  meta_error:
    "리포트 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  saju_failed:
    "사주 데이터를 가져오지 못했어요. 출생 정보가 맞는지 확인한 뒤 다시 시도해 주세요.",
  saju_timeout:
    "사주 계산이 오래 걸려 중단됐어요. 네트워크를 확인하고 다시 시도해 주세요.",
  survey_incomplete:
    "18문항 설문을 모두 마치면 심화 리포트 품질이 좋아져요. 설문을 이어한 뒤 다시 시도해 주세요.",
  detailed_survey_failed:
    "설문 심화 해석 단계에서 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
  integrated_empty:
    "통합 리포트가 비어 있어요. 다시 생성해 주세요.",
  integrated_too_short:
    "통합 리포트가 너무 짧게 끝났어요. ‘다시 생성’으로 한 번 더 시도해 주세요.",
  integrated_llm_failed:
    "통합 리포트 작성 중 오류가 났어요. 잠시 후 다시 시도해 주세요.",
  persist_failed:
    "리포트는 화면에 표시됐지만 저장에 실패했어요. 이 기기에서만 보일 수 있어요. ‘다시 생성’을 눌러 저장을 다시 시도해 주세요.",
  unknown:
    "심화 리포트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
};

export function getPremiumFailureMessage(
  failure: PremiumPipelineFailure | null | undefined,
): string {
  if (!failure) return MESSAGES.unknown;
  return MESSAGES[failure] ?? MESSAGES.unknown;
}

/** LLM 오류 문구가 본문으로 저장·표시되지 않도록 */
export function isIntegratedErrorPlaceholder(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return (
    t.startsWith("통합 리포트를 만들지 못했어요") ||
    t.startsWith("통합 리포트를 불러오는 중 문제가 생겼어요")
  );
}
