/**
 * 관계 심화 분석 — 유형별 분기 맵 (비개발자용 구조 안내)
 *
 * 새 관계 유형을 추가할 때:
 * 1. 아래 REGISTRY에 항목 추가
 * 2. lib/prompts/relationshipPremium/{유형}/ 파이프라인 추가
 * 3. components/relationship/{유형}ReportView.tsx UI 추가
 * 4. app/api/relationship/analyze/premium/route.ts 에서 kind 분기
 */
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/workColleague";
import { COHABITATION_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/cohabitation";
import { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/familyParentChild";
import type { RelationshipKind } from "./relationshipKind";

export type DeepAnalysisKind = "romantic" | "work" | "cohabitation" | "family";

export type DeepAnalysisKindEntry = {
  /** DB·API format 문자열 */
  format: string;
  /** 화면에 보이는 이름 */
  label: string;
  /** 3점수 스냅샷 설정 (triScoreSnapshot/kinds.ts) */
  triScoreKind: DeepAnalysisKind;
  /** 리포트 빌드 파이프라인 경로 */
  pipeline: string;
  /** 화면 컴포넌트 경로 */
  viewComponent: string;
  /** 출생 정보 요구 — romantic/work 는 날짜+출생지만 */
  birthRequirement: "date_place" | "date_time_place";
};

/** 연인·동료·동거·가족 — 사주 심화(deep) 파이프라인 */
export const DEEP_ANALYSIS_KIND_REGISTRY: Record<
  DeepAnalysisKind,
  DeepAnalysisKindEntry
> = {
  romantic: {
    format: ROMANTIC_SAJU_DEEP_FORMAT,
    label: "연인 사주 심화",
    triScoreKind: "romantic",
    pipeline: "lib/prompts/relationshipPremium/romanticSajuDeep",
    viewComponent: "components/relationship/RomanticSajuDeepReportView",
    birthRequirement: "date_place",
  },
  work: {
    format: WORK_COLLEAGUE_DEEP_FORMAT,
    label: "동료·비즈니스 파트너 분석",
    triScoreKind: "work",
    pipeline: "lib/prompts/relationshipPremium/workColleague",
    viewComponent: "components/relationship/WorkColleagueReportView",
    birthRequirement: "date_place",
  },
  cohabitation: {
    format: COHABITATION_DEEP_FORMAT,
    label: "동거·결혼 하우스홀드 분석",
    triScoreKind: "cohabitation",
    pipeline: "lib/prompts/relationshipPremium/cohabitation",
    viewComponent: "components/relationship/MarriageReportView",
    birthRequirement: "date_place",
  },
  family: {
    format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
    label: "가족 Child DNA Playbook",
    triScoreKind: "romantic",
    pipeline: "lib/prompts/relationshipPremium/familyParentChild",
    viewComponent: "components/relationship/FamilyParentReportView",
    birthRequirement: "date_place",
  },
};

export function relationshipKindUsesDeepPipeline(
  kind: RelationshipKind,
): kind is DeepAnalysisKind {
  return (
    kind === "romantic" ||
    kind === "work" ||
    kind === "cohabitation" ||
    kind === "family"
  );
}

export function getDeepAnalysisEntry(
  kind: DeepAnalysisKind,
): DeepAnalysisKindEntry {
  return DEEP_ANALYSIS_KIND_REGISTRY[kind];
}
