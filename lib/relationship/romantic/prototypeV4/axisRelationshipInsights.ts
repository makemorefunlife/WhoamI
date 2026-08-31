/**
 * Single source of truth for turning a raw 11-axis psych-match result into a
 * relationship-consequence insight: which axes are worth surfacing (scored on
 * significance, not raw gap alone) and what each state of each axis actually
 * means for a couple. Used by both the server-side payload builder
 * (selectAxisInsights) and the client-side "always render" fallback
 * (adaptRadarHighlights) so neither path can regress into a single reused
 * generic sentence again.
 *
 * State thresholds and significance both key off the same calibrated
 * per-axis score range / gap percentiles the rest of the psych-match system
 * already uses (AXIS_GAP_PERCENTILES, simulated over the full v2 survey
 * combinatorial space) — see the threshold-audit note above
 * classifyAxisState for why absolute 0-100 cutoffs were wrong here.
 */
import type { RomanticCompareRowKey } from "../romanticComparisonTableCanonical";
import type { RomanticPsychMatchAxisResult } from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { SCORE_BASELINE } from "@/lib/v2/survey/scoringMap";
import { psychMatchAxisLabel, scoreToAxisRatio, getAxisGapPercentiles } from "@/lib/relationship/psychMatch";
import { josaGwaWa, josaEunNeun, josaIGa } from "./romanticLanguage";
import type { AxisInsightRow, AxisSelectionRejected, ConfidenceLevel, PrototypeLocale } from "./types";

/** Which axis maps onto an existing Saju comparison-table row (used to avoid saying the same thing twice). */
export const AXIS_TO_COMPARE_ROW: Partial<Record<string, RomanticCompareRowKey>> = {
  conflict_style: "conflict",
  stimulation: "stress",
  self_control: "stress",
  empathy: "communication",
  thinking_style: "communication",
  decision_style: "decision",
  practicality: "decision",
  structure: "decision",
  energy_style: "affection",
};

export function confidenceFromGap(gap: number): ConfidenceLevel {
  if (gap >= 28) return "high";
  if (gap >= 16) return "medium";
  if (gap >= 10) return "low";
  return "tentative";
}

/**
 * Six requested situations collapse to five content buckets: "A high / B low"
 * and "A low / B high" are the same relationship dynamic mirrored, so they
 * share one direction-aware write-up (asymmetric_extreme) that names whoever
 * is actually higher/lower at render time, rather than two near-duplicate
 * hardcoded copies.
 */
export type AxisState = "both_high" | "both_low" | "both_mid" | "asymmetric_extreme" | "moderate_diff";

/**
 * THRESHOLD AUDIT (do not re-loosen without re-reading this):
 *
 * The 11 psych axes are NOT scored on a real 0-100 range. AXIS_GAP_PERCENTILES
 * (lib/relationship/psychMatch/gapPercentiles.ts) is derived from simulating
 * the full v2 survey's 262,144-profile combinatorial space and recording each
 * axis's actual achievable [scoreMin, scoreMax] — e.g. stimulation only ever
 * ranges 49-63, decision_style 50-69, conflict_style a mere 48-55. An earlier
 * version of this file used ABSOLUTE cutoffs (high>=70, low<=35) that are
 * mathematically unreachable for 10 of 11 axes — both_high/both_low/
 * asymmetric_extreme could never fire on real data.
 *
 * This version classifies each person's position as a PERCENTILE within
 * their own axis's real range (scoreToAxisRatio, already used by the radar
 * chart for the same reason) instead: top 30% of the real range = "high",
 * bottom 30% = "low". The 0.7/0.3 split itself is a design choice, not
 * derived from an actual score histogram (we have the calibrated min/max
 * simulation but not a real density curve within it) — NEEDS DATA: pull a
 * histogram of real production secondary_axes values per axis and confirm
 * 30/30 isn't over- or under-firing before trusting the exact split.
 *
 * The "is this gap actually unusual" question reuses the EXISTING calibrated
 * signal instead of inventing another one: RomanticPsychMatchAxisResult's own
 * match_type already comes from classifyPsychMatchType's per-axis p60/p90 gap
 * percentiles (simulated over 10,000 sampled pairs). similarity/complementary/
 * tension is passed straight through rather than re-derived here.
 */
const HIGH_RATIO = 0.7;
const LOW_RATIO = 0.3;

function positionOf(ratio: number): "high" | "low" | "mid" {
  if (ratio >= HIGH_RATIO) return "high";
  if (ratio <= LOW_RATIO) return "low";
  return "mid";
}

/**
 * Untouched-baseline guard (found via production-path QA, not a percentile
 * guess): the v2 survey's neutral default is SCORE_BASELINE=50 for every
 * axis, but per-axis achievable ranges are NOT centered on 50 — practicality,
 * structure, thinking_style, and decision_style all have scoreMin exactly 50,
 * and stimulation/self_control/empathy/recognition bottom out at 49. That
 * means a person who never answered anything that moves a given axis reads
 * as sitting at or barely above that axis's real floor, which the percentile
 * classifier below would otherwise call "low" — and BOTH people doing this
 * simultaneously (extremely common — most real pairs won't have deliberately
 * distinguishing answers on every one of 10 axes) would wrongly register as
 * a significant shared-extremity "both_low" finding for axes neither of them
 * actually expressed anything about. 50 is a sentinel for "no signal", not a
 * real observed low score, so it's forced to both_mid regardless of ratio.
 * SCORE_BASELINE is imported from the actual scoring engine (scorer.ts uses
 * it as `clampScore(SCORE_BASELINE + delta)`) rather than redeclared here,
 * so this guard can never silently drift out of sync with the real default.
 */

