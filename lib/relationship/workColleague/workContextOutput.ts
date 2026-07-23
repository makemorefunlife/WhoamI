/**
 * Work Colleague Context Output — 이미 계산된 RuleContext·office 결과의 표준 재포장.
 * 새 판정·점수·문구 없음. 순수 매핑만.
 */
import type { WorkScoringSignals } from "@/lib/saju/workPairAnalysis";
import type { WorkColleagueContext } from "./buildWorkColleagueContext";
import type { WorkMasterScores } from "@/lib/relationship/workPairEventScores";
import type { OfficePartnershipReport } from "./officeReportTemplate";

export const WORK_CONTEXT_OUTPUT_SCHEMA_VERSION = "context_output_v1" as const;

export type WorkContextOutputMeta = {
  reportIdA: string;
  reportIdB: string;
  inputFingerprintA: string;
  inputFingerprintB: string;
};

export type WorkContextDominantCategory = {
  category: string;
  scores?: Record<string, number>;
};

/**
 * 동료 도메인 Context Output.
 * `signals`는 기존 `WorkScoringSignals`를 그대로 노출(신규 신호 타입 없음).
 */
export type WorkContextOutput = {
  schema_version: typeof WORK_CONTEXT_OUTPUT_SCHEMA_VERSION;
  domain: "work";
  grade: WorkColleagueContext["grade"];
  /** ctx.masterScores — { activation, benefit, risk } */
  scores: WorkMasterScores;
  /**
   * office/ctx에 이미 저장된 카테고리·스타일만.
   * resolveWorkCategory 재호출 없음(DNA에는 raw TenGodCategory 키가 없음).
   */
  dominant_categories: Record<string, WorkContextDominantCategory>;
  signals: WorkScoringSignals;
  /**
   * 축 판정에 붙는 짧고 선택적인 보조 설명만.
   * Work에는 Family `decision_axis_note`에 해당하는 기계산 필드가 없어 비움.
   * 완성된 section summary 문장은 `section_summaries`에 둔다.
   */
  axis_notes: Record<string, string | null>;
  /**
   * 사용자에게 보이는 section 카드 summary(완성 문장).
   * axis_notes 계약과 분리.
   */
  section_summaries: {
    reporting_style: string | null;
    break_boundary: string | null;
    leadership: string | null;
  };
  meta?: WorkContextOutputMeta;
};

export type BuildWorkContextOutputOptions = {
  personCoreMeta?: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  } | null;
};

/**
 * ctx + 최종 office section 결과를 Context Output으로 모은다.
 * 판정 함수 재호출 없음 — 이미 있는 값만 읽는다.
 */
export function buildWorkContextOutput(
  ctx: WorkColleagueContext,
  office: OfficePartnershipReport,
  options?: BuildWorkContextOutputOptions,
): WorkContextOutput {
  const dominant_categories: Record<string, WorkContextDominantCategory> = {};

  // tenGodComplement — analyzeTenGodComplement가 이미 채운 strong/lacking
  const strongA = ctx.tenGodComplement.personA.strong[0];
  const strongB = ctx.tenGodComplement.personB.strong[0];
  if (strongA) {
    dominant_categories.person_a_strong = { category: strongA };
  }
  if (strongB) {
    dominant_categories.person_b_strong = { category: strongB };
  }
  const lackA = ctx.tenGodComplement.personA.lacking[0];
  const lackB = ctx.tenGodComplement.personB.lacking[0];
  if (lackA) {
    dominant_categories.person_a_lacking = { category: lackA };
  }
  if (lackB) {
    dominant_categories.person_b_lacking = { category: lackB };
  }

  // office psych 병합 필드 — buildWorkColleagueReport가 이미 붙인 스타일
  const reporting = office.section_mix_fit.reporting_style_fit;
  if (reporting) {
    dominant_categories.reporting_style_a = {
      category: reporting.person_a.style,
    };
    dominant_categories.reporting_style_b = {
      category: reporting.person_b.style,
    };
  }

  const breakFit = office.section_respect.break_boundary_fit;
  if (breakFit) {
    dominant_categories.break_boundary_a = {
      category: breakFit.person_a.style,
    };
    dominant_categories.break_boundary_b = {
      category: breakFit.person_b.style,
    };
  }

  const contribA = office.section_dna.person_a.contribution_style;
  const contribB = office.section_dna.person_b.contribution_style;
  if (contribA) {
    dominant_categories.contribution_style_a = { category: contribA };
  }
  if (contribB) {
    dominant_categories.contribution_style_b = { category: contribB };
  }

  const leadership = office.section_roles.leadership_split;
  if (leadership) {
    dominant_categories.external_lead = {
      category: leadership.external_lead,
    };
    dominant_categories.internal_qa_lead = {
      category: leadership.internal_qa_lead,
    };
    if (leadership.confidence) {
      dominant_categories.leadership_confidence = {
        category: leadership.confidence,
      };
    }
    if (leadership.align) {
      dominant_categories.leadership_align = {
        category: leadership.align,
      };
    }
  }

  const personCoreMeta = options?.personCoreMeta ?? null;
  const meta: WorkContextOutputMeta | undefined = personCoreMeta
    ? {
        reportIdA: personCoreMeta.reportIdA,
        reportIdB: personCoreMeta.reportIdB,
        inputFingerprintA: personCoreMeta.inputFingerprintA,
        inputFingerprintB: personCoreMeta.inputFingerprintB,
      }
    : undefined;

  return {
    schema_version: WORK_CONTEXT_OUTPUT_SCHEMA_VERSION,
    domain: "work",
    grade: ctx.grade,
    scores: {
      activation: ctx.masterScores.activation,
      benefit: ctx.masterScores.benefit,
      risk: ctx.masterScores.risk,
    },
    dominant_categories,
    signals: { ...ctx.workPairAnalysis.scoringSignals },
    axis_notes: {},
    section_summaries: {
      reporting_style: reporting?.summary ?? null,
      break_boundary: breakFit?.summary ?? null,
      leadership: leadership?.summary ?? null,
    },
    ...(meta ? { meta } : {}),
  };
}
