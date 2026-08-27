import {
  REF_EARTHLY_BRANCHES,
  REF_HEAVENLY_STEMS,
  REF_RELATION_RULES,
} from "@/lib/hardcoded/sajuReferenceData";
import {
  type ChartContext,
  TRIO_BRANCH_GROUPS,
  buildChartContext,
  type SajuPillars,
} from "@/lib/saju/chartContext";
import {
  analyzePairSaju,
  countElements,
  elementInteraction,
  type CrossChartHit,
  type PairSajuAnalysis,
} from "@/lib/saju/pairChartAnalysis";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { detectFriendWonjinGuimun } from "@/lib/saju/workPairRiskSignals";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/friend/friendCopy";
import { deriveIndividualFriendCharacter } from "@/lib/relationship/friend/friendCharacterEngine";

const stemElement = new Map(
  REF_HEAVENLY_STEMS.map((r) => [r.code, r.element as string]),
);
const branchElement = new Map(
  REF_EARTHLY_BRANCHES.map((r) => [r.code, r.element as string]),
);

function getStemEl(code: string): string {
  return stemElement.get(code as never) ?? "earth";
}

function getBranchEl(code: string): string {
  return branchElement.get(code as never) ?? "earth";
}

const YEOMA_BRANCHES = new Set(["in", "sin", "ja", "hae"]);
const COMBINE_TYPES = new Set(["육합", "삼합", "방합"]);
const DAY_TENSION_TYPES = new Set(["충", "형"]);
const FULL_TENSION_TYPES = new Set(["충", "형", "해", "파"]);

export const FRIEND_STEM_PALACE_WEIGHT: Record<string, number> = {
  일주: 1.0,
  월주: 0.85,
  년주: 0.6,
  시주: 0.5,
};

export type FriendScoringSignals = {
  hasDayBranchCombine: boolean;
  hasBijiepMutualResonance: boolean;
  hasDayBranchChungHyung: boolean;
  hasFoodSealHarmony: boolean;
  hasJohuComplement: boolean;
  hasFoodClashFriction: boolean;
  hasDayBranchFullTension: boolean;
  hasWonjinOrGuimun: boolean;
  hasWealthOfficerClash: boolean;
  hasDayStemMutualSupport: boolean;
};

export type TikitakaMode = "popcorn" | "silent";
export type BatteryMode = "outdoor" | "homebody";

export type FriendDnaProfile = {
  socialTitle: string;
  friendPosition: string;
  privateSelf: string;
  tikitakaMode: TikitakaMode;
  tikitakaLabel: string;
  tikitakaDescription: string;
  batteryMode: BatteryMode;
  batteryDescription: string;
  yeomaCount: number;
  dominantElement: "wood" | "fire" | "earth" | "metal" | "water";
};

export type FriendPairSajuAnalysis = {
  base: PairSajuAnalysis;
  chartA: ChartContext;
  chartB: ChartContext;
  crossHits: CrossChartHit[];
  scoringSignals: FriendScoringSignals;
  dnaA: FriendDnaProfile;
  dnaB: FriendDnaProfile;
};

type RelationRuleRow = {
  relation_type: string;
  code_a: string;
  code_b: string;
};

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function findBranchRule(type: string, a: string, b: string): RelationRuleRow | null {
  const key = pairKey(a, b);
  return (
    (REF_RELATION_RULES as unknown as RelationRuleRow[]).find(
      (r) =>
        r.relation_type === type && pairKey(r.code_a, r.code_b) === key,
    ) ?? null
  );
}

function branchesInSameTrio(a: string, b: string): boolean {
  for (const group of Object.values(TRIO_BRANCH_GROUPS)) {
    const codes = group as readonly string[];
    if (codes.includes(a) && codes.includes(b) && a !== b) return true;
  }
  return false;
}

function crossDayBranchCombine(a: ChartContext, b: ChartContext): boolean {
  const da = a.dayBranchCode;
  const db = b.dayBranchCode;
  if (findBranchRule("branch_six_combine", da, db)) return true;
  if (findBranchRule("branch_direction_combine", da, db)) return true;
  if (branchesInSameTrio(da, db)) return true;
  return false;
}