export function classifyAxisState(
  axisKey: string,
  scoreA: number,
  scoreB: number,
  matchType: string,
): AxisState {
  if (scoreA === SCORE_BASELINE && scoreB === SCORE_BASELINE) {
    return "both_mid";
  }
  const ratioA = scoreToAxisRatio(axisKey as Parameters<typeof scoreToAxisRatio>[0], scoreA);
  const ratioB = scoreToAxisRatio(axisKey as Parameters<typeof scoreToAxisRatio>[0], scoreB);
  const posA = positionOf(ratioA);
  const posB = positionOf(ratioB);

  if ((posA === "high" && posB === "low") || (posA === "low" && posB === "high")) {
    return "asymmetric_extreme";
  }
  if (posA === posB) {
    if (posA === "high") return "both_high";
    if (posA === "low") return "both_low";
    // both mid: only "nothing to say" if the calibrated gap is ALSO typical
    // for this axis — a mid/mid pair whose gap is still statistically
    // unusual for this specific axis (match_type !== similarity) is real.
    return matchType === "similarity" ? "both_mid" : "moderate_diff";
  }
  // one high/low, the other mid: a real but non-extreme difference.
  return "moderate_diff";
}

/** Soft tie-breaker only — axes whose difference tends to show up in daily friction rank slightly higher. */
const AXIS_RELEVANCE_WEIGHT: Partial<Record<string, number>> = {
  structure: 1.15,
  empathy: 1.15,
  resilience: 1.1,
  energy_style: 1.1,
  self_control: 1.05,
  stimulation: 1.05,
};

/**
 * Topic already covered by the Saju comparison table elsewhere in the report
 * — a SOFT demotion (not a near-disqualifying tax). An earlier version used
 * -12, which combined with AXIS_TO_COMPARE_ROW mapping 8 of 10 axes onto just
 * 4 comparison rows meant almost every axis was penalized almost always
 * (confirmed via production trace: 8/10 axes hit this on a real fixture),
 * letting the 2 unmapped axes (recognition, resilience) win selection slots
 * mainly by being exempt from a near-universal tax rather than by being more
 * significant. A true semantic-duplication check (does the Saju row's actual
 * claim overlap this axis's direction?) would be more correct but requires
 * comparing generated prose, not just row identity — flagged as a follow-up,
 * not implemented here.
 */
const OWNERSHIP_COLLISION_PENALTY = 4;

/** First 2 cards of a given state are free; only the 3rd+ gets nudged down, and only enough to break a near-tie — never enough to bury a clearly-stronger candidate. */
export const STATE_REPEAT_SOFT_PENALTY = 5;
const STATE_REPEAT_FREE_COUNT = 2;

export function computeAxisSignificance(params: {
  axisKey: string;
  state: AxisState;
  scoreA: number;
  scoreB: number;
  ownershipCollision: boolean;
}): number {
  const { axisKey, state, scoreA, scoreB, ownershipCollision } = params;
  const { maxGap } = getAxisGapPercentiles(axisKey as Parameters<typeof getAxisGapPercentiles>[0]);
  const gap = Math.abs(scoreA - scoreB);
  const gapRatio = maxGap > 0 ? Math.min(1, gap / maxGap) : 0;
  const ratioA = scoreToAxisRatio(axisKey as Parameters<typeof scoreToAxisRatio>[0], scoreA);
  const ratioB = scoreToAxisRatio(axisKey as Parameters<typeof scoreToAxisRatio>[0], scoreB);
  // 0 (dead center of this axis's real range) .. 0.5 (at the edge of it).
  const avgExtremity = Math.abs((ratioA + ratioB) / 2 - 0.5);

  let base: number;
  switch (state) {
    // Shared extremity carries relationship significance on its own — a
    // couple who are BOTH near the top (or bottom) of what's actually
    // achievable on a trait has a real, nameable dynamic even at gap 0.
    case "both_high":
    case "both_low":
      base = 24 + avgExtremity * 40;
      break;
    case "both_mid":
      base = 4 + gapRatio * 10;
      break;
    case "asymmetric_extreme":
      base = 30 + gapRatio * 20;
      break;
    case "moderate_diff":
      base = 12 + gapRatio * 26;
      break;
  }
  const relevance = AXIS_RELEVANCE_WEIGHT[axisKey] ?? 1;
  let score = base * relevance;
  if (ownershipCollision) score -= OWNERSHIP_COLLISION_PENALTY;
  return Math.round(score * 10) / 10;
}

type ContentEntry = { ko: string; en: string };
type AxisContentBank = Partial<Record<string, Record<AxisState, ContentEntry>>>;

/** Short, reusable per-axis topic phrase — the hook combines this with a state+direction frame instead of a mechanical "differ -> friction" template repeated across axes. */
const AXIS_TOPIC_PHRASE: Partial<Record<string, ContentEntry>> = {
  stimulation: { ko: "새로운 자극을 원하는 정도", en: "how much new stimulation you crave" },
  self_control: { ko: "감정을 표현하거나 억누르는 속도", en: "how fast you express versus hold in emotion" },
  practicality: { ko: "실용성과 의미 중 무엇을 앞세우는지", en: "whether you lead with practicality or with meaning" },
  structure: { ko: "약속·여행·일정을 준비하는 방식", en: "how you plan schedules, trips, and commitments" },
  empathy: { ko: "상대 감정을 알아차리는 예민함", en: "how sensitively you pick up on each other's feelings" },
  resilience: { ko: "다툰 뒤 회복하는 속도", en: "how fast you recover after a fight" },
  recognition: { ko: "잘한 일을 인정받고 싶어 하는 정도", en: "how much you need to be recognized for what you do" },
  energy_style: { ko: "사회적 에너지를 충전하는 방식", en: "how you recharge your social energy" },
  thinking_style: { ko: "감정을 원인부터 따지는지, 그냥 느끼는지", en: "whether you trace the cause or just feel it" },
  decision_style: { ko: "결정을 내리는 속도와 신중함", en: "how quickly or carefully you decide" },
};
const FALLBACK_TOPIC: ContentEntry = { ko: "이 성향", en: "this trait" };

