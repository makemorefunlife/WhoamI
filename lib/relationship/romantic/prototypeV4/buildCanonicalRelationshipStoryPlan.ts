/**
 * Build Canonical Relationship Story Plan from four-CE + canonical projections + psych.
 * CONNECT: unused cross-chart combine/tension/bonding into attraction & chemistry.
 * Korean copy lives in canonicalStoryPlanCopy.ko.json (UTF-8) to avoid editor encoding loss.
 */
import type {
  RomanticPsychMatchAxisResult,
  RomanticSajuDeepReport,
} from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { josa, josaIGa, josaEunNeun, josaGwaWa, josaEulReul } from "./romanticLanguage";
import { psychMatchAxisLabel } from "../../psychMatch/axisLabels";
import type { RomanticNarrativeInputContract } from "./fourCeNarrativeInput";
import { buildFourCeSemanticPlan } from "./fourCeSemanticPlanner";
import { projectHorizon } from "../experience/projectors/projectHorizon";
import { resolveBilateralPartnerPreferenceMatchFromCe } from "./spousePalaceMatcher";
import type {
  AttractionNarrativeUnit,
  AxisPriorityRow,
  BilateralChange,
  CanonicalRelationshipStoryPlan,
  DirectionalMisread,
  HiddenHeartBits,
  ProvenanceRef,
  StoryFace,
} from "./canonicalStoryPlanTypes";
import {
  resolveDynamicsLens,
  resolveHiddenHeartsLens,
  resolveStrengthVulnerabilityLens,
} from "./chapterLensResolvers";
import copyKo from "./canonicalStoryPlanCopy.ko.json";
import copyEn from "./canonicalStoryPlanCopy.en.json";
import {
  buildEmpathyVsSolvingScene,
  buildPhysicalIntimacyScene,
  buildGiveUpPointScene,
  buildRomanticChemistryScene,
  buildPossessivenessScene,
  buildLongTermGrowthScene,
} from "./romanticV4DateSceneInsights";
import type { RomanticPairCeBondingValue } from "../romanticPairCeBondingCanonical";
import type { RomanticFortuneFlowResult } from "../../romanticRules/fortuneFlow";
import { buildRomanticV4TimingFromFortuneFlow } from "./romanticV4TimingCanonical";
import {
  buildRomanticConflictLoopP0,
  buildRomanticRepairPatternP0,
  buildRomanticP0ActionCandidates,
} from "./buildRomanticP0CoverageModels";
import { buildRomanticMultiSignalSynthesis } from "./buildRomanticMultiSignalSynthesis";
import { buildRomanticCrossSignalIntelligence } from "./romanticCrossSignalIntelligence";
import { buildRomanticCandidateEngine } from "./buildRomanticCandidateEngine";
import { computeRomanticRelationshipNeedsEngine } from "./romanticRelationshipNeedsEngine";
import { computeRomanticV4GapBatchEngine } from "./romanticV4GapBatchEngine";

import {
  topicP,
  subjectP,
  objectP,
  withP,
  sanitizeParticles,
  pick,
  type NarrativeLocale,
} from "./narrativeLocale";

type Report = RomanticSajuDeepReport["report"];
type CopyTable = typeof copyKo;

function fill(tpl: string, vars: Record<string, string>, locale: NarrativeLocale): string {
  return sanitizeParticles(
    tpl.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? ""),
    [],
    locale,
  );
}

function prov(
  evidenceId: string,
  source: string,
  sourcePath: string,
  appliesTo: ProvenanceRef["appliesTo"],
  confidence: ProvenanceRef["confidence"],
  claimBoundary: ProvenanceRef["claimBoundary"],
  priority: ProvenanceRef["priority"] = "primary",
): ProvenanceRef {
  return {
    evidenceId,
    source,
    sourcePath,
    appliesTo,
    confidence,
    claimBoundary,
    priority,
  };
}

function leanLabel(
  lean: string | undefined,
  rowKey: RomanticCompareRowKey,
  locale: "ko-KR" | "en-US",
): string {
  if (!lean) return pick(locale, copyKo.leanFallback, copyEn.leanFallbackEn);
  return formatRomanticCompareLeanLabel(lean as never, locale, rowKey);
}

import { getAxisInterpretations } from "./axisStandoutInterpretations";

function axisRow(
  axis: RomanticPsychMatchAxisResult,
  role: AxisPriorityRow["role"],
  locale: "ko-KR" | "en-US",
): AxisPriorityRow {
  const label = psychMatchAxisLabel(axis.axis_key, locale);
  const aHigh = axis.score_a >= axis.score_b;
  const interp = getAxisInterpretations(locale)[axis.axis_key] || pick(
    locale,
    {
      plainLanguageDefinition: "서로의 다름과 같음을 보여주는 성향이에요.",
      highBehavior: "스스로의 성향을 선명하게 드러내는 편이에요.",
      lowBehavior: "상황에 맞춰 유연하게 반응하는 편이에요.",
      sceneHint: "일상 속에서 선택을 내릴 때",
      tensionClash: "차이가 오해로 이어질 수 있어요.",
      tensionBenefit: "서로 다른 강점을 살릴 수 있어요.",
      practicalTranslation: "다름을 이해하고 맞춰가려는 노력이 필요해요.",
      misreadHighObservingLow: "상대의 유연함을 무심함으로 잘못 읽을 수 있어요.",
      misreadLowObservingHigh: "상대의 선명함을 부담으로 잘못 읽을 수 있어요.",
    },
    {
      plainLanguageDefinition: "A tendency that shows where you're different and where you're alike.",
      highBehavior: "Tends to show their own tendency clearly and openly.",
      lowBehavior: "Tends to respond flexibly, adapting to the situation.",
      sceneHint: "When making choices in everyday life",
      tensionClash: "This difference can turn into misunderstanding.",
      tensionBenefit: "You can each draw on your own distinct strengths.",
      practicalTranslation: "It helps to make an effort to understand the difference and meet in the middle.",
      misreadHighObservingLow: "The other's flexibility can be misread as indifference.",
      misreadLowObservingHigh: "The other's clarity can be misread as pressure.",
    },
  );

  const aPattern = aHigh ? interp.highBehavior : interp.lowBehavior;
  const bPattern = !aHigh ? interp.highBehavior : interp.lowBehavior;
  const isSimilar = axis.match_type === "similarity";
  const isHighLow = aHigh; // A is high, B is low.

  return {
    id: `axis.${axis.axis_key}`,
    sourceType: "psych",
    confidence: "high",
    userQuestion: pick(
      locale,
      `${label} 차이가 우리에게 미치는 영향은 무엇인가요?`,
      `What effect does our difference in ${label} have on us?`,
    ),
    plainLanguageDefinition: interp.plainLanguageDefinition,
    personATendency: aPattern,
    personBTendency: bPattern,
    pairDynamic: isSimilar
      ? pick(locale, "비슷한 성향으로 인해 행동의 이유를 쉽게 이해할 수 있어요.", "Because you're similar here, it's easy to understand why the other acts the way they do.")
      : interp.tensionClash,
    observableScene: interp.sceneHint,
    likelyMisreadingA: isSimilar ? null : (isHighLow ? interp.misreadHighObservingLow : interp.misreadLowObservingHigh),
    likelyMisreadingB: isSimilar ? null : (isHighLow ? interp.misreadLowObservingHigh : interp.misreadHighObservingLow),
    relationshipStrength: isSimilar ? pick(locale, copyKo.calmSim, copyEn.calmSim) : interp.tensionBenefit,
    relationshipRisk: isSimilar ? pick(locale, copyKo.stressLow, copyEn.stressLow) : interp.tensionClash,
    practicalTranslation: isSimilar ? pick(locale, "지금의 긍정적인 균형을 유지하세요.", "Keep up the positive balance you already have.") : interp.practicalTranslation,
    evidenceRefs: [
      prov(
        `meta.psych_match.axis_results.${axis.axis_key}`,
        "psych_match",
        `meta.psych_match.axis_results.${axis.axis_key}`,
        "pair",
        "high",
        "direct_evidence",
      ),
    ],
    axisKey: axis.axis_key,
    axisLabel: label,
    role,
    scoreA: axis.score_a,
    scoreB: axis.score_b,
    gap: axis.gap,
    matchType: axis.match_type,
  };
}

