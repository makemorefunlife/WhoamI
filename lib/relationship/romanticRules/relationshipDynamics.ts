import { getHiddenStemsData, calculateTwelveStage } from "@/lib/saju/repository";
import type { ChartContext } from "@/lib/saju/chartContext";
import type { CurrentSelfProfile, SecondaryAxisKey } from "@/lib/v2/survey/types";
import type { RomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";
import { normalizeRomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";

/**
 * Consolidation Batch B — compatibility shim.
 *
 * The actual pair-dynamics calculations (resolveBalanceOfPower,
 * resolveRecoverySpeedGap, resolveExpressionSpeedDirection,
 * resolveUnconsciousRolePlay, resolveReassuranceBand/Match/GiveStyle,
 * resolveSajuFrame(Direction), resolveCrossChartTension, resolveSubLeads,
 * resolveResidualBand, resolveRolePlayWithSajuFrame, and all their result
 * types) have moved to lib/relationship/romantic/romanticPairDynamics.ts —
 * byte-identical behavior, re-exported here so every existing import path
 * (romanticSajuPromptDigest.ts, romanticSajuDeep/index.ts,
 * romanticContextInput.ts, and the *.test.mjs files under tests/) keeps
 * working unchanged. Do not add new calculation logic to this file — add
 * it to romanticPairDynamics.ts and it will appear here automatically.
 *
 * What stays here (not pair-dynamics calculation, so not moved):
 * - pick(): locale string selector, used throughout this whole file cluster.
 * - hasDayStemRootInDayBranch(): an INDIVIDUAL-chart-level fact (shared
 *   verbatim with bedroomProfile.ts/extractCohabitationSignals.ts), not a
 *   pair calculation — moving it would risk a second, drifting copy.
 * - resolveIntimacyAxisNote/resolveConflictAxisNote: narrative copy
 *   (localized sentences), not calculation — classified REPLACE, not KEEP,
 *   in the consolidation audit; left in place pending V1 retirement.
 */
export type {
  BalanceOfPowerBand,
  RecoverySpeedBand,
  ReassuranceBand,
  RolePlayBand,
  SubLeadBand,
  ResidualBand,
  GiveStyle,
  BalanceOfPowerResult,
  SubLeadResult,
  RecoverySpeedResult,
  ExpressionSpeedDirection,
  CrossChartTensionBand,
  CrossChartTensionType,
  CrossChartTensionResult,
  SajuFrameDirection,
  RolePlayResult,
} from "../romantic/romanticPairDynamics";
export {
  resolveBalanceOfPower,
  resolveSubLeads,
  resolveRecoverySpeedGap,
  resolveExpressionSpeedDirection,
  resolveResidualBand,
  resolveReassuranceBand,
  resolveGiveStyle,
  resolveReassuranceMatch,
  resolveUnconsciousRolePlay,
  resolveSajuFrame,
  resolveSajuFrameDirection,
  resolveCrossChartTension,
  resolveRolePlayWithSajuFrame,
} from "../romantic/romanticPairDynamics";

/** en/ko 문구 선택 — dayStemRomanticProfile.ts와 동일한 정규화 컨벤션. */
export function pick(
  locale: RomanticHeadlineLocale | undefined,
  en: string,
  ko: string,
): string {
  return normalizeRomanticHeadlineLocale(locale) === "en" ? en : ko;
}

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

// ---- Part1① 종합 관계 지수(친밀·끌림/갈등·긴장) — 11축 확인 문구 ----------------
//
// computeRelationshipEventScores(pairEventScores.ts)의 intimacy/conflict 원점수는
// grade(triScoreToGrade)에도 쓰이는 넓은 영향 범위라 손대지 않는다. 대신
// buildSnapshotNarrative.ts::interpretTopic이 이미 만드는 해석 문장에, 관계공감/
// 갈등대처 11축으로 확인/유보하는 문구만 별도로 덧붙인다(친구 Batch 1과 동일한
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

/** Part1① 갈등·긴장 — 갈등대처(conflict_style) 격차로 확인 */
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
      "갈등을 대하는 방식(갈등대처) 격차도 큰 편이라, 부딪힐 때 체감 긴장이 사주 신호보다 더 크게 느껴질 수 있어요.",
    );
  }
  return null;
}
