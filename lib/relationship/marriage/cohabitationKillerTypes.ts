import type { SecondaryAxisKey } from "@/lib/v2/survey/types";

/** 동거·부부 프리미엄 킬러 질문 주제 (1안 SSOT) */
export type CohabitationKillerTopic =
  | "economic_dominance"
  | "bedroom_risk"
  | "inlaw_boundary"
  | "conflict_trigger"
  | "sleep_fit";

export type KillerEvidenceSource = "saju" | "psych" | "cross";

/** saju 규칙 vs psych 축 정합 상태 */
export type KillerAlignment =
  | "reinforced"
  | "tension"
  | "saju_only"
  | "psych_only";

export type CohabitationKillerQuestion = {
  topic: CohabitationKillerTopic;
  /** household 섹션 앵커 — UI 스크롤·psych_lens section_key와 동일 체계 */
  section_key: string;
  priority: number;
  hook: string;
  narrative: string;
  evidence: KillerEvidenceSource[];
  alignment: KillerAlignment;
  /** psych 축이 관여했을 때 (교차 검증 추적용) */
  psych_axis_key?: SecondaryAxisKey;
};

export type CohabitationKillerQuestionPack = {
  intro_line: string;
  questions: CohabitationKillerQuestion[];
};