/**
 * Axis+state+direction-aware opening line for a card. Deliberately built
 * from a per-axis topic phrase (10 entries) x 5 shared state frames instead
 * of 10x5 hardcoded hooks — same maintenance shape as getAxisWhyItMatters's
 * content bank, but reusing the topic phrase keeps a second full sentence
 * matrix from having to be hand-written and kept in sync.
 */
export function buildAxisRelationshipHook(params: {
  axisKey: string;
  state: AxisState;
  scoreA: number;
  scoreB: number;
  nameA: string;
  nameB: string;
  locale: PrototypeLocale;
}): string {
  const { axisKey, state, scoreA, scoreB, nameA, nameB, locale } = params;
  const isEn = locale === "en-US";
  const topicEntry = AXIS_TOPIC_PHRASE[axisKey] ?? FALLBACK_TOPIC;
  const topic = isEn ? topicEntry.en : topicEntry.ko;
  const higher = scoreA >= scoreB ? nameA : nameB;
  const lower = scoreA >= scoreB ? nameB : nameA;

  if (isEn) {
    switch (state) {
      case "both_high":
        return `On ${topic}, ${nameA} and ${nameB} are both clearly strong, so this rarely causes friction between you.`;
      case "both_low":
        return `On ${topic}, ${nameA} and ${nameB} are both on the low side, so neither of you has to adjust much for the other here.`;
      case "both_mid":
        return `On ${topic}, ${nameA} and ${nameB} both sit in an easygoing middle range, so this isn't a wildcard between you.`;
      case "asymmetric_extreme":
        return `On ${topic}, ${higher} is clearly strong and ${lower} is clearly the opposite, so the gap here can feel very real day to day.`;
      case "moderate_diff":
        return `On ${topic}, ${higher} leans noticeably stronger and ${lower} noticeably less so.`;
    }
  }
  const pairKo = `${josaGwaWa(nameA)} ${nameB}`;
  switch (state) {
    case "both_high":
      return `${topic}에서는 ${pairKo} 둘 다 뚜렷하게 강한 편이라, 이 지점에서는 서로 크게 부딪히지 않아요.`;
    case "both_low":
      return `${topic}에서는 ${pairKo} 둘 다 낮은 편이라, 이 지점에서는 굳이 서로 맞출 필요가 없어요.`;
    case "both_mid":
      return `${topic}에서는 ${pairKo} 둘 다 무난한 중간형이라, 이 축이 관계의 변수가 되지는 않아요.`;
    case "asymmetric_extreme":
      return `${topic}에서 ${josaEunNeun(higher)} 뚜렷하게 강한 편이고 ${josaEunNeun(lower)} 뚜렷하게 약한 편이라, 이 지점에서 체감 차이가 크게 느껴질 수 있어요.`;
    case "moderate_diff":
      return `${topic}에서 ${josaIGa(higher)} 조금 더 강하고 ${josaEunNeun(lower)} 상대적으로 덜한 편이에요.`;
  }
}

/**
 * Every entry states a shared/differing behavior AND its relationship
 * consequence (never just a trait label) per axis per state, so no two
 * axis/state combinations read the same and no axis falls back to a shared
 * generic line. asymmetric_extreme entries name how EACH side is likely to
 * feel/react (not just what differs) so "A high / B low" and "A low / B
 * high" are never just a name swap. conflict_style is intentionally absent
 * — it already has its own dedicated comparison section and stays excluded
 * from this card set.
 */
