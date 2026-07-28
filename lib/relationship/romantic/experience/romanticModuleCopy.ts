/**
 * Romantic Experience V2 — user-facing module copy (ko-KR default).
 * Display layer only; projectors keep English title keys for tests/logs.
 */
import type { SnapshotSignalKind } from "./romanticExperienceTypes";

export const ROMANTIC_V2_MODULE_TITLES = {
  essence: "각자의 결",
  snapshot: "관계 한눈에 보기",
  differenceMap: "우리의 차이 지도",
  flow: "관계가 흘러가는 방식",
  hiddenHeart: "숨은 마음",
  specialDynamics: "이 관계가 특별한 이유",
  conflictTranslation: "갈등 번역",
  repairGuide: "회복 가이드",
  doDont: "평소에 도움이 되는 것 · 피할 것",
  actionAdvice: "각자에게 필요한 실천",
  nextStep: "다음 한 걸음",
  horizon: "관계의 앞길",
  reflection: "남기고 싶은 것",
  saveShare: "기억해 두기",
} as const;

export const SNAPSHOT_SIGNAL_LABELS: Record<SnapshotSignalKind, string> = {
  defining_dynamic: "관계의 중심 리듬",
  stabilizing_resource: "버티게 해 주는 힘",
  meaningful_tension: "의미 있는 긴장",
};

export const DIFFERENCE_BUCKET_LABELS = {
  shared: "비슷한 지점",
  complementary: "보완되는 차이",
  translation_required: "번역이 필요한 마찰",
} as const;
