import { ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA } from "./outputSchema";
import {
  DATA_COMBINATION_FORCE_RULES,
  buildPdfStyleReferenceGuide,
} from "./dataCombinationRules";
import { buildSectionQualityExamples } from "./sectionExamples";
import {
  buildEssenceJournalNameMappingBlock,
  buildEssenceJournalToneRules,
  buildHiddenHeartsRoleGuide,
  buildSectionRoleSeparationGuide,
} from "./essenceJournalWritingRules";
import {
  buildEssenceActionFewShotExample,
} from "./essenceActionWritingRules";
import {
  buildConflictSituationFewShotExample,
} from "./conflictSituationWritingRules";
import {
  buildSpecialBondFewShotExample,
} from "./specialBondWritingRules";
import type { RomanticSajuDeepLocale } from "./system";

const DATA_COMBINATION_RULES = `
# ⚠️ 가장 중요한 규칙: 데이터 조합 해석

**절대 단일 데이터로 해석하지 마세요.** 내부 추론 시 2~3개 신호를 반드시 조합하세요.
본문(JSON)에는 사주 전문 용어·한자를 쓰지 말고, 조합 결과만 일상어·이미지로 쓰세요.

| ❌ 이렇게 하지 마세요 | ✅ 이렇게 하세요 |
|---|---|
| "섬세해요" (일간 하나만) | "섬세한 불꽃 + 깊은 감정 + 예민한 리듬 = 물결에 비친 촛불" (3개 조합) |
| "현실적이에요" (오행 하나만) | "든든한 산 + 결단력 + 느린 호흡 = 흔들리지 않는 버팀목" (2개 조합) |
| "갈등이 있어요" (지지 하나만) | "예민한 감정 + 해결 욕구 + 속도 차이 = 위로 vs 해결책 충돌 패턴" (3개 조합) |

**예시 복사 금지**: 위 표는 조합 *방식*만 보여줍니다. 문장·은유·대화는 반드시 아래 "입력 데이터"에서 새로 작성하세요.
`.trim();

const RELATIONSHIP_INTERPRETATION_GUIDE = `
# 관계 분석용 데이터 해석 가이드

(본문 출력 시 전문 용어·한자 금지 — 아래 일상어 해석만 활용)

## 합(合) - 서로를 끌어당기는 힘
| 합의 종류 | 관계에서의 해석 |
|---|---|
| 일간 천간합 | 첫 만남부터 강렬한 끌림. 서로의 존재 자체가 편안해요. |
| 일지 육합 | 현실 생활에서 잘 보완. 함께 살아갈 때 큰 마찰이 적어요. |
| 월지 육합 | 말하지 않아도 흐름이 맞는 편안한 정서적 연결. |

## 충(沖) - 서로를 자극하는 힘
| 충의 종류 | 관계에서의 해석 |
|---|---|
| 일간 충 | 좋은 자극제. 부딪히지만 성장해요. |
| 일지 충 | 생활·재정·패턴에서 의견 차이 가능. |
| 월지 충 | 가까울수록 예민해질 수 있어요. |

## 원진(怨嗔) - 겉과 속이 다른 힘
| 원진의 종류 | 관계에서의 해석 |
|---|---|
| 일지 원진 | 겉은 멀쩡해도 속으로 서운함이 쌓일 수 있어요. |
| 연지 원진 | 근본 가치관의 미묘한 차이. |

## 형(刑) / 해(害)
- 형: 사소한 습관·말투 마찰
- 해: 주변 오해·간섭 — 둘만의 중심 유지가 중요
`.trim();

const ANALYSIS_LAYERS_GUIDE = `
# 분석 가이드 (10개 Layer)

## Layer 1: 개인 기반
일간+오행+십성+신강/신약 조합 → 인격 이미지·감정 표현·갈등 반응

## Layer 2: 오행·에너지 관계
두 사람 오행 상생/상극·합산 강약 → 함께 있을 때 시너지·보완

## Layer 2-2: 용신/기신
| 구분 | 해석 |
|---|---|
| 내 필요 기운 = 상대 강한 오행 | "이 사람은 나에게 꼭 필요한 사람" |
| 내 과부하 기운 = 상대 강한 오행 | "함께 있으면 에너지가 빠질 수 있음" |

## Layer 3-1~3-4: 일간·일지·월지·지장간
교차 지지 관계 + 각자 배우자궁·월지·지장간 조합

## Layer 4: 지지 갈등 (6단계 변환)
데이터 확인 → 삶의 영역 → 심리 현상 → 관계 발현 → 해결 방향

## Layer 5~8: 관계 유형화 · 심리 · 대화 · 시간 흐름

각 Layer는 **조합 해석**으로만 쓰고, 본문에 Layer 번호를 표시하지 마세요.
`.trim();

const UX_SECTION_GUIDE = `
# 출력 스토리 순서 (JSON 키)

1. section_1_summary 💞 — **서버가 자동 생성** (LLM 생성 금지)
2. section_2_nature 🔍
3. section_4_special_bond ⚖️
4. section_4_hidden_hearts 🌙
5. section_3_conversation_patterns 💬 — conflict **dialogue_table 2행만** (A·B 각 1행, 50:50 쌍방 고충)
6. section_5_action 🌱 — EssenceActionGuideline (action_title + saju_reason 3문장+ + real_speech_tip). real_life_example는 항상 ""
7. section_6_timeline ⏰
`.trim();

