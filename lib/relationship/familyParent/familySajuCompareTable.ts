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
import {
  resolveParentBondBandFromCounts,
  resolveHomeClimateBand,
  synthesizeFamilySignalsFromCounts,
  type HomeClimateBand,
} from "@/lib/personCore/sajuSignals/extractFamilySignals";
import { buildPairFamilySignals } from "@/lib/personCore/sajuSignals/pairFamilySignals";
import { countElements, resolveDominantElement } from "@/lib/saju/pairChartAnalysis";
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

export type FamilyTenGodCategory = "wealth" | "officer" | "food" | "seal" | "self";
export type FamilyAffectionElement = "wood" | "fire" | "earth" | "metal" | "water";
export type FamilyStrengthBand = "weak" | "balanced" | "strong";

type TenGodCategory = FamilyTenGodCategory;
type ElementKey = FamilyAffectionElement;
type StrengthBand = FamilyStrengthBand;

export type FamilyComparePersonCell = {
  nickname: string;
  shortLabel: string;
  /** Locale-independent band — optional on legacy cached rows */
  band?: string;
};

export type FamilyCompareRow = {
  id: FamilyCompareRowId;
  label: string;
  personParent: FamilyComparePersonCell;
  personChild: FamilyComparePersonCell;
  meaning: string;
};

export type FamilyCompareRowTypedValue = {
  band_parent: string;
  band_child: string;
};

