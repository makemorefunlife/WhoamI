/**
 * Unified Domain Lens Resolver
 *
 * Takes normalized Pair CE output, Pair Saju Facts, and Personal CE outputs,
 * and executes domain-specific lens evaluations with complete evidence provenance.
 */

import type { DomainPairLensId } from "@/lib/personCore/pairContextEngine/types";
import type {
  DomainLensEvaluation,
  DomainLensResolverInput,
  PartnerLensId,
  FamilyLensId,
  FriendLensId,
  WorkLensId,
} from "./types";
import { evaluatePartnerLenses } from "./partner/partnerLenses";
import { evaluateFamilyLenses } from "./family/familyLenses";
import { evaluateFriendLenses } from "./friend/friendLenses";
import { evaluateWorkLenses } from "./work/workLenses";

export function resolveDomainLenses(
  input: DomainLensResolverInput,
): DomainLensEvaluation[] {
  const {
    domain,
    facts,
    pairPackets,
    personalCeA,
    personalCeB,
    partyNames,
    domainPsychScores,
  } = input;

  switch (domain) {
    case "partner":
      return evaluatePartnerLenses({
        facts,
        packets: pairPackets,
        personalCeA,
        personalCeB,
        partyNames,
        psychScores: domainPsychScores,
      });

    case "family":
      return evaluateFamilyLenses({
        facts,
        packets: pairPackets,
        personalCeA,
        personalCeB,
        partyNames,
        psychScores: domainPsychScores,
      });

    case "friend":
      return evaluateFriendLenses({
        facts,
        packets: pairPackets,
        personalCeA,
        personalCeB,
        partyNames,
        psychScores: domainPsychScores,
      });

    case "work":
      return evaluateWorkLenses({
        facts,
        packets: pairPackets,
        personalCeA,
        personalCeB,
        partyNames,
        psychScores: domainPsychScores,
      });

    case "romantic":
    default:
      // Romantic is handled by its dedicated Reference Implementation in lib/relationship/romantic
      return [];
  }
}
