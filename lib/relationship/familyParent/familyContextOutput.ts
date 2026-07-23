/**
 * Family Context Output — 이미 계산된 RuleContext·section 결과의 표준 재포장.
 * study/wealth 사주 pick(`study_type` / `wealth_vessel`)은 재계산·변경하지 않는다.
 *
 * Phase 5-1: 자녀 psych 절대 밴드로 `study_align` / `wealth_align`만 선택 추가.
 * 이 키는 사주 분류와의 일치·확인이 아니다 — 보조 context 메타만.
 * 카피 소비 시 사주 키를 먼저 쓰고, align은 보조 관찰로만 해석할 것.
 */
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { FamilyScoringSignals } from "@/lib/saju/familyAnalysis";
import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type { FamilyMasterScores } from "./familyEventScores";
import type { FamilyParentChildReport } from "./familyReportTemplate";
import {
  resolveStudyAlign,
  resolveWealthAlign,
} from "./familyTalentAlign";

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
/**
   * 자녀 psych — 있으면 study/wealth 절대밴드 align만 추가 (없으면 키 omit).
   * 사주 study_type / wealth_vessel과 직접 비교하지 않는다.
   */
  psychChild?: PsychMasterJson | null;
};

/**
 * ctx + 최종 family section 결과를 Context Output으로 모은다.
 * study_type / wealth_vessel 사주 판정은 재호출하지 않는다 (SSOT = section_talent).
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

  // Phase 5-1 — psych 절대 밴드 메타만 (사주 일치 판정 아님). mid/누락 시 omit.
  const studyAlign = resolveStudyAlign(options?.psychChild);
  if (studyAlign) {
    dominant_categories.study_align = { category: studyAlign };
  }
  const wealthAlign = resolveWealthAlign(options?.psychChild);
  if (wealthAlign) {
    dominant_categories.wealth_align = { category: wealthAlign };
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
