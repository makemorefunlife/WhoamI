/** Essence 저널 톤 — 중복 차단·용어 일상화·섹션 역할 분리 */

export const ESSENCE_JOURNAL_FORBIDDEN_PHRASES = [
  "깊은 교감",
  "깊은 신뢰",
  "특별한 에너지",
  "특별한 인연",
  "운명적인",
  "완벽한 조합",
  "서로를 이해하는",
  "마음이 통하는",
  "영혼의 동반자",
  "환상의 커플",
  "천생연분",
  "소울메이트",
  "서로를 채워",
  "서로를 보완",
  "균형 잡힌 관계",
  "조화로운 관계",
  "아름다운 관계",
  "건강한 관계",
] as const;

export const ESSENCE_JOURNAL_FORBIDDEN_TERMS = [
  "오행",
  "일간",
  "일지",
  "월지",
  "십신",
  "십성",
  "용신",
  "기신",
  "정화",
  "무토",
  "화생토",
  "원국",
  "격국",
  "대운",
  "세운",
  "지장간",
  "천간",
  "지지",
  "충",
  "합",
  "원진",
  "형",
  "해",
  "식신",
  "편인",
  "비견",
  "겁재",
  "상관",
  "정인",
  "편재",
  "정재",
  "편관",
  "정관",
] as const;

export function buildEssenceJournalNameMappingBlock(params: {
  nicknameA: string;
  nicknameB: string;
  userCustomMyName?: string;
  userCustomTargetName?: string;
}): string {
  const {
    nicknameA,
    nicknameB,
    userCustomMyName = nicknameA,
    userCustomTargetName = nicknameB,
  } = params;

  return `
# 이름 반영 우선순위 (필수)

| 역할 | 1순위 (커스텀) | JSON 슬롯 |
|---|---|---|
| 나(리포트 주인) | **${userCustomMyName}** | 슬롯 A면 \`a_*\` / 슬롯 B면 \`b_*\` |
| 상대 | **${userCustomTargetName}** | 반대 슬롯 |

- 본문·대사·조언의 **주어·호칭**은 커스텀 이름을 **1순위**로 씁니다.
  - 내 이름: **${userCustomMyName}** → 없으면 슬롯 기본명 → "나"
  - 상대 이름: **${userCustomTargetName}** → 없으면 슬롯 기본명 → "상대"
- Write display names **exactly** as given (no added 님/씨 unless already in the string).
- **Ban**: \`나님\`, \`저님\`, doubled honorifics (e.g. name already ending in 님 + another 님).
- Never refer to yourself with your own display name + honorific inside 1st-person fields.
- 유저가 별칭·애칭(예: 창창이, 우리 여보)으로 수정했다면, 문맥 **전체 호칭을 동일하게** 유지하세요.
- JSON 키는 A/B 슬롯: \`a_hidden\` = **${nicknameA}**, \`b_hidden\` = **${nicknameB}**.
- "A", "B", "첫 번째 사람", "두 번째 사람", "상대방" 같은 플레이스홀더 **금지**.

## 1인칭 화자 바인딩 (필수)
- \`a_hidden.*\` / \`a_nature.first_person_voice\` / other \`a_*\` 1st-person: **"나" = ${nicknameA}** only; partner references = **${nicknameB}** only (never ${nicknameA} as the partner).
- \`b_hidden.*\` / \`b_nature.first_person_voice\` / other \`b_*\` 1st-person: **"나" = ${nicknameB}** only; partner references = **${nicknameA}** only (never ${nicknameB} as the partner).
`.trim();
}