function chartTemperature(chart: ChartContext): "cold" | "hot" | "neutral" {
  const el = countElements(chart);
  const cold = (el.water ?? 0) + (el.metal ?? 0);
  const hot = (el.fire ?? 0) + (el.wood ?? 0);
  if (cold >= hot + 2) return "cold";
  if (hot >= cold + 2) return "hot";
  return "neutral";
}

function johuComplement(a: ChartContext, b: ChartContext): boolean {
  const elA = getBranchEl(a.dayBranchCode);
  const elB = getBranchEl(b.dayBranchCode);
  const interaction = elementInteraction(elA, elB);
  if (!interaction.includes("상생")) return false;
  const tempA = chartTemperature(a);
  const tempB = chartTemperature(b);
  return (
    (tempA === "cold" && tempB === "hot") ||
    (tempA === "hot" && tempB === "cold")
  );
}

function countYeoma(chart: ChartContext): number {
  let n = 0;
  for (const br of chart.branchCodes) {
    if (YEOMA_BRANCHES.has(br)) n++;
  }
  return n;
}

function filterDayHits(hits: CrossChartHit[]): CrossChartHit[] {
  return hits.filter(
    (h) =>
      h.personA_pillar.startsWith("일주") && h.personB_pillar.startsWith("일주"),
  );
}

function detectWonjinGuimunCross(a: ChartContext, b: ChartContext): boolean {
  return detectFriendWonjinGuimun(a, b);
}

function elementGenerates(source: string, target: string): boolean {
  const generates: Record<string, string> = {
    wood: "fire",
    fire: "earth",
    earth: "metal",
    metal: "water",
    water: "wood",
  };
  return generates[source] === target;
}

function bijiepMutualResonance(
  a: ChartContext,
  b: ChartContext,
  countsA: TenGodCounts,
  countsB: TenGodCounts,
): boolean {
  const selfA = (countsA["비견"] ?? 0) + (countsA["겁재"] ?? 0);
  const selfB = (countsB["비견"] ?? 0) + (countsB["겁재"] ?? 0);
  if (selfA < 1 && selfB < 1) return false;
  const stemA = getStemEl(a.dayStemCode);
  const stemB = getStemEl(b.dayStemCode);
  if (stemA === stemB) return true;
  return elementGenerates(stemA, stemB) || elementGenerates(stemB, stemA);
}

function foodSealHarmony(countsA: TenGodCounts, countsB: TenGodCounts): boolean {
  const pA = profileTenGods(countsA);
  const pB = profileTenGods(countsB);
  return (
    (pA.food >= 2 && pB.seal >= 2) ||
    (pB.food >= 2 && pA.seal >= 2) ||
    (pA.food >= 1 && pB.seal >= 1 && pA.seal >= 1 && pB.food >= 1)
  );
}

function foodClashFriction(
  countsA: TenGodCounts,
  countsB: TenGodCounts,
  dayHits: CrossChartHit[],
): boolean {
  const pA = profileTenGods(countsA);
  const pB = profileTenGods(countsB);
  const bothFoodStrong = pA.food >= 2 && pB.food >= 2;
  const dayTension = dayHits.some((h) => DAY_TENSION_TYPES.has(h.type));
  return bothFoodStrong && dayTension;
}

function wealthOfficerClash(
  countsA: TenGodCounts,
  countsB: TenGodCounts,
  dayHits: CrossChartHit[],
): boolean {
  const pA = profileTenGods(countsA);
  const pB = profileTenGods(countsB);
  const bothPowerful = pA.wealthOfficer >= 3 && pB.wealthOfficer >= 3;
  const tension = dayHits.some((h) => FULL_TENSION_TYPES.has(h.type));
  return bothPowerful && tension;
}

const SOCIAL_TITLES: Record<Locale, Record<string, string>> = {
  "en-US": {
    wood: "🌿 Mood-Maker Human Vitamin",
    fire: "🔥 Party Hero Who Blows Up the Room",
    earth: "🧸 Ride-or-Die Friendship Guardian",
    metal: "💎 Fact-Bomber & Reality-Check Fairy",
    water: "🌊 Emotional-Touch Playlist DJ",
  },
  "ko-KR": {
    wood: "🌿 무드 메이커 인간 비타민",
    fire: "🔥 분위기 터뜨리는 파티 히어로",
    earth: "🧸 든든한 우정 아지트 수호자",
    metal: "💎 팩트 폭격기 & 현실 체크 요정",
    water: "🌊 감성 터치 플레이리스트 DJ",
  },
};

