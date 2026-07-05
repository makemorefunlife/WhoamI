/** 섹션별 작성 품질 기준 — 형식만 안내 (복사 가능한 예시 문장 없음) */
export function buildSectionQualityExamples(
  nicknameA: string,
  nicknameB: string,
): string {
  return `
# ⚠️ 가장 중요한 규칙: 실제 입력 데이터만 사용

1. **아래 "입력 데이터" 섹션의 실제 사주 계산값만** 근거로 삼으세요.
2. 이 블록은 **형식·깊이·분량**만 안내합니다. 문장·은유·대화를 **절대 복사하지 마세요**.
3. 모든 해석은 **2~3개 이상의 입력 신호 조합**으로만 작성하세요.
4. \`data_combination_note\`: **3단계 중 1~2단계** — 조합한 신호 2~3개 + 이미지 (일상어만)

| ❌ 금지 | ✅ 필수 |
|---|---|
| 품질 예시 문장 복사 | ${nicknameA}·${nicknameB}의 **실제** 오행·일지·십성·지지 관계에서 새로 도출 |
| "열정적이에요" 한 줄 | "[신호A] + [신호B] + [신호C] = [구체적 이미지]" |
| 모든 커플에 같은 대화 | 이 두 사람의 갈등 패턴(입력 데이터)에서만 나올 법한 대화 |

---

# 섹션별 필수 형식 (용량 제한 없음)

## section_2_nature
- \`comparison_table\`: **아래 6개 항목 모두 필수** (각 셀 1~2문장, 빈 칸 없음)
  - **각 셀은 주어(이름) 없이 서술만** — 표 열에 ${nicknameA}·${nicknameB}가 있으므로 "${nicknameA}는~", "${nicknameB}는~" 같은 표현 금지
  1. 감정 표현  2. 갈등 반응  3. 애정 언어  4. 스트레스 패턴  5. 의사결정  6. 소통 방식
- \`first_person_voice\`: "사실 나는..."으로 **5~8문장** — 입력 데이터 기반 고유 표현
- \`image_metaphor\`: 이 사람만의 이미지 (일간+오행+십성 조합)
- \`data_combination_note\`: 3단계 중 1~2단계 (신호 나열 + 조합 이미지)
- description / meeting / together_change: 각 **5~8문장**

## section_4_special_bond
- \`a_gives_b\` / \`b_gives_a\`: 각 **5문장+**, 구체적 장면
- \`relationship_formula\`: "[A이미지] + [B이미지] = [관계 핵심]" 한 줄
- \`only_together\` / \`why_special\`: 궁합 교차 데이터(일간·일지·오행) 근거

## section_4_hidden_hearts
- \`voice\`: "사실 나는..." **5~8문장**, 날것의 고백 — 용신/기신·월지·지장간 조합 반영

## section_3_conversation_patterns
- \`conflict_situation\`: **title + dialogue_table만** (3~5행 bad/good 대비)
- 긴 대화 블록·숨은 심리·key_point·positive_situation **생성하지 마세요** (표만으로 충분)

## section_5_action
- \`advice_for_a\` / \`advice_for_b\`: 각 3개 — \`{ title, detail, phrase_example }\` **phrase_example 필수**
- \`together\` + \`together_starter\` ("📱 이렇게 시작해보세요")

## section_6_timeline
- current / in_3_years / in_5_years / in_10_years / turning_point: 각 **4~6문장**
`.trim();
}