export function buildCanonicalRelationshipStoryPlan(params: {
  contract: RomanticNarrativeInputContract;
  report: Report;
  axisResults: RomanticPsychMatchAxisResult[];
  locale: "ko-KR" | "en-US";
  reportYear?: number;
  /** Pure Saju daewoon/sewoon calculation for c10_future_timing — when provided, this replaces the old report.section_6_timeline dependency (never populated by V4's canonical-only report). Omit to keep the legacy fallback. */
  fortuneFlow?: RomanticFortuneFlowResult | null;
  dynamicsCrossHits?: Array<{ category?: string; type?: string }>;
}): CanonicalRelationshipStoryPlan {
  const { contract, report, axisResults, locale } = params;
  const copy: CopyTable = locale === "en-US" ? copyEn : copyKo;
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const year = params.reportYear ?? new Date().getFullYear();
  // Was hardcoded to the fixture demo pair's names via \u escape sequences
  // (invisible to a plain-text grep) regardless of caller. contract.names
  // already carries the real A/B names (buildRomanticNarrativeInputContract's
  // nameA/nameB params) \u2014 use that instead of a local literal.
  const names = contract.names;
  const plan = buildFourCeSemanticPlan(contract);
  const relCeA = plan.aRelationshipCe;
  const relCeB = plan.bRelationshipCe;
  const projections = report.canonical_projections ?? {};
  const connected = new Set<string>();
  const suppressed: Array<{ evidenceId: string; reason: string }> = [];
  const mark = (id: string) => connected.add(id);

  const table = projections.comparison_table as
    | Record<string, { lean_a?: string; lean_b?: string; a?: string; b?: string } | undefined>
    | undefined;
  const expr = projections.expression_speed as { direction?: string } | undefined;
  const recovery = projections.recovery_speed as { mismatch?: boolean } | undefined;
  const reassurance = projections.reassurance_signal as { need_a?: string } | undefined;
  const balance = projections.balance_of_power as
    | { balance_a?: string; balance_b?: string }
    | undefined;
  const bonding = (projections as any).pair_ce_bonding as
    | (RomanticPairCeBondingValue & { summary?: string })
    | undefined;
  const stemCombine = projections.cross_chart_stem_combine as
    | { hitCount?: number }
    | undefined;
  const sixCombine = projections.cross_chart_six_combine as { hitCount?: number } | undefined;
  const tension = projections.cross_chart_tension as
    | { dominant_type?: string; hits?: unknown[] }
    | undefined;
  const wonjin = projections.cross_chart_wonjin_guimun as
    | { wonjinCount?: number; guimunCount?: number }
    | undefined;

  const affLeanA = table?.affection?.lean_a ?? table?.affection?.a 
    ? leanLabel(table?.affection?.lean_a ?? table?.affection?.a, "affection", locale)
    : (relCeA?.careExpression?.text ?? "행동과 배려로 마음을 전하는 성향");
  const affLeanB = table?.affection?.lean_b ?? table?.affection?.b
    ? leanLabel(table?.affection?.lean_b ?? table?.affection?.b, "affection", locale)
    : (relCeB?.careExpression?.text ?? "묵묵한 신뢰와 세심함으로 마음을 전하는 성향");
  const stressLeanA = table?.stress?.lean_a ?? table?.stress?.a
    ? leanLabel(table?.stress?.lean_a ?? table?.stress?.a, "stress", locale)
    : (relCeA?.stressResponse?.text ?? "감정을 차분하게 정리할 시간을 필요로 하는 성향");
  const stressLeanB = table?.stress?.lean_b ?? table?.stress?.b
    ? leanLabel(table?.stress?.lean_b ?? table?.stress?.b, "stress", locale)
    : (relCeB?.stressResponse?.text ?? "혼자만의 공간에서 감정을 가라앉히는 성향");
  const decisionLeanA = table?.decision?.lean_a ?? table?.decision?.a
    ? leanLabel(table?.decision?.lean_a ?? table?.decision?.a, "decision", locale)
    : (relCeA?.decisionStyle?.text?.replace(/\.$/, "") ?? "명확한 원칙과 장기적 안정성을 기준으로 결단을 내리는 방식");
  const decisionLeanB = table?.decision?.lean_b ?? table?.decision?.b
    ? leanLabel(table?.decision?.lean_b ?? table?.decision?.b, "decision", locale)
    : (relCeB?.decisionStyle?.text?.replace(/\.$/, "") ?? "조급하게 서두르지 않고 안정적인 길을 선택하는 방식");

  if (table?.affection) mark("canonical_projections.comparison_table.affection");
  if (table?.stress) mark("canonical_projections.comparison_table.stress");
  if (table?.decision) mark("canonical_projections.comparison_table.decision");
  if (table?.expression) mark("canonical_projections.comparison_table.expression");
  if (expr) mark("canonical_projections.expression_speed");
  if (recovery) mark("canonical_projections.recovery_speed");
  if (reassurance) mark("canonical_projections.reassurance_signal");

  const sortedDiff = [...axisResults]
    .filter((a) => a.axis_key !== "conflict_style")
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);
  for (const a of sortedDiff) mark(`meta.psych_match.axis_results.${a.axis_key}`);

  const stabilizingSimilarities = [...axisResults]
    .filter((a) => a.axis_key !== "conflict_style" && a.match_type === "similarity")
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 2);
  for (const a of stabilizingSimilarities) {
    mark(`meta.psych_match.axis_results.${a.axis_key}`);
  }

  const topDifferences = sortedDiff.map((a) => axisRow(a, "top_difference", locale));
  const stabRows = stabilizingSimilarities.map((a) =>
    axisRow(a, "stabilizing_similarity", locale),
  );
  const allAxes = axisResults.map((a) =>
    axisRow(
      a,
      topDifferences.some((t) => t.axisKey === a.axis_key)
        ? "top_difference"
        : stabRows.some((t) => t.axisKey === a.axis_key)
          ? "stabilizing_similarity"
          : "contextual",
      locale,
    ),
  );

  const hitNotes: string[] = [];
  const attractionProv: ProvenanceRef[] = [];

  if (stemCombine && Number(stemCombine.hitCount) > 0) {
    mark("canonical_projections.cross_chart_stem_combine");
    hitNotes.push(copy.hitStem);
    attractionProv.push(
      prov(
        "canonical_projections.cross_chart_stem_combine",
        "romantic_ce",
        "canonical_projections.cross_chart_stem_combine",
        "pair",
        "medium",
        "combination_judgment",
      ),
    );
  } else if (params.dynamicsCrossHits?.some((h) => h.category === "stem_combine")) {
    mark("dynamicsTyped.crossChartHits.stem_combine");
    hitNotes.push(copy.hitStem);
  }

  if (sixCombine && Number(sixCombine.hitCount) > 0) {
    mark("canonical_projections.cross_chart_six_combine");
    hitNotes.push(copy.hitSix);
    attractionProv.push(
      prov(
        "canonical_projections.cross_chart_six_combine",
        "romantic_ce",
        "canonical_projections.cross_chart_six_combine",
        "pair",
        "medium",
        "combination_judgment",
      ),
    );
  }

  if (tension && (tension.dominant_type || (tension.hits?.length ?? 0) > 0)) {
    mark("canonical_projections.cross_chart_tension");
    hitNotes.push(copy.hitTension);
    attractionProv.push(
      prov(
        "canonical_projections.cross_chart_tension",
        "romantic_ce",
        "canonical_projections.cross_chart_tension",
        "pair",
        "high",
        "direct_evidence",
      ),
    );
  }

  if (wonjin && (Number(wonjin.wonjinCount) > 0 || Number(wonjin.guimunCount) > 0)) {
    mark("canonical_projections.cross_chart_wonjin_guimun");
    hitNotes.push(copy.hitWonjin);
    attractionProv.push(
      prov(
        "canonical_projections.cross_chart_wonjin_guimun",
        "romantic_ce",
        "canonical_projections.cross_chart_wonjin_guimun",
        "pair",
        "medium",
        "combination_judgment",
      ),
    );
  }

  if (bonding) {
    mark("canonical_projections.pair_ce_bonding");
    mark("ce.pair.common");
  }

  const aCharacter = plan.aRelationshipCharacter.selectedMeaning;
  const bCharacter = plan.bRelationshipCharacter.selectedMeaning;
  if (aCharacter || relCeA) mark("ce.individual.a");
  if (bCharacter || relCeB) mark("ce.individual.b");

  const summary = report.section_1_summary as
    | { relationship_name?: string }
    | string
    | undefined;
  const relationshipDefinition =
    (typeof summary === "object" && summary?.relationship_name) ||
    (typeof summary === "string" ? summary : null) ||
    (relCeA && relCeB
      ? L(
          `${names.a}의 ${josaGwaWa(relCeA.coreRelationshipNature.text)} ${names.b}의 ${josaIGa(relCeB.coreRelationshipNature.text)} 서로의 부족한 점을 채우며 완성해가는 관계`,
          `A relationship where ${names.a}'s ${relCeA.coreRelationshipNature.text.charAt(0).toLowerCase()}${relCeA.coreRelationshipNature.text.slice(1)} and ${names.b}'s ${relCeB.coreRelationshipNature.text.charAt(0).toLowerCase()}${relCeB.coreRelationshipNature.text.slice(1)} complete each other by filling in what the other lacks`,
        )
      : plan.pairSynthesis.selectedMeaning || copy.defFallback);
  mark("section_1_summary");

  const specialBond = report.section_4_special_bond as
    | { why_special?: string; only_together?: string }
    | undefined;
  if (specialBond) mark("section_4_special_bond");

  const faces: StoryFace[] =
    relCeA && relCeB
      ? resolveDynamicsLens({
          relCeA,
          relCeB,
          names: { a: names.a, b: names.b },
          comparisonTable: table as any,
          locale,
        })
      : [
          {
            situation: "private",
            appearance: fill(copy.tpl.facePrivateApp, { a: names.a, b: names.b }, locale),
            mechanism: fill(copy.tpl.facePrivateMech, { affA: affLeanA, affB: affLeanB }, locale),
            benefit: copy.facePrivateBen,
            riskWhenExcess: copy.facePrivateRisk,
            observableSignal: copy.facePrivateSig,
            provenance: [
              prov(
                "canonical_projections.expression_speed",
                "romantic_ce",
                "canonical_projections.expression_speed",
                "pair",
                "high",
                "direct_evidence",
              ),
            ],
          },
          {
            situation: "responsibility",
            appearance: fill(copy.tpl.faceRespApp, { dA: decisionLeanA, dB: decisionLeanB }, locale),
            mechanism: copy.faceRespMech,
            benefit: copy.faceRespBen,
            riskWhenExcess: copy.faceRespRisk,
            observableSignal: copy.faceRespSig,
            provenance: [
              prov(
                "canonical_projections.comparison_table.decision",
                "romantic_ce",
                "canonical_projections.comparison_table.decision",
                "pair",
                "high",
                "direct_evidence",
              ),
            ],
          },
          {
            situation: "stress",
            appearance: fill(copy.tpl.faceStressApp, { sA: stressLeanA, sB: stressLeanB }, locale),
            mechanism: copy.faceStressMech,
            benefit: copy.faceStressBen,
            riskWhenExcess: copy.faceStressRisk,
            observableSignal: copy.faceStressSig,
            provenance: [
              prov(
                "canonical_projections.comparison_table.stress",
                "romantic_ce",
                "canonical_projections.comparison_table.stress",
                "pair",
                "high",
                "direct_evidence",
              ),
            ],
          },
        ];

  const bilateralMatchAToB =
    relCeA && relCeB
      ? resolveBilateralPartnerPreferenceMatchFromCe({
          seekerCe: relCeA,
          partnerCe: relCeB,
          seekerId: "a",
          partnerId: "b",
          seekerName: names.a,
          partnerName: names.b,
          locale,
        })
      : undefined;

  const bilateralMatchBToA =
    relCeA && relCeB
      ? resolveBilateralPartnerPreferenceMatchFromCe({
          seekerCe: relCeB,
          partnerCe: relCeA,
          seekerId: "b",
          partnerId: "a",
          seekerName: names.b,
          partnerName: names.a,
          locale,
        })
      : undefined;

  const cleanUniqueCombination = sanitizeParticles(
    hitNotes.join(" ") ||
      (plan.pairSynthesis.selectedMeaning && !plan.pairSynthesis.selectedMeaning.includes("육합")
        ? plan.pairSynthesis.selectedMeaning
        : "") ||
      specialBond?.only_together ||
      copy.attrUniqueFallback,
    [names.a, names.b],
    locale,
  );

  const mutualUnit: AttractionNarrativeUnit = {
    subject: "mutual",
    recognition: sanitizeParticles(
      hitNotes[0] ?? L(
        `${withP(names.a, locale)} ${names.b}가 마주할 때 비로소 만들어지는 특별한 정서적 공명과 몰입감이 존재합니다.`,
        `There's a special emotional resonance and immersion that only comes into being when ${withP(names.a, locale)} ${names.b} face each other.`,
      ),
      [names.a, names.b],
      locale,
    ),
    emotionalMeaning: sanitizeParticles(
      L(
        "서로 다른 고유한 리듬이 조화롭게 맞물리면서, 둘이 함께할 때 더 깊은 안도감과 편안한 활력을 경험하기 쉽습니다.",
        "Your distinct rhythms interlock harmoniously, so being together tends to bring a deeper reassurance and a comfortable sense of energy.",
      ),
      [names.a, names.b],
      locale,
    ),
    partnerEvidence: hitNotes.slice(1).map((n) => sanitizeParticles(n, [names.a, names.b], locale)),
    scene: sanitizeParticles(
      L(
        "세상의 분주함을 뒤로하고 둘만의 공간에서 대화를 시작할 때, 굳이 긴 설명 없이도 서로의 생각과 감정이 자연스럽게 포개어지는 순간",
        "The moment you leave the busy world behind and start talking in a space that's just the two of you, and your thoughts and feelings naturally fall into place without needing a long explanation",
      ),
      [names.a, names.b],
      locale,
    ),
    pairSpecificEffect: sanitizeParticles(
      L(
        "서로의 다른 기질을 자연스럽게 보완하며, 둘만의 깊은 유대감과 회복 탄력성을 차분히 키워나갑니다.",
        "Naturally complements each other's different temperaments, quietly building a deep bond and resilience that belong only to the two of you.",
      ),
      [names.a, names.b],
      locale,
    ),
    tensionBridge: sanitizeParticles(
      copy.attrFlip,
      [names.a, names.b],
      locale,
    ),
    evidenceIds: attractionProv.map((p) => p.evidenceId),
    confidence: "high",
    usedClaims: hitNotes,
  };

  const attraction = {
    aSeeks: {
      seeker: "a" as const,
      seeksInPartner: bilateralMatchAToB
        ? `${bilateralMatchAToB.narrativeUnit.recognition} ${bilateralMatchAToB.narrativeUnit.emotionalMeaning}`
        : relCeA && relCeB
        ? L(
            `${topicP(names.a, locale)} ${relCeA.partnerPreferences[0]?.text ?? affLeanB}를 자연스럽게 바라며, ${names.b}의 ${relCeB.coreRelationshipNature.text}에 깊은 매력을 느낍니다.`,
            `${topicP(names.a, locale)} naturally wants ${(relCeA.partnerPreferences[0]?.text ?? affLeanB).charAt(0).toLowerCase()}${(relCeA.partnerPreferences[0]?.text ?? affLeanB).slice(1)}, and feels deeply drawn to ${names.b}'s ${relCeB.coreRelationshipNature.text.charAt(0).toLowerCase()}${relCeB.coreRelationshipNature.text.slice(1)}`,
          )
        : fill(copy.tpl.attrASeeks, {
            topicA: topicP(names.a, locale),
            affB: affLeanB,
            char: aCharacter ? fill(copy.tpl.charSuffix, { char: aCharacter }, locale) : "",
          }, locale),
      partnerMatchPoint: bilateralMatchAToB
        ? bilateralMatchAToB.supportingReasons.map((r) => r.text).join(" ")
        : relCeB
        ? L(
            `${subjectP(names.b, locale)} 보여주는 ${relCeB.strengthsGivenToPartner[0]?.text ?? "안정감"}이 ${names.a}의 마음을 든든하게 받쳐줍니다.`,
            `The ${(relCeB.strengthsGivenToPartner[0]?.text ?? "sense of stability").charAt(0).toLowerCase()}${(relCeB.strengthsGivenToPartner[0]?.text ?? "sense of stability").slice(1)} that ${subjectP(names.b, locale)} shows gives ${names.a}'s heart something dependable to lean on.`,
          )
        : fill(copy.tpl.attrAMatch, { subjB: subjectP(names.b, locale) }, locale),
      supportingReasons: bilateralMatchAToB?.supportingReasons.map((r) => r.text),
      cautionReasons: bilateralMatchAToB?.cautionReasons.map((r) => r.text),
      preferenceMatch: bilateralMatchAToB,
      narrativeUnit: bilateralMatchAToB?.narrativeUnit,
      provenance: [
        prov(
          "canonical_projections.comparison_table.affection",
          "romantic_ce",
          "canonical_projections.comparison_table.affection",
          "a",
          "high",
          "direct_evidence",
        ),
        ...(relCeA
          ? [
              prov(
                "chart.a.spouse_palace.preference",
                "personal_saju_chart",
                "chart.a.pillars.day.branch_ten_god",
                "a" as const,
                "high" as const,
                "direct_evidence" as const,
              ),
            ]
          : [
              prov(
                "ce.individual.a",
                "personal_ce",
                "siblingInputs.individualCeA",
                "a" as const,
                "medium" as const,
                "combination_judgment" as const,
              ),
            ]),
        ...(bilateralMatchAToB
          ? bilateralMatchAToB.matchedPartnerEvidence.map((ev) =>
              prov(ev.evidenceId, ev.source, ev.sourcePath, "b" as const, "high" as const, "direct_evidence" as const),
            )
          : []),
      ],
    },
    bSeeks: {
      seeker: "b" as const,
      seeksInPartner: bilateralMatchBToA
        ? `${bilateralMatchBToA.narrativeUnit.recognition} ${bilateralMatchBToA.narrativeUnit.emotionalMeaning}`
        : relCeA && relCeB
        ? L(
            `${topicP(names.b, locale)} ${relCeB.partnerPreferences[0]?.text ?? affLeanA}를 원하며, ${names.a}의 ${relCeA.coreRelationshipNature.text}에서 신선한 활력과 이끌림을 경험합니다.`,
            `${topicP(names.b, locale)} wants ${(relCeB.partnerPreferences[0]?.text ?? affLeanA).charAt(0).toLowerCase()}${(relCeB.partnerPreferences[0]?.text ?? affLeanA).slice(1)}, and finds a fresh energy and pull in ${names.a}'s ${relCeA.coreRelationshipNature.text.charAt(0).toLowerCase()}${relCeA.coreRelationshipNature.text.slice(1)}`,
          )
        : fill(copy.tpl.attrBSeeks, {
            topicB: topicP(names.b, locale),
            affA: affLeanA,
            char: bCharacter ? fill(copy.tpl.charSuffix, { char: bCharacter }, locale) : "",
          }, locale),
      partnerMatchPoint: bilateralMatchBToA
        ? bilateralMatchBToA.supportingReasons.map((r) => r.text).join(" ")
        : relCeA
        ? L(
            `${subjectP(names.a, locale)} 보여주는 ${relCeA.strengthsGivenToPartner[0]?.text ?? "명확한 결단력"}이 ${names.b}에게 큰 확신이 됩니다.`,
            `The ${(relCeA.strengthsGivenToPartner[0]?.text ?? "clear decisiveness").charAt(0).toLowerCase()}${(relCeA.strengthsGivenToPartner[0]?.text ?? "clear decisiveness").slice(1)} that ${subjectP(names.a, locale)} shows becomes a real source of confidence for ${names.b}.`,
          )
        : fill(copy.tpl.attrBMatch, { subjA: subjectP(names.a, locale) }, locale),
      supportingReasons: bilateralMatchBToA?.supportingReasons.map((r) => r.text),
      cautionReasons: bilateralMatchBToA?.cautionReasons.map((r) => r.text),
      preferenceMatch: bilateralMatchBToA,
      narrativeUnit: bilateralMatchBToA?.narrativeUnit,
      provenance: [
        prov(
          "canonical_projections.comparison_table.affection",
          "romantic_ce",
          "canonical_projections.comparison_table.affection",
          "b",
          "high",
          "direct_evidence",
        ),
        ...(relCeB
          ? [
              prov(
                "chart.b.spouse_palace.preference",
                "personal_saju_chart",
                "chart.b.pillars.day.branch_ten_god",
                "b" as const,
                "high" as const,
                "direct_evidence" as const,
              ),
            ]
          : [
              prov(
                "ce.individual.b",
                "personal_ce",
                "siblingInputs.individualCeB",
                "b" as const,
                "medium" as const,
                "combination_judgment" as const,
              ),
            ]),
        ...(bilateralMatchBToA
          ? bilateralMatchBToA.matchedPartnerEvidence.map((ev) =>
              prov(ev.evidenceId, ev.source, ev.sourcePath, "a" as const, "high" as const, "direct_evidence" as const),
            )
          : []),
      ],
    },
    uniqueCombination: cleanUniqueCombination,
    flipsToConflictWhen: sanitizeParticles(copy.attrFlip, [names.a, names.b], locale),
    units: {
      aToB: bilateralMatchAToB?.narrativeUnit ?? {
        subject: "a_to_b",
        recognition: L(
          `${topicP(names.a, locale)} ${names.b}의 묵묵한 태도에 자연스럽게 마음이 열립니다.`,
          `${topicP(names.a, locale)} naturally opens up to ${names.b}'s quiet, steady manner.`,
        ),
        emotionalMeaning: L(
          `${topicP(names.a, locale)} 바라는 안정감을 ${names.b}에게서 발견하기 때문입니다.`,
          `That's because ${topicP(names.a, locale)} finds the stability they've been wanting in ${names.b}.`,
        ),
        partnerEvidence: [bilateralMatchAToB?.supportingReasons[0]?.text ?? ""].filter(Boolean),
        scene: L(
          "함께 중요한 일정을 의논하거나 결정을 내리는 순간",
          "The moment you discuss an important plan together or make a decision",
        ),
        pairSpecificEffect: L(
          "서로에게 든든한 버팀목이 되어주는 신뢰를 형성합니다.",
          "Builds a trust where you each become a dependable pillar for the other.",
        ),
        tensionBridge: copy.attrFlip,
        evidenceIds: [],
        confidence: "high",
        usedClaims: [],
      },
      bToA: bilateralMatchBToA?.narrativeUnit ?? {
        subject: "b_to_a",
        recognition: L(
          `${topicP(names.b, locale)} ${names.a}의 분명한 기준과 결단력에 신선한 매력을 느낍니다.`,
          `${topicP(names.b, locale)} feels a fresh pull toward ${names.a}'s clear standards and decisiveness.`,
        ),
        emotionalMeaning: L(
          `${topicP(names.b, locale)} 바라는 확실한 방향성을 ${names.a}에게서 얻기 때문입니다.`,
          `That's because ${topicP(names.b, locale)} gets the clear sense of direction they've been wanting from ${names.a}.`,
        ),
        partnerEvidence: [bilateralMatchBToA?.supportingReasons[0]?.text ?? ""].filter(Boolean),
        scene: L(
          "방향이 불확실할 때 명쾌하게 결정을 내리고 상황을 정리하는 순간",
          "The moment they make a clear-headed decision and sort out a situation when the direction is uncertain",
        ),
        pairSpecificEffect: L(
          "불안을 덜어내고 확실한 목표를 향해 나아가는 추진력을 얻습니다.",
          "Eases anxiety and gives you the drive to move toward a clear goal.",
        ),
        tensionBridge: copy.attrFlip,
        evidenceIds: [],
        confidence: "high",
        usedClaims: [],
      },
      mutual: mutualUnit,
    },
    bilateralMatches:
      bilateralMatchAToB && bilateralMatchBToA
        ? { aToB: bilateralMatchAToB, bToA: bilateralMatchBToA }
        : undefined,
    provenance: [
      ...attractionProv,
      ...(bilateralMatchAToB?.preferenceSource.map((ev) =>
        prov(ev.evidenceId, ev.source, ev.sourcePath, "a" as const, "high" as const, "direct_evidence" as const),
      ) ?? []),
      ...(bilateralMatchBToA?.preferenceSource.map((ev) =>
        prov(ev.evidenceId, ev.source, ev.sourcePath, "b" as const, "high" as const, "direct_evidence" as const),
      ) ?? []),
    ].length
      ? [
          ...attractionProv,
          ...(bilateralMatchAToB?.preferenceSource.map((ev) =>
            prov(ev.evidenceId, ev.source, ev.sourcePath, "a" as const, "high" as const, "direct_evidence" as const),
          ) ?? []),
          ...(bilateralMatchBToA?.preferenceSource.map((ev) =>
            prov(ev.evidenceId, ev.source, ev.sourcePath, "b" as const, "high" as const, "direct_evidence" as const),
          ) ?? []),
        ]
      : [
          prov(
            "canonical_projections.expression_speed",
            "romantic_ce",
            "canonical_projections.expression_speed",
            "pair",
            "medium",
            "combination_judgment",
          ),
        ],
  };

  const recurringLoop = {
    triggerScene: copy.loopTrigger,
    steps: [
      fill(copy.tpl.loop1, { subjA: subjectP(names.a, locale) }, locale),
      fill(copy.tpl.loop2, { subjB: subjectP(names.b, locale) }, locale),
      fill(copy.tpl.loop3, { topicA: topicP(names.a, locale) }, locale),
      fill(copy.tpl.loop4, { topicB: topicP(names.b, locale) }, locale),
    ],
    residue: copy.loopResidue,
    provenance: [
      prov(
        "canonical_projections.expression_speed",
        "romantic_ce",
        "canonical_projections.expression_speed",
        "pair",
        "high",
        "likely_behavior",
      ),
      prov(
        "canonical_projections.recovery_speed",
        "romantic_ce",
        "canonical_projections.recovery_speed",
        "pair",
        "high",
        "likely_behavior",
      ),
      prov(
        "canonical_projections.comparison_table.stress",
        "romantic_ce",
        "canonical_projections.comparison_table.stress",
        "pair",
        "medium",
        "likely_behavior",
      ),
    ],
  };

  const strengthVuln =
    relCeA && relCeB
      ? resolveStrengthVulnerabilityLens({
          relCeA,
          relCeB,
          names: { a: names.a, b: names.b },
          locale,
        })
      : null;

  const bilateralChanges: BilateralChange[] =
    strengthVuln?.bilateralChanges ?? [
      {
        from: "a",
        to: "b",
        change: fill(copy.tpl.giftAtoB, { subjA: subjectP(names.a, locale), b: names.b }, locale),
        excessVulnerability: fill(copy.tpl.giftARisk, { b: names.b }, locale),
        provenance: [
          prov(
            "canonical_projections.expression_speed",
            "romantic_ce",
            "canonical_projections.expression_speed",
            "a",
            "medium",
            "combination_judgment",
          ),
        ],
      },
      {
        from: "b",
        to: "a",
        change: fill(copy.tpl.giftBtoA, {
          subjB: subjectP(names.b, locale),
          topicA: topicP(names.a, locale),
        }, locale),
        excessVulnerability: fill(copy.tpl.giftBRisk, { a: names.a }, locale),
        provenance: [
          prov(
            "canonical_projections.reassurance_signal",
            "romantic_ce",
            "canonical_projections.reassurance_signal",
            "b",
            "medium",
            "combination_judgment",
          ),
        ],
      },
    ];

  const misreads: DirectionalMisread[] = [
    {
      direction: "a_observes_b",
      observedBehavior: relCeB
        ? L(
            `${subjectP(names.b, locale)} 갈등 상황에서 ${relCeB.stressResponse.text}`,
            `In a conflict, ${subjectP(names.b, locale)} ${relCeB.stressResponse.text.charAt(0).toLowerCase()}${relCeB.stressResponse.text.slice(1)}`,
          )
        : fill(copy.tpl.misreadAObs, { subjB: subjectP(names.b, locale) }, locale),
      observerFelt: fill(copy.tpl.misreadAFelt, { topicA: topicP(names.a, locale) }, locale),
      commonNegativeReading: L(
        "대화를 회피하거나 관계에 무성의하다고 오해하기 쉽습니다.",
        "It's easy to misread this as avoiding the conversation or not taking the relationship seriously.",
      ),
      actorPossibleNeed: relCeB?.relationshipNeeds[0]?.text ?? copy.misreadANeed,
      meaningGap: L(
        "표현의 속도와 생각 정리의 방식 차이일 뿐, 무관심이 아닙니다.",
        "It's only a difference in the pace of expressing and how you each sort out your thoughts — not indifference.",
      ),
      betterExpression: L(
        `${names.b}: "지금 화가 난 게 아니라, 차분하게 생각할 시간이 필요해. 조금만 기다려주면 정리해서 말할게."`,
        `${names.b}: "I'm not angry right now — I just need some calm time to think. Give me a bit and I'll come back with my thoughts sorted out."`,
      ),
      helpfulResponse: L(
        `${names.a}: 침묵을 거절로 받아들이지 않고, ${names.b}가 생각을 정리할 여유를 존중해주기.`,
        `${names.a}: Not reading the silence as rejection, and respecting ${names.b}'s need for room to sort out their thoughts.`,
      ),
      confidence: "medium",
      provenance: [
        prov(
          "canonical_projections.recovery_speed",
          "romantic_ce",
          "canonical_projections.recovery_speed",
          "relationship",
          "medium",
          "limited_inference",
        ),
        ...(relCeB
          ? [
              prov(
                "chart.b.johu.stress",
                "personal_saju_chart",
                "chart.b.johu.stress",
                "b" as const,
                "high" as const,
                "direct_evidence" as const,
              ),
            ]
          : []),
      ],
    },
    {
      direction: "b_observes_a",
      observedBehavior: relCeA
        ? L(
            `${subjectP(names.a, locale)} 긴장 상황에서 ${relCeA.stressResponse.text}`,
            `Under tension, ${subjectP(names.a, locale)} ${relCeA.stressResponse.text.charAt(0).toLowerCase()}${relCeA.stressResponse.text.slice(1)}`,
          )
        : fill(copy.tpl.misreadBObs, { subjA: subjectP(names.a, locale) }, locale),
      observerFelt: fill(copy.tpl.misreadBFelt, { topicB: topicP(names.b, locale) }, locale),
      commonNegativeReading: L(
        "자신을 탓하거나 성급하게 몰아붙인다고 오해하기 쉽습니다.",
        "It's easy to misread this as blaming you or pushing you too hard, too fast.",
      ),
      actorPossibleNeed: relCeA?.relationshipNeeds[0]?.text ?? copy.misreadBNeed,
      meaningGap: L(
        "공격하려는 것이 아니라, 관계를 빠르게 바로잡고 안심하고 싶은 다급함입니다.",
        "It's not an attack — it's an urgency to fix things quickly and feel reassured again.",
      ),
      betterExpression: L(
        `${names.a}: "너를 탓하려는 게 아니라, 우리 문제가 빨리 풀렸으면 해서 다급한 마음이 앞섰어."`,
        `${names.a}: "I'm not trying to blame you — I just got ahead of myself wanting our problem resolved quickly."`,
      ),
      helpfulResponse: L(
        `${names.b}: ${names.a}의 다급한 표현 이면에 있는 안심 욕구를 먼저 알아채고 짧게라도 따뜻한 반응을 보여주기.`,
        `${names.b}: Noticing the need for reassurance behind ${names.a}'s urgency, and offering even a brief, warm response first.`,
      ),
      confidence: "medium",
      provenance: [
        prov(
          "canonical_projections.expression_speed",
          "romantic_ce",
          "canonical_projections.expression_speed",
          "relationship",
          "medium",
          "limited_inference",
        ),
        ...(relCeA
          ? [
              prov(
                "chart.a.johu.stress",
                "personal_saju_chart",
                "chart.a.johu.stress",
                "a" as const,
                "high" as const,
                "direct_evidence" as const,
              ),
            ]
          : []),
      ],
    },
  ];
  mark("ce.conflict_meant_heard_derivation_v1.proxy");
  mark("section_3_conversation_patterns.conflict_situation.dialogue_table");

  const hidden = report.section_4_hidden_hearts as
    | {
        a_hidden?: { visible?: string; inner?: string; need?: string };
        b_hidden?: { visible?: string; inner?: string; need?: string };
      }
    | undefined;
  if (hidden) mark("section_4_hidden_hearts");

  const hiddenHearts: HiddenHeartBits[] =
    relCeA && relCeB
      ? resolveHiddenHeartsLens({
          relCeA,
          relCeB,
          names: { a: names.a, b: names.b },
          locale,
        })
      : [
          {
            person: "a",
            visibleReaction: hidden?.a_hidden?.visible ?? copy.hiddenAVis,
            innerFeeling: hidden?.a_hidden?.inner ?? copy.hiddenAInner,
            reason: L(
              "솔직한 마음을 털어놓고 관계를 온전히 지키고 싶기 때문",
              "Because they want to be honest about what's in their heart and fully protect the relationship",
            ),
            fear: L(
              "자신의 열정과 표현이 상대에게 부담이나 거절로 돌아올지 모른다는 두려움",
              "The fear that their passion and how they express it might come back to them as a burden or a rejection",
            ),
            whatHelps: copy.hiddenAHelp,
            unspokenNeed: hidden?.a_hidden?.need ?? copy.hiddenANeed,
            provenance: [
              prov(
                "section_4_hidden_hearts",
                "report",
                "section_4_hidden_hearts",
                "a",
                "medium",
                "limited_inference",
              ),
            ],
          },
          {
            person: "b",
            visibleReaction: hidden?.b_hidden?.visible ?? copy.hiddenBVis,
            innerFeeling: hidden?.b_hidden?.inner ?? copy.hiddenBInner,
            reason: L(
              "충분히 이성적이고 책임감 있게 문제를 다루고 싶기 때문",
              "Because they want to handle the problem in a fully level-headed, responsible way",
            ),
            fear: L(
              "자신의 정돈되지 않은 감정이 관계를 망치거나 오해를 부를지 모른다는 두려움",
              "The fear that their unsorted emotions might damage the relationship or invite a misunderstanding",
            ),
            whatHelps: copy.hiddenBHelp,
            unspokenNeed: hidden?.b_hidden?.need ?? copy.hiddenBNeed,
            provenance: [
              prov(
                "section_4_hidden_hearts",
                "report",
                "section_4_hidden_hearts",
                "b",
                "medium",
                "limited_inference",
              ),
            ],
          },
        ];

  const repair = {
    sequence: copy.repairSeq,
    helpsA: [
      L(
        `${names.a}에게는 ${relCeA?.recoveryPattern.text ?? '불안을 덜어주는 즉각적인 정서적 안심'}이 가장 필요합니다.`,
        `${names.a} needs ${(relCeA?.recoveryPattern.text ?? "immediate emotional reassurance that eases their anxiety").charAt(0).toLowerCase()}${(relCeA?.recoveryPattern.text ?? "immediate emotional reassurance that eases their anxiety").slice(1)} most of all.`,
      ),
      L(
        `${relCeA?.supportNeededFromPartner[0]?.text ?? '자신의 솔직한 헌신을 인정해주는 따뜻한 피드백'}을 전해주세요.`,
        `Offer them ${(relCeA?.supportNeededFromPartner[0]?.text ?? "warm feedback that recognizes their honest devotion").charAt(0).toLowerCase()}${(relCeA?.supportNeededFromPartner[0]?.text ?? "warm feedback that recognizes their honest devotion").slice(1)}.`,
      ),
      L(
        `대화를 미루지 않고 언제 다시 이야기할지 구체적인 시점을 약속해주세요.`,
        `Don't put off the conversation — promise a concrete time for when you'll talk again.`,
      ),
    ],
    helpsB: [
      L(
        `${names.b}에게는 ${relCeB?.recoveryPattern.text ?? '생각을 정리할 수 있는 충분한 침묵의 시간'}이 필요합니다.`,
        `${names.b} needs ${(relCeB?.recoveryPattern.text ?? "enough quiet time to sort out their thoughts").charAt(0).toLowerCase()}${(relCeB?.recoveryPattern.text ?? "enough quiet time to sort out their thoughts").slice(1)}.`,
      ),
      L(
        `${relCeB?.supportNeededFromPartner[0]?.text ?? '자신의 침묵과 생각을 다그치지 않고 기다려주는 신뢰'}를 보여주세요.`,
        `Show them ${(relCeB?.supportNeededFromPartner[0]?.text ?? "the trust of waiting instead of pressing their silence and thoughts").charAt(0).toLowerCase()}${(relCeB?.supportNeededFromPartner[0]?.text ?? "the trust of waiting instead of pressing their silence and thoughts").slice(1)}.`,
      ),
      L(
        `감정적인 압박 대신 차분하고 논리적인 톤으로 천천히 다가가세요.`,
        `Approach them slowly, with a calm, level tone instead of emotional pressure.`,
      ),
    ],
    avoid: copy.repairAvoid,
    sharedCommitments: copy.repairCommit,
    observationSignals: copy.repairObserve,
    warningIfRepeats: copy.repairWarn,
    provenance: [
      prov(
        "canonical_projections.recovery_speed",
        "romantic_ce",
        "canonical_projections.recovery_speed",
        "relationship",
        "high",
        "intervention",
      ),
      prov(
        "canonical_projections.expression_speed",
        "romantic_ce",
        "canonical_projections.expression_speed",
        "relationship",
        "high",
        "intervention",
      ),
    ],
  };

  // Dynamic weekend planning difference derived from energy_style evidence
  const energyScoreA = axisResults.find((a) => a.axis_key === "energy_style")?.score_a ?? params.surveyInput?.psychA?.secondary_axes?.energy_style;
  const energyScoreB = axisResults.find((a) => a.axis_key === "energy_style")?.score_b ?? params.surveyInput?.psychB?.secondary_axes?.energy_style;
  let weekendDiffText = "";
  if (typeof energyScoreA === "number" && typeof energyScoreB === "number") {
    const gap = Math.abs(energyScoreA - energyScoreB);
    if (gap >= 15) {
      const highEnergyPerson = energyScoreA > energyScoreB ? names.a : names.b;
      const lowEnergyPerson = energyScoreA > energyScoreB ? names.b : names.a;
      weekendDiffText = fill(copy.tpl.weekendDiff, {
        topicA: topicP(highEnergyPerson, locale),
        topicB: topicP(lowEnergyPerson, locale),
      }, locale);
    } else {
      weekendDiffText = L(
        `${names.a}님과 ${names.b}님 모두 에너지를 쓰는 주말 휴식 리듬이 비슷하여, 함께 활동적인 일정을 보내거나 함께 차분히 쉬는 기류를 공유합니다.`,
        `${names.a} and ${names.b} share a similar energy and weekend rest rhythm, alternating together between active plans and quiet downtime.`,
      );
    }
  } else {
    weekendDiffText = L(
      `주말 일정을 계획할 때 두 사람의 피로도와 에너지 상태에 맞춰 사전 조율이 필요합니다.`,
      `When planning weekend schedules, advance coordination is needed based on both partners' energy levels and fatigue.`,
    );
  }

  // Dynamic reply delay difference derived from expression_style / expression_speed evidence
  const exprScoreA = axisResults.find((a) => a.axis_key === "expression_style")?.score_a ?? params.surveyInput?.psychA?.secondary_axes?.expression_style;
  const exprScoreB = axisResults.find((a) => a.axis_key === "expression_style")?.score_b ?? params.surveyInput?.psychB?.secondary_axes?.expression_style;
  let replyDiffText = copy.replyDiff;
  if (typeof exprScoreA === "number" && typeof exprScoreB === "number") {
    const gap = Math.abs(exprScoreA - exprScoreB);
    if (gap >= 15) {
      const fastPerson = exprScoreA > exprScoreB ? names.a : names.b;
      const slowPerson = exprScoreA > exprScoreB ? names.b : names.a;
      replyDiffText = L(
        `${subjectP(fastPerson, locale)} 메시지를 확인하는 대로 빠른 답장과 조율을 선호하는 반면, ${subjectP(slowPerson, locale)} 생각을 정리하거나 자기 일에 몰입한 후 천천히 답하는 템포를 지니고 있습니다.`,
        `${subjectP(fastPerson, locale)} prefers quick replies upon reading messages, while ${subjectP(slowPerson, locale)} takes time to organize thoughts or focus before responding slowly.`,
      );
    }
  }

  const realLifeDomains = [
    {
      domainId: "weekend",
      title: copy.weekendTitle,
      difference: weekendDiffText,
      riskCondition: copy.weekendRisk,
      agreement: copy.weekendAgree,
      usableLine: copy.weekendLine,
      checkSignal: copy.weekendSig,
      provenance: [
        prov(
          "meta.psych_match.axis_results.energy_style",
          "psych_match",
          "meta.psych_match.axis_results.energy_style",
          "pair",
          "medium",
          "observation",
        ),
      ],
    },
    {
      domainId: "reply_delay",
      title: copy.replyTitle,
      difference: replyDiffText,
      riskCondition: copy.replyRisk,
      agreement: copy.replyAgree,
      usableLine: copy.replyLine,
      checkSignal: copy.replySig,
      provenance: [
        prov(
          "canonical_projections.expression_speed",
          "romantic_ce",
          "canonical_projections.expression_speed",
          "pair",
          "high",
          "observation",
        ),
      ],
    },
    {
      domainId: "big_decision",
      title: copy.decisionTitle,
      difference: fill(copy.tpl.decisionDiff, { dA: decisionLeanA, dB: decisionLeanB }, locale),
      riskCondition: copy.decisionRisk,
      agreement: copy.decisionAgree,
      usableLine: copy.decisionLine,
      checkSignal: copy.decisionSig,
      provenance: [
        prov(
          "canonical_projections.comparison_table.decision",
          "romantic_ce",
          "canonical_projections.comparison_table.decision",
          "pair",
          "high",
          "observation",
        ),
      ],
    },
  ];

  const dateSceneCards = [
    buildEmpathyVsSolvingScene({ axisResults, nameA: names.a, nameB: names.b, locale }),
    buildPhysicalIntimacyScene({ axisResults, nameA: names.a, nameB: names.b, locale }),
    buildGiveUpPointScene({ axisResults, nameA: names.a, nameB: names.b, locale }),
    buildRomanticChemistryScene({ bonding, nameA: names.a, nameB: names.b, locale }),
    buildPossessivenessScene({ wonjin, nameA: names.a, nameB: names.b, locale }),
    buildLongTermGrowthScene({
      hasBalance: Boolean(balance),
      combineHitCount: Number(stemCombine?.hitCount ?? 0) + Number(sixCombine?.hitCount ?? 0),
      nameA: names.a,
      nameB: names.b,
      locale,
    }),
  ].filter((card): card is NonNullable<typeof card> => card !== null);
  for (const card of dateSceneCards) {
    for (const p of card.provenance) mark(p.evidenceId);
  }
  realLifeDomains.push(...dateSceneCards);

  const fortuneFlowTiming =
    params.fortuneFlow !== undefined
      ? buildRomanticV4TimingFromFortuneFlow(params.fortuneFlow, locale)
      : null;
  const horizon = projectHorizon({ report });
  const legacyHasTiming = horizon.available && horizon.waypoints.length > 0;
  const hasTiming = fortuneFlowTiming ? fortuneFlowTiming.available : legacyHasTiming;

  if (fortuneFlowTiming) {
    if (fortuneFlowTiming.available) {
      mark("romantic_fortune_flow.sewoon");
    } else {
      suppressed.push({
        evidenceId: "romantic_fortune_flow.sewoon",
        reason: fortuneFlowTiming.hideReason ?? copy.suppressTiming,
      });
    }
  } else if (!legacyHasTiming) {
    suppressed.push({
      evidenceId: "section_6_timeline",
      reason: copy.suppressTiming,
    });
  } else {
    mark("section_6_timeline");
  }

  const chemistryAvailable = Boolean(
    bonding ||
      tension ||
      stemCombine ||
      sixCombine ||
      plan.pairSynthesis.selectedMeaning ||
      specialBond?.only_together ||
      hitNotes.length > 0,
  );

  if (balance) mark("canonical_projections.balance_of_power");

  const primaryTension =
    hitNotes.find((n) => n.includes("\uB9C8\uCC30")) || copy.primaryTensionFallback;

  const finalStoryPlan: CanonicalRelationshipStoryPlan = {
    schemaVersion: "romantic_story_plan_v1",
    locale,
    reportYear: year,
    names: { a: names.a, b: names.b },
    personalRelationshipCeA: relCeA ?? null,
    personalRelationshipCeB: relCeB ?? null,
    relationshipDefinition,
    bondMode: balance
      ? fill(copy.tpl.bondWithBalance, {
          topicA: topicP(names.a, locale),
          topicB: topicP(names.b, locale),
        }, locale)
      : fill(copy.tpl.bondWithout, { topicA: topicP(names.a, locale), b: names.b }, locale),
    growthOrStability: specialBond?.why_special ?? copy.growthFallback,
    primaryTension,
    specialCodePreview:
      hitNotes[0] ??
      plan.pairSynthesis.selectedMeaning ??
      specialBond?.only_together ??
      copy.specialPreviewFallback,
    faces,
    attraction,
    topDifferences,
    stabilizingSimilarities: stabRows,
    allAxes,
    recurringLoop,
    bilateralChanges,
    sharedStrength:
      strengthVuln?.sharedStrength ||
      bonding?.summary ||
      plan.pairSynthesis.selectedMeaning ||
      copy.sharedStrengthFallback,
    sharedVulnerability:
      strengthVuln?.sharedVulnerability || copy.sharedVuln,
    pairChemistry: {
      available: chemistryAvailable,
      combinationLabel:
        hitNotes[0] ||
        plan.pairSynthesis.selectedMeaning ||
        specialBond?.only_together ||
        copy.chemLabelFallback,
      intimacyFeel: copy.chemIntimacy,
      socialOrPracticalFeel: copy.chemPractical,
      flipsWhenExcess: copy.chemFlip,
      healthyCondition: copy.chemHealthy,
      provenance: attraction.provenance,
    },
    misreads,
    hiddenHearts,
    repair,
    realLifeDomains,
    timing:
      fortuneFlowTiming ?? {
        available: hasTiming,
        year,
        theme: hasTiming ? (horizon.title ?? null) : null,
        favorableWindows: hasTiming ? horizon.waypoints.filter((w: any) => !w.sub).map((w: any) => `${w.period}: ${w.body}`) : [],
        cautionWindows: hasTiming ? horizon.waypoints.filter((w: any) => w.sub).map((w: any) => `${w.period}: ${w.sub}`) : [],
        observationSignals: hasTiming ? copy.timingObs : [],
        hideReason: hasTiming ? null : copy.hideTiming,
        provenance: hasTiming
          ? [
              prov(
                "section_6_timeline",
                "report",
                "section_6_timeline",
                "relationship",
                "medium",
                "observation",
              ),
            ]
          : [],
      },
    closing: {
      presentPossibility: copy.closePossibility,
      rememberA: fill(copy.tpl.rememberA, { topicA: topicP(names.a, locale) }, locale),
      rememberB: fill(copy.tpl.rememberB, { topicB: topicP(names.b, locale) }, locale),
      watchSignals: repair.observationSignals,
      improvingSignals: [copy.improveSignal],
      cautionSignals: repair.warningIfRepeats,
      decisionQuestions: [copy.q1, copy.q2, copy.q3],
      provenance: [
        prov(
          "story_plan.repair",
          "story_plan",
          "repair",
          "relationship",
          "medium",
          "observation",
        ),
      ],
    },
    connectedEvidenceIds: [...connected],
    suppressedEvidence: suppressed,
  };

  const conflictLoopP0 = buildRomanticConflictLoopP0(finalStoryPlan);
  const repairPatternP0 = buildRomanticRepairPatternP0(finalStoryPlan);
  const actionCandidatesP0 = buildRomanticP0ActionCandidates(finalStoryPlan);
  const synthesisResultsP1 = buildRomanticMultiSignalSynthesis(finalStoryPlan);

  const crossSignalInsightsV1 = buildRomanticCrossSignalIntelligence({
    storyPlan: finalStoryPlan,
    relCeA,
    relCeB,
    axisResults,
    bonding,
    stemCombineHitCount: stemCombine?.hitCount ?? 0,
    sixCombineHitCount: sixCombine?.hitCount ?? 0,
    names,
    locale,
  });

  const candidateEngine = buildRomanticCandidateEngine({
    ...finalStoryPlan,
    conflictLoopP0,
    repairPatternP0,
    actionCandidatesP0,
    synthesisResultsP1,
  });

  const growthTransitionP1 = {
    currentPattern: "갈등 시 직면과 침묵의 템포 차이로 서운함이 누적되는 패턴",
    recommendedShift: "감정이 격해질 때 서둘러 해명하기보다 30분간 쿨링다운 후 내 필요만 말하는 전환",
    longTermGoal: "서로의 자율 공간을 존중하며 깊은 안정감 속에서 지속되는 성숙한 동반자 관계",
    evidenceIds: ["story_plan.recurringLoop", "story_plan.repair"],
    confidence: "high" as const,
  };

  const pairNeedsDetailed = computeRomanticRelationshipNeedsEngine({
    nicknameA: names.a,
    nicknameB: names.b,
    countsA: {},
    countsB: {},
    psychA: contract.meta?.psych_master_a ?? null,
    psychB: contract.meta?.psych_master_b ?? null,
  });

  const pairMeanings = {
    dependencyProtection: {
      provider: `${names.a}님의 정서적 포용과 ${names.b}님의 안정적인 지지`,
      reliance: "독립된 공간을 존중하면서도 필요할 때 기댈 수 있는 호환 수용 구도",
      roleReversalRisk: false,
      summary: `${names.a}님과 ${names.b}님이 서로의 독립성을 존중하면서 정서적 안전지대를 제공하는 조화로운 구도`,
    },
    loveExpressionVsReception: {
      expressesA: `${names.a}님의 신뢰 기반 다정한 관심`,
      receivesB: `${names.b}님의 존중 중심 수용 톤`,
      alignment: "matched" as const,
      summary: `${names.a}님과 ${names.b}님의 사랑 표현 톤이 왜곡 없이 잘 전달되는 매칭 상태`,
    },
    expectationVsPressure: {
      expectationA: `${names.a}님의 유연하고 성숙한 가치관`,
      pressureB: `${names.b}님이 부담 없이 자극을 흡수하는 상태`,
      gapLevel: "low" as const,
      summary: `${names.a}님의 기대가 ${names.b}님에게 성장의 좋은 동기부여로 작용함`,
    },
    pairNeedsDetailed,
  };

  const romanticGapBatch = computeRomanticV4GapBatchEngine({
    nameA: names.a,
    nameB: names.b,
    psychA: contract.meta?.psych_master_a ?? (contract as any).surveyInput?.psychA ?? (params as any).surveyInput?.psychA ?? null,
    psychB: contract.meta?.psych_master_b ?? (contract as any).surveyInput?.psychB ?? (params as any).surveyInput?.psychB ?? null,
  });

  return {
    ...finalStoryPlan,
    pairMeanings,
    romanticGapBatch,
    conflictLoopP0,
    repairPatternP0,
    actionCandidatesP0,
    synthesisResultsP1,
    insightCandidatesP1: candidateEngine.insightCandidates,
    normalizedActionCandidatesP1: candidateEngine.normalizedActions,
    growthTransitionP1,
    crossSignalInsightsV1,
  };
}
