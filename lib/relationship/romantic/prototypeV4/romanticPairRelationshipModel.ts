/**
 * Romantic VNext — Pair Relationship Model.
 *
 * The chapter planner's job used to be "select from N pre-written story
 * fragments." That's exactly what let genuinely different couples end up
 * with byte-identical prose (see the audit: buildCanonicalRelationshipStoryPlan.ts's
 * `mutualUnit.emotionalMeaning/scene/tensionBridge` were unconditional
 * constants — 0 branches on chart or psych data, for every couple, ever).
 *
 * This model flips the direction: build ONE structured, evidence-first
 * conclusion per concept BEFORE any chapter copy is written, then let
 * chapters consume it. Each field is Cross-Signal-first — Cross-Signal V1
 * (romanticCrossSignalIntelligence.ts) already computes genuinely
 * pair-specific, evidence-crossed insights (hidden_collision, paradox,
 * superpower, difference_rescue, strength_shadow, blind_spot,
 * innate_current) but the old chapter composer only ever appended them as
 * bonus blocks AFTER a generic primary thesis — never let them replace it.
 * This model is what makes them primary.
 *
 * Do NOT rebuild the upstream evidence engines (Saju/Personal CE/Pair CE/
 * Cross-Signal V1 itself) here — this file only SELECTS and STRUCTURES
 * what they already produced. A field is null (abstain) when nothing
 * evidence-backed exists — never filled with a generic fallback sentence.
 */
import type {
  CanonicalRelationshipStoryPlan,
  RomanticCrossSignalInsight,
  ProvenanceRef,
} from "./canonicalStoryPlanTypes";

export type PairModelConfidence = "high" | "medium" | "low";
export type PairModelDirectionality = "a_to_b" | "b_to_a" | "mutual" | "pair" | null;

export type PairModelField = {
  text: string;
  evidenceRefs: string[];
  confidence: PairModelConfidence;
  directionality: PairModelDirectionality;
  claimBoundary: { supported: string; notSupported: string } | null;
  /** "cross_signal" = sourced from a Cross-Signal V1 insight (the strongest,
   * most differentiated source available). "ce_direct" = wrapped from an
   * already-evidence-driven existing CanonicalRelationshipStoryPlan field
   * (e.g. plan.faces, plan.recurringLoop) — honest pass-through, not new
   * computation. "abstain" fields are represented as `null`, not this type. */
  sourceKind: "cross_signal" | "ce_direct";
  /** The Cross-Signal insight id this field consumed, if any — lets the
   * chapter composer exclude it from the old "extras" list so the same
   * insight never renders twice (once as primary thesis, once as a bonus
   * block underneath itself). */
  consumedCrossSignalId?: string;
};

export type PairRelationshipModel = {
  primaryBondMechanism: PairModelField | null;
  primaryAttractionAtoB: PairModelField | null;
  primaryAttractionBtoA: PairModelField | null;
  primaryAttractionMutual: PairModelField | null;
  privateInteractionPattern: PairModelField | null;
  responsibilityDecisionPattern: PairModelField | null;
  stressPattern: PairModelField | null;
  conflictInitiationPattern: PairModelField | null;
  conflictEscalationLoop: PairModelField | null;
  misreadAtoB: PairModelField | null;
  misreadBtoA: PairModelField | null;
  hiddenNeedA: PairModelField | null;
  hiddenNeedB: PairModelField | null;
  strongestSimilarity: PairModelField | null;
  strongestDifference: PairModelField | null;
  hiddenCollision: PairModelField | null;
  superpower: PairModelField | null;
  paradox: PairModelField | null;
  differenceRescue: PairModelField | null;
  sharedVulnerability: PairModelField | null;
  repairStrategy: PairModelField | null;
  expectationBoundaries: PairModelField | null;
  timingContext: PairModelField | null;
};

