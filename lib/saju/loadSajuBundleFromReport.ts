import { REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import { getDayStemCode } from "@/lib/saju/romanticSajuDerivations";
import { validateSajuPillars } from "@/lib/saju/validateSajuBundle";
import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";

export type ReportBirthInput = {
  birth_date: string | null;
  birth_time: string | null;
  /** DB에 null이면 blueprint와 같이 12:00 시주로 계산 */
  birth_time_unknown?: boolean | null;
};

/** 연인 심화·디버그용 — blueprint `calculateSajuBundle`과 동일 경로 */
export type SajuChartProvenance = {
  birthDate: string;
  chartTime: string;
  birthTimeUnknown: boolean;
  pillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  dayStemCode: string;
  dayStemKor: string;
  dayStemMetaphor: string;
  engine: "calculateSajuBundle_v2";
  validationOk: boolean;
  validationNotes: string[];
};

/**
 * reports 생년월일 → 만세력(팔자) + 해석 bundle.
 * Blueprint·Slim v1과 동일한 `calculateSajuBundle`만 사용 (HTTP /api/saju 우회).
 */
export function loadSajuBundleFromReport(
  report: ReportBirthInput,
): {
  sajuJson: SajuDataForIntegrated;
  provenance: SajuChartProvenance;
} | null {
  const birthDate = report.birth_date?.trim();
  if (!birthDate) return null;

  const birthTimeUnknown =
    report.birth_time_unknown === true || !report.birth_time?.trim();
  const { chartTime } = resolveBirthTimeForCharts({
    birthTime: report.birth_time,
    birthTimeUnknown,
  });

  const bundle = calculateSajuBundle({
    birthDate,
    birthTime: report.birth_time,
    birthTimeUnknown,
  });

  const payload = toV1SajuApiPayload(bundle);
  const pillars = sajuJsonToPillars(bundle.saju);
  const dayStemCode = getDayStemCode(pillars);
  const ref = REF_HEAVENLY_STEMS.find((r) => r.code === dayStemCode);
  const validation = validateSajuPillars(pillars, { birthTimeUnknown });

  const sajuJson: SajuDataForIntegrated = {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };

  return {
    sajuJson,
    provenance: {
      birthDate,
      chartTime,
      birthTimeUnknown,
      pillars: {
        year: bundle.saju.yearPillar,
        month: bundle.saju.monthPillar,
        day: bundle.saju.dayPillar,
        hour: bundle.saju.hourPillar,
      },
      dayStemCode,
      dayStemKor: ref?.kor_name ?? dayStemCode,
      dayStemMetaphor: ref?.metaphor_ko ?? "",
      engine: "calculateSajuBundle_v2",
      validationOk: validation.ok,
      validationNotes: validation.notes,
    },
  };
}
