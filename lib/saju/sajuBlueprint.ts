/**
 * 사주 블루프린트 — 만세력·십성·합충·신살을 1회만 계산하고
 * 5대 관계 탭(연인·동료·결혼·가족·친구)은 가중치·텍스트 매핑만 수행.
 */
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type {
  PersonTenGodProfile,
  TenGodCounts,
} from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import {
  countTenGodsForMarriage,
  profileTenGods,
} from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import {
  type ChartContext,
  buildChartContext,
  type SajuPillars,
} from "@/lib/saju/chartContext";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import {
  analyzePairSaju,
  sajuJsonToPillars,
  type PairSajuAnalysis,
} from "@/lib/saju/pairChartAnalysis";
import { buildSajuUncertainItems } from "@/lib/saju/sajuUncertainItems";
import {
  validateSajuPillars,
  type SajuValidationResult,
} from "@/lib/saju/validateSajuBundle";
import type { Locale } from "@/lib/i18n/locale";

/** 십성 카운트 — marriageTenGodAnalysis 단일 SSOT */
export function countTenGods(sajuJson: SajuDataForIntegrated): TenGodCounts {
  return countTenGodsForMarriage(sajuJson);
}

export type PersonSajuBlueprint = {
  sajuJson: SajuDataForIntegrated;
  provenance?: SajuChartProvenance;
  pillars: SajuPillars;
  chart: ChartContext;
  tenGodCounts: TenGodCounts;
  tenGodProfile: PersonTenGodProfile;
  relations: NonNullable<SajuDataForIntegrated["relations"]>;
  shinsals: NonNullable<SajuDataForIntegrated["shinsals"]>;
  validation: SajuValidationResult;
  birthPlace?: string;
  birthTimeUnknown?: boolean;
};

/** 페어 공통 코어 — chart·pairAnalysis 이중 연산 방지 */
export type PairSajuCore = {
  pillarsA: SajuPillars;
  pillarsB: SajuPillars;
  chartA: ChartContext;
  chartB: ChartContext;
  pairAnalysis: PairSajuAnalysis;
  tenGodsA: TenGodCounts;
  tenGodsB: TenGodCounts;
  profileA: PersonTenGodProfile;
  profileB: PersonTenGodProfile;
};

export type PairSajuBlueprint = {
  personA: PersonSajuBlueprint;
  personB: PersonSajuBlueprint;
  core: PairSajuCore;
  uncertainItems: string[];
};

export type BuildPersonBlueprintParams = {
  sajuJson: SajuDataForIntegrated;
  provenance?: SajuChartProvenance;
  birthPlace?: string | null;
  birthTimeUnknown?: boolean;
  locale?: Locale;
};

/** sajuJson → 1인 블루프린트 (chart·십성·검증 1회) */
export function buildPersonSajuBlueprint(
  params: BuildPersonBlueprintParams,
): PersonSajuBlueprint {
  const { sajuJson, provenance, birthPlace, birthTimeUnknown, locale } = params;
  const pillars = sajuJsonToPillars(
    sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
  );
  const chart = buildChartContext(pillars);
  const tenGodCounts = countTenGods(sajuJson);
  const validation = validateSajuPillars(pillars, { birthTimeUnknown, locale });

  return {
    sajuJson,
    provenance,
    pillars,
    chart,
    tenGodCounts,
    tenGodProfile: profileTenGods(tenGodCounts),
    relations: sajuJson.relations ?? [],
    shinsals: sajuJson.shinsals ?? [],
    validation,
    birthPlace: birthPlace?.trim() || undefined,
    birthTimeUnknown,
  };
}

export type BuildPairBlueprintParams = {
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  provenanceA?: SajuChartProvenance;
  provenanceB?: SajuChartProvenance;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  locale?: Locale;
};

/** 2인 블루프린트 + 페어 코어 (analyzePairSaju 1회) */
export function buildPairSajuBlueprint(
  params: BuildPairBlueprintParams,
): PairSajuBlueprint {
  const personA = buildPersonSajuBlueprint({
    sajuJson: params.sajuJsonA,
    provenance: params.provenanceA,
    birthPlace: params.birthPlaceA,
    birthTimeUnknown: params.birthTimeUnknownA,
    locale: params.locale,
  });
  const personB = buildPersonSajuBlueprint({
    sajuJson: params.sajuJsonB,
    provenance: params.provenanceB,
    birthPlace: params.birthPlaceB,
    birthTimeUnknown: params.birthTimeUnknownB,
    locale: params.locale,
  });

  const pairAnalysis = analyzePairSaju(personA.pillars, personB.pillars, {
    chartA: personA.chart,
    chartB: personB.chart,
  });

  const core: PairSajuCore = {
    pillarsA: personA.pillars,
    pillarsB: personB.pillars,
    chartA: personA.chart,
    chartB: personB.chart,
    pairAnalysis,
    tenGodsA: personA.tenGodCounts,
    tenGodsB: personB.tenGodCounts,
    profileA: personA.tenGodProfile,
    profileB: personB.tenGodProfile,
  };

  const uncertainItems = [
    ...buildSajuUncertainItems({
      birthPlace: personA.birthPlace,
      validationNotes: personA.validation.notes,
      locale: params.locale,
    }),
    ...buildSajuUncertainItems({
      birthPlace: personB.birthPlace,
      validationNotes: personB.validation.notes,
      locale: params.locale,
    }),
  ];

  return { personA, personB, core, uncertainItems };
}
