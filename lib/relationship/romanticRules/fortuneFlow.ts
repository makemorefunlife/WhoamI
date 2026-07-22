import { buildChartContext, type SajuPillars } from "@/lib/saju/chartContext";
import { elementInteraction } from "@/lib/saju/pairChartAnalysis";
import { REF_EARTHLY_BRANCHES, REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import { codesToHangulPillar } from "@/lib/saju/mapping";

const BRANCH_ORDER = [
  "ja",
  "chuk",
  "in",
  "myo",
  "jin",
  "sa",
  "o",
  "mi",
  "sin",
  "yu",
  "sul",
  "hae",
] as const;

const STEM_ORDER = [
  "gap",
  "eul",
  "byeong",
  "jeong",
  "mu",
  "gi",
  "gyeong",
  "sin",
  "im",
  "gye",
] as const;

const stemElementByCode = new Map<string, string>(
  REF_HEAVENLY_STEMS.map((row) => [row.code, row.element]),
);
const branchElementByCode = new Map<string, string>(
  REF_EARTHLY_BRANCHES.map((row) => [row.code, row.element]),
);

const POSITIVE_KEYWORDS = ["상생", "살림"];
const TENSION_KEYWORDS = ["상극", "긴장", "누름"];

export type FortuneInteraction = "supportive" | "neutral" | "tension";

export type DaewoonResult = {
  current_year: number;
  age_band_start: number;
  daewoon_pillar: string;
  daewoon_element: string;
  relationship_interaction: FortuneInteraction;
  interaction_note: string;
};

export type SewoonYearResult = {
  year: number;
  sewoon_pillar: string;
  branch_relation: "combine" | "clash" | "neutral";
};

export type SewoonResult = {
  current_year: number;
  years: SewoonYearResult[];
};

export type RomanticFortuneFlowResult = {
  daewoon: DaewoonResult;
  sewoon: SewoonResult;
};

function nextBranch(baseCode: string, step: number): string {
  const idx = BRANCH_ORDER.indexOf(baseCode as (typeof BRANCH_ORDER)[number]);
  if (idx < 0) return baseCode;
  return BRANCH_ORDER[(idx + step) % BRANCH_ORDER.length]!;
}

function nextStem(baseCode: string, step: number): string {
  const idx = STEM_ORDER.indexOf(baseCode as (typeof STEM_ORDER)[number]);
  if (idx < 0) return baseCode;
  return STEM_ORDER[(idx + step) % STEM_ORDER.length]!;
}

function normalizeBirthYear(dateText: string): number | null {
  const match = dateText.match(/^(\d{4})-/);
  if (!match) return null;
  const year = Number.parseInt(match[1]!, 10);
  return Number.isFinite(year) ? year : null;
}

function classifyInteraction(note: string): FortuneInteraction {
  if (POSITIVE_KEYWORDS.some((keyword) => note.includes(keyword))) return "supportive";
  if (TENSION_KEYWORDS.some((keyword) => note.includes(keyword))) return "tension";
  return "neutral";
}

function buildDaewoon(params: {
  currentYear: number;
  birthYearA: number;
  birthYearB: number;
  sajuA: SajuPillars;
  sajuB: SajuPillars;
}): DaewoonResult {
  const chartA = buildChartContext(params.sajuA);
  const chartB = buildChartContext(params.sajuB);

  const ageA = Math.max(0, params.currentYear - params.birthYearA);
  const ageB = Math.max(0, params.currentYear - params.birthYearB);
  const averageAge = Math.round((ageA + ageB) / 2);
  const ageBandStart = Math.floor(averageAge / 10) * 10;
  const decadeStep = Math.floor(averageAge / 10);

  const daewoonBranch = nextBranch(chartA.monthBranchCode, decadeStep);
  const daewoonStem = nextStem(chartB.monthStemCode, decadeStep);
  const daewoonElement =
    branchElementByCode.get(daewoonBranch) ?? stemElementByCode.get(daewoonStem) ?? "unknown";

  const personADayElement = stemElementByCode.get(chartA.dayStemCode) ?? "unknown";
  const personBDayElement = stemElementByCode.get(chartB.dayStemCode) ?? "unknown";
  const relationToA = elementInteraction(daewoonElement, personADayElement);
  const relationToB = elementInteraction(daewoonElement, personBDayElement);
  const interactionNote = `A:${relationToA} | B:${relationToB}`;
  const interactionLevel = [classifyInteraction(relationToA), classifyInteraction(relationToB)];
  const relationshipInteraction = interactionLevel.includes("tension")
    ? "tension"
    : interactionLevel.includes("supportive")
      ? "supportive"
      : "neutral";

  return {
    current_year: params.currentYear,
    age_band_start: ageBandStart,
    daewoon_pillar: codesToHangulPillar(daewoonStem, daewoonBranch),
    daewoon_element: daewoonElement,
    relationship_interaction: relationshipInteraction,
    interaction_note: interactionNote,
  };
}

function branchRelationFromSewoon(params: {
  targetBranchCode: string;
  dayBranchA: string;
  dayBranchB: string;
}): "combine" | "clash" | "neutral" {
  const combined = [params.dayBranchA, params.dayBranchB];
  const hitCount = combined.filter((branchCode) => branchCode === params.targetBranchCode).length;
  if (hitCount >= 1) return "combine";
  const oppositeMap: Record<string, string> = {
    ja: "o",
    chuk: "mi",
    in: "sin",
    myo: "yu",
    jin: "sul",
    sa: "hae",
    o: "ja",
    mi: "chuk",
    sin: "in",
    yu: "myo",
    sul: "jin",
    hae: "sa",
  };
  const isClash =
    oppositeMap[params.targetBranchCode] === params.dayBranchA ||
    oppositeMap[params.targetBranchCode] === params.dayBranchB;
  return isClash ? "clash" : "neutral";
}

function buildSewoon(params: {
  currentYear: number;
  sajuA: SajuPillars;
  sajuB: SajuPillars;
}): SewoonResult {
  const chartA = buildChartContext(params.sajuA);
  const chartB = buildChartContext(params.sajuB);

  const years = [0, 1, 3, 5, 10].map((horizonOffset) => params.currentYear + horizonOffset).map(
    (year) => {
      const offset = ((year - 1984) % 60 + 60) % 60;
      const stem = STEM_ORDER[offset % STEM_ORDER.length]!;
      const branch = BRANCH_ORDER[offset % BRANCH_ORDER.length]!;
      return {
        year,
        sewoon_pillar: codesToHangulPillar(stem, branch),
        branch_relation: branchRelationFromSewoon({
          targetBranchCode: branch,
          dayBranchA: chartA.dayBranchCode,
          dayBranchB: chartB.dayBranchCode,
        }),
      };
    },
  );

  return {
    current_year: params.currentYear,
    years,
  };
}

export function buildRomanticFortuneFlow(params: {
  birthDateA: string;
  birthDateB: string;
  sajuA: SajuPillars;
  sajuB: SajuPillars;
  currentYear?: number;
}): RomanticFortuneFlowResult | null {
  const birthYearA = normalizeBirthYear(params.birthDateA);
  const birthYearB = normalizeBirthYear(params.birthDateB);
  if (!birthYearA || !birthYearB) return null;

  const currentYear = params.currentYear ?? new Date().getFullYear();
  return {
    daewoon: buildDaewoon({
      currentYear,
      birthYearA,
      birthYearB,
      sajuA: params.sajuA,
      sajuB: params.sajuB,
    }),
    sewoon: buildSewoon({
      currentYear,
      sajuA: params.sajuA,
      sajuB: params.sajuB,
    }),
  };
}
