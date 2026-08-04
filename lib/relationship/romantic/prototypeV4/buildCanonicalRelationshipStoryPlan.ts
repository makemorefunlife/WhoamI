/**
 * Build Canonical Relationship Story Plan from four-CE + canonical projections + psych.
 * CONNECT: unused cross-chart combine/tension/bonding into attraction & chemistry.
 * Korean copy lives in canonicalStoryPlanCopy.ko.json (UTF-8) to avoid editor encoding loss.
 */
import type {
  RomanticPsychMatchAxisResult,
  RomanticSajuDeepReport,
} from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  formatRomanticCompareLeanLabel,
  type RomanticCompareRowKey,
} from "../romanticComparisonTableCanonical";
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
import copy from "./canonicalStoryPlanCopy.ko.json";

import {
  topicParticle as topic,
  subjectParticle as subject,
  objectParticle,
  withParticle,
  sanitizeKoreanParticles,
} from "../../koreanParticles";

type Report = RomanticSajuDeepReport["report"];

function fill(tpl: string, vars: Record<string, string>): string {
  return sanitizeKoreanParticles(
    tpl.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? ""),
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
  if (!lean) return locale === "ko-KR" ? copy.leanFallback : copy.leanFallbackEn;
  return formatRomanticCompareLeanLabel(lean as never, locale, rowKey);
}

import { AXIS_INTERPRETATIONS } from "./axisStandoutInterpretations";

