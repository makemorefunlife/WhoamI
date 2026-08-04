import { calculateSajuBundle, type SajuBundle } from "../../../v2/saju/calculateSajuBundle";
import { mapSajuBundleToMasterJson } from "../../../personCore/mappers/mapSajuMasterJson";
import type { SajuMasterJson } from "../../../personCore/types/sajuMaster";
import { buildIndividualSajuChart } from "../../../personCore/individualSaju/buildIndividualSajuChart";
import { runPersonalContextEngine } from "../../../personCore/personalContextEngine";
import { buildRomanticPairCeBondingValue } from "../romanticPairCeBondingCanonical";
import { buildPairSajuFacts } from "../../../personCore/pairSaju";
import {
  applyRomanticPairLens,
  runPairContextEngine,
} from "../../../personCore/pairContextEngine";
import { buildChartContext } from "../../../saju/chartContext";
import { sajuJsonToPillars, analyzeCrossChartRelations, analyzeCrossChartStemCombines, analyzeCrossChartTrioCombines } from "../../../saju/pairChartAnalysis";
import { analyzeCrossChartWonjinGuimun, analyzeCrossChartGongmang } from "../../../saju/workPairRiskSignals";
import { resolveCrossChartTension } from "../../romanticRules/relationshipDynamics";
import {
  buildRomanticStemCombineCanonical,
  stemCombineValueFromDynamicsSnapshot,
} from "../romanticStemCombineCanonical";
import {
  buildRomanticSixCombineCanonical,
  sixCombineValueFromDynamicsSnapshot,
} from "../romanticSixCombineCanonical";
import {
  buildRomanticCrossTrioCanonical,
  crossTrioValueFromDynamicsSnapshot,
} from "../romanticCrossTrioCanonical";
import {
  buildRomanticWonjinGuimunCanonical,
  wonjinGuimunValueFromDynamicsSnapshot,
} from "../romanticWonjinGuimunCanonical";
import {
  buildRomanticGongmangCanonical,
  gongmangValueFromDynamicsSnapshot,
} from "../romanticGongmangCanonical";
import {
  buildRomanticCrossChartTensionCanonical,
  crossChartTensionValueFromFinalized,
} from "../romanticCrossChartTensionCanonical";
import { buildRomanticNarrativeInputContract } from "./fourCeNarrativeInput";
import { buildPersonalRelationshipCe } from "./personalRelationshipCe";
import type { RomanticSajuDeepReport } from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  pairSajuProvenance,
  type RomanticV4PairSajuInput,
  type SajuBirthInput,
} from "./romanticV4SajuInput";
import { buildRomanticV4PairDynamicsProjections } from "./romanticV4PairDynamicsFusion";
import type { RomanticV4SurveyInput } from "./romanticV4SurveyEvidence";

/** Existing dev-fixture demo pair — unchanged values, just reshaped to SajuBirthInput. */
const DEV_FIXTURE_BIRTH_A: SajuBirthInput = { birthDate: "1990-05-15", birthTime: "14:30", birthTimeUnknown: false };
const DEV_FIXTURE_BIRTH_B: SajuBirthInput = { birthDate: "1992-08-20", birthTime: "09:00", birthTimeUnknown: false };

/**
 * RomanticSajuDeepReport["report"] declares section_1_summary/section_2_nature/etc.
 * as required because V1's LLM pipeline always produces all of them. V4's canonical
 * pipeline deliberately only populates canonical_projections (Consolidation Batch C —
 * no more V2 fixture spread as a stand-in for the rest). Every consumer already reads
 * these section_* fields defensively (`report.section_1_summary as {...} | undefined`,
 * see buildCanonicalRelationshipStoryPlan.ts), so the type is safe to widen locally
 * rather than fabricating placeholder section content just to satisfy it.
 */
type CanonicalOnlyReport = Partial<RomanticSajuDeepReport["report"]>;

/**
 * Already-computed Saju bundle/master JSON for A/B, when a caller (e.g. the
 * production analyze route, which already ran calculateSajuBundle/
 * mapSajuBundleToMasterJson once via bundlePersonCoreForPremium) wants to
 * avoid recomputing them here. Purely an optimization — output is identical
 * either way since calculateSajuBundle/mapSajuBundleToMasterJson are pure
 * functions of birthA/birthB.
 */
export type RomanticV4PrecomputedSaju = {
  bundleA?: SajuBundle;
  bundleB?: SajuBundle;
  masterA?: SajuMasterJson;
  masterB?: SajuMasterJson;
};

