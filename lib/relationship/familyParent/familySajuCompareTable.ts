import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import { sanitizeFamilyParentText } from "./familyParentLanguage";
import { profileTenGods, type TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { resolveParentingStyleLean } from "@/lib/personCore/sajuSignals/sharedPersonaSignals";
import {
  resolveOriginFamilyTension,
  type OriginFamilyTensionProfile,
} from "@/lib/personCore/sajuSignals/sharedPersonaSignals";
import { resolveParentBondBandFromCounts } from "@/lib/personCore/sajuSignals/extractFamilySignals";
import { buildPairFamilySignals } from "@/lib/personCore/sajuSignals/pairFamilySignals";
import { countElements } from "@/lib/saju/pairChartAnalysis";
import type { ChartContext } from "@/lib/saju/chartContext";
import type {
  FamilySajuSignals,
  FriendshipSajuSignals,
  ParentBondBand,
} from "@/lib/personCore/sajuSignals/types";
import type { PairFamilySignals } from "@/lib/personCore/sajuSignals/pairTypes";
import type { FamilyParentRole } from "./types";

/**
 * family(가족) "한눈에 비교" 표 — Part2 A/B 엔진 강화 (009).
 *
 * A correction_style: person=십신 반응 유형 / pair=nagging_band (기존 PairFamilySignals)
 * B bond_distance: person=parent_bond_band / pair=umbilical_band
 * parentRole → 제목·문맥만. 원국 점수 가감 금지.
 * C~F(③④⑤⑥)는 이번 커밋에서 계산 변경 없음(후속 Part2).
 *
 * | 행 | person | pair 의미 |
 * |---|---|---|
 * | A correction_style | ten_god style bucket | nagging_band |
 * | B bond_distance | parent_bond_band | umbilical_band |
 * | ③~⑥ | (기존 유지) | — |
 */

export type FamilyCompareRowId =
  | "correction_style"
  | "bond_distance"
  | "affection_expression"
  | "care_balance"
  | "gathering_recovery"
  | "gathering_temperature";

/** @deprecated Part2 이전 id — 테스트 마이그레이션용 별칭 */
export type LegacyFamilyCompareRowId = "nagging_reaction" | "origin_family_distance";

export type FamilyCompareRow = {
  id: FamilyCompareRowId;
  label: string;
  personParent: { nickname: string; shortLabel: string };
  personChild: { nickname: string; shortLabel: string };
  meaning: string;
};

export type PairRelation = "same" | "near" | "different";

/**
 * Family Role Lens — 제목·의미 문맥만 mother/father로 분기.
 * bucket·pair band 계산에는 관여하지 않는다 (009).
 */
type FamilyRoleLensKey = "neutral" | "mother" | "father";

function resolveRoleLensKey(parentRole: FamilyParentRole | undefined): FamilyRoleLensKey {
  if (parentRole === "mother") return "mother";
  if (parentRole === "father") return "father";
  return "neutral";
}

// ---------------------------------------------------------------------------
// 계산 레이어 (source value + bucket) — 카피 없음. parentRole 미사용.
// ---------------------------------------------------------------------------

type TenGodCategory = "wealth" | "officer" | "food" | "seal" | "self";

/** A person — 십신 우세 카테고리 = 교정 반응 유형 (de-escalation과 동일 5범주). */
export function resolveCorrectionStyleBucket(
  counts: TenGodCounts,
): { sourceValue: ReturnType<typeof profileTenGods>; bucket: TenGodCategory } {
  const p = profileTenGods(counts);
  const entries: Array<[TenGodCategory, number]> = [
    ["food", p.food],
    ["self", p.self],
    ["seal", p.seal],
    ["officer", p.officer],
    ["wealth", p.wealth],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return { sourceValue: p, bucket: entries[0]![0] };
}

/** @deprecated Part2 이전 이름 — resolveCorrectionStyleBucket과 동일 */
export function resolveNaggingReactionBucket(
  counts: TenGodCounts,
): { sourceValue: ReturnType<typeof profileTenGods>; bucket: TenGodCategory } {
  return resolveCorrectionStyleBucket(counts);
}

/** ② 레거시 — Part2 B에서 비교표 본체로는 미사용. 테스트·원가족 서사 참조용. */
export function resolveOriginFamilyDistanceBucket(
  counts: TenGodCounts,
  chart: ChartContext,
): { sourceValue: OriginFamilyTensionProfile; bucket: "needs_distance" | "comfortable" } {
  const profile = resolveOriginFamilyTension(counts, chart);
  return {
    sourceValue: profile,
    bucket: profile.needsStrongBoundary ? "needs_distance" : "comfortable",
  };
}

/** B person — FamilySajuSignals.seal_parent.parent_bond_band (기존 threshold). */
export function resolveBondDistanceBucket(
  counts: TenGodCounts,
  familySignals?: FamilySajuSignals,
): { sourceValue: { band: ParentBondBand; seal_count: number }; bucket: ParentBondBand } {
  if (familySignals) {
    const band = familySignals.seal_parent.parent_bond_band;
    return {
      sourceValue: {
        band,
        seal_count: familySignals.seal_parent.seal_count,
      },
      bucket: band,
    };
  }
  const band = resolveParentBondBandFromCounts(counts);
  const p = profileTenGods(counts);
  return { sourceValue: { band, seal_count: p.seal }, bucket: band };
}

type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";

/** ③용 — 오행 우세(work의 dominantElement(chart)와 동일 원리, 이 파일에서 로컬 재현). */
export function resolveAffectionExpressionBucket(
  chart: ChartContext,
): { sourceValue: Record<string, number>; bucket: ElementKey } {
  const counts = countElements(chart);
  const entries: Array<[ElementKey, number]> = [
    ["wood", counts.wood ?? 0],
    ["fire", counts.fire ?? 0],
    ["earth", counts.earth ?? 0],
    ["metal", counts.metal ?? 0],
    ["water", counts.water ?? 0],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return { sourceValue: counts, bucket: entries[0]![0] };
}

/** ④용 — Step1의 parenting_style_lean(marriage 재노출) 그대로 호출. */
export function resolveCareBalanceBucket(
  counts: TenGodCounts,
): { sourceValue: ReturnType<typeof profileTenGods>; bucket: "empathy" | "structure" } {
  return {
    sourceValue: profileTenGods(counts),
    bucket: resolveParentingStyleLean(counts),
  };
}

type StrengthBand = "weak" | "balanced" | "strong";

// friend의 resolveFriendStrengthBand(margin=1)와 완전히 동일한 공식 —
// 007 문서에서 "잠정 채택"으로 명시된 그대로, 이 파일 안에서 재현(friend 파일
// 미수정, 공용화는 Step6 이후 별도 결정).
const STEM_ELEMENT: Record<string, ElementKey> = {
  gap: "wood", eul: "wood",
  byeong: "fire", jeong: "fire",
  mu: "earth", gi: "earth",
  gyeong: "metal", sin: "metal",
  im: "water", gye: "water",
};
const ELEMENT_GENERATES: Record<string, string> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
const ELEMENT_OVERCOMES: Record<string, string> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};

/** ⑤용 — 신강신약(margin=1, friend와 동일 공식). */
export function resolveGatheringRecoveryBucket(
  chart: ChartContext,
): { sourceValue: { support: number; drain: number }; bucket: StrengthBand } {
  const dayEl = STEM_ELEMENT[chart.dayStemCode] ?? "earth";
  const counts = countElements(chart);
  const resourceEl = Object.entries(ELEMENT_GENERATES).find(([, v]) => v === dayEl)?.[0];
  const outputEl = ELEMENT_GENERATES[dayEl];
  const controlEl = Object.entries(ELEMENT_OVERCOMES).find(([, v]) => v === dayEl)?.[0];

  const support = (counts[dayEl] ?? 0) + (counts[resourceEl ?? ""] ?? 0);
  const drain = (counts[outputEl ?? ""] ?? 0) + (counts[controlEl ?? ""] ?? 0) * 1.2;

  let bucket: StrengthBand = "balanced";
  if (support >= drain + 1) bucket = "strong";
  else if (drain >= support + 1) bucket = "weak";
  return { sourceValue: { support, drain }, bucket };
}

type TemperatureBand = "cold" | "neutral" | "hot";

/** ⑥용 — johu_profile(PersonCore SSOT, friendship_signals). 신호 없으면
 * neutral로 폴백(신규 계산 아님 — 이 파일에서 johu 공식을 재구현하지 않음.
 * 이 폴백은 이번 wiring으로 생성되는 리포트에서는 정상적으로 발생하지 않아야
 * 하고, 방어적 코드로만 존재한다). */
export function resolveGatheringTemperatureBucket(
  signals: FriendshipSajuSignals | undefined,
): { sourceValue: FriendshipSajuSignals["johu_profile"] | null; bucket: TemperatureBand } {
  if (!signals) return { sourceValue: null, bucket: "neutral" };
  return { sourceValue: signals.johu_profile, bucket: signals.johu_profile.temperature_band };
}

// ---------------------------------------------------------------------------
// pair relation 레이어 — bucket 순서가 있으면 same/near/different, 명목형은 same/different.
// ---------------------------------------------------------------------------

function nominalRelation<T>(a: T, b: T): PairRelation {
  return a === b ? "same" : "different";
}

function orderedRelation<T>(order: T[], a: T, b: T): PairRelation {
  if (a === b) return "same";
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  return Math.abs(ia - ib) === 1 ? "near" : "different";
}

const STRENGTH_ORDER: StrengthBand[] = ["weak", "balanced", "strong"];
const TEMPERATURE_ORDER: TemperatureBand[] = ["cold", "neutral", "hot"];

// ---------------------------------------------------------------------------
// 카피 레이어 — bucket/relation 조회만. 계산되지 않은 내용(애정 크기·효심·
// 진심·죄책감·가족애 깊이) 서술 금지.
// ---------------------------------------------------------------------------

const CORRECTION_STYLE_LABEL: Record<Locale, Record<TenGodCategory, string>> = {
  "ko-KR": {
    self: "감정이 먼저 드러나는 타입",
    seal: "말없이 속으로 삭이는 타입",
    food: "그 자리에서 바로 반응하는 타입",
    officer: "이유부터 정리한 뒤 얘기하는 타입",
    wealth: "실질적으로 정리되면 넘어가는 타입",
  },
  "en-US": {
    self: "Shows the reaction right away",
    seal: "Processes it quietly, inward",
    food: "Reacts on the spot",
    officer: "Sorts out the reason before responding",
    wealth: "Lets it go once it's practically settled",
  },
};

const CORRECTION_STYLE_TITLE: Record<Locale, Record<FamilyRoleLensKey, string>> = {
  "ko-KR": {
    neutral: "지적·교정이 들어오는 순간의 반응",
    mother: "지적·교정이 들어오는 순간의 반응",
    father: "지적·교정에 대한 반응",
  },
  "en-US": {
    neutral: "How you react the moment correction arrives",
    mother: "How you react the moment correction arrives",
    father: "How you respond to correction and guidance",
  },
};

const CORRECTION_FRICTION_MEANING: Record<
  Locale,
  Record<FamilyRoleLensKey, Record<"low" | "medium" | "high", string>>
> = {
  "ko-KR": {
    neutral: {
      low: "둘이 만날 때 지적·교정 마찰이 낮은 편이에요 — 반응 유형이 달라도 쉽게 쌓이지 않아요.",
      medium: "교정 순간에 중간 정도의 마찰이 생길 수 있어요 — 반응 유형 차이를 먼저 말해 두면 도움이 돼요.",
      high: "둘이 만날 때 지적·교정 마찰이 커지기 쉬운 조합이에요 — 한 번에 한 가지 요청만 쓰는 편이 안전해요.",
    },
    mother: {
      low: "교정 장면에서도 마찰이 낮은 편이에요 — 반응 속도가 달라도 쉽게 상처로 번지지 않아요.",
      medium: "교정 순간에 중간 마찰이 생길 수 있어요 — ‘한 줄 사실 + 한 줄 요청’이 도움이 돼요.",
      high: "교정 장면에서 마찰이 커지기 쉬운 조합이에요 — 평가는 줄이고 요청만 짧게 말해 보세요.",
    },
    father: {
      low: "지적·교정 장면에서 마찰이 낮은 편이에요 — 설명 방식이 달라도 크게 쌓이지 않아요.",
      medium: "지적·교정에서 중간 마찰이 생길 수 있어요 — 이유와 요청을 한 번에 하나씩만 말하세요.",
      high: "지적·교정 장면에서 마찰이 커지기 쉬운 조합이에요 — 긴 설교보다 한 가지 기준만 분명히 하세요.",
    },
  },
  "en-US": {
    neutral: {
      low: "Correction friction between you tends to stay low — different reaction styles don't pile up easily.",
      medium: "Moderate correction friction can show up — naming your reaction styles helps.",
      high: "Correction friction tends to run high between you — one fact + one request is safer.",
    },
    mother: {
      low: "Correction moments tend to stay low-friction — different tempos rarely turn into lasting hurt.",
      medium: "Moderate friction can show up in correction moments — one fact + one request helps.",
      high: "Correction moments can escalate quickly — shorten evaluation and keep the ask brief.",
    },
    father: {
      low: "Guidance/correction friction tends to stay low — different explanation styles don't stack up.",
      medium: "Moderate friction can show up — give one reason and one request at a time.",
      high: "Guidance/correction friction tends to run high — one clear standard beats a long lecture.",
    },
  },
};

const BOND_DISTANCE_TITLE: Record<Locale, Record<FamilyRoleLensKey, string>> = {
  "ko-KR": {
    neutral: "가까운 관계와 적당한 거리, 어디에 더 편한가",
    mother: "보호와 독립의 전환",
    father: "관여와 자율의 조율",
  },
  "en-US": {
    neutral: "Closeness or comfortable distance — which feels easier?",
    mother: "Shifting between protection and independence",
    father: "Balancing involvement and autonomy",
  },
};

const BOND_DISTANCE_LABEL: Record<Locale, Record<ParentBondBand, string>> = {
  "ko-KR": {
    distant: "거리를 둘 때 더 편안한 타입",
    balanced: "적당한 거리가 편안한 타입",
    smothering: "가까이 붙어 있을 때 더 편안한 타입",
  },
  "en-US": {
    distant: "More comfortable with space",
    balanced: "Comfortable with a moderate distance",
    smothering: "More comfortable staying close",
  },
};

const UMBILICAL_MEANING: Record<
  Locale,
  Record<FamilyRoleLensKey, Record<"low" | "medium" | "high", string>>
> = {
  "ko-KR": {
    neutral: {
      low: "둘의 밀착·거리 패턴이 크게 어긋나지 않아, 분리·독립 과제가 낮은 편이에요.",
      medium: "밀착과 거리 감각에 차이가 있어, 분리·독립을 중간 강도로 조율할 여지가 있어요.",
      high: "밀착과 거리 패턴이 크게 달라, 분리·독립 과제가 선명해요 — 각자의 편안한 거리를 먼저 말해 보세요.",
    },
    mother: {
      low: "보호와 독립의 리듬이 크게 충돌하지 않아요.",
      medium: "보호와 독립 사이에서 중간 강도 조율이 필요해요.",
      high: "보호와 독립의 전환 과제가 커요 — 더 많은 공간이 필요한 쪽의 속도를 존중해 주세요.",
    },
    father: {
      low: "관여와 자율의 리듬이 크게 충돌하지 않아요.",
      medium: "관여와 자율 사이에서 중간 강도 조율이 필요해요.",
      high: "관여와 자율의 조율 과제가 커요 — 스스로 판단할 여지가 더 필요한 쪽에 방향만 남기고 맡겨 보세요.",
    },
  },
  "en-US": {
    neutral: {
      low: "Your closeness/distance patterns don't clash much — the separation task stays low.",
      medium: "There's a moderate gap in closeness needs — some tuning on independence helps.",
      high: "Your closeness patterns differ sharply — name each person's comfortable distance first.",
    },
    mother: {
      low: "Protection and independence rhythms don't clash much.",
      medium: "Moderate tuning is needed between protection and independence.",
      high: "The shift between protection and independence is a strong task — respect the pace of whoever needs more room.",
    },
    father: {
      low: "Involvement and autonomy rhythms don't clash much.",
      medium: "Moderate tuning is needed between involvement and autonomy.",
      high: "Balancing involvement and autonomy is a strong task — offer direction, then leave room to decide.",
    },
  },
};

const AFFECTION_EXPRESSION_LABEL: Record<Locale, Record<ElementKey, string>> = {
  "ko-KR": {
    wood: "함께할 자리를 만들며 마음을 표현하는 타입",
    fire: "화끈하게 티 내며 마음을 표현하는 타입",
    earth: "묵묵히 곁을 지키며 마음을 표현하는 타입",
    metal: "실질적인 도움으로 마음을 표현하는 타입",
    water: "깊이 헤아리며 마음을 표현하는 타입",
  },
  "en-US": {
    wood: "Expresses care by creating shared moments",
    fire: "Expresses care loud and proud",
    earth: "Expresses care by quietly sticking around",
    metal: "Expresses care through practical help",
    water: "Expresses care with deep emotional attentiveness",
  },
};

// 계산되는 건 "표현 방식(오행)의 차이"뿐 — 애정의 크기·효심·진심은 계산되지
// 않으므로 서술하지 않는다(friend 축③/007 문서 주의사항 동일 적용).
const AFFECTION_EXPRESSION_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same: "마음을 표현하는 방식이 비슷해서 서로의 표현을 알아채기 쉬워요.",
    diff: "표현 방식이 서로 달라요 — 서로 다른 언어로 마음을 표현한다는 걸 알아두면 오해가 줄어요.",
  },
  "en-US": {
    same: "You express care the same way, so it's easy to recognize each other's gestures.",
    diff: "You each express care in a different language — worth keeping in mind so it doesn't get misread.",
  },
};

