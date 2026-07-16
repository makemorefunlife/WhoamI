/** 🌱 section_5_action — Essence 행동 가이드 전용 프롬프트 (v1) */

export const ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES = [
  "이런 순간에",
  "이런 상황에서",
  "이때",
  "적용할 수 있는 구체적 상황",
  "상황 예시",
] as const;

export const ESSENCE_ACTION_FORBIDDEN_NATURE_METAPHORS = [
  "산",
  "대지",
  "불꽃",
  "불",
  "촛불",
  "등불",
  "물",
  "바위",
  "바다",
  "숲",
  "나무",
  "바람",
  "태양",
  "달",
  "별",
  "강",
  "흙",
  "씨앗",
  "뿌리",
  "꽃",
  "퍼즐 조각",
] as const;

export const ESSENCE_ACTION_FORBIDDEN_CLICHES = [
  "감정을 드러내라",
  "감정을 드러내",
  "서로를 이해",
  "깊은 교감",
  "특별한 에너지",
  "작은 신호부터",
  "20분 쉬어가",
  "함께보면 좋아요",
] as const;

/** Injected into system prompt — section_5_action rules */
export function buildEssenceActionSystemPromptBlock(): string {
  const planning = ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES.map((p) => `"${p}"`)
    .join(", ");
  const nature = ESSENCE_ACTION_FORBIDDEN_NATURE_METAPHORS.slice(0, 14)
    .map((p) => `"${p}"`)
    .join(", ");
  const cliches = ESSENCE_ACTION_FORBIDDEN_CLICHES.map((p) => `"${p}"`).join(
    ", ",
  );

  return `
# section_5_action — Helpful actions for each other (highest priority)

## Names (hard preference)
- All names in body/dialogue/titles: \`userCustomMyName\` / \`userCustomTargetName\` from User Prompt first.
- If nicknames exist, keep the same forms everywhere.
- JSON slot A/B names belong in \`target_user\` only — no placeholders in prose.

## No planning-memo narration
- Ban planning/analysis scaffolding such as ${planning}.
- \`real_life_example\` must always be \`""\` — fold situations into \`saju_reason\` only.
- Zero memo-style prefixes ("in situations where…", "— when ~").

## Psychological journal (block Mingli / nature metaphors)
- Internally: ground prescriptions in Saju, astrology, survey.
- **User-facing body**: zero Mingli terms / Hanja. Zero nature/element metaphors such as ${nature}.
- Use modern psychological wording + concrete action mandates + speakable lines only.

## Tip fragmentation (anti copy-paste)
- \`advice_for_a\` ×3 and \`advice_for_b\` ×3 — discard title-only mirrors with same body.
- Do not repeat the same "express your feelings" line across tips (${cliches} and variants = 0).
- Each tip needs a distinct action mandate. Example axes:
  - For A: respect partner's emotional timing / regulate expression density / check feelings before solving
  - For B: break silence and name the inner state / sync empathy before solving / try honesty over perfect words

## Output structure (required)
Per person, 3 tips — each item:
- \`action_title\`: hooky one-line mandate
- \`saju_reason\`: why/how — **3–4 sentences** (situations only here; no planning-memo tone)
- \`real_speech_tip\`: 1–2 speakable lines (no wrapping quotes)
- \`real_life_example\`: must be \`""\`

Shared bottom section:
- \`together\`: Essence diary body — **3–4+ sentences**, concrete (e.g. archive ritual, weekend talk prompt)
- \`together_starter\`: 1–2 speakable lines that open the conversation
`.trim();
}

