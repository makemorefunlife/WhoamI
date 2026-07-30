import { getHiddenStemsData, calculateTwelveStage } from "@/lib/saju/repository";
import type { ChartContext } from "@/lib/saju/chartContext";
import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";
import type { CurrentSelfProfile, SecondaryAxisKey } from "@/lib/v2/survey/types";
import type { RomanticSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { RomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";
import { normalizeRomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";

/** en/ko 문구 선택 — dayStemRomanticProfile.ts와 동일한 정규화 컨벤션. */
export function pick(
  locale: RomanticHeadlineLocale | undefined,
  en: string,
  ko: string,
): string {
  return normalizeRomanticHeadlineLocale(locale) === "en" ? en : ko;
}

/**
 * 연인 전용 "관계 역학" 4종 — 개인별 신호가 아니라 A·B를 같이 놓고 비교하는
 * pair 레벨 판정이라 PersonCore 신호팩(extractRomanticSignals)과는 별도 모듈로 둔다.
 * 심리축(11축 설문)이 1차 방향을 잡고, 이미 계산된 romantic_signals(사주 카운트)가
 * 보정·병기하는 2층 구조 — 십신 하나로 유형을 바로 확정하지 않는다.
 * 새 신호를 만들지 않고 기존 romantic_signals/secondary_axes만 재사용한다.
 */

export type BalanceOfPowerBand = "leader" | "receiver" | "balanced";
export type RecoverySpeedBand = "quick_recovery" | "deep_processing" | "balanced";
export type ReassuranceBand = "listening" | "behavior_proof" | "both" | "presence";
export type RolePlayBand = "peer" | "savior_dependent" | "mentor_student" | "parent_child";
export type SubLeadBand = "A" | "B" | "balanced";
export type ResidualBand = "lingers" | "clears_fast" | "moderate";
export type GiveStyle = "solidarity" | "expression" | "action" | "consistency" | "care";

const GAP_THRESHOLD = 15;
const RECOVERY_HIGH = 60;
const RECOVERY_LOW = 40;
const EMPATHY_HIGH = 60;
const ROLE_CONTRIBUTION_MARGIN = 5;
const SAJU_COUNT_GAP = 2;
const SUBLEAD_GAP = 1;
const RESIDUAL_TENSION_HITS = 2;
const AXIS_NOTE_EMPATHY_HIGH = 60;
const AXIS_NOTE_EMPATHY_LOW = 40;
const AXIS_NOTE_CONFLICT_GAP = 30;

const STRONG_DAY_STAGES = new Set([
  "jangsaeng",
  "geollok",
  "jewang",
  "gwandae",
]);

/** bedroomProfile.ts/extractCohabitationSignals.ts와 동일 정의 — 일간이 일지에 뿌리내렸는지. */
export function hasDayStemRootInDayBranch(chart: ChartContext): boolean {
  const hidden = getHiddenStemsData(chart.dayBranchCode);
  if (hidden.some((h) => h.stem_code === chart.dayStemCode)) return true;
  const stage = calculateTwelveStage(chart.dayStemCode, chart.dayBranchCode);
  return STRONG_DAY_STAGES.has(stage);
}

function axisScore(
  profile: CurrentSelfProfile | null | undefined,
  key: SecondaryAxisKey,
): number | null {
  const v = profile?.secondary_axes?.[key];
  return typeof v === "number" ? v : null;
}

// ---- ① 관계의 균형추 (외향에너지 + 인정욕구) ------------------------------------

export type BalanceOfPowerResult = {
  scoreA: number | null;
  scoreB: number | null;
  bandA: BalanceOfPowerBand;
  bandB: BalanceOfPowerBand;
};

function initiativeScore(profile: CurrentSelfProfile | null | undefined): number | null {
  const energy = axisScore(profile, "energy_style");
  const recognition = axisScore(profile, "recognition");
  if (energy == null || recognition == null) return null;
  return (energy + recognition) / 2;
}

export function resolveBalanceOfPower(
  profileA: CurrentSelfProfile | null | undefined,
  profileB: CurrentSelfProfile | null | undefined,
): BalanceOfPowerResult {
  const scoreA = initiativeScore(profileA);
  const scoreB = initiativeScore(profileB);
  if (scoreA == null || scoreB == null) {
    return { scoreA, scoreB, bandA: "balanced", bandB: "balanced" };
  }
  const gap = scoreA - scoreB;
  if (Math.abs(gap) < GAP_THRESHOLD) {
    return { scoreA, scoreB, bandA: "balanced", bandB: "balanced" };
  }
  return gap > 0
    ? { scoreA, scoreB, bandA: "leader", bandB: "receiver" }
    : { scoreA, scoreB, bandA: "receiver", bandB: "leader" };
}

/** 심리축 총괄 판정 아래, 사주 카운트로 "무엇을 주도하는지" 3갈래로 쪼갠 서브 리드. */
export type SubLeadResult = {
  ideaMoodLead: SubLeadBand;
  decisionApprovalLead: SubLeadBand;
  executionLead: SubLeadBand;
};

function compareCount(a: number, b: number): SubLeadBand {
  // 개별 카테고리는 0~3 범위라 SAJU_COUNT_GAP(2)는 너무 빡빡함 — 1 이상 차이면 리드로 본다.
  if (a - b >= SUBLEAD_GAP) return "A";
  if (b - a >= SUBLEAD_GAP) return "B";
  return "balanced";
}

/** food_count(식상)=아이디어·분위기, officer_count(관성)=결정·승인, wealth_count(재성)=실행. */
export function resolveSubLeads(
  romanticA: RomanticSajuSignals,
  romanticB: RomanticSajuSignals,
): SubLeadResult {
  return {
    ideaMoodLead: compareCount(
      romanticA.expression_style.food_count,
      romanticB.expression_style.food_count,
    ),
    decisionApprovalLead: compareCount(
      romanticA.conflict_response.officer_count,
      romanticB.conflict_response.officer_count,
    ),
    executionLead: compareCount(
      romanticA.affection_language.wealth_count,
      romanticB.affection_language.wealth_count,
    ),
  };
}

// ---- ② 감정 회복 속도 차이 (회복탄력성 + 자기통제) ------------------------------

export type RecoverySpeedResult = {
  scoreA: number | null;
  scoreB: number | null;
  bandA: RecoverySpeedBand;
  bandB: RecoverySpeedBand;
  mismatch: boolean;
};

function recoveryScore(profile: CurrentSelfProfile | null | undefined): number | null {
  const resilience = axisScore(profile, "resilience");
  const selfControl = axisScore(profile, "self_control");
  if (resilience == null || selfControl == null) return null;
  return (resilience + selfControl) / 2;
}

function recoveryBandFromScore(score: number | null): RecoverySpeedBand {
  if (score == null) return "balanced";
  if (score >= RECOVERY_HIGH) return "quick_recovery";
  if (score <= RECOVERY_LOW) return "deep_processing";
  return "balanced";
}

export function resolveRecoverySpeedGap(
  profileA: CurrentSelfProfile | null | undefined,
  profileB: CurrentSelfProfile | null | undefined,
): RecoverySpeedResult {
  const scoreA = recoveryScore(profileA);
  const scoreB = recoveryScore(profileB);
  const mismatch =
    scoreA != null && scoreB != null && Math.abs(scoreA - scoreB) >= GAP_THRESHOLD;
  return {
    scoreA,
    scoreB,
    bandA: recoveryBandFromScore(scoreA),
    bandB: recoveryBandFromScore(scoreB),
    mismatch,
  };
}

// ---- Part4① 표현 속도 차이 교정 대사 (갈등직면성 + 자기통제) ---------------------
//
// Part1③(감정 회복 속도, 위 resolveRecoverySpeedGap)은 회복탄력성+자기통제를 쓰지만,
// 스펙은 Part4①에 갈등직면성+자기통제를 지정해서 축이 다르다 — resolveRecoverySpeedGap을
// 재사용하지 않고 별도 함수로 둔다.

export type ExpressionSpeedDirection = "A" | "B" | "balanced";

function expressionSpeedScore(profile: CurrentSelfProfile | null | undefined): number | null {
  const conflict = axisScore(profile, "conflict_style");
  const selfControl = axisScore(profile, "self_control");
  if (conflict == null || selfControl == null) return null;
  return conflict - selfControl;
}

/** 갈등직면성↑ + 자기통제↓ = 빠른 표현 쪽(급하게 감정을 터뜨리는 쪽). 격차 작으면 balanced. */
export function resolveExpressionSpeedDirection(
  profileA: CurrentSelfProfile | null | undefined,
  profileB: CurrentSelfProfile | null | undefined,
): ExpressionSpeedDirection {
  const scoreA = expressionSpeedScore(profileA);
  const scoreB = expressionSpeedScore(profileB);
  if (scoreA == null || scoreB == null) return "balanced";
  const gap = scoreA - scoreB;
  if (Math.abs(gap) < GAP_THRESHOLD) return "balanced";
  return gap > 0 ? "A" : "B";
}

/**
 * "겉보기 속도"(위 bandA/B, 심리축)와 별개로 "내부 잔류도"를 사주로 판정.
 * 인성(seal) 우세 + 일지 충형이 많을수록 감정이 안에서 오래 남는다고 본다.
 * 자기통제가 높아 겉으론 빨라 보여도 잔류도가 높으면 실제로는 안 풀린 상태일 수 있다.
 */
export function resolveResidualBand(romantic: RomanticSajuSignals): ResidualBand {
  const sealCount = romantic.affection_language.seal_count;
  const tensionHits = romantic.conflict_response.day_branch_tension_hits.length;
  if (sealCount >= 2 || tensionHits >= RESIDUAL_TENSION_HITS) return "lingers";
  if (sealCount === 0 && tensionHits === 0) return "clears_fast";
  return "moderate";
}

// ---- ③ 안심 신호 (관계공감 + 사주 일간 뿌리) ------------------------------------

export function resolveReassuranceBand(
  profile: CurrentSelfProfile | null | undefined,
  dayStemRooted: boolean,
): ReassuranceBand {
  const empathy = axisScore(profile, "empathy");
  const highEmpathy = empathy != null && empathy >= EMPATHY_HIGH;
  if (highEmpathy && dayStemRooted) return "both";
  if (dayStemRooted) return "behavior_proof";
  if (highEmpathy) return "listening";
  return "presence";
}

/** 5개 카테고리 카운트 중 우세한 것 — "이 사람이 자연스럽게 주는" 안심 방식. 동률은 고정 우선순위로 정리. */
export function resolveGiveStyle(romantic: RomanticSajuSignals): GiveStyle {
  const counts: Array<[GiveStyle, number]> = [
    ["care", romantic.affection_language.seal_count],
    ["consistency", romantic.conflict_response.officer_count],
    ["action", romantic.affection_language.wealth_count],
    ["expression", romantic.expression_style.food_count],
    ["solidarity", romantic.communication_style.self_count],
  ];
  // 동률이면 위 순서(care>consistency>action>expression>solidarity)로 고정 — 임의 흔들림 방지.
  let best = counts[0]!;
  for (const c of counts) {
    if (c[1] > best[1]) best = c;
  }
  return best[0];
}

const GIVE_STYLE_COMPATIBLE_WITH_NEED: Record<ReassuranceBand, GiveStyle[]> = {
  listening: ["expression", "care"],
  behavior_proof: ["action", "consistency"],
  both: ["expression", "care", "action", "consistency", "solidarity"],
  presence: ["solidarity"],
};

/** A의 need(안심 요구)를 B의 give_style(안심 제공 방식)이 실제로 채워주는지. */
export function resolveReassuranceMatch(
  needBand: ReassuranceBand,
  partnerGiveStyle: GiveStyle,
): boolean {
  return GIVE_STYLE_COMPATIBLE_WITH_NEED[needBand].includes(partnerGiveStyle);
}

// ---- ④ 무의식적 역할극 (자기통제 + 관계공감 격차) --------------------------------

function caretakingGap(
  profileA: CurrentSelfProfile | null | undefined,
  profileB: CurrentSelfProfile | null | undefined,
): { total: number; empathyDiff: number; controlDiff: number } | null {
  const empA = axisScore(profileA, "empathy");
  const empB = axisScore(profileB, "empathy");
  const ctrlA = axisScore(profileA, "self_control");
  const ctrlB = axisScore(profileB, "self_control");
  if (empA == null || empB == null || ctrlA == null || ctrlB == null) return null;
  return {
    total: empA + ctrlA - (empB + ctrlB),
    empathyDiff: empA - empB,
    controlDiff: ctrlA - ctrlB,
  };
}

export function resolveUnconsciousRolePlay(
  profileA: CurrentSelfProfile | null | undefined,
  profileB: CurrentSelfProfile | null | undefined,
): RolePlayBand {
  const gap = caretakingGap(profileA, profileB);
  if (gap == null || Math.abs(gap.total) < GAP_THRESHOLD) return "peer";
  const empathyContribution = Math.abs(gap.empathyDiff);
  const controlContribution = Math.abs(gap.controlDiff);
  if (empathyContribution > controlContribution + ROLE_CONTRIBUTION_MARGIN) {
    return "savior_dependent";
  }
  if (controlContribution > empathyContribution + ROLE_CONTRIBUTION_MARGIN) {
    return "mentor_student";
  }
  return "parent_child";
}

/**
 * 심리축 판정(primaryFrame)과 별개로, 인성+관성(구조·보살핌 담당력) 비대칭과
 * 일간 상호작용(상생/상극/비화)으로 사주 쪽 프레임을 독립적으로 계산해 병기한다.
 * 둘이 일치하면 확신도가 높다는 뜻이고, 다르면 둘 다 보여준다(하나로 강제 병합하지 않음).
 */
export function resolveSajuFrame(
  romanticA: RomanticSajuSignals,
  romanticB: RomanticSajuSignals,
  dayStemInteraction: string,
): RolePlayBand {
  const structureA =
    romanticA.affection_language.seal_count + romanticA.conflict_response.officer_count;
  const structureB =
    romanticB.affection_language.seal_count + romanticB.conflict_response.officer_count;
  const gap = structureA - structureB;
  if (Math.abs(gap) < SAJU_COUNT_GAP) return "peer";
  if (dayStemInteraction.includes("상생")) return "parent_child";
  if (dayStemInteraction.includes("상극")) return "mentor_student";
  return "savior_dependent";
}

export type SajuFrameDirection = "A" | "B" | "balanced";

/**
 * Part3② special_bond 역할 배정 전용 — resolveSajuFrame과 같은 원천 신호
 * (인성+관성 합산)를 쓰지만, 그쪽은 방향성 없는 밴드만 반환해 unconscious_role_play
 * digest 줄에 쓰이고 있어 그대로 둔다. special_bond는 "누가 안식처/보호자 역인지"
 * 방향이 반드시 필요해서 별도 함수로 분리 — 높은 쪽이 안식처 역(스펙의 관성/인성=
 * 스승/보호자), 낮은 쪽이 온기 역(식상/비겁=아이/동반자 방향의 간이 근사).
 */
export function resolveSajuFrameDirection(
  romanticA: RomanticSajuSignals,
  romanticB: RomanticSajuSignals,
): SajuFrameDirection {
  const structureA =
    romanticA.affection_language.seal_count + romanticA.conflict_response.officer_count;
  const structureB =
    romanticB.affection_language.seal_count + romanticB.conflict_response.officer_count;
  const gap = structureA - structureB;
  if (Math.abs(gap) < SAJU_COUNT_GAP) return "balanced";
  return gap > 0 ? "A" : "B";
}

// ---- ⑤ 교차 사주 갈등 신호 (충형해파) --------------------------------------
//
// analyzeCrossChartRelations(pairChartAnalysis.ts)가 이미 두 사람 원국을
// 궁위 가중치까지 계산해 산출하는 충/형/파/해 히트를 갈등 해석의 구조적 근거로
// 요약한다. 육합(조화)은 갈등 신호가 아니므로 제외. 새 사주 계산을 만들지
// 않고 기존 CrossChartHit[]만 재사용한다.

export type CrossChartTensionBand = "high" | "moderate" | "none";
export type CrossChartTensionType = "충" | "형" | "파" | "해";

export type CrossChartTensionResult = {
  band: CrossChartTensionBand;
  dominantType: CrossChartTensionType | null;
  hitCount: number;
  /** 이미 필터·정렬된 tensionHits 전체 — 집계 외 개별 히트 보존용. */
  hits: CrossChartHit[];
};

const CROSS_TENSION_TYPES = new Set<CrossChartTensionType>(["충", "형", "파", "해"]);
const CROSS_TENSION_HIGH_HIT_COUNT = 2;

function isCrossChartTensionType(v: string): v is CrossChartTensionType {
  return CROSS_TENSION_TYPES.has(v as CrossChartTensionType);
}

/**
 * 일주 교차 히트(dayBranchCrossHits) 중 충/형/파/해만 걸러 밴드로 요약한다.
 * hitCount>=2면 high, 1개면 moderate, 0개면 none. dominantType은 궁위
 * 가중치가 가장 높은 히트(입력이 이미 weightedPriority 내림차순 정렬됨을 가정).
 */
export function resolveCrossChartTension(
  crossHits: CrossChartHit[],
): CrossChartTensionResult {
  const tensionHits = crossHits
    .filter((h) => isCrossChartTensionType(h.type))
    .sort((a, b) => b.weightedPriority - a.weightedPriority);
  if (tensionHits.length === 0) {
    return { band: "none", dominantType: null, hitCount: 0, hits: [] };
  }
  const dominant = tensionHits[0]!;
  const band: CrossChartTensionBand =
    tensionHits.length >= CROSS_TENSION_HIGH_HIT_COUNT ? "high" : "moderate";
  return {
    band,
    dominantType: dominant.type as CrossChartTensionType,
    hitCount: tensionHits.length,
    hits: tensionHits,
  };
}

export type RolePlayResult = {
  primaryFrame: RolePlayBand;
  sajuFrame: RolePlayBand;
  agrees: boolean;
};

export function resolveRolePlayWithSajuFrame(
  profileA: CurrentSelfProfile | null | undefined,
  profileB: CurrentSelfProfile | null | undefined,
  romanticA: RomanticSajuSignals,
  romanticB: RomanticSajuSignals,
  dayStemInteraction: string,
): RolePlayResult {
  const primaryFrame = resolveUnconsciousRolePlay(profileA, profileB);
  const sajuFrame = resolveSajuFrame(romanticA, romanticB, dayStemInteraction);
  return { primaryFrame, sajuFrame, agrees: primaryFrame === sajuFrame };
}

// ---- Part1① 종합 관계 지수(친밀·끌림/갈등·긴장) — 11축 확인 문구 ----------------
//
// computeRelationshipEventScores(pairEventScores.ts)의 intimacy/conflict 원점수는
// grade(triScoreToGrade)에도 쓰이는 넓은 영향 범위라 손대지 않는다. 대신
// buildSnapshotNarrative.ts::interpretTopic이 이미 만드는 해석 문장에, 관계공감/
// 갈등직면성 11축으로 확인/유보하는 문구만 별도로 덧붙인다(친구 Batch 1과 동일한
// non-invasive 원칙). 안정·균형(stability)은 스펙이 특정 11축을 지정하지 않아 대상 아님.

/** Part1① 친밀·끌림 — 관계공감(empathy) 평균으로 확인/유보 */
export function resolveIntimacyAxisNote(
  profileA: CurrentSelfProfile | null | undefined,
  profileB: CurrentSelfProfile | null | undefined,
  locale?: RomanticHeadlineLocale,
): string | null {
  const empathyA = axisScore(profileA, "empathy");
  const empathyB = axisScore(profileB, "empathy");
  if (empathyA == null || empathyB == null) return null;
  const avg = (empathyA + empathyB) / 2;
  if (avg >= AXIS_NOTE_EMPATHY_HIGH) {
    return pick(
      locale,
      "Your empathy axis scores are both on the high side, so the attraction your charts show has a good chance of coming through in how you actually feel.",
      "관계공감 축도 둘 다 높은 편이라, 사주로 보이는 끌림이 실제 느낌으로도 잘 이어질 가능성이 커요.",
    );
  }
  if (avg <= AXIS_NOTE_EMPATHY_LOW) {
    return pick(
      locale,
      "Your empathy axis is on the low side, so even with attraction present, it may take a bit more conscious effort for it to come through as expression.",
      "관계공감 축은 낮은 편이라, 끌림이 있어도 표현으로 이어지려면 조금 더 의식적인 노력이 필요할 수 있어요.",
    );
  }
  return null;
}

/** Part1① 갈등·긴장 — 갈등직면성(conflict_style) 격차로 확인 */
export function resolveConflictAxisNote(
  profileA: CurrentSelfProfile | null | undefined,
  profileB: CurrentSelfProfile | null | undefined,
  locale?: RomanticHeadlineLocale,
): string | null {
  const conflictA = axisScore(profileA, "conflict_style");
  const conflictB = axisScore(profileB, "conflict_style");
  if (conflictA == null || conflictB == null) return null;
  const gap = Math.abs(conflictA - conflictB);
  if (gap >= AXIS_NOTE_CONFLICT_GAP) {
    return pick(
      locale,
      "The gap in how you each face conflict (conflict-facing axis) is also fairly wide, so the tension you feel when you clash may run higher than what your charts alone suggest.",
      "갈등을 대하는 방식(갈등직면성) 격차도 큰 편이라, 부딪힐 때 체감 긴장이 사주 신호보다 더 크게 느껴질 수 있어요.",
    );
  }
  return null;
}