export function buildEssenceJournalToneRules(): string {
  const forbidden = ESSENCE_JOURNAL_FORBIDDEN_PHRASES.map((p) => `"${p}"`).join(
    ", ",
  );
  const terms = ESSENCE_JOURNAL_FORBIDDEN_TERMS.slice(0, 20).join(", ");

  return `
# Essence 저널 톤 (클래식·예리·중복 금지)

## 표현의 일상화 (명리/사주 용어 절대 노출 금지)
- 내부 추론: 입력 사주·점성·설문 데이터를 정밀하게 조합하세요.
- **최종 JSON 본문**: ${terms} 등 명리·사주·점성 **전문 용어·한자 0개**.
- 치환 예: "정화 기질" → "따뜻하고 직관적인 기질", "무토 성향" → "견고하고 흔들림 없는 성향". (special_bond는 자연물 비유도 금지 — 심리 언어만)

## 금지 미사여구 (인터넷 심리테스트식)
다음 표현 및 유사 변형 **절대 금지**: ${forbidden}.
- 대신 **이 커플만의** 구체적 장면·습관·말버릇·갈등 순간으로 대체하세요.

## 중복 표현 원천 차단 (자기 검열)
- 하위 섹션 간 **문장 구조·핵심 형용사·동사**가 50% 이상 겹치면 해당 필드를 **파기하고** 완전히 새 어휘로 재작성.
- Dedup is also **claim-level**: do not restate the same "mutual comfort / stability / emotional support" thesis across special_bond, frames, mutual_gift, and nature — each section must carry a **new function**.
- 주어만 바꾼 복사 붙여넣기(미러링) **즉시 폐기**.
- 같은 형용사(예: "따뜻한", "섬세한", "든든한")를 3개 이상 필드에서 반복하지 마세요.
`.trim();
}

/**
 * anchorIsA — Part3② 스펙(관성/인성=보호자 vs 식상/비겁=동반자)에 따라 누가
 * "안식처" 역, 누가 "온기" 역인지 신호로 정해서 넘긴다. JSON 필드 매핑
 * (a_gives_b="A가 주는 것", b_gives_a="B가 주는 것")은 그대로 두고, 그 필드에
 * 들어갈 "역할 내용"만 anchorIsA에 따라 바꾼다. true면 A가 안식처 역(A가
 * 안정·감정 부담 경감을 줌), 그 외(false/null/미전달 — 균형이거나
 * romantic_signals 없는 레거시)는 기존 문구(A=온기 제공, B=안식처 제공)를
 * byte-identical하게 그대로 유지한다. 신호 무관하게 항상 A=온기·B=안식처로
 * 고정돼있던 문제를 고침 — "A/B 복붙 현상 완벽 차단"이라는 사양서 1절
 * 목적과 어긋나던 지점.
 */
