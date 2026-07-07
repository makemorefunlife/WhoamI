import { calculateSaju } from "@fullstackfamily/manseryeok";
import { analyzeRelations } from "@/lib/saju/analyzeRelations";
import { analyzeShinsal } from "@/lib/saju/analyzeShinsal";
import { buildChartContext } from "@/lib/saju/chartContext";
import {
  calculateTenGod,
  calculateTwelveStage,
  getEarthlyBranchData,
  getHeavenlyStemData,
  getHiddenStemsData,
  getTenGodData,
  getTwelveStageData,
} from "@/lib/saju/repository";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";

export type SajuBirthInput = {
  birthDate: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
};

/**
 * v1 `/api/saju` 와 동일한 계산·구조.
 * - 출생 시간 없음/모름 → 12:00 으로 시주 계산, meta.birth_time_unknown = true
 * - 출생 시간 있음 → HH:MM 그대로 (사주는 출생지와 무관)
 */
export function calculateSajuBundle(input: SajuBirthInput) {
  const { chartTime, birthTimeUnknown } = resolveBirthTimeForCharts(input);
  const [year, month, day] = input.birthDate.split("-").map(Number);
  const [hour, minute] = chartTime.split(":").map(Number);

  const saju = calculateSaju(year, month, day, hour, minute) as {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
  };
  const chart = buildChartContext(saju);
  const dayStem = chart.dayStemCode;
  const dayBranch = chart.dayBranchCode;

  const yearStemData = getHeavenlyStemData(chart.yearStemCode);
  const monthStemData = getHeavenlyStemData(chart.monthStemCode);
  const hourStemData = getHeavenlyStemData(chart.hourStemCode);
  const yearBranchData = getEarthlyBranchData(chart.yearBranchCode);
  const monthBranchData = getEarthlyBranchData(chart.monthBranchCode);
  const hourBranchData = getEarthlyBranchData(chart.hourBranchCode);
  const dayStemData = getHeavenlyStemData(dayStem);
  const dayBranchData = getEarthlyBranchData(dayBranch);
  const hiddenStemsData = getHiddenStemsData(dayBranch);
  const twelveStageData = getTwelveStageData(
    calculateTwelveStage(dayStem, dayBranch),
  );
  const relations = analyzeRelations(chart);
  const shinsals = analyzeShinsal(chart);

  const tenGods = chart.pillars.map((p) => {
    const godCode = calculateTenGod(dayStem, p.stemCode);
    const godData = getTenGodData(godCode);
    return { pillar: p.name, godCode, godData };
  });

  const growthStages = chart.pillars.map((p) => {
    const stageCode = calculateTwelveStage(dayStem, p.branchCode);
    const stageData = getTwelveStageData(stageCode);
    return { pillar: p.name, stageCode, stageData };
  });

  return {
    meta: { birth_time_unknown: birthTimeUnknown },
    chart,
    saju: {
      yearPillar: saju.yearPillar,
      monthPillar: saju.monthPillar,
      dayPillar: saju.dayPillar,
      hourPillar: saju.hourPillar,
    },
    dayStemData,
    dayBranchData,
    yearStemData,
    monthStemData,
    hourStemData,
    yearBranchData,
    monthBranchData,
    hourBranchData,
    hiddenStemsData,
    tenGods,
    twelveStageData,
    growthStages,
    relations: relations.map((r) => ({
      type: r.type,
      name: r.name,
      interpretation: r.interpretation,
      priority: r.priority,
    })),
    shinsals,
  };
}

export type SajuBundle = ReturnType<typeof calculateSajuBundle>;
