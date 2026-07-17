import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";
import {
  computeMarriageCompatibilityGrade,
  type MarriageMasterScores,
} from "@/lib/relationship/marriageEventScores";
import { buildPairSajuBlueprint } from "@/lib/saju/sajuBlueprint";
import { estimateStrengthBalance } from "@/lib/saju/romanticSajuDerivations";
import {
  analyzeMarriagePairSaju,
  resolveAttachmentLean,
  type MarriagePairSajuAnalysis,
} from "@/lib/saju/marriageAnalysis";
import type { PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import {
  analyzeMarriageTenGod,
  type MarriageTenGodAnalysis,
} from "./marriageTenGodAnalysis";
import { buildHomeLifeDnaProfile, type HomeLifeDnaProfile } from "./homeLifeLanguage";
import {
  buildHomeDeEscalationPair,
  type HomeDeEscalationPair,
} from "./homeDeEscalationPrescriptions";
import {
  buildThreeYearHomeRiskForecast,
  buildSleepFitSection,
  buildConflictCommunicationSection,
  type ThreeYearHomeRiskForecast,
  type SleepFitSection,
  type ConflictCommunicationSection,
} from "./marriageKillerSections";
import { LEGACY_FALLBACK_LOCALE } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";

export type MarriageRuleContext = {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  pairAnalysis: PairSajuAnalysis;
  marriagePairAnalysis: MarriagePairSajuAnalysis;
  tenGod: MarriageTenGodAnalysis;
  householdDnaA: HomeLifeDnaProfile;
  householdDnaB: HomeLifeDnaProfile;
  eventScores: RelationshipEventScores;
  grade: "A" | "B" | "C" | "D";
  gradeReason: string;
  strengthA: { label: string; note: string };
  strengthB: { label: string; note: string };
  masterScores: MarriageMasterScores;
  uncertainItems: string[];
  deEscalation: HomeDeEscalationPair;
  threeYearForecast: ThreeYearHomeRiskForecast;
  sleepFit: SleepFitSection;
  conflictCommunication: ConflictCommunicationSection;
  locale: Locale;
};

/** 동거/결혼 전용 rule context — 연인·동료 파이프라인과 분리 */
export function buildMarriageRuleContext(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  locale?: Locale;
}): MarriageRuleContext {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const blueprint = buildPairSajuBlueprint(params);
  const { core, uncertainItems } = blueprint;

  const tenGodPre = analyzeMarriageTenGod({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    crossHitsInternalA: [],
    crossHitsInternalB: [],
    countsA: core.tenGodsA,
    countsB: core.tenGodsB,
    chartA: core.chartA,
    chartB: core.chartB,
    locale,
  });

  let marriagePairAnalysis = analyzeMarriagePairSaju(
    core.pillarsA,
    core.pillarsB,
    {
      hasWealthOfficerComplement: tenGodPre.complement.hasWealthOfficerComplement,
      hasFoodSealHarmony: tenGodPre.complement.hasFoodSealHarmony,
      hasWealthOfficerPowerStruggle:
        tenGodPre.complement.hasWealthOfficerPowerStruggle,
    },
    core,
  );

  marriagePairAnalysis = {
    ...marriagePairAnalysis,
    stemIntimacy: {
      ...marriagePairAnalysis.stemIntimacy,
      attachmentLeanA: resolveAttachmentLean(
        marriagePairAnalysis.chartA,
        tenGodPre.profileA.seal,
        tenGodPre.profileA.self,
      ),
      attachmentLeanB: resolveAttachmentLean(
        marriagePairAnalysis.chartB,
        tenGodPre.profileB.seal,
        tenGodPre.profileB.self,
      ),
    },
  };

  const tenGod = analyzeMarriageTenGod({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    crossHitsInternalA: marriagePairAnalysis.intraChartHitsA,
    crossHitsInternalB: marriagePairAnalysis.intraChartHitsB,
    countsA: core.tenGodsA,
    countsB: core.tenGodsB,
    chartA: core.chartA,
    chartB: core.chartB,
    locale,
  });

  const threeYearForecast = buildThreeYearHomeRiskForecast(
    marriagePairAnalysis.chartA,
    marriagePairAnalysis.chartB,
    new Date().getFullYear(),
    locale,
  );

  const sleepFit = buildSleepFitSection({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    chartA: marriagePairAnalysis.chartA,
    chartB: marriagePairAnalysis.chartB,
    locale,
  });

  const conflictCommunication = buildConflictCommunicationSection({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    countsA: tenGod.countsA,
    countsB: tenGod.countsB,
    locale,
  });

  const { grade, reason, eventScores, masterScores } =
    computeMarriageCompatibilityGrade(marriagePairAnalysis, threeYearForecast, locale);

  const householdDnaA = buildHomeLifeDnaProfile(
    params.nicknameA,
    params.sajuJsonA,
    tenGod.countsA,
    locale,
  );
  const householdDnaB = buildHomeLifeDnaProfile(
    params.nicknameB,
    params.sajuJsonB,
    tenGod.countsB,
    locale,
  );

  const deEscalation = buildHomeDeEscalationPair({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    countsA: tenGod.countsA,
    countsB: tenGod.countsB,
    locale,
  });

  return {
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    pairAnalysis: marriagePairAnalysis.base,
    marriagePairAnalysis,
    tenGod,
    householdDnaA,
    householdDnaB,
    eventScores,
    grade,
    gradeReason: reason,
    strengthA: estimateStrengthBalance(core.pillarsA),
    strengthB: estimateStrengthBalance(core.pillarsB),
    masterScores,
    uncertainItems,
    deEscalation,
    threeYearForecast,
    sleepFit,
    conflictCommunication,
    locale,
  };
}
