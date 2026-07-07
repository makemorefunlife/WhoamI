import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import {
  buildRelationshipBasicPrompt,
  buildRelationshipPremiumExtraBlock,
} from "@/lib/prompts/relationshipAnalysis";
import { buildFamilyInterpretationBlock } from "./family";
import { buildFriendshipInterpretationBlock } from "./friendship";
import { buildRomanticInterpretationBlock } from "./romantic";
import type { PremiumPromptParams } from "./types";
import { buildWorkInterpretationBlock } from "./work";

const KIND_INTERPRETATION: Record<RelationshipKind, () => string> = {
  romantic: buildRomanticInterpretationBlock,
  family: buildFamilyInterpretationBlock,
  work: buildWorkInterpretationBlock,
  friendship: buildFriendshipInterpretationBlock,
};

/** 유형별 심화 프롬프트 — 공통 JSON·분석 로직 + 유형 렌즈 + 사주·점성 */
export function buildRelationshipPremiumPrompt(
  params: PremiumPromptParams,
): string {
  const {
    kind,
    myPatternsBlock,
    partnerPatternsBlock,
    nicknameA,
    nicknameB,
    reportIdA,
    reportIdB,
    mySaju,
    partnerSaju,
    myAstrology,
    partnerAstrology,
  } = params;

  const basePrompt = buildRelationshipBasicPrompt(
    myPatternsBlock,
    partnerPatternsBlock,
    nicknameA,
    nicknameB,
    reportIdA,
    reportIdB,
  );

  const premiumBlob = buildRelationshipPremiumExtraBlock(
    mySaju,
    partnerSaju,
    myAstrology,
    partnerAstrology,
  );

  const kindBlock = KIND_INTERPRETATION[kind]();

  return `${basePrompt}

${premiumBlob}

${kindBlock}

## 심화 규칙 (공통)
- 각 축의 insights 두 줄은 필요하면 각각 2~3문장까지 확장 가능 ("~다" 종결 금지).
- actions 두 줄은 여전히 **당장 할 수 있는 구체 행동**만.
- 사주·출생 맥락은 일상 문장으로만 녹이고, 직접 인용체는 쓰지 않기.
- 위 **관계 맥락**에 맞는 예시·조언만 쓴다. 다른 관계 유형의 클리셰는 넣지 않는다.
`;
}