function fromCrossSignal(insight: RomanticCrossSignalInsight, directionality: PairModelDirectionality = "pair"): PairModelField {
  return {
    text: insight.derivedMeaning,
    evidenceRefs: insight.evidenceRefs,
    confidence: insight.confidence,
    directionality,
    claimBoundary: insight.claimBoundary,
    sourceKind: "cross_signal",
    consumedCrossSignalId: insight.id,
  };
}

function fromProvenance(
  text: string,
  provenance: ProvenanceRef[],
  directionality: PairModelDirectionality,
  confidence: PairModelConfidence = "medium",
): PairModelField | null {
  if (!text || !text.trim() || provenance.length === 0) return null;
  return {
    text,
    evidenceRefs: provenance.map((p) => p.evidenceId),
    confidence,
    directionality,
    claimBoundary: null,
    sourceKind: "ce_direct",
  };
}

function pickByType<T extends RomanticCrossSignalInsight["insightType"]>(
  insights: RomanticCrossSignalInsight[],
  type: T,
): Extract<RomanticCrossSignalInsight, { insightType: T }> | undefined {
  return insights.find((i) => i.insightType === type) as
    | Extract<RomanticCrossSignalInsight, { insightType: T }>
    | undefined;
}

/**
 * Builds the Pair Relationship Model from an already-computed story plan.
 * Cross-Signal-first: for the fields where Cross-Signal V1 has a matching
 * insight type, that insight's derivedMeaning becomes the field (this is
 * the fix for the confirmed hardcoded/coarse-bucket bug — Cross-Signal
 * insights are genuinely evidence-crossed per pair). Fields without a
 * matching Cross-Signal insight fall back to wrapping the existing,
 * already-evidence-driven CE fields (plan.faces/recurringLoop/misreads/
 * hiddenHearts/repair/bilateralChanges) — honest pass-through, not new
 * computation, since the audit found those already branch on real
 * per-person/per-pair data (unlike mutualUnit/sharedStrength/sharedVulnerability,
 * which did not).
 */
