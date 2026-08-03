import { calculateSajuBundle } from "../../../v2/saju/calculateSajuBundle";
import { mapSajuBundleToMasterJson } from "../../../personCore/mappers/mapSajuMasterJson";
import { buildIndividualSajuChart } from "../../../personCore/individualSaju/buildIndividualSajuChart";
import { runPersonalContextEngine } from "../../../personCore/personalContextEngine";
import { prepareRomanticSajuDeepRun } from "../../../prompts/relationshipPremium/romanticSajuDeep";
import { buildRomanticPairCeBondingValue } from "../romanticPairCeBondingCanonical";
import { buildPairSajuFacts } from "../../../personCore/pairSaju";
import {
  applyRomanticPairLens,
  runPairContextEngine,
} from "../../../personCore/pairContextEngine";
import { buildChartContext } from "../../../saju/chartContext";
import { sajuJsonToPillars } from "../../../saju/pairChartAnalysis";
import { romanticExperienceCompleteFixture } from "../experience/romanticExperienceDevFixtures";
import { buildRomanticNarrativeInputContract } from "./fourCeNarrativeInput";
import { buildPersonalRelationshipCe } from "./personalRelationshipCe";

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

  const personalRelationshipCeA = buildPersonalRelationshipCe({
    personId: "a",
    name: "지민",
    chart: individualCeA,
    signals: masterA?.domain_signals?.romantic_signals,
  });
  const personalRelationshipCeB = buildPersonalRelationshipCe({
    personId: "b",
    name: "정우",
    chart: individualCeB,
    signals: masterB?.domain_signals?.romantic_signals,
  });

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
    personalRelationshipCeA,
    personalRelationshipCeB,
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
    personalRelationshipCeA,
    personalRelationshipCeB,
    pairCe,
    romanticPairLens,
    reportWithPair,
    pairCeBondingValue,
  };
}
