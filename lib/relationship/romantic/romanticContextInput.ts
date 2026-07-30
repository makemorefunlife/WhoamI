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
  CrossChartTensionBand,
  CrossChartTensionResult,
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
  resolveCrossChartTension,
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
import type {
  CurrentSelfProfile,
  SecondaryAxisKey,
} from "@/lib/v2/survey/types";
import type { ChartContext } from "@/lib/saju/chartContext";
import type { CrossChartHit, CrossChartTrioHit } from "@/lib/saju/pairChartAnalysis";
import { buildPairSajuFacts } from "@/lib/personCore/pairSaju";
import {
  applyRomanticPairLens,
  romanticNonTensionPackets,
  runPairContextEngine,
  type DomainPairLensOutput,
  type PairContextPacket,
} from "@/lib/personCore/pairContextEngine";
import type { RomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";
import type { RefinedCompareConflictPair } from "@/lib/relationship/romantic/compareConflictComposite";
import type { RefinedCompareAffectionPair } from "@/lib/relationship/romantic/compareAffectionComposite";
import type { RefinedCompareStressPair } from "@/lib/relationship/romantic/compareStressComposite";
import type { RefinedCompareDecisionPair } from "@/lib/relationship/romantic/compareDecisionComposite";
import type { RefinedCompareExpressionPair } from "@/lib/relationship/romantic/compareExpressionComposite";
import type { RefinedCompareCommunicationPair } from "@/lib/relationship/romantic/compareCommunicationComposite";
import type { ExpressionSpeedCorroboration } from "@/lib/relationship/romantic/expressionSpeedCorroboration";

export const ROMANTIC_CONTEXT_INPUT_SCHEMA_VERSION = "context_output_v1" as const;

/**
 * comparison_table 6행 ↔ psych twin — digest `COMPARISON_TABLE_AXIS_MAP`과 동일.
 * Phase 5-1: psych twin raw. Phase 5-3: compare 6행 lean composite 전부.
 */
export const ROMANTIC_COMPARE_PSYCH_TWINS = [
  { compareKey: "expression", axisKey: "energy_style" as SecondaryAxisKey },
  { compareKey: "conflict", axisKey: "conflict_style" as SecondaryAxisKey },
  { compareKey: "affection", axisKey: "empathy" as SecondaryAxisKey },
  { compareKey: "stress", axisKey: "self_control" as SecondaryAxisKey },
  { compareKey: "decision", axisKey: "decision_style" as SecondaryAxisKey },
  { compareKey: "communication", axisKey: "structure" as SecondaryAxisKey },
] as const;

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
  crossChartTension: CrossChartTensionResult;
  /**
   * 육합/충형파해 + 천간합 + 원진/귀문 + 공망 + 천간충 —
   * Pair Fact Layer (`buildPairSajuFacts`) 단일 소스. hour unknown 제외 적용.
   */
  crossChartHits: CrossChartHit[];
  crossTrioHits: CrossChartTrioHit[];
  /** Shared Pair CE → Romantic lens (context-neutral packets). */
  pairLens: DomainPairLensOutput | null;
  /** Bonding/energy packets for non-tension projectors. */
  pairNonTensionPackets: PairContextPacket[];
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
  /**
   * Phase 5-3 — expression_speed residual corroboration (confirm-only).
   * direction은 변경하지 않음. align/confidence가 null이면 해당 키 omit.
   */
  expressionSpeedCorroboration?: ExpressionSpeedCorroboration | null;
  /**
   * Phase 5-1 — comparison psych twin raw.
   * secondary_axes 없으면 해당 side twin 키 전부 omit (추정 금지).
   */
  profileA?: CurrentSelfProfile | null;
  profileB?: CurrentSelfProfile | null;
  /**
   * Phase 5-3 — 「갈등 반응」 composite.
   * 있으면 compare_conflict_{a|b} category를 lean으로 덮고
   * compare_conflict_align / compare_conflict_confidence를 추가.
   * null이면 사주 band 유지(align/confidence omit).
   */
  conflictComposite?: RefinedCompareConflictPair | null;
  /**
   * Phase 5-3 — 「애정 언어」 composite.
   * 있으면 compare_affection_{a|b} category를 lean으로 덮고
   * compare_affection_align / compare_affection_confidence를 추가.
   */
  affectionComposite?: RefinedCompareAffectionPair | null;
  /**
   * Phase 5-3 — 「스트레스 패턴」 composite.
   * 있으면 compare_stress_{a|b} category를 lean으로 덮고
   * compare_stress_align / compare_stress_confidence를 추가.
   */
  stressComposite?: RefinedCompareStressPair | null;
  /**
   * Phase 5-3 — 「의사결정」 composite.
   * 있으면 compare_decision_{a|b} category를 lean으로 덮고
   * compare_decision_align / compare_decision_confidence를 추가.
   */
  decisionComposite?: RefinedCompareDecisionPair | null;
  /**
   * Phase 5-3 — 「감정 표현」 composite.
   * 있으면 compare_expression_{a|b} category를 lean으로 덮고
   * compare_expression_align / compare_expression_confidence를 추가.
   */
  expressionComposite?: RefinedCompareExpressionPair | null;
  /**
   * Phase 5-3 — 「소통 방식」 composite.
   * 있으면 compare_communication_{a|b} category를 lean으로 덮고
   * compare_communication_align / compare_communication_confidence를 추가.
   */
  communicationComposite?: RefinedCompareCommunicationPair | null;
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

/** Phase 5-1 — saju compare band와 1:1 대응되는 psych twin 수치만 (composite 없음). */
function mapComparePsychTwins(
  side: "a" | "b",
  profile: CurrentSelfProfile | null | undefined,
): Record<string, RomanticContextDominantCategory> {
  const axes = profile?.secondary_axes;
  if (!axes) return {};
  const out: Record<string, RomanticContextDominantCategory> = {};
  for (const row of ROMANTIC_COMPARE_PSYCH_TWINS) {
    const score = axes[row.axisKey];
    if (typeof score !== "number") continue;
    out[`compare_${row.compareKey}_psych_${side}`] = {
      category: row.axisKey,
      scores: { score },
    };
  }
  return out;
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
    cross_chart_tension_band: { category: d.crossChartTension.band },
    cross_chart_tension_type: {
      category: d.crossChartTension.dominantType ?? "none",
      scores: { hit_count: d.crossChartTension.hitCount },
    },
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
  /** analyzePairSaju(pairChartAnalysis.ts) 결과 — 일주 교차 충형해파 근거. */
  dayBranchCrossHits?: CrossChartHit[];
  /** @deprecated Prefer Pair Fact Layer; kept for call-site compat, ignored when Pair CE runs. */
  allCrossHits?: CrossChartHit[];
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  reportIdA?: string;
  reportIdB?: string;
}): RomanticDynamicsTypedSnapshot {
  const rootedA = hasDayStemRootInDayBranch(params.chartA);
  const rootedB = hasDayStemRootInDayBranch(params.chartB);
  const needA = resolveReassuranceBand(params.profileA, rootedA);
  const needB = resolveReassuranceBand(params.profileB, rootedB);
  const giveA = resolveGiveStyle(params.romanticA);
  const giveB = resolveGiveStyle(params.romanticB);

  const pairFacts = buildPairSajuFacts({
    chartA: params.chartA,
    chartB: params.chartB,
    birthTimeUnknownA: params.birthTimeUnknownA,
    birthTimeUnknownB: params.birthTimeUnknownB,
    reportIdA: params.reportIdA,
    reportIdB: params.reportIdB,
  });
  const pairCe = runPairContextEngine({ facts: pairFacts });
  const pairLens = applyRomanticPairLens(pairCe);

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
    crossChartTension: resolveCrossChartTension(params.dayBranchCrossHits ?? []),
    crossChartHits: pairFacts.cross_hits,
    crossTrioHits: pairFacts.trio_hits,
    pairLens,
    pairNonTensionPackets: romanticNonTensionPackets(pairLens),
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

  Object.assign(
    dominant_categories,
    mapComparePsychTwins("a", params.profileA),
  );
  Object.assign(
    dominant_categories,
    mapComparePsychTwins("b", params.profileB),
  );

  // Phase 5-3 — 기존 compare_conflict_{a|b} category를 lean으로 확장 (중복 키 없음)
  const cc = params.conflictComposite;
  if (cc) {
    dominant_categories.compare_conflict_a = {
      category: cc.leanA,
      scores: {
        officer_count: cc.personA.scores.officer_count,
        food_count: cc.personA.scores.food_count,
        saju_margin: cc.personA.scores.saju_margin,
      },
    };
    dominant_categories.compare_conflict_b = {
      category: cc.leanB,
      scores: {
        officer_count: cc.personB.scores.officer_count,
        food_count: cc.personB.scores.food_count,
        saju_margin: cc.personB.scores.saju_margin,
      },
    };
    dominant_categories.compare_conflict_align = {
      category: cc.align,
    };
    dominant_categories.compare_conflict_confidence = {
      category: cc.confidence,
    };
  }

  // Phase 5-3 — compare_affection_{a|b} lean 확장 (reassurance 키와 별개)
  const ac = params.affectionComposite;
  if (ac) {
    dominant_categories.compare_affection_a = {
      category: ac.leanA,
      scores: {
        wealth_count: ac.personA.scores.wealth_count,
        seal_count: ac.personA.scores.seal_count,
        saju_margin: ac.personA.scores.saju_margin,
      },
    };
    dominant_categories.compare_affection_b = {
      category: ac.leanB,
      scores: {
        wealth_count: ac.personB.scores.wealth_count,
        seal_count: ac.personB.scores.seal_count,
        saju_margin: ac.personB.scores.saju_margin,
      },
    };
    dominant_categories.compare_affection_align = {
      category: ac.align,
    };
    dominant_categories.compare_affection_confidence = {
      category: ac.confidence,
    };
  }

  // Phase 5-3 — compare_stress_{a|b} lean 확장 (recovery/residual 키와 별개)
  const sc = params.stressComposite;
  if (sc) {
    dominant_categories.compare_stress_a = {
      category: sc.leanA,
      scores: {
        heat_score: sc.personA.scores.heat_score,
        saju_margin: sc.personA.scores.saju_margin,
      },
    };
    dominant_categories.compare_stress_b = {
      category: sc.leanB,
      scores: {
        heat_score: sc.personB.scores.heat_score,
        saju_margin: sc.personB.scores.saju_margin,
      },
    };
    dominant_categories.compare_stress_align = {
      category: sc.align,
    };
    dominant_categories.compare_stress_confidence = {
      category: sc.confidence,
    };
  }

  // Phase 5-3 — compare_decision_{a|b} lean 확장 (balance/sublead 키와 별개)
  const dc = params.decisionComposite;
  if (dc) {
    dominant_categories.compare_decision_a = {
      category: dc.leanA,
      scores: {
        saju_margin: dc.personA.scores.saju_margin,
      },
    };
    dominant_categories.compare_decision_b = {
      category: dc.leanB,
      scores: {
        saju_margin: dc.personB.scores.saju_margin,
      },
    };
    dominant_categories.compare_decision_align = {
      category: dc.align,
    };
    dominant_categories.compare_decision_confidence = {
      category: dc.confidence,
    };
  }

  // Phase 5-3 — compare_expression_{a|b} lean 확장 (balance/expression_speed 키와 별개)
  const ec = params.expressionComposite;
  if (ec) {
    dominant_categories.compare_expression_a = {
      category: ec.leanA,
      scores: {
        food_count: ec.personA.scores.food_count,
        saju_margin: ec.personA.scores.saju_margin,
      },
    };
    dominant_categories.compare_expression_b = {
      category: ec.leanB,
      scores: {
        food_count: ec.personB.scores.food_count,
        saju_margin: ec.personB.scores.saju_margin,
      },
    };
    dominant_categories.compare_expression_align = {
      category: ec.align,
    };
    dominant_categories.compare_expression_confidence = {
      category: ec.confidence,
    };
  }

  // Phase 5-3 — compare_communication_{a|b} lean 확장
  const cmc = params.communicationComposite;
  if (cmc) {
    dominant_categories.compare_communication_a = {
      category: cmc.leanA,
      scores: {
        self_count: cmc.personA.scores.self_count,
        seal_count: cmc.personA.scores.seal_count,
        saju_margin: cmc.personA.scores.saju_margin,
      },
    };
    dominant_categories.compare_communication_b = {
      category: cmc.leanB,
      scores: {
        self_count: cmc.personB.scores.self_count,
        seal_count: cmc.personB.scores.seal_count,
        saju_margin: cmc.personB.scores.saju_margin,
      },
    };
    dominant_categories.compare_communication_align = {
      category: cmc.align,
    };
    dominant_categories.compare_communication_confidence = {
      category: cmc.confidence,
    };
  }

  if (params.dynamics) {
    Object.assign(dominant_categories, mapDynamicsCategories(params.dynamics));
  }

  if (params.expressionSpeedDirection) {
    dominant_categories.expression_speed_direction = {
      category: params.expressionSpeedDirection,
    };
  }

  // Phase 5-3 — expression_speed confirm-only (direction 불변, residual 보강만)
  const esc = params.expressionSpeedCorroboration;
  if (esc?.align != null && esc.confidence != null) {
    dominant_categories.expression_speed_align = { category: esc.align };
    dominant_categories.expression_speed_confidence = {
      category: esc.confidence,
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
  CrossChartTensionBand,
};