const CARE_BALANCE_TITLE: Record<Locale, Record<FamilyRoleLensKey, string>> = {
  "ko-KR": {
    neutral: "가족을 돌볼 때 공감과 기준의 균형",
    mother: "감정 수용과 기준의 균형",
    father: "설명·지도와 기준의 균형",
  },
  "en-US": {
    neutral: "Empathy vs. Standards When Caring",
    mother: "Emotional Acceptance and Standards",
    father: "Guidance and Standards",
  },
};

const CARE_BALANCE_LABEL: Record<Locale, Record<FamilyRoleLensKey, Record<"empathy" | "structure", string>>> = {
  "ko-KR": {
    neutral: {
      empathy: "감정을 먼저 살피는 공감형",
      structure: "기준을 먼저 세우는 원칙형",
    },
    mother: {
      empathy: "감정부터 알아주는 게 편한 타입",
      structure: "기준이 분명한 게 편한 타입",
    },
    father: {
      empathy: "이유와 맥락을 이해한 뒤 움직이는 게 편한 타입",
      structure: "명확한 기준부터 세우는 게 편한 타입",
    },
  },
  "en-US": {
    neutral: {
      empathy: "Reads emotions first",
      structure: "Sets standards first",
    },
    mother: {
      empathy: "Comfortable when feelings are acknowledged first",
      structure: "Comfortable when standards are clear",
    },
    father: {
      empathy: "Comfortable moving once the reason and context make sense",
      structure: "Comfortable once clear standards are set first",
    },
  },
};