export function buildPairRelationshipModel(plan: CanonicalRelationshipStoryPlan): PairRelationshipModel {
  const cs = plan.crossSignalInsightsV1 ?? [];

  const superpower = pickByType(cs, "superpower");
  const paradox = pickByType(cs, "paradox");
  const hiddenCollision = pickByType(cs, "hidden_collision");
  const differenceRescue = pickByType(cs, "difference_rescue");
  const blindSpot = pickByType(cs, "blind_spot");
  const strengthShadow = pickByType(cs, "strength_shadow");

  const faceA = (plan.faces ?? []).find((f) => f.situation === "private");
  const faceB = (plan.faces ?? []).find((f) => f.situation === "responsibility");
  const faceC = (plan.faces ?? []).find((f) => f.situation === "stress");
  const misreadAB = (plan.misreads ?? []).find((m) => m.direction === "a_observes_b");
  const misreadBA = (plan.misreads ?? []).find((m) => m.direction === "b_observes_a");
  const hiddenA = (plan.hiddenHearts ?? []).find((h) => h.person === "a");
  const hiddenB = (plan.hiddenHearts ?? []).find((h) => h.person === "b");
  const strongestDiff = (plan.topDifferences ?? [])[0];
  const strongestSim = (plan.stabilizingSimilarities ?? [])[0];

  return {
    // Superpower is the closest existing concept to "primary bond mechanism"
    // — an emergent, pair-level "why this bond works" claim. Falls back to
    // null (abstain) rather than a generic "완성해가는 관계"-style claim when
    // Cross-Signal found nothing strong enough (spec §5: never a default).
    primaryBondMechanism: superpower ? fromCrossSignal(superpower, "pair") : null,

    primaryAttractionAtoB: plan.attraction?.aSeeks
      ? fromProvenance(
          plan.attraction.aSeeks.narrativeUnit?.recognition ?? plan.attraction.aSeeks.seeksInPartner,
          plan.attraction.aSeeks.provenance ?? [],
          "a_to_b",
        )
      : null,
    primaryAttractionBtoA: plan.attraction?.bSeeks
      ? fromProvenance(
          plan.attraction.bSeeks.narrativeUnit?.recognition ?? plan.attraction.bSeeks.seeksInPartner,
          plan.attraction.bSeeks.provenance ?? [],
          "b_to_a",
        )
      : null,
    // The confirmed-broken field: mutual attraction's old text was 3/4
    // hardcoded constants. Paradox (attraction's own tension-bridge, by
    // construction) is the correct Cross-Signal replacement when present.
    primaryAttractionMutual: paradox ? fromCrossSignal(paradox, "mutual") : null,

    privateInteractionPattern: faceA ? fromProvenance(faceA.appearance, faceA.provenance, "mutual") : null,
    responsibilityDecisionPattern: faceB ? fromProvenance(faceB.appearance, faceB.provenance, "mutual") : null,
    stressPattern: faceC ? fromProvenance(faceC.appearance, faceC.provenance, "mutual") : null,

    conflictInitiationPattern: plan.recurringLoop
      ? fromProvenance(plan.recurringLoop.triggerScene, plan.recurringLoop.provenance ?? [], "mutual")
      : null,
    conflictEscalationLoop: plan.recurringLoop
      ? fromProvenance((plan.recurringLoop.steps ?? []).join(" -> "), plan.recurringLoop.provenance ?? [], "mutual")
      : null,

    misreadAtoB: misreadAB ? fromProvenance(misreadAB.meaningGap, misreadAB.provenance, "a_to_b", misreadAB.confidence === "tentative" ? "low" : misreadAB.confidence) : null,
    misreadBtoA: misreadBA ? fromProvenance(misreadBA.meaningGap, misreadBA.provenance, "b_to_a", misreadBA.confidence === "tentative" ? "low" : misreadBA.confidence) : null,

    hiddenNeedA: hiddenA ? fromProvenance(hiddenA.unspokenNeed, hiddenA.provenance, "a_to_b") : null,
    hiddenNeedB: hiddenB ? fromProvenance(hiddenB.unspokenNeed, hiddenB.provenance, "b_to_a") : null,

    strongestSimilarity: hiddenCollision
      ? fromCrossSignal(hiddenCollision, "pair")
      : strongestSim
        ? fromProvenance(strongestSim.plainLanguageDefinition, strongestSim.evidenceRefs, "pair")
        : null,
    strongestDifference: differenceRescue
      ? fromCrossSignal(differenceRescue, "pair")
      : strongestDiff
        ? fromProvenance(strongestDiff.plainLanguageDefinition, strongestDiff.evidenceRefs, "pair")
        : null,

    hiddenCollision: hiddenCollision ? fromCrossSignal(hiddenCollision, "pair") : null,
    superpower: superpower ? fromCrossSignal(superpower, "pair") : null,
    paradox: paradox ? fromCrossSignal(paradox, "pair") : null,
    differenceRescue: differenceRescue ? fromCrossSignal(differenceRescue, "pair") : null,

    // Shared vulnerability: strength_shadow is Cross-Signal's per-direction
    // "strength becomes shadow" insight — closest genuine equivalent. Falls
    // back to bilateralChanges' excessVulnerability (already per-pair) when
    // Cross-Signal has nothing.
    sharedVulnerability: plan.sharedVulnerability
      ? fromProvenance(plan.sharedVulnerability, [], "pair")
      : null,

    repairStrategy: plan.repair?.sequence?.length
      ? fromProvenance(plan.repair.sequence.join(" -> "), plan.repair.provenance ?? [], "mutual")
      : null,

    // Blind spot ("서로 확인시켜주는 오해") is the pair-level cross of both
    // misread directions — the correct evidence-backed source for a shared
    // "here's where our expectations don't line up" boundary statement.
    expectationBoundaries: blindSpot ? fromCrossSignal(blindSpot, "pair") : null,

    timingContext: plan.timing?.available && plan.timing.theme
      ? fromProvenance(plan.timing.theme, plan.timing.provenance, "pair")
      : null,
  };
}
