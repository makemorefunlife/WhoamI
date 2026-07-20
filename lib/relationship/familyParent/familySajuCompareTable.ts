import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import { sanitizeFamilyParentText } from "./familyParentLanguage";
import { profileTenGods, type TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { resolveParentingStyleLean } from "@/lib/personCore/sajuSignals/sharedPersonaSignals";
import {
  resolveOriginFamilyTension,
  type OriginFamilyTensionProfile,
} from "@/lib/personCore/sajuSignals/sharedPersonaSignals";
import {
  resolveGuidanceProfile,
  resolveGuidanceFit,
  type GuidanceMode,
  type GuidanceFit,
} from "@/lib/personCore/sajuSignals/guidanceProfile";
import { resolveParentBondBandFromCounts } from "@/lib/personCore/sajuSignals/extractFamilySignals";
import {
  resolveHomeClimateBand,
  type HomeClimateBand,
} from "@/lib/personCore/sajuSignals/extractFamilySignals";
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
 * family(가족) "한눈에 비교" 표 — Part2 A/B/C/E (009·010·012).
 *
 * A correction_style: person=십신 반응 유형 / pair=nagging_band
 * B bond_distance: person=parent_bond_band / pair=umbilical_band
 * C guidance_balance: person=guidance_profile / pair=guidance_fit
 * E home_climate: person=family_conflict_index band / pair=band 조합(수치 pair 없음)
 * parentRole → 제목·문맥만. 원국 점수 가감 금지.
 * F·Part3 미구현. 구 johu gathering_temperature 행은 E로 교체.
 */

export type FamilyCompareRowId =
  | "correction_style"
  | "bond_distance"
  | "affection_expression"
  | "guidance_balance"
  | "gathering_recovery"
  | "home_climate";

/** @deprecated Part2 E 이전 id — home_climate로 교체 */
export type LegacyGatheringTemperatureRowId = "gathering_temperature";

/** @deprecated Part2 C 이전 id — guidance_balance로 교체 */
export type LegacyCareBalanceRowId = "care_balance";

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

/** @deprecated Marriage parenting_style_lean 재노출 — Family C축에서는 사용하지 않음. */
export function resolveCareBalanceBucket(
  counts: TenGodCounts,
): { sourceValue: ReturnType<typeof profileTenGods>; bucket: "empathy" | "structure" } {
  return {
    sourceValue: profileTenGods(counts),
    bucket: resolveParentingStyleLean(counts),
  };
}

/** C person — seal/food/officer 상대 우세 → guidance mode (010 SSOT). */
export function resolveGuidanceBalanceBucket(
  counts: TenGodCounts,
): { sourceValue: ReturnType<typeof resolveGuidanceProfile>; bucket: GuidanceMode } {
  const profile = resolveGuidanceProfile(counts);
  return { sourceValue: profile, bucket: profile.mode };
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

/** @deprecated Part2 E — johu 행 제거. 회귀·외부 참조용만 유지. */
export function resolveGatheringTemperatureBucket(
  signals: FriendshipSajuSignals | undefined,
): { sourceValue: FriendshipSajuSignals["johu_profile"] | null; bucket: TemperatureBand } {
  if (!signals) return { sourceValue: null, bucket: "neutral" };
  return { sourceValue: signals.johu_profile, bucket: signals.johu_profile.temperature_band };
}

/** E person — family_conflict_index → intensityBand3 (기존 threshold). */
export function resolveHomeClimateBucket(
  familySignals?: FamilySajuSignals,
): ReturnType<typeof resolveHomeClimateBand> {
  return resolveHomeClimateBand(familySignals);
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

const GUIDANCE_BALANCE_TITLE: Record<Locale, Record<FamilyRoleLensKey, string>> = {
  "ko-KR": {
    neutral: "돌봄·지도가 필요할 때 자연스러운 방식",
    mother: "돌봄이 필요할 때 — 수용·설명·기준",
    father: "지도·조언이 필요할 때 — 수용·설명·기준",
  },
  "en-US": {
    neutral: "What feels natural when care or guidance is needed",
    mother: "When care is needed — accept, explain, or set standards",
    father: "When guidance is needed — accept, explain, or set standards",
  },
};

const GUIDANCE_BALANCE_LABEL: Record<Locale, Record<GuidanceMode, string>> = {
  "ko-KR": {
    receptive: "감정 수용이 먼저 나오는 타입",
    explanatory: "이유와 맥락을 설명하며 지도하는 타입",
    standards: "기준을 먼저 제시하는 타입",
    mixed: "수용·설명·기준을 섞어 쓰는 타입",
  },
  "en-US": {
    receptive: "Leads with emotional acceptance",
    explanatory: "Guides by explaining reasons and context",
    standards: "Leads by setting clear standards",
    mixed: "Mixes acceptance, explanation, and standards",
  },
};

const GUIDANCE_FIT_MEANING: Record<
  Locale,
  Record<FamilyRoleLensKey, Record<GuidanceFit, string>>
> = {
  "ko-KR": {
    neutral: {
      aligned: "돌봄·지도 방식이 잘 맞아요 — 같은 채널로 주고받기 쉬워요.",
      partial: "한쪽이 혼합형이라, 장면마다 조율할 여지가 있어요.",
      mismatch: "한쪽은 수용·설명, 다른 쪽은 기준 제시에 치우쳐 엇갈리기 쉬워요 — ‘지금 필요한 채널’을 먼저 말해 보세요.",
    },
    mother: {
      aligned: "돌봄 장면에서 방식이 잘 맞아요 — 걱정과 챙김이 같은 언어로 전달되기 쉬워요.",
      partial: "돌봄 장면에서 한쪽이 혼합형이라, 일상 개입 강도를 장면마다 조율할 여지가 있어요.",
      mismatch: "돌봄 장면에서 수용과 기준이 엇갈리기 쉬워요 — 먼저 감정을 받을지, 기준을 할지 한 줄로 맞춰 보세요.",
    },
    father: {
      aligned: "지도·조언 장면에서 방식이 잘 맞아요 — 기대와 설명이 같은 리듬으로 전달되기 쉬워요.",
      partial: "지도 장면에서 한쪽이 혼합형이라, 책임 대화의 톤을 장면마다 조율할 여지가 있어요.",
      mismatch: "지도 장면에서 설명과 기준이 엇갈리기 쉬워요 — 이유부터인지, 기준부터인지 먼저 맞춰 보세요.",
    },
  },
  "en-US": {
    neutral: {
      aligned: "Your care/guidance channels line up — easy to give and receive on the same wavelength.",
      partial: "One of you mixes modes — room to tune channel by situation.",
      mismatch: "One leans accept/explain while the other leans standards — name the channel you need first.",
    },
    mother: {
      aligned: "Care moments line up — worry and tending travel in the same language.",
      partial: "One of you mixes modes in care moments — tune everyday involvement by situation.",
      mismatch: "Acceptance and standards can cross wires in care moments — align in one line first: feel or frame.",
    },
    father: {
      aligned: "Guidance moments line up — expectation and explanation share a rhythm.",
      partial: "One of you mixes modes in guidance — tune the tone of responsibility talks by situation.",
      mismatch: "Explanation and standards can cross wires — align first: reason, or the standard.",
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

const HOME_CLIMATE_TITLE: Record<Locale, Record<FamilyRoleLensKey, string>> = {
  "ko-KR": {
    neutral: "집 안 긴장이 쌓이기 쉬운가, 오래 남지 않는가",
    mother: "집 안에서 걱정과 긴장이 쌓이는 방식",
    father: "기준·대화·침묵이 집 안 분위기에 남는 방식",
  },
  "en-US": {
    neutral: "Does household tension build easily, or does it not linger?",
    mother: "How worry and tension build inside the home",
    father: "How standards, talk, and silence linger in the household mood",
  },
};

const HOME_CLIMATE_LABEL: Record<Locale, Record<HomeClimateBand, string>> = {
  "ko-KR": {
    low: "집 안 긴장을 오래 붙잡지 않는 편",
    medium: "집 안 미묘한 압력을 중간 정도로 느끼는 편",
    high: "집 안 긴장을 빨리 감지하고 오래 품을 수 있는 편",
  },
  "en-US": {
    low: "Doesn't tend to hold household tension for long",
    medium: "Notices subtle household pressure at a moderate level",
    high: "Picks up household tension quickly and may carry it longer",
  },
};

const HOME_CLIMATE_MEANING: Record<
  Locale,
  Record<FamilyRoleLensKey, Record<string, string>>
> = {
  "ko-KR": {
    neutral: {
      "high|high": "둘 다 집 안 긴장을 오래 감지·누적하기 쉬운 구조예요 — 갈등이 집 전체 분위기로 번질 수 있어, 작은 불편을 일찍 말로 풀면 도움이 돼요.",
      "low|low": "둘 다 집 안 긴장을 오래 붙잡지 않는 편이라, 불편이 생겨도 분위기로 오래 남기기 어려워요.",
      "medium|medium": "둘 다 집 안 압력을 중간 정도로 느끼는 구조예요 — 쌓이기 전에 한 줄로 상태를 말해 두면 좋아요.",
      "high|low": "한쪽은 집 안 긴장을 빨리 감지·누적하고, 다른 쪽은 오래 붙잡지 않는 편이에요 — 민감한 쪽의 신호를 무시하지 마세요.",
      "high|medium": "한쪽은 긴장을 더 오래 품고, 다른 쪽은 중간 정도예요 — 분위기 변화가 느껴질 때 짧은 확인이 도움이 돼요.",
      "low|medium": "한쪽은 긴장을 덜 붙잡고, 다른 쪽은 중간 정도예요 — 온도 차이를 ‘관심 없음’으로 오해하지 마세요.",
    },
    mother: {
      "high|high": "걱정과 집 안 긴장이 둘 다 누적되기 쉬운 구조예요 — 분위기가 무거워지기 전에 짧은 안부로 풀면 도움이 돼요.",
      "low|low": "걱정이 집 전체 분위기로 오래 남기 어려운 조합이에요.",
      "medium|medium": "걱정과 압력이 중간 강도로 감지되는 구조예요 — 쌓이기 전에 한 줄로 말해 보세요.",
      "high|low": "한쪽은 집 안 걱정·긴장을 오래 품고, 다른 쪽은 덜 붙잡는 편이에요 — 민감한 쪽의 신호를 먼저 받아 주세요.",
      "high|medium": "걱정이 분위기로 번지기 쉬운 쪽과 중간 쪽의 조합이에요 — 변화가 느껴질 때 짧게 확인해 주세요.",
      "low|medium": "한쪽은 긴장을 덜 붙잡고, 다른 쪽은 중간 정도예요 — 온도 차이를 무관심으로 읽지 마세요.",
    },
    father: {
      "high|high": "기준·대화·침묵이 집 안 분위기로 오래 남기 쉬운 구조예요 — 한 가지 기준만 짧게 남기고 분위기를 비워 주세요.",
      "low|low": "기준 대화가 집 전체 긴장으로 오래 남기 어려운 조합이에요.",
      "medium|medium": "기준과 침묵이 중간 강도로 분위기에 남는 구조예요 — 쌓이기 전에 한 줄로 맞춰 보세요.",
      "high|low": "한쪽은 분위기 긴장을 오래 감지하고, 다른 쪽은 덜 붙잡는 편이에요 — 민감한 쪽의 침묵을 무시하지 마세요.",
      "high|medium": "긴장이 분위기로 남기 쉬운 쪽과 중간 쪽의 조합이에요 — 변화가 느껴질 때 짧게 확인해 주세요.",
      "low|medium": "한쪽은 긴장을 덜 붙잡고, 다른 쪽은 중간 정도예요 — 온도 차이를 무관심으로 읽지 마세요.",
    },
  },
  "en-US": {
    neutral: {
      "high|high": "Both of you tend to sense and accumulate household tension — friction can spread into the whole mood, so naming a small discomfort early helps.",
      "low|low": "Neither of you tends to hold household tension long — discomfort rarely settles into the room's mood.",
      "medium|medium": "You both notice household pressure at a moderate level — say one line before it stacks.",
      "high|low": "One of you senses and carries household tension; the other doesn't hold it long — don't ignore the sensitive signal.",
      "high|medium": "One carries tension longer; the other is moderate — a short check-in when the mood shifts helps.",
      "low|medium": "One holds tension lightly; the other is moderate — don't read the gap as indifference.",
    },
    mother: {
      "high|high": "Worry and household tension can stack for both of you — a short check-in before the mood gets heavy helps.",
      "low|low": "Worry is less likely to linger as the whole-home mood between you.",
      "medium|medium": "Worry and pressure register at a moderate level — say one line before it stacks.",
      "high|low": "One of you carries home worry/tension longer; the other holds it lightly — receive the sensitive signal first.",
      "high|medium": "One side lets worry tint the mood more easily; the other is moderate — check in briefly when it shifts.",
      "low|medium": "One holds tension lightly; the other is moderate — don't read the gap as indifference.",
    },
    father: {
      "high|high": "Standards, talk, and silence can linger in the household mood — leave one short standard, then clear the air.",
      "low|low": "Guidance talk is less likely to linger as whole-home tension between you.",
      "medium|medium": "Standards and silence register at a moderate mood level — align in one line before it stacks.",
      "high|low": "One of you senses mood tension longer; the other holds it lightly — don't ignore the quieter signal.",
      "high|medium": "One side lets tension linger in the mood; the other is moderate — check in briefly when it shifts.",
      "low|medium": "One holds tension lightly; the other is moderate — don't read the gap as indifference.",
    },
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

  // C person modes — pair 재구성·fit에 필요하므로 A/B보다 먼저 계산(SSOT 함수만 호출)
  const guideP = resolveGuidanceBalanceBucket(countsParent);
  const guideC = resolveGuidanceBalanceBucket(countsChild);

  const pairFamily: PairFamilySignals | null =
    params.pairFamily ??
    (familySignalsParent && familySignalsChild
      ? buildPairFamilySignals(familySignalsParent, familySignalsChild, {
          modeA: guideP.bucket,
          modeB: guideC.bucket,
        })
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

  // ③⑤⑥ — Part2 D~F 이전 유지; C는 guidance_balance
  const affectionP = resolveAffectionExpressionBucket(chartParent);
  const affectionC = resolveAffectionExpressionBucket(chartChild);
  const affectionRelation = nominalRelation(affectionP.bucket, affectionC.bucket);

  const guidanceFit: GuidanceFit =
    pairFamily?.guidance_fit ?? resolveGuidanceFit(guideP.bucket, guideC.bucket);

  const recoveryP = resolveGatheringRecoveryBucket(chartParent);
  const recoveryC = resolveGatheringRecoveryBucket(chartChild);

  const climateP = resolveHomeClimateBucket(familySignalsParent);
  const climateC = resolveHomeClimateBucket(familySignalsChild);
  const climateMeaning =
    HOME_CLIMATE_MEANING[locale][roleLensKey][
      comboKey(climateP.bucket, climateC.bucket)
    ]!;

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
      "guidance_balance",
      GUIDANCE_BALANCE_TITLE[locale][roleLensKey],
      GUIDANCE_BALANCE_LABEL[locale][guideP.bucket],
      GUIDANCE_BALANCE_LABEL[locale][guideC.bucket],
      GUIDANCE_FIT_MEANING[locale][roleLensKey][guidanceFit],
    ),
    row(
      "gathering_recovery",
      pick(locale, "How You Recover After Family Events", "가족행사 후 에너지 회복 방식"),
      GATHERING_RECOVERY_LABEL[locale][recoveryP.bucket],
      GATHERING_RECOVERY_LABEL[locale][recoveryC.bucket],
      GATHERING_RECOVERY_MEANING[locale][comboKey(recoveryP.bucket, recoveryC.bucket)]!,
    ),
    row(
      "home_climate",
      HOME_CLIMATE_TITLE[locale][roleLensKey],
      HOME_CLIMATE_LABEL[locale][climateP.bucket],
      HOME_CLIMATE_LABEL[locale][climateC.bucket],
      climateMeaning,
    ),
  ];
}
