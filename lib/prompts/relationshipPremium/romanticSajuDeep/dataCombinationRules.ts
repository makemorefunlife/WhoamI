/** 데이터 조합 강제 규칙 — 모든 해석에 3단계 적용 */
export const DATA_COMBINATION_FORCE_RULES = `
# Data-combination hard rules (must follow)

Every interpretation must use this **3-step** path:

1. **Confirm data**: "Input data shows these signals" (2+ signals)
2. **Combine + image**: "this signal + that signal = this image/feel"
3. **Relational reading**: "so in this relationship, this shows up as…"

| Step | Where | Rule |
|---|---|---|
| 1–2 | \`data_combination_note\`, \`image_metaphor\` | everyday language/imagery only (no technical terms / Hanja) |
| 3 | description, a_gives_b, conflict, advice, etc. | empathy, scenes, behavior |

❌ Ban: "so they're sensitive" (conclusion without combination)
❌ Ban: single-signal causality ("because day-master X…")
✅ Required method example (**do not copy sentences**):
   [internal] delicate spark + deep feeling + surprise-change signal
   → [image] candlelight reflected on water, flickered by wind
   → [relation] mood swings / sensitivity; small shifts move them a lot

Self-check the 3 steps for each person's nature block, conflict, and advice.
`.trim();

/** PDF 스타일 → 일상어 변환 참고 (톤·깊이만 참고, 문장 복사 금지) */
export function buildPdfStyleReferenceGuide(
  nicknameA: string,
  nicknameB: string,
): string {
  return `
# 섹션별 PDF 스타일 참고 (변환 톤만 — 절대 복사 금지)

아래는 **전문 분석 → 따뜻한 관계 언어**로 바꾸는 *방식*만 보여줍니다.
반드시 ${nicknameA}·${nicknameB}의 **실제 입력 데이터**로 새로 작성하세요.

---

## section_4_special_bond (이 관계가 특별한 이유)

| 내부 신호 | JSON 출력 |
|---|---|
| A 기질 → B 내면 | \`a_gives_b_headline\` + \`a_gives_b\` — 새 경험·변화·더 나은 결정 |
| B 기질 → A 내면 | \`b_gives_a_headline\` + \`b_gives_a\` — 감정 부담 경감·분석적 새 시각 |
| 둘의 결합 | \`only_together_headline\` + \`only_together\` — 상호보완·Essence 아우라 |

- 본문: **현대 심리학 언어**만. 명리 용어·자연물 비유(산·불꽃·촛불·물·바위 등) **0개**.
- User Prompt의 **Few-Shot 구조·문장 밀도**를 뼈대로 삼되, ${nicknameA}·${nicknameB} 데이터로 **새로 작성**.

---

## section_3_conversation_patterns (갈등 상황)

| 규칙 | 내용 |
|---|---|
| 구조 | \`title\` + \`dialogue_table\` **2행만** (A·B 각 1행) |
| 밸런스 | 50:50 쌍방 고충 — 가해/피해 프레이밍 금지 |
| 빠른 감정 쪽 ❌ | 침묵·무뚝뚝함 → 방관·무시 오해 |
| 신중 쪽 ❌ | 과부하 → 이성 통제로 상대 서운함 |
| 금지 | hidden_psychology·positive_situation·모범답안 good_line |

User Prompt **Few-Shot 구조**를 뼈대로, ${nicknameA}·${nicknameB} 데이터로 **새로 작성**.

---

## section_5_action (조언)

| PDF/내부 톤 (참고) | 이렇게 변환해서 작성 |
|---|---|
| "감정 기복을 '변덕'이 아닌 '다양한 색깔'로 본다" | "상대의 예민함을 '변덕'이 아닌 '다양한 감정의 표현'으로 받아들이는 연습을 해보세요" |
| 긍정 프레이밍 + 구체 행동 | \`EssenceActionGuideline\` — action_title + saju_reason(3~4문장) + real_speech_tip. \`real_life_example\`는 \`""\` |
| 각자 3개 | 용신/기신·갈등 패턴·십성에서 도출한 **맞춤** 조언만 |

\`promise\`: 따뜻한 격려 한 문장 — 두 사람 이름 포함.
`.trim();
}
