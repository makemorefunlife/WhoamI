/**
 * M10 Next Step projector.
 * Minimal deterministic action: pick one concrete 24h step from M9 Do/Don't.
 * If deterministic guidance is unavailable, omit safely.
 */
import type { NextStepVM } from "../romanticExperienceTypes";
import { emptyNextStep } from "./_empty";
import type { DoDontVM } from "../romanticExperienceTypes";

export type ProjectNextStepInput = {
  doDont: DoDontVM;
};

export function projectNextStep(input: ProjectNextStepInput): NextStepVM {
  const base = emptyNextStep();
  const doDont = input.doDont;
  const firstItem = doDont.pack?.items?.[0];
  const firstAction = firstItem?.do_list?.[0]?.trim();
  if (!firstAction) return base;

  return {
    ...base,
    title: "Next Step",
    available: true,
    confidence: doDont.confidence,
    evidence: doDont.evidence,
    defaultTab: "viewer",
    viewerExperiments: [{ kind: "24h", text: firstAction }],
    partnerExperiments: [],
    together: null,
    togetherStarter: null,
  };
}