const AXIS_INSIGHT_CONTENT: AxisContentBank = {
  thinking_style: {
    both_high: {
      ko: "두 사람 다 감정보다 원인과 구조를 먼저 따지는 편이라, 갈등이 생겨도 문제의 뿌리를 빠르게 짚어낼 수 있어요. 다만 감정을 충분히 느끼기도 전에 분석부터 시작하면 서로가 차갑다고 느낄 수 있으니, 가끔은 설명 없이 그냥 들어주는 시간도 필요해요.",
      en: "You both reach for the cause and structure before the feeling, so you can get to the root of a conflict fast. But starting to analyze before either of you has actually felt the emotion can come across as cold, so you both still need moments of just listening without explaining.",
    },
    both_low: {
      ko: "두 사람 다 상황을 직관적으로 느끼고 반응하는 편이라, 대화에 설명이 많지 않아도 분위기로 서로를 이해할 수 있어요. 다만 문제의 원인을 짚지 않고 넘어가는 습관이 쌓이면, 같은 다툼이 이유도 모른 채 반복될 수 있어요.",
      en: "You both read situations intuitively and react by feel, so you can understand each other from the mood alone without much explaining. But if neither of you ever names the actual cause, the same fight can keep resurfacing without either of you knowing why.",
    },
    both_mid: {
      ko: "두 사람 다 상황에 따라 분석적으로 볼 때도, 감으로 받아들일 때도 있는 균형 잡힌 편이라, 대화 방식 자체가 갈등의 원인이 되는 경우는 드물어요.",
      en: "You both switch between analyzing and going with your gut depending on the situation, so how you process things rarely becomes a source of conflict on its own.",
    },
    asymmetric_extreme: {
      ko: "한 사람은 감정도 원인부터 짚고 넘어가야 정리가 되는 편이고, 다른 사람은 이유를 따지기보다 일단 느끼고 흘려보내는 편이라, 같은 상황을 두고 한쪽은 '왜 그랬는지 설명해달라'고 하고 다른 쪽은 '그냥 넘어가면 안 되냐'고 답답해할 수 있어요.",
      en: "One of you needs to trace the cause before you can settle a feeling, while the other would rather just feel it and move on — so over the same moment, one keeps asking 'explain why,' and the other gets frustrated wondering 'can we just let it go.'",
    },
    moderate_diff: {
      ko: "한쪽이 조금 더 이유를 따지는 편이고 다른 쪽은 조금 더 감정을 있는 그대로 받아들이는 편이라, 진지한 대화를 할 때 원하는 설명의 깊이가 미묘하게 어긋날 수 있어요.",
      en: "One of you leans a bit more toward working out the reason, the other toward taking the feeling at face value, so in serious conversations you can quietly want different amounts of explanation.",
    },
  },
  self_control: {
    both_high: {
      ko: "두 사람 다 감정이 격해져도 즉흥적으로 터뜨리기보다 참고 조절하는 편이라, 큰 소리 나는 다툼은 적을 수 있어요. 다만 서로 너무 잘 참다 보면 진짜 불만이 쌓이고 있다는 걸 상대가 늦게 알아차릴 수 있어요.",
      en: "You both tend to hold and manage strong emotions rather than let them burst out, so loud fights are rare. But if you're both this good at holding back, real frustration can build up quietly for a long time before the other one notices.",
    },
    both_low: {
      ko: "두 사람 다 감정이 올라오면 바로 표현하는 편이라, 화가 났는지 서운한지 굳이 묻지 않아도 금방 알 수 있어요. 다만 둘 다 순간적으로 욱하면 작은 일도 빠르게 큰 다툼으로 번질 수 있어요.",
      en: "You both express what you feel the moment it rises, so you rarely have to ask whether the other is upset. But when you both flare up at the same time, a small thing can escalate into a real fight fast.",
    },
    both_mid: {
      ko: "두 사람 다 상황에 따라 참을 때도, 바로 표현할 때도 있는 편이라, 감정 조절 방식 자체가 관계의 약점이 되지는 않아요.",
      en: "You both hold back sometimes and speak up right away other times, so how you regulate emotion doesn't become a weak point on its own.",
    },
    asymmetric_extreme: {
      ko: "한 사람은 화가 나도 일단 누르고 정리한 뒤에 말하는 편이고, 다른 사람은 감정이 올라오는 즉시 표현하는 편이라, 참는 쪽은 상대가 성급하다고 느끼고 즉각적인 쪽은 상대가 속을 안 보여준다고 느끼기 쉬워요.",
      en: "One of you holds anger in and sorts it out before speaking, while the other says it the instant it rises — so the one who holds back reads the other as rash, and the one who speaks up feels shut out.",
    },
    moderate_diff: {
      ko: "한쪽이 조금 더 감정을 눌러두는 편이고 다른 쪽은 조금 더 바로 드러내는 편이라, 다툰 직후 서로가 원하는 '정리할 시간'의 길이가 다를 수 있어요.",
      en: "One of you leans toward holding a feeling in, the other toward showing it right away, so right after a fight you can want very different lengths of time to cool off.",
    },
  },
  practicality: {
    both_high: {
      ko: "두 사람 다 낭만보다 실속을 먼저 따지는 편이라, 데이트 비용이나 미래 계획 같은 현실적인 이야기를 부담 없이 주고받을 수 있어요. 다만 둘 다 효율만 앞세우다 보면 이벤트나 서프라이즈 같은 정서적 표현이 부족하다고 느껴질 수 있어요.",
      en: "You both weigh what's practical before what's romantic, so money and future planning are easy topics between you. But if efficiency always wins, the relationship can start to feel short on surprises and emotional gestures.",
    },
    both_low: {
      ko: "두 사람 다 실용성보다 의미와 분위기를 중요하게 여기는 편이라, 기념일이나 작은 이벤트에 마음을 쓰는 결이 잘 맞아요. 다만 둘 다 현실적인 계산에는 약해서, 돈이나 시간 관리처럼 실질적인 부분에서 구멍이 날 수 있어요.",
      en: "You both value meaning and mood over practicality, so you're naturally aligned on caring about anniversaries and small gestures. But neither of you is strong on the practical math, so money or time management can quietly slip through the cracks.",
    },
    both_mid: {
      ko: "두 사람 다 실속과 의미 사이에서 상황에 맞게 균형을 잡는 편이라, 소비나 계획을 두고 가치관 차이로 부딪힐 일은 적어요.",
      en: "You both balance practicality and meaning depending on the situation, so clashing over spending or plans on values alone is unlikely.",
    },
    asymmetric_extreme: {
      ko: "한 사람은 선물이나 데이트도 실용성을 먼저 따지는 편이고, 다른 사람은 의미와 감동을 더 중요하게 여기는 편이라, 실용적인 쪽이 고른 선물을 상대는 '성의가 없다'고 느끼고, 반대로 의미를 중시하는 쪽의 선택을 실용적인 쪽은 '낭비'라고 느낄 수 있어요.",
      en: "One of you picks gifts and dates by usefulness first, the other by meaning and emotion — so the practical pick can land as thoughtless, while the sentimental pick can look like a waste of money to the practical one.",
    },
    moderate_diff: {
      ko: "한쪽이 조금 더 현실적인 계산을 앞세우고 다른 쪽은 조금 더 의미를 우선하는 편이라, 데이트나 선물을 정할 때 은근히 취향이 갈릴 수 있어요.",
      en: "One of you leans a bit more toward the practical calculation, the other toward meaning, so picking a date or a gift can quietly reveal different priorities.",
    },
  },
  structure: {
    both_high: {
      ko: "두 사람 다 미리 계획하고 정리해야 마음이 편한 편이라, 여행이나 약속을 정할 때 손발이 잘 맞아요. 다만 둘 다 계획이 틀어지는 상황에는 약해서, 갑작스러운 변수가 생기면 평소보다 더 예민해질 수 있어요.",
      en: "You both feel settled only once things are planned out, so you sync up easily on trips and plans. But you're both weak to a plan falling apart, so a sudden change can make you more on edge than usual — together.",
    },
    both_low: {
      ko: "두 사람 다 그때그때 상황에 맞춰 움직이는 편이라, 즉흥적인 데이트나 갑작스러운 일정 변경에도 서로 스트레스가 적어요. 다만 중요한 약속조차 구체적으로 정해두지 않는 습관이 쌓이면, 정작 챙겨야 할 일들을 놓칠 수 있어요.",
      en: "You both move with whatever the moment brings, so spontaneous dates or last-minute changes don't stress either of you out. But if even the important things stay unplanned, real commitments can start slipping through.",
    },
    both_mid: {
      ko: "두 사람 다 계획과 즉흥 사이에서 유연하게 움직이는 편이라, 일정을 정하는 방식 자체가 갈등의 씨앗이 되지는 않아요.",
      en: "You both flex between planning and improvising, so how you set schedules doesn't become a seed of conflict on its own.",
    },
    // Rewritten from a v1 line that stated only WHAT differs, not how each
    // side experiences the other — now names both reactions explicitly.
    asymmetric_extreme: {
      ko: "한 사람은 미리 정해둔 계획대로 움직여야 마음이 편한 편이고, 다른 사람은 상황에 맞춰 즉흥적으로 바꾸는 걸 편하게 여기는 편이라, 계획적인 쪽은 상대가 무책임하다고 느끼고 즉흥적인 쪽은 상대가 너무 융통성이 없다고 답답해할 수 있어요.",
      en: "One of you only feels settled once everything is planned out, while the other is comfortable changing course on the fly — so the planner reads the other as irresponsible, and the improviser finds the planner rigid and exhausting to deal with.",
    },
    moderate_diff: {
      ko: "한쪽이 조금 더 계획을 세워두고 싶어 하고 다른 쪽은 조금 더 즉흥적으로 흘러가고 싶어 해서, 여행 준비나 약속을 잡을 때 은근한 신경전이 생길 수 있어요.",
      en: "One of you wants things planned ahead, the other prefers to let it flow, so packing for a trip or setting a date can turn into a quiet tug-of-war.",
    },
  },
  empathy: {
    both_high: {
      ko: "두 사람 다 상대의 감정 변화를 빠르게 알아차리고 맞춰주는 편이라, 굳이 말하지 않아도 서로의 기분을 잘 살펴요. 다만 둘 다 상대 기분을 살피는 데 에너지를 많이 쓰다 보면, 정작 자기 감정은 뒤로 미루다가 지칠 수 있어요.",
      en: "You both pick up on the other's mood shifts quickly and adjust, so you read each other well without needing much said. But if you're both spending that much energy watching the other's feelings, your own can get pushed aside until you're worn out.",
    },
    both_low: {
      ko: "두 사람 다 감정보다 상황과 사실을 먼저 보는 편이라, 서로의 기분 문제로 예민하게 부딪히는 일은 적어요. 다만 둘 다 상대가 힘들어하는 신호를 늦게 알아차려서, 위로가 필요한 순간을 놓칠 수 있어요.",
      en: "You both look at the situation and the facts before the feeling, so you rarely clash over hurt feelings. But you can both be slow to notice when the other is struggling, and miss the moment comfort was actually needed.",
    },
    both_mid: {
      ko: "두 사람 다 필요할 때는 공감하고 아닐 때는 담담한, 균형 잡힌 편이라 감정을 읽는 방식이 관계의 약점이 되지는 않아요.",
      en: "You both empathize when it's needed and stay even-keeled otherwise, so how you read emotion doesn't become a weak point.",
    },
    asymmetric_extreme: {
      ko: "한 사람은 상대의 표정과 말투만 봐도 기분을 알아차리는 편이고, 다른 사람은 직접 말해줘야 상황을 파악하는 편이라, 공감이 빠른 쪽은 '왜 눈치를 못 채냐'고 답답해하고 다른 쪽은 '말을 안 하는데 어떻게 아냐'고 억울해할 수 있어요.",
      en: "One of you can read a mood off a face or tone alone, the other only understands once it's said out loud — so the quick-empathy side gets frustrated wondering 'how could you not notice,' and the other feels it's unfair to be expected to know without being told.",
    },
    moderate_diff: {
      ko: "한쪽이 조금 더 상대 감정에 예민하게 반응하고 다른 쪽은 조금 더 담담한 편이라, 위로가 필요한 순간에 서로 기대하는 반응의 온도차가 있을 수 있어요.",
      en: "One of you responds to the other's feelings more sensitively, the other stays a bit more even, so in a moment that needs comfort you can expect different levels of warmth from each other.",
    },
  },
  resilience: {
    both_high: {
      ko: "두 사람 다 다툰 뒤에도 감정을 빠르게 추스르는 편이라, 냉전이 길게 가지 않고 금방 다시 편해져요. 다만 회복이 너무 빠르다 보니 정작 그 다툼에서 짚고 넘어가야 할 문제를 얼버무리고 지나칠 수 있어요.",
      en: "You both bounce back fast after a fight, so the cold spell never lasts long. But recovering that quickly means you can both gloss over the actual issue the fight was about instead of resolving it.",
    },
    both_low: {
      ko: "두 사람 다 감정이 상하면 회복까지 시간이 걸리는 편이라, 한 번 다투면 서로 냉전이 꽤 길어질 수 있어요. 이 조합에서는 화해의 타이밍을 누가 먼저 잡을지 미리 정해두는 게 도움이 돼요.",
      en: "You both take real time to recover once hurt, so a single fight can turn into a long cold stretch for both of you. For this pairing, it helps to agree in advance on who makes the first move toward making up.",
    },
    both_mid: {
      ko: "두 사람 다 다툰 뒤 하루나 이틀 정도면 자연스럽게 풀리는 편이라, 회복 속도 차이로 관계가 삐걱거릴 일은 적어요.",
      en: "You both tend to settle naturally within a day or two of a fight, so a mismatch in recovery speed is unlikely to strain things.",
    },
    asymmetric_extreme: {
      ko: "한 사람은 다투고 나서 금방 훌훌 털어내는 편이고, 다른 사람은 감정이 가라앉기까지 시간이 필요한 편이라, 빨리 회복하는 쪽은 상대가 '뒤끝 있다'고 느끼고 늦게 회복하는 쪽은 상대가 '너무 쉽게 넘어간다'고 서운해할 수 있어요.",
      en: "One of you shakes it off quickly after a fight, the other needs real time for the feeling to settle — so the fast-recovering one reads the other as holding a grudge, while the slower one feels brushed off by how easily the other moves on.",
    },
    moderate_diff: {
      ko: "한쪽이 조금 더 빨리 털어내고 다른 쪽은 조금 더 오래 담아두는 편이라, 화해를 시도하는 타이밍이 미묘하게 어긋날 수 있어요.",
      en: "One of you lets go a bit faster, the other holds on a bit longer, so the timing of when each of you is ready to make up can be slightly out of sync.",
    },
  },
  recognition: {
    both_high: {
      ko: "두 사람 다 잘한 일은 확실하게 인정받고 싶어 하는 편이라, 서로 칭찬하고 표현하는 데 인색하지 않으면 관계가 더 단단해져요. 다만 둘 다 인정받고 싶은 마음이 크다 보니, 같은 상황에서 서로 먼저 알아봐 주길 기다리다가 둘 다 서운해질 수 있어요.",
      en: "You both want real acknowledgment for what you've done well, so being generous with praise strengthens things. But since you both need that recognition, you can each end up waiting for the other to notice first — and both come away disappointed.",
    },
    both_low: {
      ko: "두 사람 다 굳이 칭찬이나 인정을 받지 않아도 크게 신경 쓰지 않는 편이라, 서로에게 확인받으려는 압박이 적어요. 다만 둘 다 애정 표현에도 무심해지기 쉬워서, 관계가 무덤덤해 보일 수 있어요.",
      en: "Neither of you needs much praise or acknowledgment to feel fine, so there's little pressure to keep reassuring each other. But that same ease can slide into being casual about affection too, making the relationship look flat from the outside.",
    },
    both_mid: {
      ko: "두 사람 다 인정받으면 기쁘지만 없어도 크게 흔들리지 않는 편이라, 이 부분이 관계의 갈등 요인이 되는 경우는 드물어요.",
      en: "You both enjoy being acknowledged but aren't shaken without it, so this is unlikely to become a source of friction.",
    },
    asymmetric_extreme: {
      ko: "한 사람은 잘한 일을 상대가 알아봐 주고 표현해줘야 힘이 나는 편이고, 다른 사람은 그런 확인이 크게 필요 없는 편이라, 인정이 필요한 쪽은 상대의 무심함을 애정 부족으로 오해하고 상대는 왜 그렇게까지 표현해야 하는지 이해하기 어려울 수 있어요.",
      en: "One of you needs the other to notice and say it out loud to feel motivated, the other barely needs that kind of confirmation — so the one who needs it can mistake the other's quietness for a lack of love, while the other genuinely doesn't understand why it has to be said so much.",
    },
    moderate_diff: {
      ko: "한쪽이 조금 더 칭찬과 확인을 필요로 하고 다른 쪽은 조금 덜한 편이라, 애정 표현의 '양'을 두고 은근히 아쉬움이 남을 수 있어요.",
      en: "One of you needs a bit more praise and confirmation, the other needs less, so the sheer amount of affection shown can quietly leave one side wanting more.",
    },
  },
  energy_style: {
    both_high: {
      ko: "두 사람 다 사람들과 어울리면서 에너지를 얻는 편이라, 함께 밖으로 나가고 새로운 사람을 만나는 데 부담이 없어요. 다만 둘 다 밖에서 에너지를 쓰기만 하고 둘만의 조용한 시간을 따로 챙기지 않으면, 정작 서로에게 집중하는 시간이 부족해질 수 있어요.",
      en: "You both recharge by being around people, so heading out together or meeting new people together comes easily. But if you're both only spending energy outward and never carving out quiet time for just the two of you, focused time on each other can run short.",
    },
    both_low: {
      ko: "두 사람 다 혼자 또는 둘만의 시간에서 에너지를 회복하는 편이라, 조용히 함께 있는 것만으로도 만족스러운 관계를 만들 수 있어요. 다만 둘 다 사람 만나는 걸 미루다 보면, 다른 관계망이 점점 좁아질 수 있어요.",
      en: "You both recover energy alone or in quiet time together, so simply being together quietly can already feel satisfying. But if you both keep putting off seeing other people, your wider circle can slowly shrink.",
    },
    both_mid: {
      ko: "두 사람 다 사람들과 어울리는 것도, 혼자 쉬는 것도 무리 없이 즐기는 편이라, 에너지 충전 방식 차이로 부딪힐 일은 적어요.",
      en: "You both enjoy socializing and downtime without strain, so a mismatch in how you recharge is unlikely to cause friction.",
    },
    asymmetric_extreme: {
      ko: "한 사람은 사람 많은 자리에서 에너지를 얻는 편이고, 다른 사람은 둘만의 조용한 시간이 있어야 충전이 되는 편이라, 자주 나가고 싶은 쪽은 상대가 집에만 있으려 한다고 답답해하고 조용히 쉬고 싶은 쪽은 매번 나가자는 상대가 버겁게 느껴질 수 있어요.",
      en: "One of you recharges in a crowd, the other only recharges in quiet time with just the two of you — so the one who wants to go out reads staying in as the other checking out, while the one who wants quiet finds constantly being asked out exhausting.",
    },
    moderate_diff: {
      ko: "한쪽이 조금 더 밖에서 에너지를 얻고 다른 쪽은 조금 더 안에서 충전하는 편이라, 약속 빈도나 모임 참석을 둘러싼 취향 차이가 은근히 반복될 수 있어요.",
      en: "One of you leans toward recharging outward, the other inward, so how often to go out or attend gatherings can keep surfacing as a quiet mismatch.",
    },
  },
  decision_style: {
    both_high: {
      ko: "두 사람 다 중요한 결정을 내리기 전에 여러 번 따져보고 신중하게 접근하는 편이라, 큰 결정에서 성급하게 후회할 일은 적어요. 다만 둘 다 신중하다 보니 정작 결정을 내려야 할 타이밍을 놓치고 계속 미루기만 할 수 있어요.",
      en: "You both weigh a big decision carefully before committing, so you rarely rush into something you'll regret. But being this careful together can mean you both keep pushing the actual decision back until the moment for it has passed.",
    },
    both_low: {
      ko: "두 사람 다 고민보다 일단 해보고 결정하는 편이라, 여행이나 데이트 계획을 빠르게 밀어붙일 수 있어요. 다만 둘 다 신중하게 따져야 할 순간에도 즉흥적으로 결정하다 보면, 나중에 같이 후회할 선택이 생길 수 있어요.",
      en: "You both decide first and think later, so plans for a trip or a date come together fast. But when you're both deciding on impulse even in moments that call for real thought, you can end up with a choice you both regret later.",
    },
    both_mid: {
      ko: "두 사람 다 상황에 따라 신중해질 때도, 빠르게 결정할 때도 있는 편이라, 의사결정 방식 자체가 관계의 약점이 되지는 않아요.",
      en: "You both get careful sometimes and decide quickly other times, so how you make decisions doesn't become a weak point on its own.",
    },
    asymmetric_extreme: {
      ko: "한 사람은 결정을 내리기 전에 충분히 따져보고 확인받고 싶어 하는 편이고, 다른 사람은 일단 정하고 움직이는 걸 편하게 여기는 편이라, 신중한 쪽은 상대가 너무 성급하다고 느끼고 빠른 쪽은 상대가 결정을 계속 미룬다고 답답해할 수 있어요.",
      en: "One of you wants to weigh things fully and get confirmation before deciding, the other is comfortable deciding and moving right away — so the careful one finds the other rash, and the quick one gets frustrated that the other keeps stalling.",
    },
    moderate_diff: {
      ko: "한쪽이 조금 더 신중하게 따져보고 다른 쪽은 조금 더 빠르게 결정하는 편이라, 같이 뭔가를 정할 때 속도 차이로 은근한 조바심이나 답답함이 생길 수 있어요.",
      en: "One of you leans toward weighing things carefully, the other toward deciding fast, so settling on something together can quietly stir up impatience on one side and pressure on the other.",
    },
  },
  stimulation: {
    both_high: {
      ko: "두 사람 다 새로운 자극과 경험을 원하는 편이라, 여행이나 새로운 장소를 찾아다니는 데 죽이 잘 맞아요. 다만 둘 다 새로운 자극만 좇다 보면, 정작 안정적으로 쉬어가는 시간이 부족해질 수 있어요.",
      en: "You both crave new experiences, so you sync up easily on travel and trying new places. But chasing novelty together can leave little room for the steady, restful time you both still need.",
    },
    both_low: {
      ko: "두 사람 다 익숙하고 편안한 루틴을 선호하는 편이라, 매번 새로운 걸 찾아다니지 않아도 관계가 지루해지지 않아요. 다만 둘 다 새로운 시도를 미루다 보면, 관계가 점점 매너리즘에 빠질 수 있어요.",
      en: "You both prefer a familiar, comfortable routine, so the relationship doesn't need constant novelty to feel alive. But if you both keep putting off trying anything new, things can slowly settle into a rut.",
    },
    both_mid: {
      ko: "두 사람 다 새로운 자극과 익숙한 편안함 사이에서 적당히 균형을 잡는 편이라, 이 부분이 갈등으로 이어지는 경우는 드물어요.",
      en: "You both balance novelty and comfort reasonably well, so this rarely turns into real conflict.",
    },
    // Rewritten from a v1 line that only stated the mechanism, not how each
    // side is likely to experience the other.
    asymmetric_extreme: {
      ko: "한 사람은 계속 새로운 걸 시도해야 만족스러운 편이고, 다른 사람은 익숙한 루틴이 편안한 편이라, 자극을 원하는 쪽은 상대가 재미없다고 느끼고 편안함을 원하는 쪽은 상대가 너무 정신없다고 느낄 수 있어요.",
      en: "One of you only feels satisfied when trying something new, while the other is happiest sticking to a familiar routine — so the novelty-seeker finds the other boring, and the routine-lover finds the other exhausting to keep up with.",
    },
    moderate_diff: {
      ko: "한쪽이 조금 더 새로운 자극을 원하고 다른 쪽은 조금 더 익숙한 편안함을 원해서, 데이트 코스나 여행지를 정할 때 취향이 은근히 갈릴 수 있어요.",
      en: "One of you leans toward wanting something new, the other toward staying comfortable, so picking a date spot or a trip destination can quietly reveal different tastes.",
    },
  },
};

