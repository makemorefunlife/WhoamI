/** 🌱 section_5_action — Married Couples household action guide (Round 1) */

export const ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES = [
  "이런 순간에",
  "이런 상황에서",
  "이때",
  "적용할 수 있는 구체적 상황",
  "상황 예시",
] as const;

export const ESSENCE_ACTION_FORBIDDEN_CLICHES = [
  "감정을 드러내라",
  "서로를 이해",
  "깊은 교감",
  "특별한 에너지",
  "설레는 연애",
  "로맨틱한 데이트",
  "서로 존중하며 소통하세요",
] as const;

/** Injected into system prompt — section_5_action rules (marriage) */
export function buildEssenceActionSystemPromptBlock(): string {
  const planning = ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES.map((p) => `"${p}"`)
    .join(", ");
  const cliches = ESSENCE_ACTION_FORBIDDEN_CLICHES.map((p) => `"${p}"`).join(
    ", ",
  );

  return `
# section_5_action — Helpful household actions for each other (Married Couples)

## Domain (hard)
- This is **married / cohabiting partnership**, not dating romance.
- Center: living chemistry, role split, money ops, long-horizon conflict repair, co-parenting/boundary when present.
- Ban dating thrills, "설렘", destiny-couple fluff, generic "express your feelings" clones (${cliches}).

## Names
- Write display names exactly as given. Ban \`나님\` / \`저님\` / inventing \`님\` on bare names / awkward \`이의\`.

## No planning-memo narration
- Ban scaffolding such as ${planning}.
- \`real_life_example\` must always be \`""\`.

## No Mingli in user-facing prose
- Never print 오행/격국/십성/한자 technical terms. Translate digest facts into natural Korean.

## Digest-backed advice (Round 1 — hard)
- Every tip derives from **exactly one** marriage digest fact:
  household_stress | marital_conflict | asset_management | operating_cfo | family_boundary | parenting_style | bedroom_lead | role split.
- Internally: \`[source]\` + observed fact + action + expected effect — then **delete tags**.
- **Hard**: \`saju_reason\` **sentence 1** = evidence bridge. Sentence 2+ = concrete household action + benefit.
- **Anti-drift**: tip1, tip2, **and tip3** each restart the bridge gate.
- **Generic bridge starters** (pick only if digest supports):
  - "가사·루틴 스트레스 드러내는 방식이 다르게 잡히므로…"
  - "부부 갈등 반응(폭발·침묵) 결이 다르게 잡히기 때문에…"
  - "자산관리 기질 밴드가 다르게 잡히기 때문에…"
  - "일상 재정 운영(CFO) 역할이 한쪽으로 잡히기 때문에…"
  - "원가족 경계 필요가 다르게 보이기 때문에…"
  - "육아·교육 가치 기울기가 다르게 잡히기 때문에…"
  - "역할·생활 분담이 어긋날 수 있어서…"
- Invalid: "서로 존중하며…", "설레는…", "어떤 상황에서도…" without a digest fact first.
- If a tip lacks a bridge, discard and rewrite.

## Output structure
Per person, 3 tips — each item:
- \`action_title\`: household action mandate
- \`saju_reason\`: 3–4 sentences (bridge → action → benefit)
- \`real_speech_tip\`: speakable line for home/money/conflict moments
- \`real_life_example\`: \`""\`

Shared:
- \`together\`: household archive / weekly ops check (3+ sentences) — digest-shaped, never romance diary fluff
- \`together_starter\`: conversation opener about home ops
`.trim();
}

export function buildEssenceActionFewShotExample(params: {
  nicknameA: string;
  nicknameB: string;
  myName: string;
  targetName: string;
}): string {
  const { nicknameA, nicknameB, myName, targetName } = params;

  return `
# [구조 예시] section_5_action — Married Couples

⚠️ 구조·밀도만 참고. ${nicknameA}·${nicknameB} 실제 digest로 **새로** 작성. 문장 복사 금지.

---
🌱 서로에게 도움이 되는 생활 행동

✨ ${myName}을 위한 가정 운영 가이드
(JSON: \`advice_for_a\`)

- 01. ${targetName}의 가사 리듬 존중하기:
  \`action_title\`: "${targetName}의 가사 리듬 존중하기"
  \`saju_reason\`: "[다리] 가사·루틴 스트레스 드러내는 방식이 다르게 잡히므로… [행동] … [효과] … **복사 금지**"
  \`real_speech_tip\`: "${targetName}, 이번 주 집안일 중에서 네가 제일 지치는 게 뭐야? 그걸 먼저 맞춰 보자."
  \`real_life_example\`: ""

- 02. 갈등 전 재정·일정부터 한 줄 정리하기:
  \`action_title\`: "갈등 전 재정·일정부터 한 줄 정리하기"
  \`saju_reason\`: "[다리] (다른 digest — 예: 자산관리/CFO 신호가 …이므로) [행동] … [효과] …"
  \`real_speech_tip\`: "(01과 다른 실전 대사)"
  \`real_life_example\`: ""

- 03. (세 번째 **고유** 생활 강령 — tip3도 다리 필수)
  \`action_title\`: "(고유 제목)"
  \`saju_reason\`: "[다리] (또 다른 digest — 예: 부부 갈등 반응 결이 …이므로) [행동] … [효과] …"
  \`real_speech_tip\`: "(01·02와 다른 대사)"
  \`real_life_example\`: ""

✨ ${targetName}을 위한 가정 운영 가이드
(JSON: \`advice_for_b\`)

- 01. 침묵 대신 운영 규칙 한 줄 말하기:
  \`action_title\`: "침묵 대신 운영 규칙 한 줄 말하기"
  \`saju_reason\`: "[다리] 부부 갈등 반응 결이 다르게 잡히기 때문에… [행동] … [효과] …"
  \`real_speech_tip\`: "지금은 해결보다, 오늘 누가 무엇을 맡을지만 먼저 정하고 싶어."
  \`real_life_example\`: ""

- 02. (다른 digest 다리 + 다른 강령)
- 03. (또 다른 digest 다리 — **tip3도 다리 필수**)

💌 우리 집 운영 아카이브
\`together\`: "(구조만) ① digest 차이/공통 1개 ② 주간 점검 습관 1개 ③ 실행 제안 — **연애 일기·아름다운 조각 복사 금지**"
\`together_starter\`: "(구조만) 이번 주 가사·지출 온도를 묻는 대사 — 복사 금지"

---
핵심: tip1·tip2·**tip3** 모두 evidence bridge로 시작. 연애 톤 금지. 내부 키 노출 금지.
`.trim();
}

export function buildEssenceActionSelfDedupChecklist(
  nicknameA: string,
  nicknameB: string,
): string {
  return `
## section_5_action 검열 (Married · 필수)
- [ ] advice_for_a / advice_for_b **각 3개**?
- [ ] tip1·tip2·**tip3** 모두 \`saju_reason\` 첫 문장이 household evidence bridge인가?
- [ ] 연애/설렘 톤·일반론("서로 존중하며…") 0개?
- [ ] 명리 용어 0개?
- [ ] ${nicknameA}·${nicknameB} 호칭이 제공 이름 그대로인가? (\`나님\`/\`저님\` 0개)
- [ ] \`together\`가 가사·재정·역할 점검 톤인가? (연애 다이어리 금지)
`.trim();
}
