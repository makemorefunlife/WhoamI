import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";
import {
  computeMarriageCompatibilityGrade,
  type MarriageMasterScores,
} from "@/lib/relationship/marriageEventScores";
import { buildSajuUncertainItems } from "@/lib/saju/sajuUncertainItems";
import { sajuJsonToPillars, type PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import {
  analyzeMarriagePairSaju,
  resolveAttachmentLean,
  type MarriagePairSajuAnalysis,
} from "@/lib/saju/marriageAnalysis";
import { estimateStrengthBalance } from "@/lib/saju/romanticSajuDerivations";
import { validateSajuPillars } from "@/lib/saju/validateSajuBundle";
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
}): MarriageRuleContext {
  const pillarsA = sajuJsonToPillars(
    params.sajuJsonA.saju as Required<NonNullable<typeof params.sajuJsonA.saju>>,
  );
  const pillarsB = sajuJsonToPillars(
    params.sajuJsonB.saju as Required<NonNullable<typeof params.sajuJsonB.saju>>,
  );

  const tenGodPre = analyzeMarriageTenGod({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    crossHitsInternalA: [],
    crossHitsInternalB: [],
  });

  let marriagePairAnalysis = analyzeMarriagePairSaju(pillarsA, pillarsB, {
    hasWealthOfficerComplement: tenGodPre.complement.hasWealthOfficerComplement,
    hasFoodSealHarmony: tenGodPre.complement.hasFoodSealHarmony,
    hasWealthOfficerPowerStruggle:
      tenGodPre.complement.hasWealthOfficerPowerStruggle,
  });

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
  });

  const threeYearForecast = buildThreeYearHomeRiskForecast(
    marriagePairAnalysis.chartA,
    marriagePairAnalysis.chartB,
  );

  const sleepFit = buildSleepFitSection({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    chartA: marriagePairAnalysis.chartA,
    chartB: marriagePairAnalysis.chartB,
  });

  const conflictCommunication = buildConflictCommunicationSection({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    countsA: tenGod.countsA,
    countsB: tenGod.countsB,
  });

  const { grade, reason, eventScores, masterScores } =
    computeMarriageCompatibilityGrade(marriagePairAnalysis, threeYearForecast);

  const validationA = validateSajuPillars(pillarsA, {
    birthTimeUnknown: params.birthTimeUnknownA,
  });
  const validationB = validateSajuPillars(pillarsB, {
    birthTimeUnknown: params.birthTimeUnknownB,
  });

  const uncertainItems = [
    ...buildSajuUncertainItems({
      birthPlace: params.birthPlaceA,
      validationNotes: validationA.notes,
    }),
    ...buildSajuUncertainItems({
      birthPlace: params.birthPlaceB,
      validationNotes: validationB.notes,
    }),
  ];

  const householdDnaA = buildHomeLifeDnaProfile(
    params.nicknameA,
    params.sajuJsonA,
    tenGod.countsA,
  );
  const householdDnaB = buildHomeLifeDnaProfile(
    params.nicknameB,
    params.sajuJsonB,
    tenGod.countsB,
  );

  const deEscalation = buildHomeDeEscalationPair({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    countsA: tenGod.countsA,
    countsB: tenGod.countsB,
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
    strengthA: estimateStrengthBalance(pillarsA),
    strengthB: estimateStrengthBalance(pillarsB),
    masterScores,
    uncertainItems,
    deEscalation,
    threeYearForecast,
    sleepFit,
    conflictCommunication,
  };
}
