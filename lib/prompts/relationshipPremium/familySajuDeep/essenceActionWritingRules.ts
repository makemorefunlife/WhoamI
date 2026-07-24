/** 🌱 section_5_action — Family Parent–Child action guide (Round 1) */

export const ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES = [
  "이런 순간에",
  "이런 상황에서",
  "이때",
  "적용할 수 있는 구체적 상황",
] as const;

export const ESSENCE_ACTION_FORBIDDEN_CLICHES = [
  "무조건 사랑하",
  "피는 물보다",
  "서로 존중하며 소통하세요",
  "감정을 솔직히 표현하세요",
  "설레는 연애",
  "가사 분담",
  "일상 재정 운영",
] as const;

export function buildEssenceActionSystemPromptBlock(): string {
  const planning = ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES.map((p) => `"${p}"`)
    .join(", ");
  const cliches = ESSENCE_ACTION_FORBIDDEN_CLICHES.map((p) => `"${p}"`).join(
    ", ",
  );

  return `
# section_5_action — Helpful actions for parent & child (Family)

## Domain (hard)
- This is **parent–child family**, not dating or married household ops.
- Center: parenting stance, generational temperament gap, emotional acceptance, communication, child's reflection/independence.
- Ban romance thrills, marriage CFO/chore framing, and fluff like ${cliches}.

## Names
- Write parent/child display names exactly. Ban \`나님\` / \`저님\` / inventing \`님\` / awkward \`이의\`.
- Never shame either generation ("문제 자녀", "문제 부모").

## No planning-memo / Mingli
- Ban scaffolding such as ${planning}.
- \`real_life_example\` must always be \`""\`.
- Never print 오행/격국/십성/한자 technical terms.

## Digest-backed advice (Round 1 — hard)
- Every tip derives from **exactly one** family digest fact:
  correction_style | bond_distance | guidance_balance | affection_expression | home_climate | gathering_recovery.
- **Hard**: \`saju_reason\` **sentence 1** = evidence bridge. Sentence 2+ = concrete action + benefit.
- **Anti-drift**: tip1, tip2, **and tip3** each restart the bridge gate.
- Valid bridge starters (only if digest supports):
  - "잔소리·지적에 반응하는 결이 다르게 잡히기 때문에…"
  - "편안하다고 느끼는 정서적 거리가 다르게 보이기 때문에…"
  - "돌봄·지도(수용·설명·기준) 균형이 다르게 잡히므로…"
  - "마음을 표현하는 채널이 다르게 잡히기 때문에…"
  - "가정 분위기 결이 다르게 잡히므로…"
  - "가족행사 후 회복 리듬이 다르게 보이기 때문에…"
  - "세대 간 성향·거리 기대가 어긋날 수 있어서…"
- If a tip lacks a bridge, discard and rewrite.

## Output structure
- \`advice_for_parent\` ×3 and \`advice_for_child\` ×3 (aliases \`advice_for_a\`/\`advice_for_b\` OK if slots map parent/child).
- Each tip: action_title + saju_reason (3–4 sentences) + real_speech_tip + real_life_example \`""\`.
- \`together\`: family check-in archive (3+ sentences) — not romance diary / "무조건 사랑" fluff.
- \`together_starter\`: conversation opener about distance/guidance/communication.
`.trim();
}

export function buildEssenceActionFewShotExample(params: {
  nicknameParent: string;
  nicknameChild: string;
}): string {
  const { nicknameParent, nicknameChild } = params;
  return `
# [구조 예시] section_5_action — Family Parent–Child

⚠️ 구조만 참고. ${nicknameParent}·${nicknameChild} 실제 digest로 **새로** 작성. 문장 복사 금지.

---
🌱 서로에게 도움이 되는 가족 행동

✨ ${nicknameParent}을 위한 가이드 (\`advice_for_parent\`)
- 01. 잔소리 전에 한 줄 질문하기:
  \`saju_reason\`: "[다리] 잔소리·지적에 반응하는 결이 다르게 잡히기 때문에… [행동] … [효과] … **복사 금지**"
  \`real_life_example\`: ""
- 02. (다른 digest 다리 + 다른 강령)
- 03. (또 다른 digest — **tip3도 다리 필수**)

✨ ${nicknameChild}을 위한 가이드 (\`advice_for_child\`)
- 01. 거리를 말로 말하기:
  \`saju_reason\`: "[다리] 편안하다고 느끼는 정서적 거리가 다르게 보이기 때문에… [행동] … [효과] …"
- 02. / 03. tip3도 다리 필수

💌 가족 점검 아카이브
\`together\`: "(구조만) digest 차이 1개 + 주간 점검 + 실행 — **무조건 사랑/연애 일기 복사 금지**"
\`together_starter\`: "(구조만) 거리·기대 온도를 묻는 대사"

핵심: tip1·tip2·**tip3** 모두 evidence bridge. 부모/자녀 존엄 유지.
`.trim();
}

export function buildEssenceActionSelfDedupChecklist(
  nicknameParent: string,
  nicknameChild: string,
): string {
  return `
## section_5_action 검열 (Family · 필수)
- [ ] advice_for_parent / advice_for_child **각 3개**?
- [ ] tip1·tip2·**tip3** 모두 첫 문장이 family evidence bridge인가?
- [ ] 연애/부부(가사·CFO) 톤·"무조건 사랑" 일반론 0개?
- [ ] 명리 용어 0개? 수치심 프레이밍 0개?
- [ ] ${nicknameParent}·${nicknameChild} 호칭이 제공 이름 그대로인가?
`.trim();
}
