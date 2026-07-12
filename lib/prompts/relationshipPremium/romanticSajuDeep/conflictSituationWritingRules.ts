/** 💬 section_3_conversation_patterns — 갈등 상황 대화표 전용 프롬프트 (v1) */

import {
  ESSENCE_JOURNAL_FORBIDDEN_TERMS,
} from "./essenceJournalWritingRules";
import { SPECIAL_BOND_FORBIDDEN_NATURE_METAPHORS } from "./specialBondWritingRules";

export const CONFLICT_SITUATION_FORBIDDEN_CLICHES = [
  "서로 존중",
  "솔직한 대화",
  "깊은 교감",
  "마음을 열고",
  "이해해 주세요",
  "잘못했어요",
  "내 탓이야",
  "네 탓이야",
  "화해하자",
  "그냥 좀 더 강해져야",
] as const;

export const CONFLICT_GENERIC_GOOD_LINES = [
  "지금 기분부터 들어볼게",
  "네 마음 알겠어",
  "같이 해결해 보자",
  "문제를 해결하는 데 집중",
  "차분하게 얘기하자",
] as const;

/** System Prompt에 주입 */
export function buildConflictSituationSystemPromptBlock(): string {
  const nature = SPECIAL_BOND_FORBIDDEN_NATURE_METAPHORS.slice(0, 12)
    .map((p) => `"${p}"`)
    .join(", ");
  const cliches = CONFLICT_SITUATION_FORBIDDEN_CLICHES.map((p) => `"${p}"`)
    .join(", ");
  const genericGood = CONFLICT_GENERIC_GOOD_LINES.map((p) => `"${p}"`)
    .join(", ");

  return `
# section_3_conversation_patterns — 💬 갈등 상황 (최우선 규칙)

## 호칭
- \`label\`·대사 속 이름: User Prompt \`userCustomMyName\` / \`userCustomTargetName\` **1순위**.
- JSON \`speaker\`는 A/B 슬롯. \`label\`은 **실명·별칭** (플레이스홀더 금지).

## 50:50 쌍방 고충 (가해자/피해자 프레이밍 절대 금지)
- 갈등은 **기질적 차이**에서 동시에 생기는 힘듦. 한쪽만 잘못·한쪽만 서운한 **유치한 심리테스트 톤 금지**.
- \`dialogue_table\` **정확히 2행** — ${"`"}A 슬롯 1행 + B 슬롯 1행${"`"} (3행 이상·한 사람만 여러 행 **금지**).

### 빠른 감정 표현 쪽 (입력 데이터에서 해당하는 사람)
- ❌ \`bad_line\`: 직관·빠른 감정 표현 때문에 상대 **침묵·무뚝뚝함**을 방관·무시로 오해 → **공격적·서운한** 말 (상대를 몰아붙이지 말고 **자기 해석**이 드러나게)
- ✅ \`good_line\`: 속도 인정 + 자기 감정 소유 + 상대 생각 듣기 **제안** (모범답안·상담사 톤 금지)

### 신중·무거운 처리 쪽 (입력 데이터에서 해당하는 사람)
- ❌ \`bad_line\`: 강한 감정 에너지에 **과부하(뇌정지)** → 상황을 **이성·통제**로만 맞추려다 상대에게 **서운함·차갑게 느껴지는** 말
- ✅ \`good_line\`: 상대 속상함 **인정** + 무시가 아니라 **정리·호흡**이 필요했다는 설명 + 잠깐 숨 고르자 **제안**

## 출력 구조
- \`conflict_situation.title\`: 한 줄 — 기질 차이 핵심 (예: "표현의 속도차이와 내면의 과부하")
- 각 행: \`speaker\`, \`label\`(이름), \`emoji\`(😤 / 🤔 등), \`bad_line\`, \`good_line\`
- **hidden_psychology·positive_situation·긴 대화 블록 생성 금지** — \`dialogue_table\`만

## 금지
- 명리·사주 용어·한자: ${ESSENCE_JOURNAL_FORBIDDEN_TERMS.slice(0, 12).join(", ")} 등 **0개**
- 자연물 비유: ${nature} 등 **0개**
- 진부 클리셰: ${cliches} 및 유사 변형 **0개**
- 영혼 없는 모범답안: ${genericGood} 식 **뻔한 good_line** — 발견 시 해당 행 **파기 후 재작성**
- 한쪽만 ❌가 공격적이고 다른 쪽 ❌가 온화한 **불균형** — 발견 시 **전면 재작성**
`.trim();
}

