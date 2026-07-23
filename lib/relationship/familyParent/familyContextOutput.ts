/**
 * Family Context Output — 이미 계산된 RuleContext·section 결과의 표준 재포장.
 * 새 판정·점수·문구 없음. 순수 매핑만.
 */
import type { FamilyScoringSignals } from "@/lib/saju/familyAnalysis";
import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type { FamilyMasterScores } from "./familyEventScores";
import type { FamilyParentChildReport } from "./familyReportTemplate";

export const FAMILY_CONTEXT_OUTPUT_SCHEMA_VERSION = "context_output_v1" as const;

export type FamilyContextOutputMeta = {
  reportIdA: string;
  reportIdB: string;
  inputFingerprintA: string;
  inputFingerprintB: string;
};

export type FamilyContextDominantCategory = {
  category: string;
  scores?: Record<string, number>;
};

/**
 * 가족 도메인 Context Output.
 * `signals`는 기존 `FamilyScoringSignals`를 그대로 노출(신규 신호 타입 없음).
 */
export type FamilyContextOutput = {
  schema_version: typeof FAMILY_CONTEXT_OUTPUT_SCHEMA_VERSION;
  domain: "family";
  grade: FamilyRuleContext["grade"];
  /** ctx.masterScores — { bond, synergy, risk } */
  scores: FamilyMasterScores;
  /**
   * 이미 section/ctx에 있는 카테고리만 담음.
   * correction_style raw bucket은 section에 키로 저장되지 않아 재호출 없이 제외.
   */
  dominant_categories: Record<string, FamilyContextDominantCategory>;
  signals: FamilyScoringSignals;
  axis_notes: {
    decision_style: string | null;
  };
  /**
   * envelope 계약 정렬용 — 이번 배치에서는 완성 카피를 넣지 않고 빈 객체 유지.
   * (Family summary 인정 범위는 Romantic 이후 별도 판단)
   */
  section_summaries: Record<string, never>;
  /** personCoreMeta가 있을 때만 — 없으면 필드 자체 생략 */
  meta?: FamilyContextOutputMeta;
};

export type BuildFamilyContextOutputOptions = {
  personCoreMeta?: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  } | null;
};

/**
 * ctx + 최종 family section 결과를 Context Output으로 모은다.
 * 판정 함수 재호출 없음 — 이미 있는 값만 읽는다.
 */
export function buildFamilyContextOutput(
  ctx: FamilyRuleContext,
  family: FamilyParentChildReport,
  options?: BuildFamilyContextOutputOptions,
): FamilyContextOutput {
  const dominant_categories: Record<string, FamilyContextDominantCategory> =
    {};

  // section_family_role — buildFamilyRoleSection이 이미 판정한 child_role
  if (family.section_family_role) {
    dominant_categories.family_role = {
      category: family.section_family_role.child_role,
    };
  }

  // section_talent — resolveStudyType/WealthVessel 결과가 이미 필드에 있음
  if (family.section_talent) {
    dominant_categories.study_type = {
      category: family.section_talent.study_type,
    };
    dominant_categories.wealth_vessel = {
      category: family.section_talent.wealth_vessel,
    };
  }

  // familyPairAnalysis.childSignals — analyzeFamilyPairSaju가 이미 채움
  const childSignals = ctx.familyPairAnalysis.childSignals;
  dominant_categories.child_archetype = {
    category: childSignals.dominantArchetype,
  };
  dominant_categories.child_communication = {
    category: childSignals.communicationStyle,
  };

  // tenGod.parentProfile — analyzeFamilyParentTenGod가 이미 채움
  dominant_categories.parent_support_strength = {
    category: ctx.tenGod.parentProfile.support_strength,
  };

  const personCoreMeta = options?.personCoreMeta ?? null;
  const meta: FamilyContextOutputMeta | undefined = personCoreMeta
    ? {
        reportIdA: personCoreMeta.reportIdA,
        reportIdB: personCoreMeta.reportIdB,
        inputFingerprintA: personCoreMeta.inputFingerprintA,
        inputFingerprintB: personCoreMeta.inputFingerprintB,
      }
    : undefined;

  return {
    schema_version: FAMILY_CONTEXT_OUTPUT_SCHEMA_VERSION,
    domain: "family",
    grade: ctx.grade,
    scores: {
      bond: ctx.masterScores.bond,
      synergy: ctx.masterScores.synergy,
      risk: ctx.masterScores.risk,
    },
    dominant_categories,
    signals: { ...ctx.familyPairAnalysis.scoringSignals },
    axis_notes: {
      decision_style:
        family.section_relationship_index?.decision_axis_note ?? null,
    },
    section_summaries: {},
    ...(meta ? { meta } : {}),
  };
}
