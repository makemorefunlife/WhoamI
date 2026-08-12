import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type { FamilyParentChildReport } from "./familyReportTemplate";
import type {
  FamilyInsightCandidate,
  FamilyActionCandidate,
  FamilyTopic,
  FamilyPerspective,
} from "./familyStoryPlanTypes";

export function buildFamilyInsightCandidates(
  ctx: FamilyRuleContext,
  report: FamilyParentChildReport
): FamilyInsightCandidate[] {
  const candidates: FamilyInsightCandidate[] = [];

  // 1. Deep Read - Parent Advice
  const parentAdvice = report.section_growth_tunnel?.parent_advice ?? "";
  if (parentAdvice) {
    candidates.push({
      id: "insight.deepRead.parent",
      topic: "deepRead",
      perspective: "parent",
      meaningId: "deepRead.parentAdvice",
      evidenceIds: ["growth_tunnel.parent", "pair_ce.growth"],
      confidence: ctx.canonicalPairFacts.elementSupport.aToB ? "high" : "medium",
      priority: 90,
      currentCopy: parentAdvice,
      sourceType: "pair_saju",
      recommendedActionIds: ["action.do.parent"],
    });
  }

  // 2. Deep Read - Child Advice
  const childAdvice = report.section_growth_tunnel?.child_advice ?? "";
  if (childAdvice) {
    candidates.push({
      id: "insight.deepRead.child",
      topic: "deepRead",
      perspective: "child",
      meaningId: "deepRead.childAdvice",
      evidenceIds: ["growth_tunnel.child", "pair_ce.child_autonomy"],
      confidence: ctx.canonicalPairFacts.elementSupport.bToA ? "high" : "medium",
      priority: 85,
      currentCopy: childAdvice,
      sourceType: "pair_saju",
      recommendedActionIds: ["action.do.child"],
    });
  }

  // 3. Deep Read - Shared Action / Perspective
  const sharedAction = report.section_growth_tunnel?.shared_action ?? "";
  if (sharedAction) {
    candidates.push({
      id: "insight.deepRead.shared",
      topic: "deepRead",
      perspective: "shared",
      meaningId: "deepRead.sharedAction",
      evidenceIds: ["growth_tunnel.shared"],
      confidence: "high",
      priority: 95,
      currentCopy: sharedAction,
      sourceType: "pair_saju",
      recommendedActionIds: ["action.routine.shared"],
    });
  }

  // 4. Discipline / De-escalation Trigger Insight
  const triggerPoint = report.section_de_escalation?.trigger_point ?? "";
  if (triggerPoint) {
    candidates.push({
      id: "insight.deEscalation.trigger",
      topic: "discipline",
      perspective: "pair",
      meaningId: "deEscalation.trigger",
      evidenceIds: ["de_escalation.trigger", "canonical.clash"],
      confidence: ctx.canonicalPairFacts.hasWonjinOrGuimun ? "high" : "medium",
      priority: 80,
      currentCopy: triggerPoint,
      sourceType: "family_rule",
      recommendedActionIds: ["action.dont.trigger"],
    });
  }

  // Sort by priority descending
  candidates.sort((a, b) => b.priority - a.priority);

  return candidates;
}

export function buildFamilyActionCandidates(
  ctx: FamilyRuleContext,
  report: FamilyParentChildReport
): FamilyActionCandidate[] {
  const candidates: FamilyActionCandidate[] = [];

  // 1. Do Action
  const doAction = report.section_prescriptions?.do_list?.[0] ?? "";
  if (doAction) {
    candidates.push({
      id: "action.do.parent",
      type: "do",
      perspective: "parent",
      triggerEvidenceIds: ["prescriptions.do", "ten_god.parent"],
      targetTopic: "actions",
      priority: 90,
      copy: doAction,
      meaningId: "action.do.parentAdvice",
    });
  }

  // 2. Don't Action
  const dontAction = report.section_prescriptions?.dont_list?.[0] ?? "";
  if (dontAction) {
    candidates.push({
      id: "action.dont.trigger",
      type: "dont",
      perspective: "parent",
      triggerEvidenceIds: ["prescriptions.dont", "canonical.clash"],
      targetTopic: "actions",
      priority: 85,
      copy: dontAction,
      meaningId: "action.dont.avoidClash",
    });
  }

  // 3. SOS Script Action
  const sosScript = report.section_de_escalation?.parent_script ?? "";
  if (sosScript) {
    candidates.push({
      id: "action.sos.deEscalation",
      type: "sos",
      perspective: "parent",
      triggerEvidenceIds: ["de_escalation.parent_script"],
      targetTopic: "actions",
      priority: 95,
      copy: sosScript,
      meaningId: "action.sos.emergencyScript",
    });
  }

  // 4. Routine Action
  const routine = report.section_destiny?.harmony_one_liner ?? "";
  if (routine) {
    candidates.push({
      id: "action.routine.shared",
      type: "routine",
      perspective: "shared",
      triggerEvidenceIds: ["destiny.harmony_one_liner"],
      targetTopic: "actions",
      priority: 75,
      copy: routine,
      meaningId: "action.routine.maintenance",
    });
  }

  // Sort by priority descending
  candidates.sort((a, b) => b.priority - a.priority);

  return candidates;
}
