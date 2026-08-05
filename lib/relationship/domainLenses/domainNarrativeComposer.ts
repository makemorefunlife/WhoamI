/**
 * Unified Domain 7-Scene Narrative Composer Dispatcher
 *
 * Dispatches deterministic bilingual (KO/EN) 4-beat narrative composition across
 * Friend, Work, Family Parent-Child, and Life Partner domains.
 */

import type { DomainStoryPlan } from "./storyPlannerTypes";
import type { DomainNarrativePlan } from "./narrativeTypes";
import { composeFriendNarrative } from "./friend/friendNarrativeComposer";
import { composeWorkNarrative } from "./work/workNarrativeComposer";
import { composeFamilyNarrative } from "./family/familyNarrativeComposer";
import { composePartnerNarrative } from "./partner/partnerNarrativeComposer";

export function composeDomain7SceneNarrative(params: {
  storyPlan: DomainStoryPlan;
}): DomainNarrativePlan {
  const { storyPlan } = params;

  switch (storyPlan.domain) {
    case "friend":
      return composeFriendNarrative(storyPlan);

    case "work":
      return composeWorkNarrative(storyPlan);

    case "family":
      return composeFamilyNarrative(storyPlan);

    case "partner":
      return composePartnerNarrative(storyPlan);

    default:
      return composePartnerNarrative(storyPlan);
  }
}