/** 100점 Few-Shot — 구조·깊이·톤 (문장 복사 금지) */
export function buildConflictSituationFewShotExample(params: {
  nicknameA: string;
  nicknameB: string;
  myName: string;
  targetName: string;
}): string {
  const { nicknameA, nicknameB, myName, targetName } = params;

  return `
# [최종 통합 출력 예시] section_3_conversation_patterns.conflict_situation

⚠️ **구조·문장 밀도·50:50 밸런스**만 참고. ${nicknameA}·${nicknameB} **실제 입력 데이터**로 새로 작성. 예시 대사 **복사 금지**.
⚠️ 입력 데이터로 **누가 빠른 감정 표현 / 누가 신중·무거운 처리**인지 판별한 뒤, 해당 슬롯에 bad/good를 배치하세요. (아래는 ${myName}=빠른 쪽, ${targetName}=신중 쪽 **예시**)

---
💬 갈등 상황: 표현의 속도차이와 내면의 과부하

\`title\`: "표현의 속도차이와 내면의 과부하"

\`dialogue_table\` (정확히 2행):

| speaker | label | emoji | bad_line | good_line |
|---|---|---|---|---|
| (빠른 감정 표현 슬롯) | **${myName}** | 😤 | "왜 그렇게 남 얘기하듯 무뚝뚝해? 내 감정이 너한테는 아무것도 아니야?" | "내가 지금 감정이 너무 벅차올라서 서운함을 급하게 쏟아냈어. 내 속도를 조금 줄일 테니, ${targetName}의 생각도 듣고 싶어." |
| (신중·무거운 처리 슬롯) | **${targetName}** | 🤔 | "그냥 좀 차분하게 얘기해. 그렇게 감정적으로 소리 지르면 대화가 안 되잖아." | "${myName}가 많이 속상했다는 건 알겠어. 내가 무시하는 게 아니라 잘 정리해서 말하고 싶어서 그래. 잠깐만 숨 고르고 대화하자." |

JSON 예시 골격 (대사는 반드시 입력 데이터 기반으로 새로 작성):

\`\`\`json
"conflict_situation": {
  "title": "표현의 속도차이와 내면의 과부하",
  "dialogue_table": [
    {
      "speaker": "A 또는 B",
      "label": "${myName}",
      "emoji": "😤",
      "bad_line": "(빠른 감정 표현 쪽 — 침묵 오해형 bad)",
      "good_line": "(속도 인정 + 상대 듣기 good)"
    },
    {
      "speaker": "반대 슬롯",
      "label": "${targetName}",
      "emoji": "🤔",
      "bad_line": "(신중 쪽 — 과부하·통제형 bad)",
      "good_line": "(인정 + 정리 필요 설명 good)"
    }
  ]
}
\`\`\`

**반드시 흡수할 핵심**:
1. **2행·2인** — 각자 ❌/✅ 한 쌍. 한 사람만 여러 행 **금지**
2. **50:50** — 양쪽 ❌ 모두 **기질에서 비롯된 필연적 힘듦** (가해/피해 구도 금지)
3. good_line은 **구체적·입 밖에 낼 법한 말** — 상담사 모범답안 금지
4. \`label\`·대사에 **${myName}·${targetName}** 커스텀 이름 1순위
`.trim();
}

export function buildConflictSituationSelfDedupChecklist(
  nicknameA: string,
  nicknameB: string,
): string {
  const generic = CONFLICT_GENERIC_GOOD_LINES.slice(0, 3)
    .map((p) => `"${p}"`)
    .join(", ");
  return `
## 12. section_3 conflict_situation 검열 (필수)
- [ ] \`dialogue_table\`이 **정확히 2행** (${nicknameA}·${nicknameB} 각 1행)인가요?
- [ ] 양쪽 ❌ bad_line이 **각자 기질의 힘듦**을 담고, 한쪽만 공격적·한쪽만 온화하지 **않나요**?
- [ ] good_line이 ${generic} 식 **뻔한 모범답안**이 아닌가요?
- [ ] 빠른 감정 표현 쪽 ❌에 **침묵·무뚝뚝함 오해**가, 신중 쪽 ❌에 **과부하·이성 통제**가 드러나나요?
- [ ] \`label\`에 커스텀 이름이 쓰이고 A/B 플레이스홀더가 없나요?
- [ ] 명리 용어·자연물 비유·가해/피해 프레이밍 **0개**인가요?
- [ ] hidden_psychology·positive_situation 등 **표 외 필드**를 만들지 않았나요?
`.trim();
}