export function buildActualFourCeContract(
  locale: "ko-KR" | "en-US",
  pairSajuInput?: RomanticV4PairSajuInput,
  surveyInput?: RomanticV4SurveyInput,
  precomputed?: RomanticV4PrecomputedSaju,
) {
  const mode = pairSajuInput?.mode ?? "dev_fixture";
  let birthA: SajuBirthInput;
  let birthB: SajuBirthInput;
  let nameA: string;
  let nameB: string;
  if (mode === "real") {
    if (!pairSajuInput?.birthA || !pairSajuInput?.birthB) {
      throw new Error(
        "buildActualFourCeContract: mode 'real' requires both birthA and birthB — refusing to silently fall back to the dev-fixture demo pair.",
      );
    }
    birthA = pairSajuInput.birthA;
    birthB = pairSajuInput.birthB;
    nameA = pairSajuInput.nameA ?? "Person A";
    nameB = pairSajuInput.nameB ?? "Person B";
  } else {
    birthA = DEV_FIXTURE_BIRTH_A;
    birthB = DEV_FIXTURE_BIRTH_B;
    nameA = pairSajuInput?.nameA ?? "지민";
    nameB = pairSajuInput?.nameB ?? "정우";
  }
  const birthTimeUnknownA = birthA.birthTimeUnknown ?? false;
  const birthTimeUnknownB = birthB.birthTimeUnknown ?? false;

  const bundleA = precomputed?.bundleA ?? calculateSajuBundle({
    birthDate: birthA.birthDate,
    birthTime: birthA.birthTime,
    birthTimeUnknown: birthTimeUnknownA,
  });
  const bundleB = precomputed?.bundleB ?? calculateSajuBundle({
    birthDate: birthB.birthDate,
    birthTime: birthB.birthTime,
    birthTimeUnknown: birthTimeUnknownB,
  });
  const masterA = precomputed?.masterA ?? mapSajuBundleToMasterJson({
    bundle: bundleA,
    birthDate: birthA.birthDate,
    birthTime: birthA.birthTime ?? null,
    birthTimeUnknown: birthTimeUnknownA,
  });
  const masterB = precomputed?.masterB ?? mapSajuBundleToMasterJson({
    bundle: bundleB,
    birthDate: birthB.birthDate,
    birthTime: birthB.birthTime ?? null,
    birthTimeUnknown: birthTimeUnknownB,
  });
  const individualCeA = buildIndividualSajuChart({
    reportId: "a",
    birthDate: birthA.birthDate,
    birthTime: birthA.birthTime ?? null,
    birthTimeUnknown: birthTimeUnknownA,
    bundle: bundleA,
  });
  const individualCeB = buildIndividualSajuChart({
    reportId: "b",
    birthDate: birthB.birthDate,
    birthTime: birthB.birthTime ?? null,
    birthTimeUnknown: birthTimeUnknownB,
    bundle: bundleB,
  });

  const personalCeA = runPersonalContextEngine({ chart: individualCeA });
  const personalCeB = runPersonalContextEngine({ chart: individualCeB });

  // Freshly computed (not a loaded legacy snapshot), so domain_signals.romantic_signals
  // is always present — SajuMasterJson declares it required.
  const romanticSignalsA = masterA.domain_signals.romantic_signals;
  const romanticSignalsB = masterB.domain_signals.romantic_signals;

  const personalRelationshipCeA = buildPersonalRelationshipCe({
    personId: "a",
    name: nameA,
    chart: individualCeA,
    signals: romanticSignalsA,
    relationalProfile: personalCeA.aggregates.relational_profile,
    locale,
  });
  const personalRelationshipCeB = buildPersonalRelationshipCe({
    personId: "b",
    name: nameB,
    chart: individualCeB,
    signals: romanticSignalsB,
    relationalProfile: personalCeB.aggregates.relational_profile,
    locale,
  });

  const sajuA = sajuJsonToPillars(bundleA.saju);
  const sajuB = sajuJsonToPillars(bundleB.saju);
  const chartA = buildChartContext(sajuA);
  const chartB = buildChartContext(sajuB);
  const pairFacts = buildPairSajuFacts({
    chartA,
    chartB,
    reportIdA: "a",
    reportIdB: "b",
    birthTimeUnknownA,
    birthTimeUnknownB,
  });
  const pairCe = runPairContextEngine({ facts: pairFacts });
  const romanticPairLens = applyRomanticPairLens(pairCe);

  const pairCeBondingValue = buildRomanticPairCeBondingValue(
    romanticPairLens.packets.filter(
      (p) =>
        p.group === "bonding" ||
        p.group === "energy" ||
        p.fact_kind === "branch_trio" ||
        p.fact_kind === "gongmang_shared",
    ),
  );

  // Consolidation Batch C: cross-chart canonical projections computed directly
  // from chartA/chartB (the same charts already built above), not read from a
  // static V2 fixture. Mirrors the exact pattern already proven in
  // tests/unit/romantic-v4-consolidation-cross-chart.test.mjs.
  const crossChartBranchHits = analyzeCrossChartRelations(chartA, chartB);
  const stemHits = analyzeCrossChartStemCombines(chartA, chartB);
  const trioHits = analyzeCrossChartTrioCombines(chartA, chartB);
  const wonjinGuimunHits = analyzeCrossChartWonjinGuimun(chartA, chartB);
  const gongmangHits = analyzeCrossChartGongmang(chartA, chartB);
  const tensionResult = resolveCrossChartTension(crossChartBranchHits);

  const canonicalProjections: Record<string, unknown> = { pair_ce_bonding: pairCeBondingValue };
  const stemCombineValue = buildRomanticStemCombineCanonical(
    stemCombineValueFromDynamicsSnapshot({ crossChartHits: stemHits }),
  )?.value;
  if (stemCombineValue) canonicalProjections.cross_chart_stem_combine = stemCombineValue;
  const sixCombineValue = buildRomanticSixCombineCanonical(
    sixCombineValueFromDynamicsSnapshot({ crossChartHits: crossChartBranchHits }),
  )?.value;
  if (sixCombineValue) canonicalProjections.cross_chart_six_combine = sixCombineValue;
  const trioValue = buildRomanticCrossTrioCanonical(
    crossTrioValueFromDynamicsSnapshot({ crossTrioHits: trioHits }),
  )?.value;
  if (trioValue) canonicalProjections.cross_chart_trio = trioValue;
  const wonjinGuimunValue = buildRomanticWonjinGuimunCanonical(
    wonjinGuimunValueFromDynamicsSnapshot({ crossChartHits: wonjinGuimunHits }),
  )?.value;
  if (wonjinGuimunValue) canonicalProjections.cross_chart_wonjin_guimun = wonjinGuimunValue;
  const gongmangValue = buildRomanticGongmangCanonical(
    gongmangValueFromDynamicsSnapshot({ crossChartHits: gongmangHits }),
  )?.value;
  if (gongmangValue) canonicalProjections.cross_chart_gongmang = gongmangValue;
  const tensionValue = buildRomanticCrossChartTensionCanonical(
    crossChartTensionValueFromFinalized(tensionResult),
  )?.value;
  if (tensionValue) canonicalProjections.cross_chart_tension = tensionValue;

  // Gold Logic restoration: balance_of_power, recovery_speed, expression_speed,
  // reassurance_signal, residual, and unconscious_role_play — previously
  // "NOT populated" here (see tests/unit/romantic-v4-consolidation-pair-dynamics.test.mjs
  // and the Batch C report) because nothing threaded a real CurrentSelfProfile
  // in. Now that surveyInput carries real (or null) profileA/profileB, reuse
  // the same collectRomanticDynamicsTypedSnapshot + *Canonical.ts wrap layer
  // V1 already uses (romanticV4PairDynamicsFusion.ts) — every one of these
  // resolvers already degrades to its neutral band when a profile is null,
  // so no extra "keep it safe" logic is needed here.
  const pairDynamics = buildRomanticV4PairDynamicsProjections({
    profileA: surveyInput?.profileA ?? null,
    profileB: surveyInput?.profileB ?? null,
    romanticSignalsA,
    romanticSignalsB,
    chartA,
    chartB,
    sajuA,
    sajuB,
  });
  Object.assign(canonicalProjections, pairDynamics.projections);

  const reportWithPair: CanonicalOnlyReport = {
    canonical_projections: canonicalProjections,
  };
  const contract = buildRomanticNarrativeInputContract({
    report: reportWithPair as RomanticSajuDeepReport["report"],
    locale,
    nameA,
    nameB,
    personalCeA,
    personalCeB,
    personalRelationshipCeA,
    personalRelationshipCeB,
    pairCe,
    romanticPairLens,
  });

  return {
    contract,
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
    // Saju base bands for the comparisonTable fusion resolver (romanticV4ComparisonFusion.ts) —
    // same domain_signals.romantic_signals PersonCore already bakes in for V1's production path.
    romanticSignalsA,
    romanticSignalsB,
    nameA,
    nameB,
    /** Provenance for every Saju/CE value returned above — real A/B birth vs the dev-fixture demo pair. */
    pairSajuProvenance: pairSajuProvenance(mode),
    /** Gold Logic pair-dynamics projections (balance/recovery/expression_speed/reassurance/residual/role_play) + their survey evidence status. */
    pairDynamics,
  };
}
