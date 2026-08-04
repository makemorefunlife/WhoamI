import { calculateSajuBundle } from "../../../v2/saju/calculateSajuBundle";
import { mapSajuBundleToMasterJson } from "../../../personCore/mappers/mapSajuMasterJson";
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

export function buildActualFourCeContract(
  locale: "ko-KR" | "en-US",
  pairSajuInput?: RomanticV4PairSajuInput,
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

  const bundleA = calculateSajuBundle({
    birthDate: birthA.birthDate,
    birthTime: birthA.birthTime,
    birthTimeUnknown: birthTimeUnknownA,
  });
  const bundleB = calculateSajuBundle({
    birthDate: birthB.birthDate,
    birthTime: birthB.birthTime,
    birthTimeUnknown: birthTimeUnknownB,
  });
  const masterA = mapSajuBundleToMasterJson({
    bundle: bundleA,
    birthDate: birthA.birthDate,
    birthTime: birthA.birthTime ?? null,
    birthTimeUnknown: birthTimeUnknownA,
  });
  const masterB = mapSajuBundleToMasterJson({
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

  const personalRelationshipCeA = buildPersonalRelationshipCe({
    personId: "a",
    name: nameA,
    chart: individualCeA,
    signals: masterA?.domain_signals?.romantic_signals,
    relationalProfile: personalCeA.aggregates.relational_profile,
  });
  const personalRelationshipCeB = buildPersonalRelationshipCe({
    personId: "b",
    name: nameB,
    chart: individualCeB,
    signals: masterB?.domain_signals?.romantic_signals,
    relationalProfile: personalCeB.aggregates.relational_profile,
  });

  const chartA = buildChartContext(sajuJsonToPillars(bundleA.saju));
  const chartB = buildChartContext(sajuJsonToPillars(bundleB.saju));
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

  // NOT populated (documented blocker, see tests/unit/romantic-v4-consolidation-pair-dynamics.test.mjs
  // and the Batch C report): balance_of_power, expression_speed, reassurance_signal,
  // recovery_speed, unconscious_role_play all require CurrentSelfProfile (11-axis
  // survey data), which Personal CE / Pair CE do not construct anywhere in this
  // pipeline. Left absent (explicit "unavailable" state) rather than reusing a
  // static fixture value or fabricating survey data.
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
    romanticSignalsA: masterA?.domain_signals?.romantic_signals ?? null,
    romanticSignalsB: masterB?.domain_signals?.romantic_signals ?? null,
    nameA,
    nameB,
    /** Provenance for every Saju/CE value returned above — real A/B birth vs the dev-fixture demo pair. */
    pairSajuProvenance: pairSajuProvenance(mode),
  };
}
