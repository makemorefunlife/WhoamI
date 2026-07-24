/** 🌱 section_5_action — Business / Partnership action guide (Round 1) */

export const ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES = [
  "이런 순간에",
  "이런 상황에서",
  "이때",
  "적용할 수 있는 구체적 상황",
] as const;

export const ESSENCE_ACTION_FORBIDDEN_CLICHES = [
  "서로 믿으면 된다",
  "파트너니까 괜찮",
  "사이만 좋으면",
  "무조건 사랑하",
  "피는 물보다",
  "설레는 연애",
  "가사 분담",
  "양육",
  "시너지 창출이 요구됩니다",
] as const;

export function buildEssenceActionSystemPromptBlock(): string {
  const planning = ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES.map((p) => `"${p}"`)
    .join(", ");
  const cliches = ESSENCE_ACTION_FORBIDDEN_CLICHES.map((p) => `"${p}"`).join(
    ", ",
  );

  return `
# section_5_action — Helpful actions for business partners (Business)

## Domain (hard)
- This is **business / partnership**, not dating, marriage household, or family parenting.
- Center: execution pace, decision style, P&L / money sense, leadership & followership, risk control, role ownership & handoff.
- Ban romance thrills, family soft-wash, marriage CFO/chore framing, and fluff like ${cliches}.

## Names
- Write partner display names exactly. Ban \`나님\` / \`저님\` / inventing \`님\` / awkward \`이의\`.
- Never shame either partner ("문제 파트너", "무능한 쪽").

## No planning-memo / Mingli
- Ban scaffolding such as ${planning}.
- \`real_life_example\` must always be \`""\`.
- Never print 오행/격국/십성/한자 technical terms.

## Digest-backed advice (Round 1 — hard)
- Every tip derives from **exactly one** business digest fact:
  boundary | feedback | synergy_position | burnout | risk_taking | reporting_rhythm | leadership.
- **Hard**: \`saju_reason\` **sentence 1** = evidence bridge. Sentence 2+ = concrete action + benefit.
- **Anti-drift**: tip1, tip2, **and tip3** each restart the bridge gate.
- Valid bridge starters (only if digest supports):
  - "업무 경계·역할 소유가 다르게 잡히기 때문에…"
  - "피드백 전달·수용 결이 다르게 보이기 때문에…"
  - "시너지·역할 자리 기대가 다르게 잡히므로…"
  - "번아웃·회복 리듬이 다르게 보이기 때문에…"
  - "리스크 감수 성향이 다르게 잡히기 때문에…"
  - "보고·공유 리듬이 다르게 보이기 때문에…"
  - "대외 리드 / 내부 점검 역할 분담이 어긋날 수 있어서…"
  - "손익·리스크를 보는 결이 다르게 잡히므로…"
  - "의사결정·추진 속도가 다르게 보이기 때문에…"
- If a tip lacks a bridge, discard and rewrite.

## Output structure
- \`advice_for_a\` ×3 and \`advice_for_b\` ×3.
- Each tip: action_title + saju_reason (3–4 sentences) + real_speech_tip + real_life_example \`""\`.
- \`together\`: weekly ops check-in archive (3+ sentences) — not romance diary / "서로 믿으면 된다" fluff.
- \`together_starter\`: conversation opener about ownership, risk, or reporting cadence.
`.trim();
}

export function buildEssenceActionFewShotExample(params: {
  nicknameA: string;
  nicknameB: string;
}): string {
  const { nicknameA, nicknameB } = params;
  return `
# [구조 예시] section_5_action — Business / Partnership

⚠️ 구조만 참고. ${nicknameA}·${nicknameB} 실제 digest로 **새로** 작성. 문장 복사 금지.

---
🌱 서로에게 도움이 되는 비즈니스 행동

✨ ${nicknameA}을 위한 가이드 (\`advice_for_a\`)
- 01. 핸드오프 전에 소유권 한 줄 확인:
  \`saju_reason\`: "[다리] 업무 경계·역할 소유가 다르게 잡히기 때문에… [행동] … [효과] … **복사 금지**"
  \`real_life_example\`: ""
- 02. (다른 digest 다리 + 다른 강령)
- 03. (또 다른 digest — **tip3도 다리 필수**)

✨ ${nicknameB}을 위한 가이드 (\`advice_for_b\`)
- 01. 리스크 한도를 숫자로 말하기:
  \`saju_reason\`: "[다리] 리스크 감수 성향이 다르게 잡히기 때문에… [행동] … [효과] …"
- 02. / 03. tip3도 다리 필수

💌 주간 운영 점검 아카이브
\`together\`: "(구조만) digest 차이 1개 + 주간 점검 + 실행 — **서로 믿으면 된다/연애 일기 복사 금지**"
\`together_starter\`: "(구조만) 소유권·리스크·보고 리듬을 묻는 대사"

핵심: tip1·tip2·**tip3** 모두 evidence bridge. 양쪽 파트너 존엄 유지.
`.trim();
}

export function buildEssenceActionSelfDedupChecklist(
  nicknameA: string,
  nicknameB: string,
): string {
  return `
## section_5_action 검열 (Business · 필수)
- [ ] advice_for_a / advice_for_b **각 3개**?
- [ ] tip1·tip2·**tip3** 모두 첫 문장이 business evidence bridge인가?
- [ ] 연애/부부/가족 soft-wash·"서로 믿으면 된다" 일반론 0개?
- [ ] 명리 용어 0개? 수치심 프레이밍 0개?
- [ ] ${nicknameA}·${nicknameB} 호칭이 제공 이름 그대로인가?
`.trim();
}