// "돌봄 상황에서 감정 vs 원칙 중 무엇을 먼저 보는지" 성향으로 한정 — 실제
// 부모 역할 여부와 무관하게 두 사람 모두에게 적용 가능한 일반 성향 서술.
const CARE_BALANCE_MEANING: Record<Locale, Record<FamilyRoleLensKey, { same: string; diff: string }>> = {
  "ko-KR": {
    neutral: {
      same: "누군가를 돌볼 때 먼저 보는 지점이 비슷해요.",
      diff: "누군가를 돌볼 때 먼저 보는 지점이 서로 달라요 — 한쪽은 감정을, 한쪽은 기준을 먼저 챙기는 조합이에요.",
    },
    mother: {
      same: "돌볼 때 먼저 보는 지점이 비슷해요.",
      diff: "돌볼 때 먼저 보는 지점이 서로 달라요 — 한쪽은 감정을, 한쪽은 기준을 먼저 챙기는 조합이에요.",
    },
    father: {
      same: "돌볼 때 먼저 확인하는 방식이 비슷해요.",
      diff: "돌볼 때 먼저 확인하는 방식이 서로 달라요 — 한쪽은 이유와 맥락을 먼저 살피고, 한쪽은 기준부터 세우는 조합이에요.",
    },
  },
  "en-US": {
    neutral: {
      same: "You both look at the same thing first when caring for someone.",
      diff: "You look at different things first when caring for someone — one leads with emotion, the other with standards.",
    },
    mother: {
      same: "You both look at the same thing first when caring for someone.",
      diff: "You look at different things first when caring for someone — one leads with emotion, the other with standards.",
    },
    father: {
      same: "You both check in on things the same way when caring for someone.",
      diff: "You check in differently when caring for someone — one looks for the reason and context first, the other sets standards first.",
    },
  },
};

