import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import { buildChartContext } from "@/lib/saju/chartContext";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";

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

export function pickHouseholdCfo(
  nicknameA: string,
  nicknameB: string,
  countsA: TenGodCounts,
  countsB: TenGodCounts,
  chartABranchCodes: Set<string>,
  chartBBranchCodes: Set<string>,
): { nickname: string; reason: string } {
  const a = profileTenGods(countsA);
  const b = profileTenGods(countsB);

  const score = (
    p: PersonTenGodProfile,
    branches: Set<string>,
  ): number => {
    let s = p.wealthOfficer * 3 + p.wealth * 2;
    for (const br of branches) {
      if (WEALTH_STORAGE_BRANCHES.has(br)) s += 4;
    }
    if (p.noWealth && p.self >= 3) s -= 3;
    return s;
  };

  const scoreA = score(a, chartABranchCodes);
  const scoreB = score(b, chartBBranchCodes);

  let winnerNick = scoreA >= scoreB ? nicknameA : nicknameB;
  let winnerProfile = scoreA >= scoreB ? a : b;

  if (scoreA === scoreB) {
    const jungjaeA = (countsA["정재"] ?? 0) + (countsA["정관"] ?? 0);
    const jungjaeB = (countsB["정재"] ?? 0) + (countsB["정관"] ?? 0);
    if (jungjaeB > jungjaeA) {
      winnerNick = nicknameB;
      winnerProfile = b;
    } else {
      winnerNick = nicknameA;
      winnerProfile = a;
    }
  }

  const loserNick = winnerNick === nicknameA ? nicknameB : nicknameA;

  return {
    nickname: winnerNick,
    reason:
      winnerProfile.wealthOfficer >= 3
        ? `${winnerNick}이(가) 집안 CFO 단독 리더입니다. 예산·통장·큰 지출 결정권은 이 사람 한 명에게 몰아야 집이 안 흔들립니다. ${loserNick}은(는) 의견은 내되 최종 결정은 맡기세요.`
        : `${winnerNick}이(가) 현실 감각·책임감이 더 단단해 집안 재정 리더로 지정됩니다. '듀얼 CFO'는 금지 — 한 명만 쥐세요.`,
  };
}

export type ParentingStyle = "empathy" | "structure";

export function resolveParentingStyle(
  counts: TenGodCounts,
): { style: ParentingStyle; label: string } {
  const p = profileTenGods(counts);
  const foodDeveloped =
    p.food >= 2 || p.food > p.seal + p.officer;
  const structureDeveloped =
    p.seal + p.officer >= 2 || p.seal + p.officer > p.food;

  if (foodDeveloped && !structureDeveloped) {
    return {
      style: "empathy",
      label:
        "🎨 아이의 감정을 먼저 읽는 공감형 — 눈물·불안·숨겨진 마음을 먼저 받아 주지만, 규칙과 경계가 흐려지기 쉬워요.",
    };
  }
  if (structureDeveloped && !foodDeveloped) {
    return {
      style: "structure",
      label:
        "📐 엄격한 가이드를 세우는 규칙형 — 일정·기준·원칙으로 아이에게 안전망을 주지만, 감정 요구는 뒤로 밀릴 수 있어요.",
    };
  }

  if (p.food >= p.seal + p.officer) {
    return {
      style: "empathy",
      label:
        "🎨 아이의 감정을 먼저 읽는 공감형 — 눈물·불안·숨겨진 마음을 먼저 받아 주지만, 규칙과 경계가 흐려지기 쉬워요.",
    };
  }
  return {
    style: "structure",
    label:
      "📐 엄격한 가이드를 세우는 규칙형 — 일정·기준·원칙으로 아이에게 안전망을 주지만, 감정 요구는 뒤로 밀릴 수 있어요.",
  };
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
}): MarriageTenGodAnalysis {
  const countsA = countTenGodsForMarriage(params.sajuJsonA);
  const countsB = countTenGodsForMarriage(params.sajuJsonB);
  const chartA = buildChartContext(
    sajuJsonToPillars(
      params.sajuJsonA.saju as Required<
        NonNullable<typeof params.sajuJsonA.saju>
      >,
    ),
  );
  const chartB = buildChartContext(
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
    ),
    parentingA: resolveParentingStyle(countsA),
    parentingB: resolveParentingStyle(countsB),
    boundaryA: analyzeFamilyBoundary(countsA, params.crossHitsInternalA),
    boundaryB: analyzeFamilyBoundary(countsB, params.crossHitsInternalB),
  };
}