const buildFinalOutputRules = (nicknameA: string, nicknameB: string) => `
# 최종 지침
1. **입력 데이터 필수 사용** — 위 "입력 데이터"의 실제 계산값을 근거로만 작성. 품질 예시·정답 예시 복사 금지.
2. 전문 용어 금지 — 본문(JSON 값)에 사주 용어·한자 없음
3. **데이터 조합 필수** — 3단계(데이터 확인 → 조합·이미지 → 관계적 해석) 적용. data_combination_note에 1~2단계 명시.
4. **용량 제한 없음** — 요약·압축 금지. 각 필드 5~8문장+
5. 1인칭 대화체 — "사실 나는..." 날것의 표현
6. 대화 — conflict는 **dialogue_table만** (bad_example·hidden_psychology·positive_situation 금지)
7. "~것 같아요" 금지 → "~해요", "~거예요"
8. A와 B 균형
9. Output Schema 모든 필드 빈 칸 없이
10. **comparison_table**: 감정 표현·갈등 반응·애정 언어·스트레스 패턴·의사결정·소통 방식 **6행 필수**
    - \`a\` 열 = **${nicknameA}** 성향만, \`b\` 열 = **${nicknameB}** 성향만 (서로 바꿔 쓰지 마세요)
    - 각 셀은 **이름·주어 없이** 서술 (표 헤더에 이름 있음). "OO는~", "OO을~" 금지
    - 상대를 가리킬 때는 이름 대신 **"상대에게"**, **"상대를"** (둘만 보는 리포트 톤)
    - 예: "상대에게 고마움을 자주 표현해요." / "사랑을 행동으로 보여 주려 해요."
11. **section_5**: advice_for_a·b **각 3개** — action_title + saju_reason(3문장+) + real_speech_tip 필수. real_life_example는 **""**. together=💌 에센스 다이어리(3문장+), together_starter=대화 시작 대사. "이런 순간에"·자연물 비유·감정드러내라 복제 금지
12. **section_3 conflict**: dialogue_table **정확히 2행** — 빠른 감정 표현 쪽·신중 쪽 각 ❌/✅. 50:50 밸런스·모범답안 금지. hidden_psychology 금지
13. **section_4_special_bond**: \`a_gives_b_headline\`+\`a_gives_b\`, \`b_gives_a_headline\`+\`b_gives_a\`, \`only_together_headline\`+\`only_together\` 필수. Few-Shot 구조 준수. 자연물 비유·명리 용어 금지
14. **section_4_hidden_hearts**: a_hidden·b_hidden 둘 다 필수. special_bond와 **완전 분리**
15. **section_1_summary**: LLM이 만들지 마세요 (Headline Selector가 사주 rule 결과로 채움)
16. **중복 검열**: 주어만 바꾼 미러링·금지 미사여구·사주 전문 용어·bond 자연물 비유 발견 시 해당 필드 **전면 재작성**
`.trim();

export function buildRomanticSajuDeepUserPrompt(params: {
  nicknameA: string;
  nicknameB: string;
  personBlockA: string;
  personBlockB: string;
  pairBlock: string;
  userCustomMyName?: string;
  userCustomTargetName?: string;
  locale?: RomanticSajuDeepLocale;
}): string {
  const {
    nicknameA,
    nicknameB,
    personBlockA,
    personBlockB,
    pairBlock,
    userCustomMyName,
    userCustomTargetName,
    locale: _locale = "ko",
  } = params;
  void _locale;

  const myName = userCustomMyName?.trim() || nicknameA;
  const targetName = userCustomTargetName?.trim() || nicknameB;

  const qualityExamples = buildSectionQualityExamples(nicknameA, nicknameB);
  const pdfStyleGuide = buildPdfStyleReferenceGuide(nicknameA, nicknameB);
  const conversationActionGuide = buildConversationAndActionWritingGuide(
    nicknameA,
    nicknameB,
  );
  const nameMapping = buildEssenceJournalNameMappingBlock({
    nicknameA,
    nicknameB,
    userCustomMyName: myName,
    userCustomTargetName: targetName,
  });
  const essenceTone = buildEssenceJournalToneRules();
  const sectionRoles = buildSectionRoleSeparationGuide(nicknameA, nicknameB);
  const hiddenHeartsGuide = buildHiddenHeartsRoleGuide(nicknameA, nicknameB);
  const specialBondFewShot = buildSpecialBondFewShotExample(
    nicknameA,
    nicknameB,
  );
  const essenceActionFewShot = buildEssenceActionFewShotExample({
    nicknameA,
    nicknameB,
    myName,
    targetName,
  });
  const conflictFewShot = buildConflictSituationFewShotExample({
    nicknameA,
    nicknameB,
    myName,
    targetName,
  });

  return `
# 분석 대상
- A (JSON 슬롯): ${nicknameA}
- B (JSON 슬롯): ${nicknameB}
- 나(커스텀 1순위): ${myName}
- 상대(커스텀 1순위): ${targetName}
- 관계 유형: 연인

---

${nameMapping}

---

${essenceTone}

---

${sectionRoles}

---

${hiddenHeartsGuide}

---

${specialBondFewShot}

---

${essenceActionFewShot}

---

${conflictFewShot}

---

# 입력 데이터 (실제 사주 계산값 — 반드시 이 데이터로만 분석)

## A (${nicknameA})
${personBlockA}

## B (${nicknameB})
${personBlockB}

---

${pairBlock}

---

${DATA_COMBINATION_FORCE_RULES}

---

${DATA_COMBINATION_RULES}

---

${qualityExamples}

---

${pdfStyleGuide}

---

${RELATIONSHIP_INTERPRETATION_GUIDE}

---

${ANALYSIS_LAYERS_GUIDE}

---

${UX_SECTION_GUIDE}

---

# Output Schema
A = **${nicknameA}**, B = **${nicknameB}**. 모든 닉네임·대사에 실제 이름 사용.

${ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA}

---

${buildFinalOutputRules(nicknameA, nicknameB)}

JSON만 출력하세요.
`.trim();
}
