import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { mapSajuBundleToMasterJson } from "@/lib/personCore/mappers/mapSajuMasterJson";
import { buildIndividualSajuChart } from "@/lib/personCore/individualSaju/buildIndividualSajuChart";
import { runPersonalContextEngine } from "@/lib/personCore/personalContextEngine";
import { prepareRomanticSajuDeepRun } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { buildRomanticPairCeBondingValue } from "@/lib/relationship/romantic/romanticPairCeBondingCanonical";
import { buildPairSajuFacts } from "@/lib/personCore/pairSaju";
import {
  applyRomanticPairLens,
  runPairContextEngine,
} from "@/lib/personCore/pairContextEngine";
import { buildChartContext } from "@/lib/saju/chartContext";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import { romanticExperienceCompleteFixture } from "@/lib/relationship/romantic/experience/romanticExperienceDevFixtures";
import { buildRomanticNarrativeInputContract } from "./fourCeNarrativeInput";

function toSajuJson(bundle: ReturnType<typeof calculateSajuBundle>) {
  return {
    saju: bundle.saju,
    dayStemData: bundle.dayStemData,
    dayBranchData: bundle.dayBranchData,
    hiddenStemsData: bundle.hiddenStemsData,
    tenGods: bundle.tenGods,
    relations: bundle.relations,
    shinsals: bundle.shinsals,
  };
}

export function buildActualFourCeContract(locale: "ko-KR" | "en-US") {
  const birthA = { date: "1990-05-15", time: "14:30", place: "서울" };
  const birthB = { date: "1992-08-20", time: "09:00", place: "부산" };
  const bundleA = calculateSajuBundle({
    birthDate: birthA.date,
    birthTime: birthA.time,
  });
  const bundleB = calculateSajuBundle({
    birthDate: birthB.date,
    birthTime: birthB.time,
  });
  const masterA = mapSajuBundleToMasterJson({
    bundle: bundleA,
    birthDate: birthA.date,
    birthTime: birthA.time,
    birthTimeUnknown: false,
  });
  const masterB = mapSajuBundleToMasterJson({
    bundle: bundleB,
    birthDate: birthB.date,
    birthTime: birthB.time,
    birthTimeUnknown: false,
  });
  const prepared = prepareRomanticSajuDeepRun({
    nicknameA: "지민",
    nicknameB: "정우",
    birthA,
    birthB,
    sajuJsonA: toSajuJson(bundleA),
    sajuJsonB: toSajuJson(bundleB),
    sajuMasterA: masterA,
    sajuMasterB: masterB,
    surveyProfileA: null,
    surveyProfileB: null,
    locale: locale === "ko-KR" ? "ko" : "en",
  });
  const individualCeA = buildIndividualSajuChart({
    reportId: "a",
    birthDate: birthA.date,
    birthTime: birthA.time,
    birthTimeUnknown: false,
    bundle: bundleA,
  });
  const individualCeB = buildIndividualSajuChart({
    reportId: "b",
    birthDate: birthB.date,
    birthTime: birthB.time,
    birthTimeUnknown: false,
    bundle: bundleB,
  });

  const personalCeA = runPersonalContextEngine({ chart: individualCeA });
  const personalCeB = runPersonalContextEngine({ chart: individualCeB });

  const chartA = buildChartContext(sajuJsonToPillars(bundleA.saju));
  const chartB = buildChartContext(sajuJsonToPillars(bundleB.saju));
  const pairFacts = buildPairSajuFacts({
    chartA,
    chartB,
    reportIdA: "a",
    reportIdB: "b",
    birthTimeUnknownA: false,
    birthTimeUnknownB: false,
  });
  const pairCe = runPairContextEngine({ facts: pairFacts });
  const romanticPairLens = applyRomanticPairLens(pairCe);

  const pairCeBondingValue = buildRomanticPairCeBondingValue(
    prepared.dynamicsTyped?.pairNonTensionPackets ??
      romanticPairLens.packets.filter(
        (p) =>
          p.group === "bonding" ||
          p.group === "energy" ||
          p.fact_kind === "branch_trio" ||
          p.fact_kind === "gongmang_shared",
      ),
  );
  const reportWithPair = {
    ...romanticExperienceCompleteFixture,
    romantic_context_input: prepared.romanticContextInput,
    canonical_projections: {
      ...(romanticExperienceCompleteFixture.canonical_projections ?? {}),
      pair_ce_bonding: pairCeBondingValue,
    },
  };
  const contract = buildRomanticNarrativeInputContract({
    report: reportWithPair,
    locale,
    nameA: "지민",
    nameB: "정우",
    personalCeA,
    personalCeB,
    pairCe,
    romanticPairLens,
  });

  return {
    contract,
    prepared,
    individualCeA,
    individualCeB,
    personalCeA,
    personalCeB,
    pairCe,
    romanticPairLens,
    reportWithPair,
    pairCeBondingValue,
  };
}