export function buildSectionRoleSeparationGuide(
  nicknameA: string,
  nicknameB: string,
  anchorIsA?: boolean | null,
): string {
  const ANCHOR_ROLE = "다정한 안식처·**안정·감정 부담 경감·분석적 새 시각**";
  const WARMTH_ROLE = "다정한 생동감·**새 경험·변화·더 나은 결정**";
  const DEFAULT_B_ROLE = "안정·**감정 부담 경감·분석적 새 시각**"; // 기존(anchorIsA 도입 전) b_gives_a 문구 그대로
  const aGivesRole = anchorIsA ? ANCHOR_ROLE : WARMTH_ROLE;
  const bGivesRole = anchorIsA ? WARMTH_ROLE : DEFAULT_B_ROLE;

  return `
# 섹션별 서술 역할 분리 (중복 금지 — 각 필드는 고유한 질문에만 답할 것)

> JSON 슬롯: \`a_*\` = **${nicknameA}**, \`b_*\` = **${nicknameB}**. 본문 주어·호칭은 위 이름 매핑표의 커스텀 이름 1순위.

## Section jobs (one purpose each — do not borrow another section's thesis)

| Section | Unique job | Must not become |
|---|---|---|
| \`section_2_nature\` | Solo lean + 1st-person self-portrait | Relationship praise / mutual comfort essay |
| \`section_4_special_bond\` | What each gives the other + interlocking roles | Soft reassurance mismatch cover-up; hidden-hearts confession |
| \`section_4_relationship_frames\` | Reassurance need/give + role-play frame from digest | Second special_bond; erase \`일치:false\` |
| \`section_4_hidden_hearts\` | Unspoken need/fear + raw voice | Bond synergy / "we comfort each other" |
| \`mutual_gift\` | Unconscious tension **or** quiet safety — one sharp insight | Restate special_bond or frames comfort thesis |
| \`section_5_action\` | Digest-backed concrete handles + speakable lines | Generic "communicate more" tips |
| \`why_special\` | Named conflict/tempo pattern + one practical tip | Bond praise rehash |

## section_4_special_bond

| 필드 | 서술 역할 | 금지 |
|---|---|---|
| \`a_gives_b_headline\` + \`a_gives_b\` | **${nicknameA} → ${nicknameB}**: ${aGivesRole} | 자연물 비유, b_gives_a 미러링 |
| \`b_gives_a_headline\` + \`b_gives_a\` | **${nicknameB} → ${nicknameA}**: ${bGivesRole} | a_gives_b 미러링 |
| \`only_together_headline\` + \`only_together\` | **${nicknameA} ↔ ${nicknameB}**: 상호보완·Essence 아우라 | 앞 본문 재탕 |
| \`why_special\` | 💡 맞춰 가는 지점 — 갈등 패턴·실전 팁 | bond 칭찬 재탕 |

> Few-Shot 예시 구조·퀄리티는 User Prompt 참조. 명리·자연물 비유 금지.

## section_2_nature vs section_4 (겹침 금지)
- nature: 각자 **단독 성향·1인칭 고백**
- special_bond: **관계 속 역할·보완·마찰** — nature 문장을 그대로 옮기지 마세요.

## section_4_hidden_hearts vs special_bond (겹침 금지)
- hidden: 무의식적 욕구·두려움·날것의 voice
- special_bond: 관계 기능·시너지 — hidden의 need/voice 문장 재사용 금지

## section_3_conversation_patterns vs why_special
- conflict dialogue_table: **정확히 2행** — A·B 각 ❌/✅. 50:50 기질 차이 (가해/피해 금지)
- why_special: **패턴 이름 + 왜 생기는지 + 한 줄 실전 팁** — 대사 표를 복사하지 마세요.

## section_5_action vs why_special
- action: 개인별 **행동 강령 + real_speech_tip** (기획 메모 "이런 순간에" 금지, real_life_example **""**)
- why_special: 관계 **패턴 진단** — 같은 대사를 양쪽에 넣지 마세요.
- advice_for_a 3개·advice_for_b 3개 — **서로 다른 구체 행동** (감정 드러내라 복제 금지); each tip must cite a digest signal
- together: **💌 에센스 다이어리** 3문장+ / together_starter: 대화 문 여는 대사
`.trim();
}

export const HIDDEN_HEARTS_FORBIDDEN_PHRASES = [
  "깊은 정서적 교감",
  "솔직한 대화",
  "서로 존중",
  "깊은 교감",
  "깊은 신뢰",
  "마음이 통하는",
  "서로를 이해",
  "정서적 유대",
  "영혼의",
  "진정한 사랑",
  "완벽한 이해",
] as const;

