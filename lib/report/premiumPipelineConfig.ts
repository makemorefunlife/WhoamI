/** 심화(integrated) 파이프라인 — 운영·QA 상수 */
export const SAJU_FETCH_TIMEOUT_MS = 45_000;
export const ASTROLOGY_FETCH_TIMEOUT_MS = 30_000;
export const LLM_FETCH_TIMEOUT_MS = 300_000;

/** integrated 본문 최소 길이 (이하면 too_short) */
export const MIN_INTEGRATED_CHARS = 600;

/** 품질 경고: Part 파싱 기대 최소 개수 */
export const MIN_PART_COUNT_WARNING = 2;

export type PremiumProgressStage =
  | "cache_check"
  | "saju"
  | "astrology"
  | "relationship"
  | "detailed_survey"
  | "integrated"
  | "saving"
  | "done";

export const PREMIUM_PROGRESS_LABELS: Record<PremiumProgressStage, string> = {
  cache_check: "저장된 리포트를 확인하는 중…",
  saju: "사주 데이터를 불러오는 중…",
  astrology: "출생 시점 정보를 정리하는 중…",
  relationship: "관계 맥락을 확인하는 중…",
  detailed_survey: "설문 심화 해석을 준비하는 중…",
  integrated: "Part 0~5 통합 리포트를 작성하는 중… (1~3분)",
  saving: "리포트를 저장하는 중…",
  done: "완료",
};