const GATHERING_RECOVERY_LABEL: Record<Locale, Record<StrengthBand, string>> = {
  "ko-KR": {
    strong: "가족 모임에서 에너지를 발산해야 풀리는 타입",
    weak: "가족 모임 후 혼자만의 시간이 있어야 회복되는 타입",
    balanced: "그때그때 컨디션 따라 발산과 휴식을 오가는 타입",
  },
  "en-US": {
    strong: "Recharges by being active and engaged at family gatherings",
    weak: "Recharges with alone time after family gatherings",
    balanced: "Recharges differently depending on the day",
  },
};

const GATHERING_RECOVERY_MEANING: Record<Locale, Record<string, string>> = {
  "ko-KR": {
    "strong|strong": "둘 다 모임에서 에너지를 발산하는 타입이라 함께 있으면 에너지가 배가 돼요.",
    "weak|weak": "둘 다 모임 후 혼자만의 시간이 필요한 타입이에요. 서로의 '조용해짐'을 무관심으로 오해하지 않는 게 중요해요.",
    "balanced|balanced": "둘 다 그날그날 컨디션에 따라 회복 방식이 바뀌는 타입이라 서로 맞춰주기 편해요.",
    "balanced|strong": "한쪽은 확실한 발산형이고, 다른 쪽은 그날그날 달라요.",
    "balanced|weak": "한쪽은 혼자만의 시간이 꼭 필요하고, 다른 쪽은 그날그날 달라요.",
    "strong|weak": "한쪽은 모임에서 발산해야 풀리고, 다른 쪽은 혼자 있어야 회복돼요. 모임 후 조용해지는 쪽이 있어도 무관심이 아니라 회복 방식이 다른 것뿐이에요.",
  },
  "en-US": {
    "strong|strong": "You both recharge by being active together, so energy doubles when you're together.",
    "weak|weak": "You both need alone time after gatherings. Don't mistake each other's quiet stretches for disinterest.",
    "balanced|balanced": "You both shift recovery styles depending on the day, making it easy to match each other.",
    "balanced|strong": "One of you is clearly the outward-recharging type, the other shifts day to day.",
    "balanced|weak": "One of you really needs alone time, the other shifts day to day.",
    "strong|weak": "One of you recharges by being active, the other needs alone time. Going quiet after a gathering isn't disinterest — it's just a different recovery style.",
  },
};