/** section_4_hidden_hearts 전용 역할·후킹 가이드 */
export function buildHiddenHeartsRoleGuide(
  nicknameA: string,
  nicknameB: string,
): string {
  const hiddenForbidden = HIDDEN_HEARTS_FORBIDDEN_PHRASES.map((p) => `"${p}"`)
    .join(", ");

  return `
# section_4_hidden_hearts — 🌙 서로의 숨은 마음 (고유 역할)

> **절대 금지**: section_4_special_bond의 칭찬·보완·시너지 문장을 재사용하거나 paraphrase하지 마세요.
> 이 섹션은 **겉으로 드러나지 않는 무의식·속마음**만 다룹니다.

## 내부 계산 / 외부 표현
- 내부: 십신(정재·편재·정관·편관 등), 달(Moon) 별자리, 용신/기신 신호로 무의식 역동 계산.
- **본문 출력**: 정재·편관·Moon 등 **전문 용어 0개**. 현대 심리학적 일상어로만.
- 치환 예: use bare names — "${nicknameA}가 내심 가장 바라는 것은…", "${nicknameB}가 겉보기와 달리 두려워하는 지점은…" (do **not** invent 나님 / doubled 님)

## 필드별 후킹 정의

| 필드 | 역할 | 후킹 포인트 |
|---|---|---|
| \`a_hidden\` (${nicknameA}) | **${nicknameA}의 숨은 마음** | 겉으론 쿨·씩씩해 보여도, 내심 ${nicknameB}에게 **인정받고 싶은 욕구**·말 못 한 **정서적 갈증**(불안·서운함의 진짜 원인). "내 마음을 들켰다" 소름 |
| \`b_hidden\` (${nicknameB}) | **${nicknameB}의 숨은 마음** | 겉으론 든든·무뚝뚝해 보여도, ${nicknameA}와의 관계에서 **조심스럽고 상처받기 싫어 방어하는** 인간적 취약점. a_hidden과 **문장 골격·형용사 중복 금지** |
| \`mutual_gift\` | **💡 두 사람의 무의식 시너지** | 말하지 않아도 느끼는 **묘한 긴장감** 또는 **보이지 않는 정서적 안전지대**. 날카로운 심리 저널 톤. 칭찬·치유 클리셰 금지. Must **not** restate special_bond / reassurance comfort thesis. |

## 각 hidden 블록 구조 (필수)
- \`need\`: 한 줄 **후킹** — 무의식적 욕구·두려움의 핵심 (2문장 이내)
- \`reason\`: 왜 그런지 — **3문장+**, 구체적 장면·습관
- \`voice\`: "사실 나는…" **1인칭 5~8문장**, 날것의 고백
  - \`a_hidden.voice\`: speaker = **${nicknameA}**; partner = **${nicknameB}** only
  - \`b_hidden.voice\`: speaker = **${nicknameB}**; partner = **${nicknameA}** only
  - Never call yourself by your own display name inside voice

## 금지 미사여구
${hiddenForbidden} 및 유사 변형 **0개**.

## 중복 검열
- a_hidden / b_hidden / mutual_gift / special_bond **어휘·문장 구조 50% 이상 겹치면 해당 필드 파기 후 재작성**.
`.trim();
}

export function buildEssenceJournalSelfDedupChecklist(
  nicknameA: string,
  nicknameB: string,
): string {
  return `
## 10. Essence 저널 중복·톤 검열 (필수)
- [ ] a_gives_b와 b_gives_a가 **문장 골격·핵심 형용사**가 다르게 쓰였나요? (주어만 바꾼 미러링 없음)
- [ ] only_together가 a_gives_b/b_gives_a의 칭찬을 **반복하지 않았나요**?
- [ ] why_special이 앞 bond 필드 칭찬을 **반복하지 않고**, 갈등 패턴(속도 시차·공감vs해결) + 실전 팁인가요?
- [ ] 금지 미사여구(${ESSENCE_JOURNAL_FORBIDDEN_PHRASES.slice(0, 4).join(", ")} 등)가 **0개**인가요?
- [ ] 본문에 사주·명리 전문 용어·한자가 **0개**인가요?
- [ ] ${nicknameA}·${nicknameB} 실명이 쓰이고 A/B 플레이스홀더가 없나요?
- [ ] 섹션 간 동일 문장이 1개라도 있으면 **해당 필드 전면 재작성**했나요?
- [ ] hidden_hearts가 special_bond 칭찬·보완을 **반복하지 않고** 무의식·속마음만 다루나요?
- [ ] a_hidden / b_hidden / mutual_gift가 **서로 다른 통찰**인가요? (주어만 바꾼 미러링 없음)
`.trim();
}
