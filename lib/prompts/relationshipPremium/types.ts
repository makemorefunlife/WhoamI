import type { RelationshipKind } from "@/lib/relationship/relationshipKind";

export type PremiumPromptParams = {
  kind: RelationshipKind;
  myPatternsBlock: string;
  partnerPatternsBlock: string;
  nicknameA: string;
  nicknameB: string;
  reportIdA: string;
  reportIdB: string;
  mySaju: string;
  partnerSaju: string;
  myAstrology: string;
  partnerAstrology: string;
};
