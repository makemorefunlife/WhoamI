import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { buildChartContext } from "@/lib/saju/chartContext";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";
import { LEGACY_FALLBACK_LOCALE, pick } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";
import type { CohabitationSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";

type WealthOfficerPower = CohabitationSajuSignals["wealth_officer_power"];

export type TenGodCounts = Record<string, number>;

const WEALTH_GODS = ["정재", "편재"];
const OFFICER_GODS = ["정관", "편관"];
const FOOD_GODS = ["식신", "상관"];
const SEAL_GODS = ["정인", "편인"];
const SELF_GODS = ["비견", "겁재"];

export function countTenGodsForMarriage(
  sajuJson: SajuDataForIntegrated,
): TenGodCounts {
  const counts: TenGodCounts = {};
  for (const t of sajuJson.tenGods ?? []) {
    // 일주(day pillar)는 일간을 자기 자신과 비교하는 항목이라 정의상 항상
    // 비견(self)으로 계산됨 — 실제 신호가 아니므로 카운트에서 제외한다.
    if (t.pillar === "일주") continue;
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function sumGods(counts: TenGodCounts, gods: string[]): number {
  return gods.reduce((s, g) => s + (counts[g] ?? 0), 0);
}

export type PersonTenGodProfile = {
  wealth: number;
  officer: number;
  food: number;
  seal: number;
  self: number;
  wealthOfficer: number;
  foodSeal: number;
  sealExcess: boolean;
  hasHyoshin: boolean;
  noWealth: boolean;
};

export function profileTenGods(counts: TenGodCounts): PersonTenGodProfile {
  const wealth = sumGods(counts, WEALTH_GODS);
  const officer = sumGods(counts, OFFICER_GODS);
  const food = sumGods(counts, FOOD_GODS);
  const seal = sumGods(counts, SEAL_GODS);
  const self = sumGods(counts, SELF_GODS);
  return {
    wealth,
    officer,
    food,
    seal,
    self,
    wealthOfficer: wealth + officer,
    foodSeal: food + seal,
    sealExcess: seal >= 3,
    hasHyoshin: (counts["편인"] ?? 0) >= 1,
    noWealth: wealth === 0,
  };
}

export type MarriageTenGodComplement = {
  hasWealthOfficerComplement: boolean;
  hasFoodSealHarmony: boolean;
  hasWealthOfficerPowerStruggle: boolean;
  wealthOfficerExplanation: string;
  foodSealExplanation: string;
};

export function analyzeMarriageTenGodComplement(
  countsA: TenGodCounts,
  countsB: TenGodCounts,
): MarriageTenGodComplement {
  const a = profileTenGods(countsA);
  const b = profileTenGods(countsB);

  const aLacksWealthOfficer = a.wealthOfficer <= 1;
  const bLacksWealthOfficer = b.wealthOfficer <= 1;
  const aStrongWealthOfficer = a.wealthOfficer >= 2;
  const bStrongWealthOfficer = b.wealthOfficer >= 2;

  const hasWealthOfficerComplement =
    (aLacksWealthOfficer && bStrongWealthOfficer) ||
    (bLacksWealthOfficer && aStrongWealthOfficer);

  const aFoodStrong = a.food >= 2;
  const bFoodStrong = b.food >= 2;
  const aSealStrong = a.seal >= 2;
  const bSealStrong = b.seal >= 2;

  const hasFoodSealHarmony =
    (aFoodStrong && bSealStrong) ||
    (bFoodStrong && aSealStrong) ||
    (a.food >= 1 && b.seal >= 1 && a.seal >= 1 && b.food >= 1);

  const bothPowerfulWealthOfficer =
    a.wealthOfficer >= 3 && b.wealthOfficer >= 3;

  return {
    hasWealthOfficerComplement,
    hasFoodSealHarmony,
    hasWealthOfficerPowerStruggle: bothPowerfulWealthOfficer,
    wealthOfficerExplanation: hasWealthOfficerComplement
      ? "한쪽의 현실 감각·책임감이 다른 쪽의 빈 구간을 메워 줍니다."
      : "재정·주도권 역량이 비슷한 편이라 역할 협상이 중요합니다.",
    foodSealExplanation: hasFoodSealHarmony
      ? "표현(육아 대화)과 훈육(원칙)이 톱니바퀴처럼 맞물릴 여지가 큽니다."
      : "육아·가사 스타일 차이를 미리 합의할 여지가 있습니다.",
  };
}

const WEALTH_STORAGE_BRANCHES = new Set(["chuk", "jin", "mi", "sul"]);

function legacyCfoScore(
  p: PersonTenGodProfile,
  branches: Set<string>,
): number {
  let s = p.wealthOfficer * 3 + p.wealth * 2;
  for (const br of branches) {
    if (WEALTH_STORAGE_BRANCHES.has(br)) s += 4;
  }
  if (p.noWealth && p.self >= 3) s -= 3;
  return s;
}

/** PersonCore wealth_officer_power 우선, 없으면 기존 십신·지지 폴백 — pick 재호출 없이 점수만. */
export function resolveCfoAffinityScore(
  counts: TenGodCounts,
  branchCodes: Set<string>,
  wealthOfficerPower?: WealthOfficerPower | null,
): number {
  if (wealthOfficerPower?.cfo_affinity_score != null) {
    return wealthOfficerPower.cfo_affinity_score;
  }
  return legacyCfoScore(profileTenGods(counts), branchCodes);
}

export function buildHouseholdCfoReason(
  winnerNick: string,
  loserNick: string,
  winnerIsHighDominance: boolean,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  return pick(
    locale,
    winnerIsHighDominance
      ? `${winnerNick} is the sole CFO leader of the household. Budget, bank accounts, and big-spending decisions should all go to this one person, or the household gets shaky. ${loserNick} should give input but leave the final call to them.`
      : `${winnerNick} has a firmer practical sense and sense of responsibility, so they're designated the household's financial leader. A "dual CFO" setup is banned — only one person should hold the reins.`,
    winnerIsHighDominance
      ? `${winnerNick}이(가) 집안 CFO 단독 리더입니다. 예산·통장·큰 지출 결정권은 이 사람 한 명에게 몰아야 집이 안 흔들립니다. ${loserNick}은(는) 의견은 내되 최종 결정은 맡기세요.`
      : `${winnerNick}이(가) 현실 감각·책임감이 더 단단해 집안 재정 리더로 지정됩니다. '듀얼 CFO'는 금지 — 한 명만 쥐세요.`,
  );
}

/**
 * PersonCore SSOT `CohabitationSajuSignals.wealth_officer_power` —
 * base saju CFO candidate used as the input/fallback for final refinement
 * (`refineHouseholdCfo` → `section_money_chores`). Prefer
 * `cfo_affinity_score` / `economic_dominance_band` when present; otherwise
 * (legacy cache) fall back to ten-god / branch counts.
 */
export function pickHouseholdCfo(
  nicknameA: string,
  nicknameB: string,
  countsA: TenGodCounts,
  countsB: TenGodCounts,
  chartABranchCodes: Set<string>,
  chartBBranchCodes: Set<string>,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
  wealthOfficerPowerA?: WealthOfficerPower,
  wealthOfficerPowerB?: WealthOfficerPower,
): { nickname: string; reason: string } {
  const a = profileTenGods(countsA);
  const b = profileTenGods(countsB);

  const scoreA = resolveCfoAffinityScore(
    countsA,
    chartABranchCodes,
    wealthOfficerPowerA,
  );
  const scoreB = resolveCfoAffinityScore(
    countsB,
    chartBBranchCodes,
    wealthOfficerPowerB,
  );
  const isHighDominance = (nick: "A" | "B"): boolean =>
    nick === "A"
      ? wealthOfficerPowerA
        ? wealthOfficerPowerA.economic_dominance_band === "high"
        : a.wealthOfficer >= 3
      : wealthOfficerPowerB
        ? wealthOfficerPowerB.economic_dominance_band === "high"
        : b.wealthOfficer >= 3;

  let winnerNick = scoreA >= scoreB ? nicknameA : nicknameB;
  let winnerIsHighDominance = isHighDominance(scoreA >= scoreB ? "A" : "B");

  if (scoreA === scoreB) {
    const jungjaeA = (countsA["정재"] ?? 0) + (countsA["정관"] ?? 0);
    const jungjaeB = (countsB["정재"] ?? 0) + (countsB["정관"] ?? 0);
    if (jungjaeB > jungjaeA) {
      winnerNick = nicknameB;
      winnerIsHighDominance = isHighDominance("B");
    } else {
      winnerNick = nicknameA;
      winnerIsHighDominance = isHighDominance("A");
    }
  }

  const loserNick = winnerNick === nicknameA ? nicknameB : nicknameA;

  return {
    nickname: winnerNick,
    reason: buildHouseholdCfoReason(
      winnerNick,
      loserNick,
      winnerIsHighDominance,
      locale,
    ),
  };
}

export type ParentingStyle = "empathy" | "structure";

const EMPATHY_LABEL: Record<Locale, string> = {
  "en-US":
    "🎨 Empathy Type Who Reads the Child's Emotions First — Takes in tears, anxiety, and hidden feelings first, but rules and boundaries can easily blur.",
  "ko-KR":
    "🎨 아이의 감정을 먼저 읽는 공감형 — 눈물·불안·숨겨진 마음을 먼저 받아 주지만, 규칙과 경계가 흐려지기 쉬워요.",
};

const STRUCTURE_LABEL: Record<Locale, string> = {
  "en-US":
    "📐 Structure Type Who Sets Firm Guidelines — Gives the child a safety net through schedule, standards, and principle, but emotional needs can get pushed back.",
  "ko-KR":
    "📐 엄격한 가이드를 세우는 규칙형 — 일정·기준·원칙으로 아이에게 안전망을 주지만, 감정 요구는 뒤로 밀릴 수 있어요.",
};

export function resolveParentingStyle(
  counts: TenGodCounts,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): { style: ParentingStyle; label: string } {
  const p = profileTenGods(counts);
  const foodDeveloped =
    p.food >= 2 || p.food > p.seal + p.officer;
  const structureDeveloped =
    p.seal + p.officer >= 2 || p.seal + p.officer > p.food;

  if (foodDeveloped && !structureDeveloped) {
    return { style: "empathy", label: EMPATHY_LABEL[locale] };
  }
  if (structureDeveloped && !foodDeveloped) {
    return { style: "structure", label: STRUCTURE_LABEL[locale] };
  }

  if (p.food >= p.seal + p.officer) {
    return { style: "empathy", label: EMPATHY_LABEL[locale] };
  }
  return { style: "structure", label: STRUCTURE_LABEL[locale] };
}

/** 식상 vs 인성+관성 한쪽만 뚜렷할 때 강한 사주 — flip 잠금용 */
export function isParentingSajuLocked(counts: TenGodCounts): boolean {
  const p = profileTenGods(counts);
  const foodDeveloped =
    p.food >= 2 || p.food > p.seal + p.officer;
  const structureDeveloped =
    p.seal + p.officer >= 2 || p.seal + p.officer > p.food;
  return (
    (foodDeveloped && !structureDeveloped) ||
    (structureDeveloped && !foodDeveloped)
  );
}

export function labelForParentingStyle(
  style: ParentingStyle,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  return style === "empathy" ? EMPATHY_LABEL[locale] : STRUCTURE_LABEL[locale];
}

const PSYCH_PARENTING_FLIP_GAP = 20;

export type RefineParentingStyleParams = {
  baseStyle: ParentingStyle;
  counts: TenGodCounts;
  psych?: PsychMasterJson | null;
  locale?: Locale;
};

export type RefinedParentingStyle = {
  style: ParentingStyle;
  label: string;
  confidence?: "high" | "low";
  align?: "confirms" | "caution";
};

/**
 * Phase 5-2 — resolveParentingStyle base + empathy/self_control 보정.
 * psych 없거나 mid·강한 사주면 base 유지. 약한 사주에서만 제한적 flip.
 * resolveParentingStyle 재호출 없음.
 */
export function refineParentingStyle(
  params: RefineParentingStyleParams,
): RefinedParentingStyle {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const baseStyle = params.baseStyle;
  const baseLabel = labelForParentingStyle(baseStyle, locale);

  if (!params.psych?.secondary_axes) {
    return { style: baseStyle, label: baseLabel };
  }

  const empathy = params.psych.secondary_axes.empathy;
  const selfControl = params.psych.secondary_axes.self_control;
  const psychDiff = empathy - selfControl;
  const locked = isParentingSajuLocked(params.counts);

  const psychLean: ParentingStyle | "balanced" =
    psychDiff >= PSYCH_PARENTING_FLIP_GAP
      ? "empathy"
      : psychDiff <= -PSYCH_PARENTING_FLIP_GAP
        ? "structure"
        : "balanced";

  if (psychLean === "balanced") {
    return {
      style: baseStyle,
      label: baseLabel,
      confidence: "low",
      align: "caution",
    };
  }

  if (psychLean === baseStyle) {
    return {
      style: baseStyle,
      label: baseLabel,
      confidence: "high",
      align: "confirms",
    };
  }

  // psych가 base와 반대
  if (locked) {
    return {
      style: baseStyle,
      label: baseLabel,
      confidence: "low",
      align: "caution",
    };
  }

  // 약한 사주 + 뚜렷한 psych 반대 → flip
  return {
    style: psychLean,
    label: labelForParentingStyle(psychLean, locale),
    confidence: "high",
    align: "caution",
  };
}

const AXIS_NOTE_HIGH = 60;
const AXIS_NOTE_LOW = 40;

/**
 * Part4① "Good Cop vs Bad Cop" 역할 네이밍 + 11축[자기통제/관계공감] 확인문구.
 * `resolveParentingStyle`의 공감형/규칙형 판정 자체는 전혀 안 건드리고, 스펙이
 * 요구하는 롤 네이밍과 11축 확인만 별도 필드로 얹는다.
 */
export function resolveParentingRoleNote(
  style: ParentingStyle,
  psych: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (style === "structure") {
    const score = psych?.secondary_axes?.self_control;
    if (typeof score !== "number") return null;
    if (score >= AXIS_NOTE_HIGH) {
      return pick(
        locale,
        "This person naturally settles into the \"Bad Cop\" role at home — setting rules and holding the line — and the 11-axis survey backs it up too: self-control runs high.",
        "이 사람은 집에서 자연스럽게 'Bad Cop' 역할을 맡게 돼요 — 규칙을 세우고 원칙을 지키는 쪽. 11축 설문에서도 확인돼요 — 자기통제 축이 높은 편이에요.",
      );
    }
    if (score <= AXIS_NOTE_LOW) {
      return pick(
        locale,
        "This person tends toward the \"Bad Cop\" role at home, but survey scores lean the other way — self-control runs low, so sticking to the rules consistently may take more conscious effort than the chart suggests.",
        "이 사람은 집에서 'Bad Cop' 역할에 가깝지만, 설문 점수는 오히려 반대로 나와요 — 자기통제 축이 낮은 편이라 원칙을 꾸준히 지키는 데 생각보다 의식적인 노력이 필요할 수 있어요.",
      );
    }
    return null;
  }

  const score = psych?.secondary_axes?.empathy;
  if (typeof score !== "number") return null;
  if (score >= AXIS_NOTE_HIGH) {
    return pick(
      locale,
      "This person naturally settles into the \"Good Cop\" role at home — reading the child's hurt feelings and softening them — and the 11-axis survey backs it up too: relational empathy runs high.",
      "이 사람은 집에서 자연스럽게 'Good Cop' 역할을 맡게 돼요 — 아이의 서운한 마음을 읽고 녹여주는 쪽. 11축 설문에서도 확인돼요 — 관계공감 축이 높은 편이에요.",
    );
  }
  if (score <= AXIS_NOTE_LOW) {
    return pick(
      locale,
      "This person tends toward the \"Good Cop\" role at home, but survey scores lean the other way — relational empathy runs low, so reading the child's emotional signals may take more conscious effort than the chart suggests.",
      "이 사람은 집에서 'Good Cop' 역할에 가깝지만, 설문 점수는 오히려 반대로 나와요 — 관계공감 축이 낮은 편이라 아이의 감정 신호를 읽는 데 생각보다 의식적인 노력이 필요할 수 있어요.",
    );
  }
  return null;
}

export type FamilyBoundaryProfile = {
  inlawStressIndex: number;
  needsStrongBoundary: boolean;
  hyoshinRisk: boolean;
  sealExcess: boolean;
  yearPalaceTension: boolean;
  summary: string;
};

export function analyzeFamilyBoundary(
  counts: TenGodCounts,
  intraHits: CrossChartHit[],
): FamilyBoundaryProfile {
  const p = profileTenGods(counts);
  const yearTension = intraHits.some(
    (h) =>
      ["충", "형"].includes(h.type) &&
      ((h.personA_pillar.startsWith("년주") &&
        (h.personB_pillar.startsWith("월주") ||
          h.personB_pillar.startsWith("일주"))) ||
        (h.personB_pillar.startsWith("년주") &&
          (h.personA_pillar.startsWith("월주") ||
            h.personA_pillar.startsWith("일주")))),
  );

  let inlawStressIndex = 20;
  if (p.hasHyoshin) inlawStressIndex += 25;
  if (p.sealExcess) inlawStressIndex += 20;
  if (yearTension) inlawStressIndex += 30;
  inlawStressIndex = Math.min(100, inlawStressIndex);

  const needsStrongBoundary =
    inlawStressIndex >= 55 || yearTension || (p.hasHyoshin && p.sealExcess);

  const summary = needsStrongBoundary
    ? "원가족과 정서적·물리적 거리를 분명히 두고 핵가족 중심으로 살아갈 때 평화가 커집니다."
    : "원가족과 적당한 거리를 유지하면서도 관계를 이어가기 좋은 구조입니다.";

  return {
    inlawStressIndex,
    needsStrongBoundary,
    hyoshinRisk: p.hasHyoshin,
    sealExcess: p.sealExcess,
    yearPalaceTension: yearTension,
    summary,
  };
}

export type MarriageTenGodAnalysis = {
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  profileA: PersonTenGodProfile;
  profileB: PersonTenGodProfile;
  complement: MarriageTenGodComplement;
  cfo: { nickname: string; reason: string };
  parentingA: ReturnType<typeof resolveParentingStyle>;
  parentingB: ReturnType<typeof resolveParentingStyle>;
  boundaryA: FamilyBoundaryProfile;
  boundaryB: FamilyBoundaryProfile;
};

export function analyzeMarriageTenGod(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  crossHitsInternalA: CrossChartHit[];
  crossHitsInternalB: CrossChartHit[];
  countsA?: TenGodCounts;
  countsB?: TenGodCounts;
  chartA?: ReturnType<typeof buildChartContext>;
  chartB?: ReturnType<typeof buildChartContext>;
  wealthOfficerPowerA?: WealthOfficerPower;
  wealthOfficerPowerB?: WealthOfficerPower;
  locale?: Locale;
}): MarriageTenGodAnalysis {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const countsA = params.countsA ?? countTenGodsForMarriage(params.sajuJsonA);
  const countsB = params.countsB ?? countTenGodsForMarriage(params.sajuJsonB);
  const chartA =
    params.chartA ??
    buildChartContext(
      sajuJsonToPillars(
        params.sajuJsonA.saju as Required<
          NonNullable<typeof params.sajuJsonA.saju>
        >,
      ),
    );
  const chartB =
    params.chartB ??
    buildChartContext(
      sajuJsonToPillars(
        params.sajuJsonB.saju as Required<
          NonNullable<typeof params.sajuJsonB.saju>
        >,
      ),
    );

  return {
    countsA,
    countsB,
    profileA: profileTenGods(countsA),
    profileB: profileTenGods(countsB),
    complement: analyzeMarriageTenGodComplement(countsA, countsB),
    cfo: pickHouseholdCfo(
      params.nicknameA,
      params.nicknameB,
      countsA,
      countsB,
      chartA.branchCodes,
      chartB.branchCodes,
      locale,
      params.wealthOfficerPowerA,
      params.wealthOfficerPowerB,
    ),
    parentingA: resolveParentingStyle(countsA, locale),
    parentingB: resolveParentingStyle(countsB, locale),
    boundaryA: analyzeFamilyBoundary(countsA, params.crossHitsInternalA),
    boundaryB: analyzeFamilyBoundary(countsB, params.crossHitsInternalB),
  };
}
