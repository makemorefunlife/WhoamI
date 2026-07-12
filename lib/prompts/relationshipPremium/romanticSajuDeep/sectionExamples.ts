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
  - **각 셀은 주어(이름) 없이 서술만** — 표 열에 ${nicknameA}·${nicknameB}가 있으므로 "${nicknameA}는~", "${nicknameB}는~" 같은 표현 금지. 상대 지칭은 **"상대에게"**, **"상대를"**
  1. 감정 표현  2. 갈등 반응  3. 애정 언어  4. 스트레스 패턴  5. 의사결정  6. 소통 방식
- \`first_person_voice\`: "사실 나는..."으로 **5~8문장** — 입력 데이터 기반 고유 표현
- \`image_metaphor\`: 이 사람만의 이미지 (일간+오행+십성 조합)
- \`data_combination_note\`: 3단계 중 1~2단계 (신호 나열 + 조합 이미지)
- description / meeting / together_change: 각 **5~8문장**

## section_4_special_bond (⚖️ — specialBond Few-Shot 구조 **필수**)
- \`a_gives_b_headline\` / \`b_gives_a_headline\` / \`only_together_headline\`: 각 방향 **한 줄 훅** (이름 없이)
- \`a_gives_b\`: ${nicknameA}→${nicknameB} 본문 4~5문장 — **새 경험·변화 자극 + 더 나은 결정** 역동 필수
- \`b_gives_a\`: ${nicknameB}→${nicknameA} 본문 4~5문장 — **감정 부담 경감 + 분석적 새 시각** 역동 필수. a_gives_b와 **문장 미러링 금지**
- \`only_together\`: ${nicknameA}↔${nicknameB} — **장단점이 맞물린 상호보완** (a_gives_b/b_gives_a 재탕·요약 금지)
- **금지**: 명리 용어, 자연물 비유(산·불꽃·촛불·물·바위 등), "깊은 교감", "특별한 에너지"
- \`why_special\`: 💡 맞춰 가는 지점 — **갈등·속도 시차·실전 팁만** (칭찬·교감 문단 금지)
- \`relationship_formula\`: 생략 가능(\`""\`). only_together가 충분하면 비워 두기

## section_4_hidden_hearts (🌙 서로의 숨은 마음 — special_bond와 **완전 분리**)
- \`a_hidden\` / \`b_hidden\` **둘 다 필수** — need(후킹 1~2문장) · reason(3문장+) · voice("사실 나는…" 5~8문장)
- **절대 금지**: special_bond 칭찬·보완·시너지 재탕. 무의식·속마음·방어·갈증만.
- \`a_hidden\` (${nicknameA}): 겉쿨/씩씩 vs 내심 ${nicknameB}에게 인정 욕구·말 못 한 정서적 갈증
- \`b_hidden\` (${nicknameB}): 겉든든/무뚝뚝 vs ${nicknameA} 앞 방어·취약 — a_hidden과 **문장 미러링 금지**
- \`mutual_gift\`: **💡 두 사람의 무의식 시너지** — 말하지 않아도 느끼는 긴장감 또는 보이지 않는 안전지대 (4문장+)
- 금지: "깊은 정서적 교감", "솔직한 대화", "서로 존중" 등 진부한 심리테스트 문구
- 한자·사주 용어·끊긴 은유 금지 — **읽으면 바로 이해되는 일상 한국어**

## section_3_conversation_patterns (💬 갈등 상황 — Few-Shot **필수**)
- \`conflict_situation.title\`: 기질 차이 한 줄 (예: "표현의 속도차이와 내면의 과부하")
- \`dialogue_table\`: **정확히 2행** — ${nicknameA}·${nicknameB} **각 1행** (한 사람만 여러 행 금지)
- **50:50 밸런스**: 가해/피해 구도 금지. 양쪽 ❌ 모두 **기질에서 비롯된 필연적 힘듦**
  - 빠른 감정 표현 쪽 ❌: 침묵·무뚝뚝함을 방관·무시로 오해하는 **공격적** 말
  - 신중·무거운 처리 쪽 ❌: 감정 과부하 → **이성 통제**로만 맞추다 상대에게 서운한 말
- ✅ good_line: 상담사 모범답안 금지 — **구체적·입 밖에 낼 법한** 말
- \`label\`·대사: 커스텀 이름 1순위. emoji 😤/🤔 등
- hidden_psychology·positive_situation·3행 이상 **금지**

## section_6_timeline
- **지금·1년·3년·5년·10년** 다섯 구간 모두 필수 — 각 구간에 \`period\`에 연도 명시
- 사주·한자·대운·세운 용어 금지 — 관계 변화만 일상어로

## section_5_action (🌱 Essence 행동 가이드 — Few-Shot 구조 **필수**)
- \`advice_for_a\` / \`advice_for_b\`: **각 3개** — \`EssenceActionGuideline\`
- 필드: \`action_title\`(행동 강령 제목) + \`saju_reason\`(왜·어떻게 **3~4문장**) + \`real_speech_tip\`(실전 대사)
- \`real_life_example\`: **항상 \`""\`** — "이런 순간에 —" 기획 메모식 서술 **절대 금지**
- 6개 팁은 **서로 다른 행동 강령** (제목만 다르고 "감정을 드러내라" 복제 금지)
- A용 예: 정서적 타이밍 존중 / 표현 밀도 조절 / 해결 전 감정 확인
- B용 예: 침묵 깨고 내면 표현 / 해결 전 주파수 맞추기 / 완벽한 말 대신 솔직한 시도
- \`together\`: **💌 에센스 다이어리** 본문 **3~4문장+** ("함께보면 좋아요" 한 줄 금지)
- \`together_starter\`: 대화의 문을 여는 실전 대사
- 명리 용어·자연물 비유(산·불·물 등) **0개**

## section_6_timeline
- **지금·1년·3년·5년·10년** 다섯 구간 — \`in_1_year\` 키 포함, 각 \`period\`에 연도
- 사주·한자·대운·세운 용어 금지 — 관계 변화만 일상어로 (각 2~4문장)
`.trim();
}
