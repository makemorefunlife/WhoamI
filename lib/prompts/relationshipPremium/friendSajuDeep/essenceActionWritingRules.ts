/** 🌱 section_5_action — Friend / Social action guide (Round 1) */

export const ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES = [
  "이런 순간에",
  "이런 상황에서",
  "이때",
  "적용할 수 있는 구체적 상황",
] as const;

export const ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES_EN = [
  "in moments like this",
  "in a situation like this",
  "at this point",
  "a specific situation you could apply this to",
] as const;

export const ESSENCE_ACTION_FORBIDDEN_CLICHES = [
  "친구니까 무조건",
  "진짜 친구면 괜찮",
  "무조건 다 이해",
  "절교각",
  "무조건 사랑하",
  "피는 물보다",
  "설레는 연애",
  "가사 분담",
  "양육",
  "손익",
  "핸드오프",
] as const;

export const ESSENCE_ACTION_FORBIDDEN_CLICHES_EN = [
  "you're friends, so you just have to understand",
  "real friends don't mind",
  "you just have to accept everything",
  "blood is thicker than water",
  "swoony romance",
  "splitting chores",
  "raising kids",
  "P&L",
  "handoff",
] as const;

/**
 * "Evidence bridge" opener sentences — the required first sentence of every
 * advice tip's `saju_reason` (see buildFinalOutputRules in user.ts). Mirrors
 * ASPECT_BRIDGE_LABEL / buildAdviceBridgePool in postValidateNarrative.ts —
 * keep the two in sync so the LLM's own English attempt and the
 * post-validate fallback injection read as the same voice.
 */
const BRIDGE_STARTERS_KO = [
  "일상 공유·연락 템포가 다르게 잡히기 때문에…",
  "서운함을 드러내는 방식이 다르게 보이기 때문에…",
  "호감을 표현하는 언어 채널이 다르게 잡히므로…",
  "배터리·회복 방식이 다르게 보이기 때문에…",
  "만남·약속 계획 결이 다르게 잡히기 때문에…",
  "티키타카·소통 리듬이 다르게 보이기 때문에…",
  "편한 거리 기대가 어긋날 수 있어서…",
  "케미·유머 결이 다르게 잡히므로…",
] as const;

const BRIDGE_STARTERS_EN = [
  "Your daily contact tempo tends to land differently, so…",
  "You each show being upset in a different way, so…",
  "The way you each express affection runs on a different channel, so…",
  "Your social battery and recharge styles differ, so…",
  "How you plan hangouts tends to fall into different patterns, so…",
  "Your back-and-forth rhythm syncs differently, so…",
  "Your comfortable-distance expectations may not quite line up, so…",
  "Your chemistry and sense of humor land differently, so…",
] as const;

export function buildEssenceActionSystemPromptBlock(
  locale: "ko" | "en" = "ko",
): string {
  const isEn = locale === "en";
  const planningList = isEn
    ? ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES_EN
    : ESSENCE_ACTION_FORBIDDEN_PLANNING_PHRASES;
  const clichesList = isEn
    ? ESSENCE_ACTION_FORBIDDEN_CLICHES_EN
    : ESSENCE_ACTION_FORBIDDEN_CLICHES;
  const bridgeStarters = isEn ? BRIDGE_STARTERS_EN : BRIDGE_STARTERS_KO;
  const planning = planningList.map((p) => `"${p}"`).join(", ");
  const cliches = clichesList.map((p) => `"${p}"`).join(", ");
  const bridgeList = bridgeStarters.map((b) => `  - "${b}"`).join("\n");

  if (isEn) {
    return `
# section_5_action — Helpful actions for friends (Friend)

## Domain (hard)
- This is **friendship / social**, not dating, marriage household, family parenting, or business ops.
- Center: contact rhythm, tikitaka/chemistry, comfortable distance, upset expression, hangout planning, low-pressure ease.
- Ban romance thrills, family soft-wash, marriage CFO/chore, business handoff/P&L, and fluff like ${cliches}.

## Names
- Write friend display names exactly. Never invent an honorific or an awkward possessive form.
- Never shame either friend ("problem friend", ranking jokes, punch-down humor).

## No planning-memo / Mingli
- Ban scaffolding such as ${planning}.
- \`real_life_example\` must always be \`""\`.
- Never print Saju/Mingli technical terms (five elements, ten gods, etc.) in user-facing prose.

## Digest-backed advice (Round 1 — hard)
- Every tip derives from **exactly one** friend digest fact:
  daily_share_tempo | upset_expression | affection_language | battery_recharge | hangout_planning | communication_rhythm.
- **Hard**: \`saju_reason\` **sentence 1** = evidence bridge. Sentence 2+ = concrete action + benefit.
- **Anti-drift**: tip1, tip2, **and tip3** each restart the bridge gate.
- Valid bridge starters (only if digest supports):
${bridgeList}
- If a tip lacks a bridge, discard and rewrite.

## Output structure
- \`advice_for_a\` ×3 and \`advice_for_b\` ×3.
- Each tip: action_title + saju_reason (3–4 sentences) + real_speech_tip + real_life_example \`""\`.
- \`together\`: light weekly friendship check-in (3+ sentences) — not a romance diary or generic "friends just get it" fluff.
- \`together_starter\`: conversation opener about rhythm, distance, or hangout vibe.
`.trim();
  }

  return `
# section_5_action — Helpful actions for friends (Friend)

## Domain (hard)
- This is **friendship / social**, not dating, marriage household, family parenting, or business ops.
- Center: contact rhythm, tikitaka/chemistry, comfortable distance, upset expression, hangout planning, low-pressure ease.
- Ban romance thrills, family soft-wash, marriage CFO/chore, business handoff/P&L, and fluff like ${cliches}.

## Names
- Write friend display names exactly. Ban \`나님\` / \`저님\` / inventing \`님\` / awkward \`이의\`.
- Never shame either friend ("문제 친구", ranking jokes, punch-down humor).

## No planning-memo / Mingli
- Ban scaffolding such as ${planning}.
- \`real_life_example\` must always be \`""\`.
- Never print 오행/격국/십성/한자 technical terms.

## Digest-backed advice (Round 1 — hard)
- Every tip derives from **exactly one** friend digest fact:
  daily_share_tempo | upset_expression | affection_language | battery_recharge | hangout_planning | communication_rhythm.
- **Hard**: \`saju_reason\` **sentence 1** = evidence bridge. Sentence 2+ = concrete action + benefit.
- **Anti-drift**: tip1, tip2, **and tip3** each restart the bridge gate.
- Valid bridge starters (only if digest supports):
${bridgeList}
- If a tip lacks a bridge, discard and rewrite.

## Output structure
- \`advice_for_a\` ×3 and \`advice_for_b\` ×3.
- Each tip: action_title + saju_reason (3–4 sentences) + real_speech_tip + real_life_example \`""\`.
- \`together\`: light weekly friendship check-in (3+ sentences) — not romance diary / "친구니까 무조건" fluff.
- \`together_starter\`: conversation opener about rhythm, distance, or hangout vibe.
`.trim();
}