function resolveTikitaka(
  counts: TenGodCounts,
  locale: Locale,
): {
  mode: TikitakaMode;
  label: string;
  description: string;
} {
  const p = profileTenGods(counts);
  const foodCount = p.food;
  if (foodCount >= 2) {
    return {
      mode: "popcorn",
      label: pick(locale, "🔥 All-Night Popcorn Talk Type", "🔥 밤새 털어대는 팝콘 토크파"),
      description: pick(
        locale,
        "Jokes and reactions fire nonstop — they only feel satisfied after a talk that spills every last thought.",
        "쉬지 않고 드립과 리액션이 튀어나오며 영혼을 탈탈 털어 수다를 떨어야 풀리는 스타일.",
      ),
    };
  }
  return {
    mode: "silent",
    label: pick(locale, "☕ Comfortable-Silence Home-Base Type", "☕ 말 없이 있어도 편한 침묵 아지트파"),
    description: pick(
      locale,
      "Prefers sharing the same space in comfortable silence — scrolling your phone or zoning out — over small talk for its own sake.",
      "영혼 없는 수다보다는 같은 공간에서 각자 폰을 보거나 멍 때려도 편안한 스타일.",
    ),
  };
}

function resolveBattery(
  chart: ChartContext,
  locale: Locale,
): {
  mode: BatteryMode;
  description: string;
} {
  const temp = chartTemperature(chart);
  const yeoma = countYeoma(chart);
  if (temp === "hot" || yeoma >= 1) {
    return {
      mode: "outdoor",
      description: pick(
        locale,
        "An iron-stamina outdoor type who has to get out and tear up a hot new spot or festival to recharge.",
        "무조건 밖으로 기어나가 힙한 핫플이나 페스티벌을 찢어야 풀리는 강철 체력 밖순이/밖돌이.",
      ),
    };
  }
  return {
    mode: "homebody",
    description: pick(
      locale,
      "A Netflix-and-delivery homebody who recharges by lying around their own home base.",
      "배달 음식 시켜놓고 집구석 아지트에서 누워있어야 충전되는 넷플릭스형 집순이/집돌이.",
    ),
  };
}

const FRIEND_POSITION: Record<Locale, Record<string, string>> = {
  "en-US": {
    wood: "The networking captain who hypes up the group and pulls in new friends",
    fire: "The entertainer who blows up the room with jokes, memes, and reactions",
    earth: "The friendship guardian who reads everyone's mood and keeps the peace",
    metal: "The reality-check leader who sets the group's standard on promises, manners, and facts",
    water: "The emotional counselor everyone comes to for a listening ear",
  },
  "ko-KR": {
    wood: "모임에서 분위기 띄우고 새 친구 끌어오는 네트워킹 캡틴",
    fire: "드립·밈·리액션으로 분위기 폭발시키는 엔터테이너",
    earth: "친구들 감정 캐치하고 중재하는 우정 수호자",
    metal: "약속·매너·팩트로 그룹 기준 잡는 현실 체크 리더",
    water: "속마음 듣고 공감해 주는 감성 상담소",
  },
};

/** @deprecated Legacy stem element friend position — superceded by 10 Day Master friendCharacterEngine */
function friendPosition(stemEl: string, locale: Locale): string {
  const map = FRIEND_POSITION[locale];
  return map[stemEl] ?? map.earth!;
}

