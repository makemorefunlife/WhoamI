import type {
  CanonicalRelationshipStoryPlan,
  RomanticInsightCandidate,
  RomanticActionCandidate,
} from "./canonicalStoryPlanTypes";

export function buildRomanticCandidateEngine(
  storyPlan: CanonicalRelationshipStoryPlan
): {
  insightCandidates: RomanticInsightCandidate[];
  normalizedActions: RomanticActionCandidate[];
} {
  const insightCandidates: RomanticInsightCandidate[] = [];
  const normalizedActions: RomanticActionCandidate[] = [];

  const seenMeaningIds = new Set<string>();

  // 1. Attraction Candidates -> Owner: c2_attraction
  if (storyPlan.attraction?.aSeeks) {
    const meaningId = "meaning_attraction_a_seeks";
    seenMeaningIds.add(meaningId);
    insightCandidates.push({
      id: "candidate_attr_a",
      topic: "attraction_preference",
      perspective: "self",
      meaningId,
      evidenceIds: storyPlan.attraction.provenance.map((p) => p.evidenceId),
      primarySemanticOwner: "c2_attraction",
      confidence: "high",
      priority: 10,
      currentCopy: storyPlan.attraction.aSeeks.seeksInPartner,
    });
  }

  // 2. Misreading Candidates -> Owner: c6_misreads
  if (storyPlan.misreads && storyPlan.misreads.length > 0) {
    storyPlan.misreads.forEach((m, idx) => {
      const meaningId = `meaning_misread_${m.observeKey}`;
      const isDuplicate = seenMeaningIds.has(meaningId);

      if (!isDuplicate) {
        seenMeaningIds.add(meaningId);
        insightCandidates.push({
          id: `candidate_misread_${idx}`,
          topic: "behavioral_misread",
          perspective: m.observeRole === "a" ? "self" : "partner",
          meaningId,
          evidenceIds: [m.evidenceId],
          primarySemanticOwner: "c6_misreads",
          confidence: "high",
          priority: 20,
          currentCopy: m.reactionScene,
        });
      } else {
        insightCandidates.push({
          id: `candidate_misread_${idx}_suppressed`,
          topic: "behavioral_misread",
          perspective: m.observeRole === "a" ? "self" : "partner",
          meaningId,
          evidenceIds: [m.evidenceId],
          primarySemanticOwner: "c6_misreads",
          confidence: "high",
          priority: 20,
          isSuppressed: true,
          suppressionReason: "SAME_MEANING_DUPLICATE",
        });
      }
    });
  }

  // 3. Conflict Loop Candidate -> Owner: c4_conflict
  if (storyPlan.conflictLoopP0) {
    const meaningId = "meaning_conflict_loop";
    seenMeaningIds.add(meaningId);
    insightCandidates.push({
      id: "candidate_conflict_loop",
      topic: "recurring_loop",
      perspective: "couple",
      meaningId,
      evidenceIds: storyPlan.conflictLoopP0.triggerEvidenceIds,
      primarySemanticOwner: "c4_conflict",
      confidence: storyPlan.conflictLoopP0.confidence,
      priority: 30,
      currentCopy: storyPlan.conflictLoopP0.trigger,
      recommendedActionIds: ["action_sos_pause"],
    });
  }

  // 4. Composite Synthesis Candidates -> Owner: c8_strength_vulnerability / c3_dynamics
  if (storyPlan.synthesisResultsP1) {
    storyPlan.synthesisResultsP1.forEach((syn) => {
      const isDuplicate = seenMeaningIds.has(syn.canonicalMeaningId);

      if (!isDuplicate) {
        seenMeaningIds.add(syn.canonicalMeaningId);
        insightCandidates.push({
          id: `candidate_${syn.id}`,
          topic: syn.topic,
          perspective: syn.perspective,
          meaningId: syn.canonicalMeaningId,
          evidenceIds: syn.evidenceIds,
          reinforcementEvidenceIds: syn.sourceClaimIds,
          primarySemanticOwner: syn.topic.includes("attraction") ? "c8_strength_vulnerability" : "c3_dynamics",
          confidence: syn.confidence,
          priority: 15,
          currentCopy: syn.narrative,
        });
      } else {
        insightCandidates.push({
          id: `candidate_${syn.id}_suppressed`,
          topic: syn.topic,
          perspective: syn.perspective,
          meaningId: syn.canonicalMeaningId,
          evidenceIds: syn.evidenceIds,
          primarySemanticOwner: "c8_strength_vulnerability",
          confidence: syn.confidence,
          priority: 15,
          isSuppressed: true,
          suppressionReason: "SAME_MEANING_DUPLICATE",
        });
      }
    });
  }

  // 5. Action Candidates Normalization & Semantic Ownership
  const p0Actions = storyPlan.actionCandidatesP0 || [];
  p0Actions.forEach((act) => {
    normalizedActions.push({
      ...act,
      confidence: act.confidence || "high",
    });
  });

  return {
    insightCandidates,
    normalizedActions,
  };
}
