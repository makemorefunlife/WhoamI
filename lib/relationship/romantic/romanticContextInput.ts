/**
 * Romantic deterministic input context — LLM 호출 전 서버 확정값만 구조화.
 *
 * digest 문자열·LLM prose·section summary는 넣지 않는다.
 * 이 모듈의 build*는 resolver를 호출하지 않는다 — prepare가 넘긴 typed 결과만 매핑.
 */

import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";
import type { RomanticSajuSignals } from "@/lib/personCore/sajuSignals/types";
import { DOMAIN_SAJU_SIGNALS_VERSION } from "@/lib/personCore/sajuSignals/types";
import type {
  BalanceOfPowerBand,
  BalanceOfPowerResult,
  ExpressionSpeedDirection,
  GiveStyle,
  ReassuranceBand,
  RecoverySpeedBand,
  RecoverySpeedResult,
  ResidualBand,
  RolePlayBand,
  RolePlayResult,
  SajuFrameDirection,
  SubLeadBand,
  SubLeadResult,
} from "@/lib/relationship/romanticRules/relationshipDynamics";
import {
  hasDayStemRootInDayBranch,
  resolveBalanceOfPower,
  resolveExpressionSpeedDirection,
  resolveGiveStyle,
  resolveReassuranceBand,
  resolveReassuranceMatch,
  resolveRecoverySpeedGap,
  resolveResidualBand,
  resolveRolePlayWithSajuFrame,
  resolveSajuFrameDirection,
  resolveSubLeads,
  resolveConflictAxisNote,
  resolveIntimacyAxisNote,
} from "@/lib/relationship/romanticRules/relationshipDynamics";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import type { ChartContext } from "@/lib/saju/chartContext";
import type { RomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";

export const ROMANTIC_CONTEXT_INPUT_SCHEMA_VERSION = "context_output_v1" as const;

export type RomanticContextDominantCategory = {
  category: string;
  scores?: Record<string, number>;
};

export type RomanticContextInputMeta = {
  domain_signals_version?: string;
  saju_master_schema_a?: string | null;
  saju_master_schema_b?: string | null;
  prompt_input_mode: "domain_signals_digest_v1";
};

/**
 * prepare에서 digest와 동일 소스 resolver를 1회 호출해 모은 typed 스냅샷.
 * buildRomanticContextInput은 이 객체만 읽는다.
 */
export type RomanticDynamicsTypedSnapshot = {
  balance: BalanceOfPowerResult;
  subLeads: SubLeadResult;
  recovery: RecoverySpeedResult;
  residualA: ResidualBand;
  residualB: ResidualBand;
  needA: ReassuranceBand;
  needB: ReassuranceBand;
  giveA: GiveStyle;
  giveB: GiveStyle;
  matchBGivesA: boolean;
  matchAGivesB: boolean;
  rolePlay: RolePlayResult;
  sajuFrameDirection: SajuFrameDirection;
};

export type RomanticContextInput = {
  schema_version: typeof ROMANTIC_CONTEXT_INPUT_SCHEMA_VERSION;
  domain: "romantic";
  grade: "A" | "B" | "C" | "D";
  /** overall tri-score — 공통 envelope `scores` 슬롯 */
  scores: {
    activation: number;
    benefit: number;
    risk: number;
  };
  /** 전체 주제별 event_scores (서버 SSOT) */
  event_scores: RelationshipEventScores;
  /**
   * person별 romantic_signals.
   * 레거시/누락 시 해당 키 생략.
   */
  signals: {
    person_a?: RomanticSajuSignals;
    person_b?: RomanticSajuSignals;
  };
  dominant_categories: Record<string, RomanticContextDominantCategory>;
  axis_notes: {
    intimacy: string | null;
    conflict: string | null;
  };
  meta?: RomanticContextInputMeta;
};

export type BuildRomanticContextInputParams = {
  grade: "A" | "B" | "C" | "D";
  eventScores: RelationshipEventScores;
  romanticSignalsA?: RomanticSajuSignals | null;
  romanticSignalsB?: RomanticSajuSignals | null;
  /** signals A/B 모두 있을 때만 — 없으면 dynamics/compare pair 카테고리 생략 */
  dynamics?: RomanticDynamicsTypedSnapshot | null;
  expressionSpeedDirection?: ExpressionSpeedDirection | null;
  axisNotes?: {
    intimacy: string | null;
    conflict: string | null;
  };
  meta?: {
    sajuMasterSchemaA?: string | null;
    sajuMasterSchemaB?: string | null;
  };
};

function boolCat(v: boolean): string {
  return v ? "matched" : "mismatched";
}

function mapCompareBands(
  side: "a" | "b",
  rs: RomanticSajuSignals,
): Record<string, RomanticContextDominantCategory> {
  return {
    [`compare_expression_${side}`]: {
      category: rs.expression_style.expression_band,
    },
    [`compare_conflict_${side}`]: {
      category: rs.conflict_response.conflict_band,
    },
    [`compare_affection_${side}`]: {
      category: rs.affection_language.affection_band,
    },
    [`compare_stress_${side}`]: {
      category: rs.stress_pattern.stress_band,
    },
    [`compare_decision_${side}`]: {
      category: rs.decision_making.decision_band,
    },
    [`compare_communication_${side}`]: {
      category: rs.communication_style.communication_band,
    },
  };
}

function mapDynamicsCategories(
  d: RomanticDynamicsTypedSnapshot,
): Record<string, RomanticContextDominantCategory> {
  const out: Record<string, RomanticContextDominantCategory> = {
    balance_a: { category: d.balance.bandA },
    balance_b: { category: d.balance.bandB },
    recovery_a: { category: d.recovery.bandA },
    recovery_b: { category: d.recovery.bandB },
    recovery_mismatch: {
      category: d.recovery.mismatch ? "mismatch" : "aligned",
    },
    residual_a: { category: d.residualA },
    residual_b: { category: d.residualB },
    reassurance_need_a: { category: d.needA },
    reassurance_need_b: { category: d.needB },
    reassurance_give_a: { category: d.giveA },
    reassurance_give_b: { category: d.giveB },
    reassurance_match_b_gives_a: { category: boolCat(d.matchBGivesA) },
    reassurance_match_a_gives_b: { category: boolCat(d.matchAGivesB) },
    role_primary: { category: d.rolePlay.primaryFrame },
    role_saju: { category: d.rolePlay.sajuFrame },
    role_agrees: { category: d.rolePlay.agrees ? "agrees" : "differs" },
    saju_frame_direction: { category: d.sajuFrameDirection },
    sublead_idea_mood: { category: d.subLeads.ideaMoodLead },
    sublead_decision_approval: { category: d.subLeads.decisionApprovalLead },
    sublead_execution: { category: d.subLeads.executionLead },
  };
  if (d.balance.scoreA != null && d.balance.scoreB != null) {
    out.balance_a = {
      category: d.balance.bandA,
      scores: { score: d.balance.scoreA },
    };
    out.balance_b = {
      category: d.balance.bandB,
      scores: { score: d.balance.scoreB },
    };
  }
  if (d.recovery.scoreA != null && d.recovery.scoreB != null) {
    out.recovery_a = {
      category: d.recovery.bandA,
      scores: { score: d.recovery.scoreA },
    };
    out.recovery_b = {
      category: d.recovery.bandB,
      scores: { score: d.recovery.scoreB },
    };
  }
  return out;
}

/**
 * prepare 전용 — dynamics_digest와 동일 resolver를 한 번 호출해 typed 스냅샷 생성.
 * buildRomanticContextInput / digest 문자열 조립과는 분리.
 */
export function collectRomanticDynamicsTypedSnapshot(params: {
  profileA?: CurrentSelfProfile | null;
  profileB?: CurrentSelfProfile | null;
  romanticA: RomanticSajuSignals;
  romanticB: RomanticSajuSignals;
  chartA: ChartContext;
  chartB: ChartContext;
  dayStemInteraction: string;
}): RomanticDynamicsTypedSnapshot {
  const rootedA = hasDayStemRootInDayBranch(params.chartA);
  const rootedB = hasDayStemRootInDayBranch(params.chartB);
  const needA = resolveReassuranceBand(params.profileA, rootedA);
  const needB = resolveReassuranceBand(params.profileB, rootedB);
  const giveA = resolveGiveStyle(params.romanticA);
  const giveB = resolveGiveStyle(params.romanticB);
  return {
    balance: resolveBalanceOfPower(params.profileA, params.profileB),
    subLeads: resolveSubLeads(params.romanticA, params.romanticB),
    recovery: resolveRecoverySpeedGap(params.profileA, params.profileB),
    residualA: resolveResidualBand(params.romanticA),
    residualB: resolveResidualBand(params.romanticB),
    needA,
    needB,
    giveA,
    giveB,
    matchBGivesA: resolveReassuranceMatch(needA, giveB),
    matchAGivesB: resolveReassuranceMatch(needB, giveA),
    rolePlay: resolveRolePlayWithSajuFrame(
      params.profileA,
      params.profileB,
      params.romanticA,
      params.romanticB,
      params.dayStemInteraction,
    ),
    sajuFrameDirection: resolveSajuFrameDirection(
      params.romanticA,
      params.romanticB,
    ),
  };
}

/** prepare에서 axis note 문자열을 한 번 계산해 넘길 때 사용 */
export function collectRomanticAxisNotes(params: {
  profileA?: CurrentSelfProfile | null;
  profileB?: CurrentSelfProfile | null;
  locale?: RomanticHeadlineLocale;
}): { intimacy: string | null; conflict: string | null } {
  return {
    intimacy: resolveIntimacyAxisNote(
      params.profileA,
      params.profileB,
      params.locale,
    ),
    conflict: resolveConflictAxisNote(
      params.profileA,
      params.profileB,
      params.locale,
    ),
  };
}

/**
 * 순수 매핑 — resolver 재호출 없음.
 */
export function buildRomanticContextInput(
  params: BuildRomanticContextInputParams,
): RomanticContextInput {
  const signals: RomanticContextInput["signals"] = {};
  if (params.romanticSignalsA) {
    signals.person_a = params.romanticSignalsA;
  }
  if (params.romanticSignalsB) {
    signals.person_b = params.romanticSignalsB;
  }

  const dominant_categories: Record<string, RomanticContextDominantCategory> =
    {};

  if (params.romanticSignalsA) {
    Object.assign(
      dominant_categories,
      mapCompareBands("a", params.romanticSignalsA),
    );
  }
  if (params.romanticSignalsB) {
    Object.assign(
      dominant_categories,
      mapCompareBands("b", params.romanticSignalsB),
    );
  }

  if (params.dynamics) {
    Object.assign(dominant_categories, mapDynamicsCategories(params.dynamics));
  }

  if (params.expressionSpeedDirection) {
    dominant_categories.expression_speed_direction = {
      category: params.expressionSpeedDirection,
    };
  }

  const overall = params.eventScores.overall;
  const out: RomanticContextInput = {
    schema_version: ROMANTIC_CONTEXT_INPUT_SCHEMA_VERSION,
    domain: "romantic",
    grade: params.grade,
    scores: {
      activation: overall.activation,
      benefit: overall.benefit,
      risk: overall.risk,
    },
    event_scores: {
      intimacy: { ...params.eventScores.intimacy },
      conflict: { ...params.eventScores.conflict },
      stability: { ...params.eventScores.stability },
      overall: { ...params.eventScores.overall },
    },
    signals,
    dominant_categories,
    axis_notes: {
      intimacy: params.axisNotes?.intimacy ?? null,
      conflict: params.axisNotes?.conflict ?? null,
    },
  };

  const hasSignals = Boolean(
    params.romanticSignalsA || params.romanticSignalsB,
  );
  out.meta = {
    prompt_input_mode: "domain_signals_digest_v1",
    ...(hasSignals
      ? { domain_signals_version: DOMAIN_SAJU_SIGNALS_VERSION }
      : {}),
    ...(params.meta?.sajuMasterSchemaA !== undefined
      ? { saju_master_schema_a: params.meta.sajuMasterSchemaA }
      : {}),
    ...(params.meta?.sajuMasterSchemaB !== undefined
      ? { saju_master_schema_b: params.meta.sajuMasterSchemaB }
      : {}),
  };

  return out;
}

/** 타입 re-export — 테스트·소비처용 */
export type {
  BalanceOfPowerBand,
  RecoverySpeedBand,
  ResidualBand,
  ReassuranceBand,
  GiveStyle,
  RolePlayBand,
  SubLeadBand,
  ExpressionSpeedDirection,
  SajuFrameDirection,
};