const GATHERING_TEMPERATURE_LABEL: Record<Locale, Record<TemperatureBand, string>> = {
  "ko-KR": {
    hot: "가족 모임에서 활발하게 대화를 주도하는 타입",
    neutral: "필요할 때 적당히 대화하는 타입",
    cold: "말수는 적어도 편안하게 함께 있는 타입",
  },
  "en-US": {
    hot: "Actively drives conversation at family gatherings",
    neutral: "Chats when it counts, easygoing otherwise",
    cold: "Comfortable together even with fewer words",
  },
};

const GATHERING_TEMPERATURE_MEANING: Record<Locale, Record<string, string>> = {
  "ko-KR": {
    "hot|hot": "둘 다 활발한 분위기를 좋아해서 모임이 시끌벅적해지기 쉬워요.",
    "neutral|neutral": "둘 다 적당한 온도의 대화를 편하게 느껴요.",
    "cold|cold": "둘 다 말수가 적어도 편안한 편이라 조용한 모임도 괜찮아요.",
    "hot|neutral": "한쪽은 활발하게 대화를 주도하고, 다른 쪽은 적당한 선에서 맞춰요.",
    "cold|neutral": "한쪽은 적당히, 다른 쪽은 조용한 편이라 자연스럽게 리듬이 맞을 수 있어요.",
    "cold|hot": "한쪽은 활발하게 분위기를 이끌고, 다른 쪽은 조용히 함께 있는 걸 편해해요 — 온도차를 서로 존중하는 게 중요해요.",
  },
  "en-US": {
    "hot|hot": "You both like an energetic atmosphere, so gatherings tend to get lively.",
    "neutral|neutral": "You're both comfortable with a moderate conversational temperature.",
    "cold|cold": "You're both fine with fewer words — quiet gatherings work for you.",
    "hot|neutral": "One of you actively drives conversation, the other matches at a moderate level.",
    "cold|neutral": "One of you is moderate, the other quieter — the rhythm tends to line up naturally.",
    "cold|hot": "One of you actively leads the mood, the other is comfortable being quietly present — worth respecting the temperature gap.",
  },
};

function comboKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

// ---------------------------------------------------------------------------
// 빌더
// ---------------------------------------------------------------------------

export function buildFamilySajuCompareTable(params: {
  parentNickname: string;
  childNickname: string;
  countsParent: TenGodCounts;
  countsChild: TenGodCounts;
  chartParent: ChartContext;
  chartChild: ChartContext;
  friendshipSignalsParent?: FriendshipSajuSignals;
  friendshipSignalsChild?: FriendshipSajuSignals;
  familySignalsParent?: FamilySajuSignals;
  familySignalsChild?: FamilySajuSignals;
  /** 기존 PairFamilySignals — 없으면 person signals로 재구성(동일 공식). */
  pairFamily?: PairFamilySignals | null;
  /**
   * 제목·의미 문맥만 분기. bucket / nagging_band / umbilical_band 계산에는 미사용.
   */
  parentRole?: FamilyParentRole;
  locale?: Locale;
}): FamilyCompareRow[] {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const {
    parentNickname,
    childNickname,
    countsParent,
    countsChild,
    chartParent,
    chartChild,
    friendshipSignalsParent,
    friendshipSignalsChild,
    familySignalsParent,
    familySignalsChild,
    parentRole,
  } = params;
  const roleLensKey = resolveRoleLensKey(parentRole);

  const pairFamily: PairFamilySignals | null =
    params.pairFamily ??
    (familySignalsParent && familySignalsChild
      ? buildPairFamilySignals(familySignalsParent, familySignalsChild)
      : null);

  const row = (
    id: FamilyCompareRowId,
    label: string,
    shortLabelParent: string,
    shortLabelChild: string,
    meaning: string,
  ): FamilyCompareRow => ({
    id,
    label,
    personParent: { nickname: parentNickname, shortLabel: sanitizeFamilyParentText(shortLabelParent) },
    personChild: { nickname: childNickname, shortLabel: sanitizeFamilyParentText(shortLabelChild) },
    meaning: sanitizeFamilyParentText(meaning),
  });

  // A — person style + pair nagging friction
  const styleP = resolveCorrectionStyleBucket(countsParent);
  const styleC = resolveCorrectionStyleBucket(countsChild);
  const frictionBand = pairFamily?.nagging_band ?? "medium";
  const correctionMeaning =
    CORRECTION_FRICTION_MEANING[locale][roleLensKey][frictionBand];

  // B — person bond + pair umbilical (origin_family_tension 미사용)
  const bondP = resolveBondDistanceBucket(countsParent, familySignalsParent);
  const bondC = resolveBondDistanceBucket(countsChild, familySignalsChild);
  const umbilicalBand = pairFamily?.umbilical_band ?? "medium";
  const bondMeaning = UMBILICAL_MEANING[locale][roleLensKey][umbilicalBand];

  // ③~⑥ — Part2 C~F 이전 유지
  const affectionP = resolveAffectionExpressionBucket(chartParent);
  const affectionC = resolveAffectionExpressionBucket(chartChild);
  const affectionRelation = nominalRelation(affectionP.bucket, affectionC.bucket);

  const careP = resolveCareBalanceBucket(countsParent);
  const careC = resolveCareBalanceBucket(countsChild);
  const careRelation = nominalRelation(careP.bucket, careC.bucket);

  const recoveryP = resolveGatheringRecoveryBucket(chartParent);
  const recoveryC = resolveGatheringRecoveryBucket(chartChild);

  const tempP = resolveGatheringTemperatureBucket(friendshipSignalsParent);
  const tempC = resolveGatheringTemperatureBucket(friendshipSignalsChild);

  return [
    row(
      "correction_style",
      CORRECTION_STYLE_TITLE[locale][roleLensKey],
      CORRECTION_STYLE_LABEL[locale][styleP.bucket],
      CORRECTION_STYLE_LABEL[locale][styleC.bucket],
      correctionMeaning,
    ),
    row(
      "bond_distance",
      BOND_DISTANCE_TITLE[locale][roleLensKey],
      BOND_DISTANCE_LABEL[locale][bondP.bucket],
      BOND_DISTANCE_LABEL[locale][bondC.bucket],
      bondMeaning,
    ),
    row(
      "affection_expression",
      pick(locale, "How You Express Care", "가족에게 마음을 표현하는 방식"),
      AFFECTION_EXPRESSION_LABEL[locale][affectionP.bucket],
      AFFECTION_EXPRESSION_LABEL[locale][affectionC.bucket],
      affectionRelation === "same"
        ? AFFECTION_EXPRESSION_MEANING[locale].same
        : AFFECTION_EXPRESSION_MEANING[locale].diff,
    ),
    row(
      "care_balance",
      CARE_BALANCE_TITLE[locale][roleLensKey],
      CARE_BALANCE_LABEL[locale][roleLensKey][careP.bucket],
      CARE_BALANCE_LABEL[locale][roleLensKey][careC.bucket],
      careRelation === "same"
        ? CARE_BALANCE_MEANING[locale][roleLensKey].same
        : CARE_BALANCE_MEANING[locale][roleLensKey].diff,
    ),
    row(
      "gathering_recovery",
      pick(locale, "How You Recover After Family Events", "가족행사 후 에너지 회복 방식"),
      GATHERING_RECOVERY_LABEL[locale][recoveryP.bucket],
      GATHERING_RECOVERY_LABEL[locale][recoveryC.bucket],
      GATHERING_RECOVERY_MEANING[locale][comboKey(recoveryP.bucket, recoveryC.bucket)]!,
    ),
    row(
      "gathering_temperature",
      pick(locale, "Conversational Temperature at Gatherings", "가족모임의 대화 온도"),
      GATHERING_TEMPERATURE_LABEL[locale][tempP.bucket],
      GATHERING_TEMPERATURE_LABEL[locale][tempC.bucket],
      GATHERING_TEMPERATURE_MEANING[locale][comboKey(tempP.bucket, tempC.bucket)]!,
    ),
  ];
}
