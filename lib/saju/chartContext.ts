import { toBranchCode, toStemCode } from "@/lib/saju/mapping";

export type SajuPillars = {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
};

export type PillarSlot = "년주" | "월주" | "일주" | "시주" | "year" | "month" | "day" | "hour" | string;

export type ChartPillar = {
  name: string;
  pillar: string;
  stemCode: string;
  branchCode: string;
};

export type ChartContext = {
  pillars: ChartPillar[];
  stemCodes: Set<string>;
  branchCodes: Set<string>;
  dayStemCode: string;
  dayBranchCode: string;
  monthStemCode: string;
  monthBranchCode: string;
  yearStemCode: string;
  yearBranchCode: string;
  hourStemCode: string;
  hourBranchCode: string;
  dayPillar: string;
};

export function buildChartContext(saju: SajuPillars): ChartContext {
  const entries: { name: string; pillar: string }[] = [
    { name: "년주", pillar: saju.yearPillar },
    { name: "월주", pillar: saju.monthPillar },
    { name: "일주", pillar: saju.dayPillar },
    { name: "시주", pillar: saju.hourPillar },
  ];

  const pillars: ChartPillar[] = entries.map(({ name, pillar }) => ({
    name,
    pillar,
    stemCode: toStemCode(pillar),
    branchCode: toBranchCode(pillar),
  }));

  const stemCodes = new Set(pillars.map((p) => p.stemCode));
  const branchCodes = new Set(pillars.map((p) => p.branchCode));

  const day = pillars.find((p) => p.name === "일주")!;
  const month = pillars.find((p) => p.name === "월주")!;
  const year = pillars.find((p) => p.name === "년주")!;
  const hour = pillars.find((p) => p.name === "시주")!;

  return {
    pillars,
    stemCodes,
    branchCodes,
    dayStemCode: day.stemCode,
    dayBranchCode: day.branchCode,
    monthStemCode: month.stemCode,
    monthBranchCode: month.branchCode,
    yearStemCode: year.stemCode,
    yearBranchCode: year.branchCode,
    hourStemCode: hour.stemCode,
    hourBranchCode: hour.branchCode,
    dayPillar: saju.dayPillar,
  };
}

/** ref_relation_rules result_code → 지지 code[] */
export const TRIO_BRANCH_GROUPS: Record<string, string[]> = {
  sin_ja_jin: ["sin", "ja", "jin"],
  hae_myo_mi: ["hae", "myo", "mi"],
  in_o_sul: ["in", "o", "sul"],
  sa_yu_chuk: ["sa", "yu", "chuk"],
  in_myo_jin: ["in", "myo", "jin"],
  sa_o_mi: ["sa", "o", "mi"],
  sin_yu_sul: ["sin", "yu", "sul"],
  hae_ja_chuk: ["hae", "ja", "chuk"],
};

export function chartHasAllBranches(
  chart: ChartContext,
  codes: string[],
): boolean {
  return codes.every((c) => chart.branchCodes.has(c));
}