/** 100점 Few-Shot — 구조·톤·길이 뼈대 (문장 복사 금지) */
export function buildEssenceActionFewShotExample(params: {
  nicknameA: string;
  nicknameB: string;
  myName: string;
  targetName: string;
}): string {
  const { nicknameA, nicknameB, myName, targetName } = params;

  return `
# [최종 통합 출력 예시] section_5_action

⚠️ 아래는 **구조·문장 밀도·톤·길이**만 참고. ${nicknameA}·${nicknameB} 실제 입력 데이터로 **새로** 작성. 예시 문장·형용사 **복사 금지**.
⚠️ \`real_life_example\`은 모든 항목 **\`""\`**. "이런 순간에 —" **절대 금지**.

---
🌱 서로에게 도움이 되는 행동들

✨ ${myName}님을 위한 에센스 가이드
(JSON: \`advice_for_a\` if viewer=A, else mapping per 슬롯 — 각 항목 \`target_user\`는 조언 **받는 사람** = ${nicknameA})

- 01. ${targetName}님의 정서적 타이밍 존중하기:
  \`action_title\`: "${targetName}님의 정서적 타이밍 존중하기"
  \`saju_reason\`: "${myName}님은 감정의 온도가 빠르게 올라가고 표현이 직관적인 만큼, 대화할 때 ${targetName}님의 호흡을 기다려주는 지혜가 필요합니다. ${myName}님이 먼저 한 걸음 물러나 안정감을 보여줄 때, ${targetName}님은 비로소 안전하다고 느끼며 숨겨둔 속마음을 더 잘 꺼내놓게 됩니다."
  \`real_speech_tip\`: "${targetName}, 네가 이 상황을 어떻게 느끼고 정리하고 있는지 내심 궁금해. 천천히 얘기해 줘."
  \`real_life_example\`: ""

- 02. 표현의 밀도 조절하기:
  \`action_title\`: "표현의 밀도 조절하기"
  \`saju_reason\`: "(감정이 올라올 때 말의 양·속도를 조절해 상대가 방어하지 않게 하는 구체 행동 — 3~4문장, 01번과 **다른 강령**)"
  \`real_speech_tip\`: "(01번과 다른 실전 대사)"
  \`real_life_example\`: ""

- 03. (세 번째 **고유** 행동 강령 — 01·02와 주제·문장 골격 중복 금지)
  \`real_life_example\`: ""

✨ ${targetName}님을 위한 에센스 가이드
(JSON: \`advice_for_b\` — \`target_user\` = ${nicknameB})

- 01. 침묵을 깨고 내면의 지도 보여주기:
  \`action_title\`: "침묵을 깨고 내면의 지도 보여주기"
  \`saju_reason\`: "${targetName}님은 갈등 상황에서 ${myName}님의 강한 감정 에너지에 조심스럽게 대처하느라, 혹은 상황을 완벽히 정리하느라 내심 자신의 감정을 억누르는 경향이 있습니다. 하지만 침묵이 길어지면 ${myName}님은 거절당했다고 느끼므로 미완성된 생각이라도 꺼내어 보여주는 것이 중요합니다."
  \`real_speech_tip\`: "사실 나도 지금 이 상황이 당황스럽고 속상한 감정이 들어. 잘 얘기하고 싶어서 멈춰 있는 거야."
  \`real_life_example\`: ""

- 02. '해결'하기 전에 '주파수' 맞춰주기:
  \`action_title\`: "'해결'하기 전에 '주파수' 맞춰주기"
  \`saju_reason\`: "(논리적 해결보다 감정 공감·리듬 맞추기 — 3~4문장, 01번과 **다른 강령**)"
  \`real_speech_tip\`: "(01번과 다른 실전 대사)"
  \`real_life_example\`: ""

- 03. (세 번째 **고유** 행동 강령)
  \`real_life_example\`: ""

💌 에센스 다이어리 : 우리만의 관계 아카이브
\`together\`: "두 사람의 다름은 틀린 것이 아니라 서로를 채워주는 가장 아름다운 조각입니다. 서로의 감정을 억누르거나 방어벽 뒤로 숨기지 않고, 있는 그대로 흐를 수 있는 안전한 대화의 공간을 집 안에 만들어보세요. 이번 주말에는 따뜻한 차 한 잔을 사이에 두고 깊이 있는 저널을 써보듯 대화를 시작해 보세요."
\`together_starter\`: "우리 요즘 서로 마음의 온도가 어땠는지, 한 주 동안 고생한 서로의 속마음에 대해 편안하게 얘기해 볼까?"

---

위 예시에서 **반드시 흡수할 핵심**:
1. 호칭: ${myName} / ${targetName} 커스텀 이름 1순위
2. "이런 순간에 —" **0개**, \`real_life_example\` **전부 빈 문자열**
3. A·B 각 3팁 — **제목·본문·대사 모두 서로 다름** (감정 드러내라 복제 금지)
4. \`together\` = 에센스 다이어리 **3문장+**, \`together_starter\` = 대화 문 여는 대사
`.trim();
}

export function buildEssenceActionSelfDedupChecklist(
  nicknameA: string,
  nicknameB: string,
): string {
  const planning = ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES[0];
  return `
## 11. section_5_action 검열 (필수)
- [ ] advice_for_a / advice_for_b **각 3개** — action_title·saju_reason(3문장+)·real_speech_tip 필수?
- [ ] 모든 \`real_life_example\`이 **\`""\`** 인가요?
- [ ] "${planning}" 등 기획 메모식 문구가 **0개**인가요?
- [ ] 6개 팁이 **서로 다른 행동 강령**인가요? ("감정을 드러내라" 복제 없음)
- [ ] ${nicknameA}용·${nicknameB}용 팁이 **주어만 바꾼 미러링**이 아닌가요?
- [ ] \`together\`가 **3문장+** 에센스 다이어리 톤인가요? ("함께보면 좋아요" 한 줄 금지)
- [ ] \`together_starter\`가 실전 대화 시작 대사인가요?
- [ ] 명리 용어·자연물 비유(산·불·물 등) **0개**인가요?
`.trim();
}