const FALLBACK_CONTENT: ContentEntry = {
  ko: "이 축에서는 아직 뚜렷한 패턴이 보이지 않아, 실제 대화 속에서 서로 확인해 보는 게 가장 정확해요.",
  en: "This axis doesn't show a clear pattern yet, so checking in with each other directly is the most reliable read.",
};

export function getAxisWhyItMatters(axisKey: string, state: AxisState, locale: PrototypeLocale): string {
  const entry = AXIS_INSIGHT_CONTENT[axisKey]?.[state] ?? FALLBACK_CONTENT;
  return locale === "en-US" ? entry.en : entry.ko;
}

/** Internal classification tag — data only; callers must not append this to user-facing copy (see types.ts note on AxisInsightRow.relationshipEffect). */
export function relationshipEffectTag(matchType: string, locale: PrototypeLocale): string {
  const isEn = locale === "en-US";
  if (matchType === "tension") return isEn ? "tension" : "긴장";
  if (matchType === "complementary") return isEn ? "complement" : "보완";
  return isEn ? "resonance" : "공명";
}

/**
 * Ranks every non-conflict_style axis by relationship significance (not raw
 * gap) and returns up to `maxCount` real, state-specific insights. Priority
 * order is significance > insight uniqueness (guaranteed by construction —
 * every axis/state cell has distinct content) > presentation diversity: the
 * state-repeat penalty below is a soft nudge for near-ties, never a hard
 * gate that can bury a clearly higher-significance axis just to vary the
 * card shapes. Nothing is padded to hit a card count.
 */
