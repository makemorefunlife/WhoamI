/**
 * Domain 7-Scene Story Planner Unified Dispatcher
 *
 * Dispatches to domain-specific 7-scene Story Planners (Friend, Work, Family, Partner).
 * Preserves V1 Gold specificity, canonical meaning packets, confidence, directionality,
 * and abstention states without performing analytical recalculation or narrative synthesis.
 */

import type { PairSajuFacts } from "../../personCore/pairSaju/types";
import type { DomainPairLensId } from "../../personCore/pairContextEngine/types";
import type { DomainLensEvaluation } from "./types";
import type { DomainStoryPlan } from "./storyPlannerTypes";
import { buildFriendStoryPlan } from "./friend/friendStoryPlanner";
import { buildWorkStoryPlan } from "./work/workStoryPlanner";
import { buildFamilyStoryPlan } from "./family/familyStoryPlanner";
import { buildPartnerStoryPlan } from "./partner/partnerStoryPlanner";

export function buildDomain7SceneStoryPlan(params: {
  domain: DomainPairLensId | string;
  facts: PairSajuFacts;
  evaluations: DomainLensEvaluation[];
  partyNames?: { a: string; b: string };
  roleLabels?: { a: string; b: string };
}): DomainStoryPlan {
  const { domain, facts, evaluations, partyNames, roleLabels } = params;

  switch (domain) {
    case "friend":
      return buildFriendStoryPlan({ facts, evaluations, partyNames, roleLabels });
    case "work":
      return buildWorkStoryPlan({ facts, evaluations, partyNames, roleLabels });
    case "family":
    case "family_parent":
    case "family_child":
      return buildFamilyStoryPlan({ facts, evaluations, partyNames, roleLabels });
    case "partner":
    case "marriage":
    case "dating":
      return buildPartnerStoryPlan({ facts, evaluations, partyNames, roleLabels });
    default:
      // Fallback: If romantic or unexpected domain is passed, map via partner
      return buildPartnerStoryPlan({ facts, evaluations, partyNames, roleLabels });
  }
}