const PRIVATE_SELF: Record<Locale, Record<string, string>> = {
  "en-US": {
    wood: "Gets loose and honest even at a casual drinking night",
    fire: "Gets more hyped and shows their true self the closer you get",
    earth: "Their real self comes out in a quiet corner during a deep conversation",
    metal: "Their real feelings show when the jokes stop and the talk gets serious and factual",
    water: "Processes emotions alone, and only opens up to their closest friends",
  },
  "ko-KR": {
    wood: "편한 술자리에서도 자유롭게 움직이며 솔직해지는 타입",
    fire: "친해질수록 텐션 올라가고 본音이 튀어나오는 타입",
    earth: "조용한 구석에서 깊은 대화가 터질 때 진짜 본모습",
    metal: "장난 줄이고 진지한 팩트 토크할 때 진짜 속마음",
    water: "혼자 있을 때 감정 정리하고, 친한 친구에게만 털어놓는 타입",
  },
};

function privateSelf(branchEl: string, locale: Locale): string {
  const map = PRIVATE_SELF[locale];
  return map[branchEl] ?? map.earth!;
}

function buildDnaProfile(
  chart: ChartContext,
  counts: TenGodCounts,
  locale: Locale,
): FriendDnaProfile {
  const el = countElements(chart);
  const dominant = (
    Object.entries(el) as [FriendDnaProfile["dominantElement"], number][]
  ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "earth";
  const tikitaka = resolveTikitaka(counts, locale);
  const battery = resolveBattery(chart, locale);
  const branchEl = getBranchEl(chart.dayBranchCode);

  const ind = deriveIndividualFriendCharacter({
    chart,
    tenGods: counts,
    psych: null,
    locale,
  });

  return {
    socialTitle: ind.characterTitle,
    friendPosition: ind.individualExplanation,
    privateSelf: privateSelf(branchEl, locale),
    tikitakaMode: tikitaka.mode,
    tikitakaLabel: tikitaka.label,
    tikitakaDescription: tikitaka.description,
    batteryMode: battery.mode,
    batteryDescription: battery.description,
    yeomaCount: countYeoma(chart),
    dominantElement: dominant,
  };
}

function buildScoringSignals(
  chartA: ChartContext,
  chartB: ChartContext,
  cross: CrossChartHit[],
  countsA: TenGodCounts,
  countsB: TenGodCounts,
  base: PairSajuAnalysis,
): FriendScoringSignals {
  const dayHits = filterDayHits(cross);
  const stemSupport = base.dayStemInteraction.includes("상생");

  return {
    hasDayBranchCombine: crossDayBranchCombine(chartA, chartB),
    hasBijiepMutualResonance: bijiepMutualResonance(
      chartA,
      chartB,
      countsA,
      countsB,
    ),
    hasDayBranchChungHyung: dayHits.some((h) => DAY_TENSION_TYPES.has(h.type)),
    hasFoodSealHarmony: foodSealHarmony(countsA, countsB),
    hasJohuComplement: johuComplement(chartA, chartB),
    hasFoodClashFriction: foodClashFriction(countsA, countsB, dayHits),
    hasDayBranchFullTension: dayHits.some((h) =>
      FULL_TENSION_TYPES.has(h.type),
    ),
    hasWonjinOrGuimun: detectWonjinGuimunCross(chartA, chartB),
    hasWealthOfficerClash: wealthOfficerClash(countsA, countsB, dayHits),
    hasDayStemMutualSupport: stemSupport,
  };
}

/** 친구(Social DNA) 페어 사주 분석 */
export function analyzeFriendPairSaju(
  sajuA: SajuPillars,
  sajuB: SajuPillars,
  countsA: TenGodCounts = {},
  countsB: TenGodCounts = {},
  prebuilt?: {
    chartA: ChartContext;
    chartB: ChartContext;
    pairAnalysis: PairSajuAnalysis;
  },
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): FriendPairSajuAnalysis {
  const chartA = prebuilt?.chartA ?? buildChartContext(sajuA);
  const chartB = prebuilt?.chartB ?? buildChartContext(sajuB);
  const base =
    prebuilt?.pairAnalysis ??
    analyzePairSaju(sajuA, sajuB, { chartA, chartB });
  const cross = base.allCrossHits;

  return {
    base,
    chartA,
    chartB,
    crossHits: cross,
    scoringSignals: buildScoringSignals(
      chartA,
      chartB,
      cross,
      countsA,
      countsB,
      base,
    ),
    dnaA: buildDnaProfile(chartA, countsA, locale),
    dnaB: buildDnaProfile(chartB, countsB, locale),
  };
}