export function selectAxisRelationshipInsights(params: {
  locale: PrototypeLocale;
  axisResults: RomanticPsychMatchAxisResult[];
  usedRows?: RomanticCompareRowKey[];
  maxCount?: number;
  names?: { nameA: string; nameB: string };
}): { selected: AxisInsightRow[]; rejected: AxisSelectionRejected[] } {
  const usedRows = params.usedRows ?? [];
  const maxCount = params.maxCount ?? 4;
  const rejected: AxisSelectionRejected[] = [];
  const isEn = params.locale === "en-US";
  const nameA = params.names?.nameA ?? (isEn ? "You" : "나");
  const nameB = params.names?.nameB ?? (isEn ? "your partner" : "상대");

  const scored = params.axisResults
    .filter((axis) => axis.axis_key !== "conflict_style")
    .map((axis) => {
      const state = classifyAxisState(axis.axis_key, axis.score_a, axis.score_b, axis.match_type);
      const mapped = AXIS_TO_COMPARE_ROW[axis.axis_key];
      const ownershipCollision = Boolean(mapped && usedRows.includes(mapped));
      const rawSignificance = computeAxisSignificance({
        axisKey: axis.axis_key,
        state,
        scoreA: axis.score_a,
        scoreB: axis.score_b,
        ownershipCollision,
      });
      return { axis, state, rawSignificance, ownershipCollision };
    });

  // Only a truly flat, near-identical mid-range pairing gets filtered out —
  // gated on RAW significance so the diversity tie-breaker below can never
  // be the reason a genuinely meaningful axis is dropped entirely.
  const SIGNIFICANCE_FLOOR = 10;
  const candidates = scored.filter((row) => {
    if (row.rawSignificance < SIGNIFICANCE_FLOOR) {
      rejected.push({
        axisKey: row.axis.axis_key,
        reason: "insufficient_evidence",
        detail: `significance ${row.rawSignificance} below floor ${SIGNIFICANCE_FLOOR} (state=${row.state}).`,
        evidenceIds: [`meta.psych_match.axis_results.${row.axis.axis_key}`],
      });
      return false;
    }
    return true;
  });

  // Soft presentation-diversity tie-breaker: sort by raw significance first
  // to fix each candidate's "how many higher-ranked axes already share this
  // state" count, then apply a small penalty only from the 3rd occurrence of
  // a state onward, then re-sort. A candidate can only be displaced by this
  // if the gap was already within STATE_REPEAT_SOFT_PENALTY points.
  const byRawDesc = [...candidates].sort((a, b) => b.rawSignificance - a.rawSignificance);
  const stateSeenCount = new Map<AxisState, number>();
  const withAdjusted = byRawDesc.map((row) => {
    const seen = stateSeenCount.get(row.state) ?? 0;
    stateSeenCount.set(row.state, seen + 1);
    const penalty = seen >= STATE_REPEAT_FREE_COUNT ? STATE_REPEAT_SOFT_PENALTY : 0;
    return { ...row, adjustedSignificance: Math.round((row.rawSignificance - penalty) * 10) / 10 };
  });
  const ranked = [...withAdjusted].sort((a, b) => b.adjustedSignificance - a.adjustedSignificance);

  const chosen = ranked.slice(0, maxCount);
  for (const dropped of ranked.slice(maxCount)) {
    rejected.push({
      axisKey: dropped.axis.axis_key,
      reason: "low_distinctiveness",
      detail: `ranked #${ranked.indexOf(dropped) + 1} after diversity tie-break (raw ${dropped.rawSignificance}, adjusted ${dropped.adjustedSignificance}); only top ${maxCount} shown.`,
      evidenceIds: [`meta.psych_match.axis_results.${dropped.axis.axis_key}`],
    });
  }

  const selected: AxisInsightRow[] = chosen.map((c) => {
    const axisLabel = psychMatchAxisLabel(c.axis.axis_key, params.locale);
    return {
      axisKey: c.axis.axis_key,
      axisLabel,
      matchType: c.axis.match_type,
      state: c.state,
      gap: c.axis.gap,
      personAPattern: isEn ? `score of ${c.axis.score_a}` : `${c.axis.score_a}점 경향`,
      personBPattern: isEn ? `score of ${c.axis.score_b}` : `${c.axis.score_b}점 경향`,
      hook: buildAxisRelationshipHook({
        axisKey: c.axis.axis_key,
        state: c.state,
        scoreA: c.axis.score_a,
        scoreB: c.axis.score_b,
        nameA,
        nameB,
        locale: params.locale,
      }),
      whyItMatters: getAxisWhyItMatters(c.axis.axis_key, c.state, params.locale),
      // Not rendered by any current consumer (adaptRadarHighlights only reads
      // hook + whyItMatters) — left empty rather than filled with more
      // unused boilerplate.
      dailyManifestation: "",
      // Data-only tag (see types.ts) — do not concatenate into user-facing narrative.
      relationshipEffect: relationshipEffectTag(c.axis.match_type, params.locale),
      confidence: confidenceFromGap(c.axis.gap),
      evidenceIds: [`meta.psych_match.axis_results.${c.axis.axis_key}`],
    };
  });

  return { selected, rejected };
}
