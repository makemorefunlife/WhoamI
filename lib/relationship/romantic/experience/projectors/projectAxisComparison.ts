/**
 * Sprint 5 — shared 11-axis comparison projector.
 * Binds to the existing meta.psych_match (already computed server-side for
 * Romantic; same shape Friend/Work/Family/Marriage already read). No new
 * analysis — only viewer-perspective ordering, reusing the same
 * swapPsychAxisForViewer helper RelationshipPsychMatchSection already uses.
 */
import type {
  RomanticPsychMatchResult,
  RomanticSajuDeepReport,
} from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { swapPsychAxisForViewer } from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import type {
  AxisComparisonVM,
  ConfidenceLevel,
  EvidenceRef,
} from "../romanticExperienceTypes";
import { emptyAxisComparison } from "./_empty";

export type ProjectAxisComparisonInput = {
  report: RomanticSajuDeepReport["report"];
  viewerIsReportA: boolean;
};

export function projectAxisComparison(
  input: ProjectAxisComparisonInput,
): AxisComparisonVM {
  const base = emptyAxisComparison();
  const meta = input.report.meta as
    | { psych_match?: RomanticPsychMatchResult | null }
    | undefined;
  const psychMatch = meta?.psych_match;
  if (!psychMatch?.axis_results?.length) return base;

  const axisResults = swapPsychAxisForViewer(
    psychMatch.axis_results,
    input.viewerIsReportA,
  );

  const evidence: EvidenceRef[] = [
    { path: "meta.psych_match.axis_results", summary: "11-axis two-person comparison" },
  ];

  const tensionCount = axisResults.filter((a) => a.match_type === "tension").length;
  let confidence: ConfidenceLevel = "medium";
  if (axisResults.length >= 11) confidence = "high";
  else if (axisResults.length < 6) confidence = "low";

  return {
    available: true,
    confidence,
    evidence,
    axisResults,
    hasTension: tensionCount > 0,
  };
}
