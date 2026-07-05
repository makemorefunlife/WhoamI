import type { SajuBundle } from "@/lib/v2/saju/calculateSajuBundle";

/** `/api/saju` POST 응답과 동일한 형태 */
export function toV1SajuApiPayload(bundle: SajuBundle) {
  return {
    success: true,
    saju: bundle.saju,
    dayStemData: bundle.dayStemData,
    dayBranchData: bundle.dayBranchData,
    yearStemData: bundle.yearStemData,
    monthStemData: bundle.monthStemData,
    hourStemData: bundle.hourStemData,
    yearBranchData: bundle.yearBranchData,
    monthBranchData: bundle.monthBranchData,
    hourBranchData: bundle.hourBranchData,
    hiddenStemsData: bundle.hiddenStemsData,
    tenGods: bundle.tenGods,
    twelveStageData: bundle.twelveStageData,
    relations: bundle.relations.map((r) => ({
      type: r.type,
      interpretation: r.interpretation,
    })),
    growthStages: bundle.growthStages,
    shinsals: bundle.shinsals,
  };
}