export type FamilyComparisonTableTypedValue = {
  correction_style: FamilyCompareRowTypedValue & {
    band_parent: FamilyTenGodCategory;
    band_child: FamilyTenGodCategory;
  };
  bond_distance: FamilyCompareRowTypedValue & {
    band_parent: ParentBondBand;
    band_child: ParentBondBand;
  };
  affection_expression: FamilyCompareRowTypedValue & {
    band_parent: FamilyAffectionElement;
    band_child: FamilyAffectionElement;
  };
  guidance_balance: FamilyCompareRowTypedValue & {
    band_parent: GuidanceMode;
    band_child: GuidanceMode;
  };
  gathering_recovery: FamilyCompareRowTypedValue & {
    band_parent: FamilyStrengthBand;
    band_child: FamilyStrengthBand;
  };
  home_climate: FamilyCompareRowTypedValue & {
    band_parent: HomeClimateBand;
    band_child: HomeClimateBand;
  };
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

import { josaGwaWa } from "./familyParentLanguage";

/**
 * meaning이 pair 밴드만 쓰면 person shortLabel 차이가 최종 문장에 안 남음.
 * 이미 계산된 A/B 라벨을 앞에 붙여, 같으면 “같음”·다르면 “차이”가 문장에 나타나게 한다.
 */
function personAxisLead(
  locale: Locale,
  nameParent: string,
  labelParent: string,
  nameChild: string,
  labelChild: string,
): string {
  if (labelParent === labelChild) {
    const parentWithJosa = josaGwaWa(nameParent);
    return pick(
      locale,
      `${nameParent} and ${nameChild} share the same signal (“${labelParent}”). `,
      `${parentWithJosa} ${nameChild} 모두 ‘${labelParent}’이에요. `,
    );
  }
  return pick(
    locale,
    `${nameParent}: “${labelParent}.” ${nameChild}: “${labelChild}.” `,
    `${nameParent} 쪽은 ‘${labelParent}’, ${nameChild} 쪽은 ‘${labelChild}’이에요. `,
  );
}

/** pairFamily 없으면 counts로 seal/bond 합성 → 기존 buildPairFamilySignals SSOT 재사용 (medium 강제 금지). */
function resolveComparePairFamily(params: {
  pairFamily?: PairFamilySignals | null;
  familySignalsParent?: FamilySajuSignals;
  familySignalsChild?: FamilySajuSignals;
  countsParent: TenGodCounts;
  countsChild: TenGodCounts;
  modeParent: GuidanceMode;
  modeChild: GuidanceMode;
}): PairFamilySignals {
  const famP =
    params.familySignalsParent ??
    synthesizeFamilySignalsFromCounts(params.countsParent);
  const famC =
    params.familySignalsChild ??
    synthesizeFamilySignalsFromCounts(params.countsChild);
  const rebuilt = buildPairFamilySignals(famP, famC, {
    modeA: params.modeParent,
    modeB: params.modeChild,
  });
  if (!params.pairFamily) return rebuilt;
  return {
    ...params.pairFamily,
    umbilical_band: params.pairFamily.umbilical_band ?? rebuilt.umbilical_band,
    nagging_band: params.pairFamily.nagging_band ?? rebuilt.nagging_band,
    guidance_fit:
      params.pairFamily.guidance_fit ??
      resolveGuidanceFit(params.modeParent, params.modeChild),
    umbilical_separation_index:
      params.pairFamily.umbilical_separation_index ??
      rebuilt.umbilical_separation_index,
    nagging_trigger_index:
      params.pairFamily.nagging_trigger_index ?? rebuilt.nagging_trigger_index,
    combined_karma_tension:
      params.pairFamily.combined_karma_tension ?? rebuilt.combined_karma_tension,
  };
}

// ---------------------------------------------------------------------------
// 계산 레이어 (source value + bucket) — 카피 없음. parentRole 미사용.
// ---------------------------------------------------------------------------

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

/** ③용 — 오행 우세(resolveDominantElement SSOT, Part3 genius와 동일 primitive). */
export function resolveAffectionExpressionBucket(
  chart: ChartContext,
): { sourceValue: Record<string, number>; bucket: ElementKey } {
  const { counts, dominant } = resolveDominantElement(chart);
  return { sourceValue: counts, bucket: dominant };
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

/** person shortLabel이 다를 때 — “달라도” 문구 허용 */
const CORRECTION_FRICTION_DIFF: Record<
  Locale,
  Record<FamilyRoleLensKey, Record<"low" | "medium" | "high", string>>
> = {
  "ko-KR": {
    neutral: {
      low: "집 안에서 훈육이나 서운함으로 지적이나 교정이 들어오는 순간, 한쪽은 감정이나 서운함이 먼저 터져 나오고 다른 쪽은 논리적인 이유부터 정리해 반응하기 쉽습니다. 서운함을 '무시당했다'고 느끼기보다, 10분 정도 쿨다운 시간을 가진 뒤 '한 줄 사실 + 한 줄 요청'으로만 대화하면 불필요한 마찰로 번지지 않습니다.",
      medium: "집 안에서 실수나 생활 습관 문제로 의견이 갈릴 때, 감정을 다독이는 쪽과 직설적으로 원인을 짚는 방식이 부딪히기 쉽습니다. 대화 시작 전 10초간 숨을 고르고 감정과 요청을 나누어 전달하면 훨씬 매끄러워집니다.",
      high: "지적이나 지시가 들어오는 순간 한쪽은 정서적 거부감을, 다른 쪽은 논리적 정당성을 내세워 감정 대립으로 격화되기 쉽습니다. 길게 설득하려 하기보다 핵심 요청 사항만 짧고 명확하게 전달해야 마찰을 피할 수 있습니다.",
    },
    mother: {
      low: "집 안에서 학업이나 생활 습관으로 지적이나 교정이 들어오는 순간, 한쪽은 서운함이나 감정이 먼저 터져 나오고 다른 쪽은 그 자리에서 즉시 직설적인 원인부터 정리하려는 경향이 있습니다. 서로 반응 속도가 달라도 서운함이 오래 굳어지지 않도록, 감정이 가라앉은 뒤 짧은 대화로 마치는 것이 좋습니다.",
      medium: "아이의 생활 태도를 교정할 때 감정적 반응과 이성적 설명이 엇갈려 중간 마찰이 날 수 있습니다. 서운함을 탓하기보다 '어떤 행동이 필요했는지' 한 줄 사실과 한 줄 요청으로 단순화해 보세요.",
      high: "훈육 순간 감정 반응과 직설적 교정이 상충하여 마찰이 빠르게 커질 수 있습니다. 상대의 반응에 조급해지지 말고 길게 평가하지 않는 것이 마음 상하지 않는 지혜입니다.",
    },
    father: {
      low: "집 안에서 행동이나 규칙 관련 지적이 들어오는 순간, 한쪽은 행동의 이유부터 짚으려 하고 다른 쪽은 감정적 반발이나 즉각적인 피드백을 보입니다. 대화 방식이 다를 뿐 본심은 닿아 있으므로, 핵심 이유 하나만 명확히 건네면 오해가 방지됩니다.",
      medium: "지도 과정에서 이유 설명 방식의 템포가 달라 답답함을 느낄 수 있습니다. 한 번에 여러 지적을 쏟아내기보다 한 번에 하나씩만 짚고 넘어가면 부드럽게 해결됩니다.",
      high: "규칙 지적 시 논리적 설명과 감정 반응이 강하게 부딪힐 수 있습니다. 긴 설교나 훈계보다는 한 가지 원칙만 분명히 남기고 스스로 생각할 여지를 주는 것이 효과적입니다.",
    },
  },
  "en-US": {
    neutral: {
      low: "When chores or rules trigger feedback at home, one leads with emotion while the other processes facts first. Taking a 10-minute pause before delivering one clear ask prevents unnecessary friction.",
      medium: "Different reaction styles can trigger friction over daily tasks — pause first and split feelings from the ask.",
      high: "Feedback moments escalate when emotional defensiveness meets direct evaluation — keep the ask brief and specific.",
    },
    mother: {
      low: "During routine discipline, one reacts emotionally while the other directly dissects causes. Letting emotions cool before a quick follow-up prevents lasting hurt.",
      medium: "Discipline styles differ — focus on one short fact and one clear ask rather than evaluating intentions.",
      high: "Discipline moments can escalate — shorten evaluation and stick strictly to a single request.",
    },
    father: {
      low: "When addressing rules, one explains reasons while the other responds directly. Keeping the core point clear prevents misunderstanding.",
      medium: "Guidance styles differ — address one point at a time instead of stacking issues.",
      high: "Rule discussions can escalate — state one firm principle and leave room rather than giving a long lecture.",
    },
  },
};

/** person shortLabel이 같을 때 — “달라도” 금지, 같은 타입의 함의를 짚음 */
const CORRECTION_FRICTION_SAME: Record<
  Locale,
  Record<FamilyRoleLensKey, Record<"low" | "medium" | "high", string>>
> = {
  "ko-KR": {
    neutral: {
      low: "같은 반응 타입이라 속도 싸움은 적고, 지금 마찰도 낮은 편이에요.",
      medium: "같은 반응 타입끼리 감정이 겹치면 중간 마찰이 날 수 있어요 — ‘한 줄 사실 + 한 줄 요청’이 도움이 돼요.",
      high: "같은 반응 타입끼리라 감정 온도가 겹치며 마찰이 커지기 쉬워요 — 평가는 줄이고 요청만 짧게.",
    },
    father: {
      low: "같은 반응 타입이라 설명 방식 충돌은 적고, 지금 마찰도 낮은 편이에요.",
      medium: "같은 반응 타입끼리 말이 겹치면 중간 마찰이 날 수 있어요 — 이유와 요청을 하나씩만.",
      high: "같은 반응 타입끼리라 말이 겹치며 마찰이 커지기 쉬워요 — 한 가지 기준만 분명히 하세요.",
    },
  },
  "en-US": {
    neutral: {
      low: "Same reaction type — less tempo clash, and friction stays low right now.",
      medium: "Same reaction type can still create moderate friction when feelings stack — keep one short ask.",
      high: "Same reaction type can stack emotion and escalate — one request at a time.",
    },
    mother: {
      low: "Same reaction type — less tempo fight, and friction stays low right now.",
      medium: "Same reaction type can create moderate friction when feelings overlap — one fact + one request.",
      high: "Same reaction type can stack emotion quickly — shorten evaluation and keep the ask brief.",
    },
    father: {
      low: "Same reaction type — less style clash, and friction stays low right now.",
      medium: "Same reaction type can create moderate friction when talk overlaps — one reason, one request.",
      high: "Same reaction type can escalate when talk stacks — one clear standard is enough.",
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

/** person bond가 다를 때 */
const UMBILICAL_DIFF: Record<
  Locale,
  Record<FamilyRoleLensKey, Record<"low" | "medium" | "high", string>>
> = {
  "ko-KR": {
    neutral: {
      low: "거리 감각이 달라도 지금은 크게 어긋나지 않아, 분리·독립 과제가 낮은 편이에요.",
      medium: "거리 감각이 달라 중간 강도 조율이 필요해요 — 가까운 쪽·공간 필요한 쪽을 말로 맞춰 보세요.",
      high: "거리 감각이 크게 달라 분리·독립 과제가 선명해요 — 각자의 편안한 거리를 먼저 말해 보세요.",
    },
    mother: {
      low: "거리 감각이 달라도 보호·독립 리듬이 크게 충돌하지 않아요.",
      medium: "거리 감각이 달라 보호와 독립 사이에서 중간 강도 조율이 필요해요.",
      high: "거리 감각이 달라 보호·독립 전환 과제가 커요 — 더 많은 공간이 필요한 쪽의 속도를 존중해 주세요.",
    },
    father: {
      low: "거리 감각이 달라도 관여·자율 리듬이 크게 충돌하지 않아요.",
      medium: "거리 감각이 달라 관여와 자율 사이에서 중간 강도 조율이 필요해요.",
      high: "거리 감각이 달라 관여·자율 조율 과제가 커요 — 스스로 판단할 여지가 더 필요한 쪽에 방향만 남기고 맡겨 보세요.",
    },
  },
  "en-US": {
    neutral: {
      low: "Different closeness needs, but the separation task stays low right now.",
      medium: "Different closeness needs need moderate tuning — name who wants nearer vs more space.",
      high: "Closeness needs differ sharply — name each person's comfortable distance first.",
    },
    mother: {
      low: "Different closeness needs, but protection/independence rhythms don't clash much.",
      medium: "Different closeness needs — moderate tuning between protection and independence.",
      high: "Different closeness needs make the protection/independence shift a strong task — respect who needs more room.",
    },
    father: {
      low: "Different closeness needs, but involvement/autonomy rhythms don't clash much.",
      medium: "Different closeness needs — moderate tuning between involvement and autonomy.",
      high: "Different closeness needs make involvement/autonomy a strong task — offer direction, then leave room.",
    },
  },
};

/** person bond가 같을 때 — “차이가 있어” 금지 */
const UMBILICAL_SAME: Record<
  Locale,
  Record<FamilyRoleLensKey, Record<"low" | "medium" | "high", string>>
> = {
  "ko-KR": {
    neutral: {
      low: "일상생활에서 외출 후 안부를 묻거나 각자의 개인 공간에서 시간을 보낼 때, 둘 다 서로의 영역을 존중하면서도 자연스러운 거리를 유지합니다. 지나치게 간섭하거나 갑자기 멀어지는 불안 없이 쾌적한 일상 리듬이 지속됩니다.",
      medium: "서로의 공간이 필요하다는 점은 잘 통하지만, 일상적인 안부나 챙김이 자칫 소홀해지지 않도록 가볍게 마음을 건네는 관심 조율이 도움이 됩니다.",
      high: "둘 다 독립성을 중시하더라도 너무 멀어지면 서운함이 축적될 수 있습니다. 각자 편안하다고 느끼는 관심의 정도를 주기적으로 대화로 나눠 보세요.",
    },
    mother: {
      low: "일상생활에서 외출 후 안부를 묻거나 각자의 공간에서 개인 시간을 보낼 때, 둘 다 적당히 서로의 일상을 챙기면서도 지나치게 간섭하지 않는 쾌적한 거리를 유지합니다. 일방적으로 밀착하거나 갑자기 멀어지는 불안 없이 안락한 일상 리듬이 지속됩니다.",
      medium: "서로 개인 영역을 존중하는 템포는 잘 맞지만, 일상적인 케어가 부족하다고 느끼지 않도록 안부를 챙기는 조율이 도움이 됩니다.",
      high: "독립성과 공간을 바라는 성향이 같아도 지나치게 방치된다고 느끼지 않도록 적절한 수용과 안부 표현이 필요합니다.",
    },
    father: {
      low: "일상생활에서 관여와 자율의 리듬이 서로 일치합니다. 적당한 거리를 두고 각자의 역할을 존중하므로 자율권 충돌이나 과도한 간섭 없이 편안한 관계가 유지됩니다.",
      medium: "자율성을 중시하는 속도는 통하지만, 가끔은 구체적인 방향 설정이나 케어가 필요할 때를 놓치지 않도록 조율하세요.",
      high: "독립된 방식이 비슷해 서로 닿지 않는 느낌을 줄 수 있으므로, 핵심 방향은 공유하는 대화가 필요합니다.",
    },
  },
  "en-US": {
    neutral: {
      low: "When checking in after returning home or using personal space, you both maintain a comfortable distance while respecting each other's boundaries. Daily rhythms stay peaceful without smothering or sudden coldness.",
      medium: "You both respect personal space, but balance it with light check-ins so care isn't missed.",
      high: "Even with shared independence, staying too distant can feel quiet — share your comfortable distance regularly.",
    },
    mother: {
      low: "During daily check-ins and personal time, you both maintain a healthy distance without micro-managing. Rhythms stay peaceful without feeling smothered or abandoned.",
      medium: "You understand each other's space, but make sure daily care stays clear and present.",
      high: "Respecting space is shared, but ensure independent boundaries don't translate to feeling ignored.",
    },
    father: {
      low: "Involvement and autonomy rhythms match well in daily life. Respecting each other's space keeps the bond free of over-involvement.",
      medium: "Autonomy needs align, but ensure direction and support are given when needed.",
      high: "Independence matches, but make sure shared direction remains connected.",
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
      aligned: "가정 내에서 조언이나 훈육이 필요한 순간에 서로 선호하는 소통 채널이 잘 맞물립니다. 부모가 전달하려는 핵심과 아이가 수용하는 방식이 같은 언어로 소통되어 오해 없이 뜻이 잘 전달됩니다.",
      partial: "돌봄과 지도 순간에 한쪽이 상황에 따라 수용과 기준을 번갈아 쓰는 유연한 타입이라, 일상적인 대화 톤이나 개입 강도를 상황별로 자유롭게 조율할 수 있는 구조입니다.",
      mismatch: "훈육이나 조언 시 한쪽은 따뜻한 정서적 수용을 먼저 바라는 반면, 다른 쪽은 구체적인 기준과 규칙 제시를 우선시하여 엇갈리기 쉽습니다. 대화 시작 전 '지금은 마음을 들을 타이밍인지, 기준을 잡을 타이밍인지' 한 줄로 선을 맞추면 훨씬 편안해집니다.",
    },
    mother: {
      aligned: "돌봄 장면에서 걱정과 챙김이 같은 언어로 전달되는 이상적인 구도입니다. 아이의 마음 상태를 살피고 보듬어주는 템포가 조화로워 억압이나 단절 없이 정서적 안정이 유지됩니다.",
      partial: "돌봄 장면에서 한쪽이 혼합형이라, 일상적인 관심과 개인 공간의 균형을 상황에 맞춰 부드럽게 조율할 수 있는 여지가 많은 구조입니다.",
      mismatch: "아이의 서운함을 보듬어주는 수용과 잘못을 바로잡는 기준 제시가 엇갈리기 쉬운 구도입니다. 먼저 감정을 받아줄지, 기준을 제시할지 사전에 가볍게 맞춰두는 노력이 필요합니다.",
    },
    father: {
      aligned: "지도와 조언이 오가는 대화에서 기대와 이유 설명의 리듬이 잘 맞물립니다. 책임과 자율의 기준이 명확하게 전달되어 서로 오해 없이 소통하기 편안합니다.",
      partial: "지도 장면에서 한쪽이 융통성 있게 수용과 기준을 취하는 타입이라, 책임 대화의 톤을 아이의 성장 단계에 따라 부드럽게 맞춰갈 수 있습니다.",
      mismatch: "조언 시 훈육의 이유부터 듣고 싶어 하는 방식과 명확한 원칙을 먼저 제시하려는 방식이 부딪히기 쉽습니다. 이유 설명부터 할지, 기준부터 짚을지 순서를 먼저 맞추는 대화 기술이 도움이 됩니다.",
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
      "low|low": "집안에서 오해나 마찰이 생기더라도 한쪽이 마음에 담아두고 분위기를 어둡게 끌고 가기보다, 상황을 담담하게 넘기거나 빠르게 풀어내는 성향입니다. 앙금이 정서적 상처로 오래 남아 집 전체를 누르지 않고 쾌적하게 회복되는 좋은 조합입니다.",
      "medium|medium": "걱정과 압력이 중간 강도로 감지되는 구조예요 — 쌓이기 전에 한 줄로 말해 보세요.",
      "high|low": "한쪽은 집 안 걱정·긴장을 오래 품고, 다른 쪽은 덜 붙잡는 편이에요 — 민감한 쪽의 신호를 먼저 받아 주세요.",
      "high|medium": "걱정이 분위기로 번지기 쉬운 쪽과 중간 쪽의 조합이에요 — 변화가 느껴질 때 짧게 확인해 주세요.",
      "low|medium": "한쪽은 긴장을 덜 붙잡고, 다른 쪽은 중간 정도예요 — 온도 차이를 무관심으로 읽지 마세요.",
    },
    father: {
      "high|high": "기준·대화·침묵이 집 안 분위기로 오래 남기 쉬운 구조예요 — 한 가지 기준만 짧게 남기고 분위기를 비워 주세요.",
      "low|low": "기준이나 대화에서 긴장이 발생해도 이를 집안 분위기로 오래 품지 않고 담담하게 털어내는 조합입니다. 불필요한 서운함이나 침묵이 길어지지 않고 빠르게 가벼운 일상으로 회복되는 특징을 보입니다.",
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

// ---- Typed resolver + label format -----------------------------------------

export type FamilyCompareTableResolverParams = {
  countsParent: TenGodCounts;
  countsChild: TenGodCounts;
  chartParent: ChartContext;
  chartChild: ChartContext;
  familySignalsParent?: FamilySajuSignals;
  familySignalsChild?: FamilySajuSignals;
};

/**
 * Locale-independent typed bands for all six Family compare rows.
 * Always parent/child oriented (never report A/B). parentRole unused.
 */
export function resolveFamilyComparisonTableTyped(
  params: FamilyCompareTableResolverParams,
): FamilyComparisonTableTypedValue {
  return {
    correction_style: {
      band_parent: resolveCorrectionStyleBucket(params.countsParent).bucket,
      band_child: resolveCorrectionStyleBucket(params.countsChild).bucket,
    },
    bond_distance: {
      band_parent: resolveBondDistanceBucket(
        params.countsParent,
        params.familySignalsParent,
      ).bucket,
      band_child: resolveBondDistanceBucket(
        params.countsChild,
        params.familySignalsChild,
      ).bucket,
    },
    affection_expression: {
      band_parent: resolveAffectionExpressionBucket(params.chartParent).bucket,
      band_child: resolveAffectionExpressionBucket(params.chartChild).bucket,
    },
    guidance_balance: {
      band_parent: resolveGuidanceBalanceBucket(params.countsParent).bucket,
      band_child: resolveGuidanceBalanceBucket(params.countsChild).bucket,
    },
    gathering_recovery: {
      band_parent: resolveGatheringRecoveryBucket(params.chartParent).bucket,
      band_child: resolveGatheringRecoveryBucket(params.chartChild).bucket,
    },
    home_climate: {
      band_parent: resolveHomeClimateBucket(params.familySignalsParent).bucket,
      band_child: resolveHomeClimateBucket(params.familySignalsChild).bucket,
    },
  };
}

export function formatFamilyCompareBandLabel(
  rowId: FamilyCompareRowId,
  band: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  switch (rowId) {
    case "correction_style":
      return CORRECTION_STYLE_LABEL[locale][band as TenGodCategory] ?? band;
    case "bond_distance":
      return BOND_DISTANCE_LABEL[locale][band as ParentBondBand] ?? band;
    case "affection_expression":
      return AFFECTION_EXPRESSION_LABEL[locale][band as ElementKey] ?? band;
    case "guidance_balance":
      return GUIDANCE_BALANCE_LABEL[locale][band as GuidanceMode] ?? band;
    case "gathering_recovery":
      return GATHERING_RECOVERY_LABEL[locale][band as StrengthBand] ?? band;
    case "home_climate":
      return HOME_CLIMATE_LABEL[locale][band as HomeClimateBand] ?? band;
    default:
      return band;
  }
}

export function formatFamilyCompareCanonicalMeaning(params: {
  rowId: FamilyCompareRowId;
  bandParent: string;
  bandChild: string;
  parentNickname: string;
  childNickname: string;
  parentRole?: FamilyParentRole;
  locale?: Locale;
}): string {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const roleLensKey = resolveRoleLensKey(params.parentRole);
  const { rowId, bandParent, bandChild, parentNickname, childNickname } = params;

  const labelP = formatFamilyCompareBandLabel(rowId, bandParent, locale);
  const labelC = formatFamilyCompareBandLabel(rowId, bandChild, locale);
  const lead = personAxisLead(locale, parentNickname, labelP, childNickname, labelC);

  if (rowId === "home_climate") {
    const key = comboKey(bandParent as HomeClimateBand, bandChild as HomeClimateBand);
    const text = HOME_CLIMATE_MEANING[locale][roleLensKey][key] || HOME_CLIMATE_MEANING[locale]["neutral"][key] || "";
    return lead + text;
  }
  if (rowId === "correction_style") {
    const text = bandParent === bandChild
      ? (CORRECTION_FRICTION_SAME[locale][roleLensKey]["low"] || "")
      : (CORRECTION_FRICTION_DIFF[locale][roleLensKey]["low"] || "");
    return lead + text;
  }
  if (rowId === "bond_distance") {
    const text = bandParent === bandChild
      ? (UMBILICAL_SAME[locale][roleLensKey]["low"] || "")
      : (UMBILICAL_DIFF[locale][roleLensKey]["low"] || "");
    return lead + text;
  }
  if (rowId === "guidance_balance") {
    const fitKey: GuidanceFit = bandParent === bandChild ? "aligned" : (bandParent === "mixed" || bandChild === "mixed" ? "partial" : "mismatch");
    const text = GUIDANCE_FIT_MEANING[locale][roleLensKey][fitKey] || "";
    return lead + text;
  }
  if (rowId === "affection_expression") {
    const text = bandParent === bandChild
      ? AFFECTION_EXPRESSION_MEANING[locale].same
      : AFFECTION_EXPRESSION_MEANING[locale].diff;
    return text;
  }
  if (rowId === "gathering_recovery") {
    const key = `${bandParent}|${bandChild}`;
    const text = GATHERING_RECOVERY_MEANING[locale][key] || "";
    return text;
  }
  return lead;
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
  const typed = resolveFamilyComparisonTableTyped({
    countsParent,
    countsChild,
    chartParent,
    chartChild,
    familySignalsParent,
    familySignalsChild,
  });

  // C person modes — pair 재구성·fit에 필요하므로 A/B보다 먼저 계산(SSOT 함수만 호출)
  const guideP = { bucket: typed.guidance_balance.band_parent };
  const guideC = { bucket: typed.guidance_balance.band_child };

  const pairFamily = resolveComparePairFamily({
    pairFamily: params.pairFamily,
    familySignalsParent,
    familySignalsChild,
    countsParent,
    countsChild,
    modeParent: guideP.bucket,
    modeChild: guideC.bucket,
  });

  const row = (
    id: FamilyCompareRowId,
    label: string,
    bandParent: string,
    bandChild: string,
    meaning: string,
  ): FamilyCompareRow => ({
    id,
    label,
    personParent: {
      nickname: parentNickname,
      shortLabel: sanitizeFamilyParentText(
        formatFamilyCompareBandLabel(id, bandParent, locale),
      ),
      band: bandParent,
    },
    personChild: {
      nickname: childNickname,
      shortLabel: sanitizeFamilyParentText(
        formatFamilyCompareBandLabel(id, bandChild, locale),
      ),
      band: bandChild,
    },
    meaning: sanitizeFamilyParentText(meaning),
  });

  // A — person style + pair nagging friction (+ person contrast in meaning)
  const styleP = typed.correction_style.band_parent;
  const styleC = typed.correction_style.band_child;
  const labelStyleP = formatFamilyCompareBandLabel("correction_style", styleP, locale);
  const labelStyleC = formatFamilyCompareBandLabel("correction_style", styleC, locale);
  const frictionBand = pairFamily.nagging_band;
  const correctionMeaning =
    personAxisLead(locale, parentNickname, labelStyleP, childNickname, labelStyleC) +
    (styleP === styleC
      ? CORRECTION_FRICTION_SAME[locale][roleLensKey][frictionBand]
      : CORRECTION_FRICTION_DIFF[locale][roleLensKey][frictionBand]);

  // B — person bond + pair umbilical (+ person contrast in meaning)
  const bondP = typed.bond_distance.band_parent;
  const bondC = typed.bond_distance.band_child;
  const labelBondP = formatFamilyCompareBandLabel("bond_distance", bondP, locale);
  const labelBondC = formatFamilyCompareBandLabel("bond_distance", bondC, locale);
  const umbilicalBand = pairFamily.umbilical_band;
  const bondMeaning =
    personAxisLead(locale, parentNickname, labelBondP, childNickname, labelBondC) +
    (bondP === bondC
      ? UMBILICAL_SAME[locale][roleLensKey][umbilicalBand]
      : UMBILICAL_DIFF[locale][roleLensKey][umbilicalBand]);

  // ③⑤⑥ — Part2 D~F 이전 유지; C는 guidance_balance
  const affectionP = typed.affection_expression.band_parent;
  const affectionC = typed.affection_expression.band_child;
  const affectionRelation = nominalRelation(affectionP, affectionC);

  const guidanceFit: GuidanceFit =
    pairFamily.guidance_fit ?? resolveGuidanceFit(guideP.bucket, guideC.bucket);
  const labelGuideP = formatFamilyCompareBandLabel(
    "guidance_balance",
    guideP.bucket,
    locale,
  );
  const labelGuideC = formatFamilyCompareBandLabel(
    "guidance_balance",
    guideC.bucket,
    locale,
  );
  const guidanceMeaning =
    personAxisLead(locale, parentNickname, labelGuideP, childNickname, labelGuideC) +
    GUIDANCE_FIT_MEANING[locale][roleLensKey][guidanceFit];

  const recoveryP = typed.gathering_recovery.band_parent;
  const recoveryC = typed.gathering_recovery.band_child;

  const climateP = typed.home_climate.band_parent;
  const climateC = typed.home_climate.band_child;
  const labelClimateP = formatFamilyCompareBandLabel("home_climate", climateP, locale);
  const labelClimateC = formatFamilyCompareBandLabel("home_climate", climateC, locale);
  const climateMeaning =
    personAxisLead(
      locale,
      parentNickname,
      labelClimateP,
      childNickname,
      labelClimateC,
    ) +
    HOME_CLIMATE_MEANING[locale][roleLensKey][
      comboKey(climateP, climateC)
    ]!;

  return [
    row(
      "correction_style",
      CORRECTION_STYLE_TITLE[locale][roleLensKey],
      styleP,
      styleC,
      correctionMeaning,
    ),
    row(
      "bond_distance",
      BOND_DISTANCE_TITLE[locale][roleLensKey],
      bondP,
      bondC,
      bondMeaning,
    ),
    row(
      "affection_expression",
      pick(locale, "How You Express Care", "가족에게 마음을 표현하는 방식"),
      affectionP,
      affectionC,
      affectionRelation === "same"
        ? AFFECTION_EXPRESSION_MEANING[locale].same
        : AFFECTION_EXPRESSION_MEANING[locale].diff,
    ),
    row(
      "guidance_balance",
      GUIDANCE_BALANCE_TITLE[locale][roleLensKey],
      guideP.bucket,
      guideC.bucket,
      guidanceMeaning,
    ),
    row(
      "gathering_recovery",
      pick(locale, "How You Recover After Family Events", "가족행사 후 에너지 회복 방식"),
      recoveryP,
      recoveryC,
      GATHERING_RECOVERY_MEANING[locale][comboKey(recoveryP, recoveryC)]!,
    ),
    row(
      "home_climate",
      HOME_CLIMATE_TITLE[locale][roleLensKey],
      climateP,
      climateC,
      climateMeaning,
    ),
  ];
}
