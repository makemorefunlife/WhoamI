/**
 * Domain Lens Resolution Dispatcher
 *
 * Dispatches domain-specific 34-lens evaluations across Partner, Family, Friend, and Cowork.
 * Strictly consumes from canonical SSOT PairSajuFacts, Pair Context Engine Packets, and Personal CE.
 */

import type {
  DomainPairLensId,
  PairContextPacket,
} from "../../personCore/pairContextEngine/types";
import type { PairSajuFacts } from "../../personCore/pairSaju/types";
import type { PersonalContextEngineOutput } from "../../personCore/personalContextEngine/types";
import type { DomainLensEvaluation } from "./types";

import { evaluatePartnerLenses } from "./partner/partnerLenses";
import { evaluateFamilyLenses } from "./family/familyLenses";
import { evaluateFriendLenses } from "./friend/friendLenses";
import { evaluateWorkLenses } from "./work/workLenses";

export function resolveDomainLenses(params: {
  domain: DomainPairLensId;
  facts: PairSajuFacts;
  packets: PairContextPacket[];
  personalCeA?: PersonalContextEngineOutput | null;
  personalCeB?: PersonalContextEngineOutput | null;
  partyNames?: { a: string; b: string };
  roleLabels?: { a: string; b: string };
}): DomainLensEvaluation[] {
  const { domain, facts, packets, personalCeA, personalCeB, partyNames, roleLabels } = params;
  const ceA = personalCeA ?? undefined;
  const ceB = personalCeB ?? undefined;

  switch (domain) {
    case "partner":
      return evaluatePartnerLenses({
        facts,
        packets,
        personalCeA: ceA,
        personalCeB: ceB,
        partyNames,
      });

    case "family":
      return evaluateFamilyLenses({
        facts,
        packets,
        personalCeA: ceA,
        personalCeB: ceB,
        partyNames,
      });

    case "friend":
      return evaluateFriendLenses({
        facts,
        packets,
        personalCeA: ceA,
        personalCeB: ceB,
        partyNames,
      });

    case "work":
      return evaluateWorkLenses({
        facts,
        packets,
        personalCeA: ceA,
        personalCeB: ceB,
        partyNames,
      });

    default:
      // Fallback for romantic domain or unhandled domains: return partner lens evaluation
      return evaluatePartnerLenses({
        facts,
        packets,
        personalCeA: ceA,
        personalCeB: ceB,
        partyNames,
      });
  }
}