function axisRow(
  axis: RomanticPsychMatchAxisResult,
  role: AxisPriorityRow["role"],
  locale: "ko-KR" | "en-US",
): AxisPriorityRow {
  const label = psychMatchAxisLabel(axis.axis_key, locale);
  const aHigh = axis.score_a >= axis.score_b;
  const interp = AXIS_INTERPRETATIONS[axis.axis_key] || {
    plainLanguageDefinition: "서로의 다름과 같음을 보여주는 성향이에요.",
    highBehavior: "스스로의 성향을 선명하게 드러내는 편이에요.",
    lowBehavior: "상황에 맞춰 유연하게 반응하는 편이에요.",
    sceneHint: "일상 속에서 선택을 내릴 때",
    tensionClash: "차이가 오해로 이어질 수 있어요.",
    tensionBenefit: "서로 다른 강점을 살릴 수 있어요.",
    practicalTranslation: "다름을 이해하고 맞춰가려는 노력이 필요해요.",
    misreadHighObservingLow: "상대의 유연함을 무심함으로 잘못 읽을 수 있어요.",
    misreadLowObservingHigh: "상대의 선명함을 부담으로 잘못 읽을 수 있어요.",
  };

  const aPattern = aHigh ? interp.highBehavior : interp.lowBehavior;
  const bPattern = !aHigh ? interp.highBehavior : interp.lowBehavior;
  const isSimilar = axis.match_type === "similarity";
  const isHighLow = aHigh; // A is high, B is low.

  return {
    id: `axis.${axis.axis_key}`,
    sourceType: "psych",
    confidence: "high",
    userQuestion: `${label} 차이가 우리에게 미치는 영향은 무엇인가요?`,
    plainLanguageDefinition: interp.plainLanguageDefinition,
    personATendency: aPattern,
    personBTendency: bPattern,
    pairDynamic: isSimilar 
      ? "비슷한 성향으로 인해 행동의 이유를 쉽게 이해할 수 있어요." 
      : interp.tensionClash,
    observableScene: interp.sceneHint,
    likelyMisreadingA: isSimilar ? null : (isHighLow ? interp.misreadHighObservingLow : interp.misreadLowObservingHigh),
    likelyMisreadingB: isSimilar ? null : (isHighLow ? interp.misreadLowObservingHigh : interp.misreadHighObservingLow),
    relationshipStrength: isSimilar ? copy.calmSim : interp.tensionBenefit,
    relationshipRisk: isSimilar ? copy.stressLow : interp.tensionClash,
    practicalTranslation: isSimilar ? "지금의 긍정적인 균형을 유지하세요." : interp.practicalTranslation,
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
  dynamicsCrossHits?: Array<{ category?: string; type?: string }>;
}): CanonicalRelationshipStoryPlan {
  const { contract, report, axisResults, locale } = params;
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
  const bonding = (projections as any).pair_ce_bonding as { summary?: string } | undefined;
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
      ? `${names.a}의 ${relCeA.coreRelationshipNature.text}와 ${names.b}의 ${relCeB.coreRelationshipNature.text}가 서로의 부족한 점을 채우며 완성해가는 관계`
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
        })
      : [
          {
            situation: "private",
            appearance: fill(copy.tpl.facePrivateApp, { a: names.a, b: names.b }),
            mechanism: fill(copy.tpl.facePrivateMech, { affA: affLeanA, affB: affLeanB }),
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
            appearance: fill(copy.tpl.faceRespApp, { dA: decisionLeanA, dB: decisionLeanB }),
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
            appearance: fill(copy.tpl.faceStressApp, { sA: stressLeanA, sB: stressLeanB }),
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
        })
      : undefined;

  const cleanUniqueCombination = sanitizeKoreanParticles(
    hitNotes.join(" ") ||
      (plan.pairSynthesis.selectedMeaning && !plan.pairSynthesis.selectedMeaning.includes("육합")
        ? plan.pairSynthesis.selectedMeaning
        : "") ||
      specialBond?.only_together ||
      copy.attrUniqueFallback,
    [names.a, names.b],
  );

  const mutualUnit: AttractionNarrativeUnit = {
    subject: "mutual",
    recognition: sanitizeKoreanParticles(
      hitNotes[0] ?? `${withParticle(names.a)} ${names.b}가 마주할 때 비로소 만들어지는 특별한 정서적 공명과 몰입감이 존재합니다.`,
      [names.a, names.b],
    ),
    emotionalMeaning: sanitizeKoreanParticles(
      "서로 다른 고유한 리듬이 조화롭게 맞물리면서, 둘이 함께할 때 더 깊은 안도감과 편안한 활력을 경험하기 쉽습니다.",
      [names.a, names.b],
    ),
    partnerEvidence: hitNotes.slice(1).map((n) => sanitizeKoreanParticles(n, [names.a, names.b])),
    scene: sanitizeKoreanParticles(
      "세상의 분주함을 뒤로하고 둘만의 공간에서 대화를 시작할 때, 굳이 긴 설명 없이도 서로의 생각과 감정이 자연스럽게 포개어지는 순간",
      [names.a, names.b],
    ),
    pairSpecificEffect: sanitizeKoreanParticles(
      "서로의 다른 기질을 자연스럽게 보완하며, 둘만의 깊은 유대감과 회복 탄력성을 차분히 키워나갑니다.",
      [names.a, names.b],
    ),
    tensionBridge: sanitizeKoreanParticles(
      copy.attrFlip,
      [names.a, names.b],
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
        ? `${topic(names.a)} ${relCeA.partnerPreferences[0]?.text ?? affLeanB}를 자연스럽게 바라며, ${names.b}의 ${relCeB.coreRelationshipNature.text}에 깊은 매력을 느낍니다.`
        : fill(copy.tpl.attrASeeks, {
            topicA: topic(names.a),
            affB: affLeanB,
            char: aCharacter ? fill(copy.tpl.charSuffix, { char: aCharacter }) : "",
          }),
      partnerMatchPoint: bilateralMatchAToB
        ? bilateralMatchAToB.supportingReasons.map((r) => r.text).join(" ")
        : relCeB
        ? `${subject(names.b)} 보여주는 ${relCeB.strengthsGivenToPartner[0]?.text ?? "안정감"}이 ${names.a}의 마음을 든든하게 받쳐줍니다.`
        : fill(copy.tpl.attrAMatch, { subjB: subject(names.b) }),
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
        ? `${topic(names.b)} ${relCeB.partnerPreferences[0]?.text ?? affLeanA}를 원하며, ${names.a}의 ${relCeA.coreRelationshipNature.text}에서 신선한 활력과 이끌림을 경험합니다.`
        : fill(copy.tpl.attrBSeeks, {
            topicB: topic(names.b),
            affA: affLeanA,
            char: bCharacter ? fill(copy.tpl.charSuffix, { char: bCharacter }) : "",
          }),
      partnerMatchPoint: bilateralMatchBToA
        ? bilateralMatchBToA.supportingReasons.map((r) => r.text).join(" ")
        : relCeA
        ? `${subject(names.a)} 보여주는 ${relCeA.strengthsGivenToPartner[0]?.text ?? "명확한 결단력"}이 ${names.b}에게 큰 확신이 됩니다.`
        : fill(copy.tpl.attrBMatch, { subjA: subject(names.a) }),
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
    flipsToConflictWhen: sanitizeKoreanParticles(copy.attrFlip, [names.a, names.b]),
    units: {
      aToB: bilateralMatchAToB?.narrativeUnit ?? {
        subject: "a_to_b",
        recognition: `${topic(names.a)} ${names.b}의 묵묵한 태도에 자연스럽게 마음이 열립니다.`,
        emotionalMeaning: `${topic(names.a)} 바라는 안정감을 ${names.b}에게서 발견하기 때문입니다.`,
        partnerEvidence: [bilateralMatchAToB?.supportingReasons[0]?.text ?? ""].filter(Boolean),
        scene: "함께 중요한 일정을 의논하거나 결정을 내리는 순간",
        pairSpecificEffect: "서로에게 든든한 버팀목이 되어주는 신뢰를 형성합니다.",
        tensionBridge: copy.attrFlip,
        evidenceIds: [],
        confidence: "high",
        usedClaims: [],
      },
      bToA: bilateralMatchBToA?.narrativeUnit ?? {
        subject: "b_to_a",
        recognition: `${topic(names.b)} ${names.a}의 분명한 기준과 결단력에 신선한 매력을 느낍니다.`,
        emotionalMeaning: `${topic(names.b)} 바라는 확실한 방향성을 ${names.a}에게서 얻기 때문입니다.`,
        partnerEvidence: [bilateralMatchBToA?.supportingReasons[0]?.text ?? ""].filter(Boolean),
        scene: "방향이 불확실할 때 명쾌하게 결정을 내리고 상황을 정리하는 순간",
        pairSpecificEffect: "불안을 덜어내고 확실한 목표를 향해 나아가는 추진력을 얻습니다.",
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
      fill(copy.tpl.loop1, { subjA: subject(names.a) }),
      fill(copy.tpl.loop2, { subjB: subject(names.b) }),
      fill(copy.tpl.loop3, { topicA: topic(names.a) }),
      fill(copy.tpl.loop4, { topicB: topic(names.b) }),
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
        })
      : null;

  const bilateralChanges: BilateralChange[] =
    strengthVuln?.bilateralChanges ?? [
      {
        from: "a",
        to: "b",
        change: fill(copy.tpl.giftAtoB, { subjA: subject(names.a), b: names.b }),
        excessVulnerability: fill(copy.tpl.giftARisk, { b: names.b }),
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
          subjB: subject(names.b),
          topicA: topic(names.a),
        }),
        excessVulnerability: fill(copy.tpl.giftBRisk, { a: names.a }),
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
        ? `${subject(names.b)} 갈등 상황에서 ${relCeB.stressResponse.text}`
        : fill(copy.tpl.misreadAObs, { subjB: subject(names.b) }),
      observerFelt: fill(copy.tpl.misreadAFelt, { topicA: topic(names.a) }),
      commonNegativeReading: "대화를 회피하거나 관계에 무성의하다고 오해하기 쉽습니다.",
      actorPossibleNeed: relCeB?.relationshipNeeds[0]?.text ?? copy.misreadANeed,
      meaningGap: "표현의 속도와 생각 정리의 방식 차이일 뿐, 무관심이 아닙니다.",
      betterExpression: `${names.b}: "지금 화가 난 게 아니라, 차분하게 생각할 시간이 필요해. 조금만 기다려주면 정리해서 말할게."`,
      helpfulResponse: `${names.a}: 침묵을 거절로 받아들이지 않고, ${names.b}가 생각을 정리할 여유를 존중해주기.`,
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
        ? `${subject(names.a)} 긴장 상황에서 ${relCeA.stressResponse.text}`
        : fill(copy.tpl.misreadBObs, { subjA: subject(names.a) }),
      observerFelt: fill(copy.tpl.misreadBFelt, { topicB: topic(names.b) }),
      commonNegativeReading: "자신을 탓하거나 성급하게 몰아붙인다고 오해하기 쉽습니다.",
      actorPossibleNeed: relCeA?.relationshipNeeds[0]?.text ?? copy.misreadBNeed,
      meaningGap: "공격하려는 것이 아니라, 관계를 빠르게 바로잡고 안심하고 싶은 다급함입니다.",
      betterExpression: `${names.a}: "너를 탓하려는 게 아니라, 우리 문제가 빨리 풀렸으면 해서 다급한 마음이 앞섰어."`,
      helpfulResponse: `${names.b}: ${names.a}의 다급한 표현 이면에 있는 안심 욕구를 먼저 알아채고 짧게라도 따뜻한 반응을 보여주기.`,
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
        })
      : [
          {
            person: "a",
            visibleReaction: hidden?.a_hidden?.visible ?? copy.hiddenAVis,
            innerFeeling: hidden?.a_hidden?.inner ?? copy.hiddenAInner,
            reason: "솔직한 마음을 털어놓고 관계를 온전히 지키고 싶기 때문",
            fear: "자신의 열정과 표현이 상대에게 부담이나 거절로 돌아올지 모른다는 두려움",
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
            reason: "충분히 이성적이고 책임감 있게 문제를 다루고 싶기 때문",
            fear: "자신의 정돈되지 않은 감정이 관계를 망치거나 오해를 부를지 모른다는 두려움",
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
      `${names.a}에게는 ${relCeA?.recoveryPattern.text ?? '불안을 덜어주는 즉각적인 정서적 안심'}이 가장 필요합니다.`,
      `${relCeA?.supportNeededFromPartner[0]?.text ?? '자신의 솔직한 헌신을 인정해주는 따뜻한 피드백'}을 전해주세요.`,
      `대화를 미루지 않고 언제 다시 이야기할지 구체적인 시점을 약속해주세요.`,
    ],
    helpsB: [
      `${names.b}에게는 ${relCeB?.recoveryPattern.text ?? '생각을 정리할 수 있는 충분한 침묵의 시간'}이 필요합니다.`,
      `${relCeB?.supportNeededFromPartner[0]?.text ?? '자신의 침묵과 생각을 다그치지 않고 기다려주는 신뢰'}를 보여주세요.`,
      `감정적인 압박 대신 차분하고 논리적인 톤으로 천천히 다가가세요.`,
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

  const realLifeDomains = [
    {
      domainId: "weekend",
      title: copy.weekendTitle,
      difference: fill(copy.tpl.weekendDiff, {
        topicA: topic(names.a),
        topicB: topic(names.b),
      }),
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
      difference: copy.replyDiff,
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
      difference: fill(copy.tpl.decisionDiff, { dA: decisionLeanA, dB: decisionLeanB }),
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

  const horizon = projectHorizon({ report });
  const hasTiming = horizon.available && horizon.waypoints.length > 0;

  if (!hasTiming) {
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

  return {
    schemaVersion: "romantic_story_plan_v1",
    locale,
    reportYear: year,
    names: { a: names.a, b: names.b },
    personalRelationshipCeA: relCeA ?? null,
    personalRelationshipCeB: relCeB ?? null,
    relationshipDefinition,
    bondMode: balance
      ? fill(copy.tpl.bondWithBalance, {
          topicA: topic(names.a),
          topicB: topic(names.b),
        })
      : fill(copy.tpl.bondWithout, { topicA: topic(names.a), b: names.b }),
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
    timing: {
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
      rememberA: fill(copy.tpl.rememberA, { topicA: topic(names.a) }),
      rememberB: fill(copy.tpl.rememberB, { topicB: topic(names.b) }),
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
}