export function buildEssenceActionFewShotExample(params: {
  nicknameA: string;
  nicknameB: string;
  locale?: "ko" | "en";
}): string {
  const { nicknameA, nicknameB } = params;
  if (params.locale === "en") {
    return `
# [Structure example] section_5_action — Friend / Social

⚠️ Structure only. Write **new** content from ${nicknameA} / ${nicknameB}'s real digest. Never copy these sentences.

---
🌱 Actions that help each other as friends

✨ Guide for ${nicknameA} (\`advice_for_a\`)
- 01. Say the contact tempo out loud:
  \`saju_reason\`: "[bridge] Your daily contact tempo tends to land differently, so… [action] … [benefit] … **do not copy**"
  \`real_life_example\`: ""
- 02. (a different digest bridge + different focus)
- 03. (yet another digest fact — **tip3 needs a bridge too**)

✨ Guide for ${nicknameB} (\`advice_for_b\`)
- 01. Name the "upset" signal briefly:
  \`saju_reason\`: "[bridge] You each show being upset in a different way, so… [action] … [benefit] …"
- 02. / 03. tip3 needs a bridge too

💌 Light friendship check-in
\`together\`: "(structure only) 1 digest difference + one weekly line + an action — **never copy a romance-diary or 'friends just get it' line**"
\`together_starter\`: "(structure only) a line asking about contact/distance/hangout vibe"

Key: tip1, tip2, **and tip3** each need an evidence bridge. Preserve both friends' dignity. No punch-down humor.
`.trim();
  }
  return `
# [구조 예시] section_5_action — Friend / Social

⚠️ 구조만 참고. ${nicknameA}·${nicknameB} 실제 digest로 **새로** 작성. 문장 복사 금지.

---
🌱 서로에게 도움이 되는 친구 행동

✨ ${nicknameA}을 위한 가이드 (\`advice_for_a\`)
- 01. 연락 템포를 말로 맞추기:
  \`saju_reason\`: "[다리] 일상 공유·연락 템포가 다르게 잡히기 때문에… [행동] … [효과] … **복사 금지**"
  \`real_life_example\`: ""
- 02. (다른 digest 다리 + 다른 강령)
- 03. (또 다른 digest — **tip3도 다리 필수**)

✨ ${nicknameB}을 위한 가이드 (\`advice_for_b\`)
- 01. 서운한 신호를 짧게 말하기:
  \`saju_reason\`: "[다리] 서운함을 드러내는 방식이 다르게 보이기 때문에… [행동] … [효과] …"
- 02. / 03. tip3도 다리 필수

💌 가벼운 친구 점검 아카이브
\`together\`: "(구조만) digest 차이 1개 + 주간 한 줄 + 실행 — **친구니까 무조건/연애 일기 복사 금지**"
\`together_starter\`: "(구조만) 연락·거리·만남 온도를 묻는 대사"

핵심: tip1·tip2·**tip3** 모두 evidence bridge. 양쪽 친구 존엄 유지. 유머는 올려치기 금지.
`.trim();
}

export function buildEssenceActionSelfDedupChecklist(
  nicknameA: string,
  nicknameB: string,
  locale?: "ko" | "en",
): string {
  if (locale === "en") {
    return `
## section_5_action self-check (Friend · required)
- [ ] advice_for_a / advice_for_b each have **exactly 3**?
- [ ] tip1, tip2, **and tip3** all open with a friend evidence bridge?
- [ ] Zero dating/marriage/family/business soft-wash or "friends just get it" generics?
- [ ] Zero Saju/Mingli technical terms? Zero punch-down humor or shame framing?
- [ ] Do ${nicknameA} / ${nicknameB} appear exactly as the names provided?
`.trim();
  }
  return `
## section_5_action 검열 (Friend · 필수)
- [ ] advice_for_a / advice_for_b **각 3개**?
- [ ] tip1·tip2·**tip3** 모두 첫 문장이 friend evidence bridge인가?
- [ ] 연애/부부/가족/비즈니스 soft-wash·"친구니까 무조건" 일반론 0개?
- [ ] 명리 용어 0개? 올려치기 유머·수치심 프레이밍 0개?
- [ ] ${nicknameA}·${nicknameB} 호칭이 제공 이름 그대로인가?
`.trim();
}
