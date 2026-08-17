/**
 * Married Couples saju-deep — user prompt builders (Round 1).
 * Independent of romanticSajuDeep. Explain-only narrative over marriage CE facts.
 */

import {
  buildEssenceActionFewShotExample,
  buildEssenceActionSelfDedupChecklist,
} from "./essenceActionWritingRules";

const buildFinalOutputRules = (
  nicknameA: string,
  nicknameB: string,
  locale: "ko" | "en" = "ko",
) => {
  if (locale === "en") {
    return `
# Final output rules (Married Couples · Round 1)

## Domain
- Write for **married / cohabiting partners**: living chemistry, role balance, household money ops, long-horizon conflict repair, family boundary / parenting when present.
- Ban dating thrills, destiny-couple fluff, generic romance advice.

## Epistemics
- Canonical server values (compare bands, operating_cfo, confidence/align) are authoritative.
- Narrative may explain and soften wording; must never contradict.
- \`confidence=low\` or \`align=caution\` → tentative markers ("this can come across as…", "worth checking against real life").
- High confidence may stay direct.

## Soft-wash ban (household)
- When role/chore/conflict bands disagree (mismatch):
  1. First sentence must name the operational gap.
  2. Entire body stays mismatch-consistent — may describe what each needs / currently does / how to translate.
  3. Must not claim the household already runs smoothly, roles are already perfect, or conflict is already resolved.
  4. Repair language = conditional/future: "you can work toward this", "worth checking in on", "agreeing on an operating rule would help".
  - Forbidden: "you two already run a smooth household", "there's no conflict in this home", "roles are already perfectly split".
  - Valid: "role and daily-life division may not line up.", "it's worth separately checking what operating style feels comfortable to your partner."

## section_5 advice — Evidence bridge (hard, anti-drift)
- Write tips tip1 → tip2 → tip3 for A, then B.
- **Before every tip** (including tip2 and tip3):
  1. Pick exactly one unused marriage digest fact.
  2. Sentence 1 of \`saju_reason\` = user-facing evidence bridge (natural English; never print raw Saju terms like 五行/格局/十神 or internal keys).
  3. Then concrete household action + benefit.
- Valid bridges: "Because household/routine stress shows up differently…", "Because your conflict-reaction styles read differently…", "Because your money-management temperaments read differently…", "Because day-to-day money ops (CFO) sits mostly with one of you…", "Because your family-of-origin boundary needs read differently…", "Because role and daily-life division may not line up…"
- Tip3 is not exempt. Soft openers without a digest fact → discard and rewrite.
- Forbidden generic: "communicate with mutual respect", "express your feelings honestly", "understand each other's differences".

## Names & B-speaker binding
- Write **${nicknameA}** / **${nicknameB}** exactly as given. Do not invent titles/honorifics on bare names.
- \`a_*\` 1st-person: "I" = **${nicknameA}**; partner = **${nicknameB}**.
- \`b_*\` 1st-person (\`b_nature.first_person_voice\`, \`b_nature.description\`, \`b_hidden.*\`): speaker = **${nicknameB}**; partner = **${nicknameA}**.
- Forbid in \`b_*\`: describing the relationship from A's point of view (e.g. "my relationship with ${nicknameB}") — it must read as ${nicknameB} speaking about ${nicknameA}.

## Mingli
- Zero user-facing Saju jargon. Digest → natural English only.

## Tone — English output
- Write like a sharp, warm friend talking to one person — contractions on (it's, you're, that's), second person where natural, active voice.
- Do not chain two independent clauses with an em dash. Use a period, or a plain connector (but/since/so), instead.
- Ban consultant/self-help filler ("it's important to note that", "when it comes to", "delve into", "navigate the complexities of", "foster a deeper connection"). Say the plain thing instead.
- Do not flip register mid-paragraph. Pick one voice and hold it, including in comparison-table cells.
- Example: ❌ "You two handle chore stress differently — one explodes, one goes quiet." → ✅ "You two handle chore stress differently. One tends to explode, the other tends to go quiet."

## section_2_nature — first_person_voice (new, required)
- \`a_nature.first_person_voice\`: **${nicknameA}** speaking in first person ("I"), 1-2 sentences on how this person tends to show up in the relationship/household.
- \`b_nature.first_person_voice\`: **${nicknameB}** speaking in first person ("I"), same format, 1-2 sentences.
- Ground it in at least one real band/signal from the household_digest (how stress shows up, conflict-reaction style, money-management temperament, etc.), translated into natural personality language. No Saju jargon, no internal keys.
- Do not invent facts (no birth-story narration, no invented hobbies/jobs). Do not add detail that isn't in the digest.
- Do not write \`description\`/\`comparison_table\` unless separately requested.
`.trim();
  }

  return `
# Final output rules (Married Couples · Round 1)

## Domain
- Write for **married / cohabiting partners**: living chemistry, role balance, household money ops, long-horizon conflict repair, family boundary / parenting when present.
- Ban dating thrills, destiny-couple fluff, "설렘", generic romance advice.

## Epistemics
- Canonical server values (compare bands, operating_cfo, confidence/align) are authoritative.
- Narrative may explain and soften wording; must never contradict.
- \`confidence=low\` or \`align=caution\` → tentative markers ("~하는 편으로 보일 수 있어요", "실제 생활에서 확인해 볼 부분이에요").
- High confidence may stay direct.

## Soft-wash ban (household)
- When role/chore/conflict bands disagree (mismatch):
  1. First sentence must name the operational gap.
  2. Entire body stays mismatch-consistent — may describe what each needs / currently does / how to translate.
  3. Must not claim the household already runs smoothly, roles are already perfect, or conflict is already resolved.
  4. Repair language = conditional/future: "맞춰 갈 수 있어요", "확인해 보면 좋아요", "운영 규칙을 합의하면 도움이 돼요".
  - Forbidden: "이미 잘 맞춰 사는 부부", "갈등이 없는 가정", "역할이 이미 완벽히 분담되어 있다".
  - Valid: "역할·생활 분담이 어긋날 수 있어요.", "상대가 편하다고 느끼는 운영 방식을 따로 확인해 보는 게 좋아요."

## section_5 advice — Evidence bridge (hard, anti-drift)
- Write tips tip1 → tip2 → tip3 for A, then B.
- **Before every tip** (including tip2 and tip3):
  1. Pick exactly one unused marriage digest fact.
  2. Sentence 1 of \`saju_reason\` = user-facing evidence bridge (natural Korean; never print 오행/격국/십성 or internal keys).
  3. Then concrete household action + benefit.
- Valid bridges: "가사·루틴 스트레스 드러내는 방식이 다르게 잡히므로…", "부부 갈등 반응 결이 다르게 잡히기 때문에…", "자산관리 기질 밴드가 다르게 잡히기 때문에…", "일상 재정 운영(CFO) 역할이 한쪽으로 잡히기 때문에…", "원가족 경계 필요가 다르게 보이기 때문에…", "역할·생활 분담이 어긋날 수 있어서…"
- Tip3 is not exempt. Soft openers without digest fact → discard and rewrite.
- Forbidden generic: "서로 존중하며 소통하세요", "감정을 솔직히 표현하세요", "서로의 차이를 이해하세요".

## Names & B-speaker binding
- Write **${nicknameA}** / **${nicknameB}** exactly. Ban **나님**, **저님**, inventing \`님\`, awkward \`${nicknameB}이의\` → \`${nicknameB}의\`.
- \`a_*\` 1st-person: "나" = **${nicknameA}**; partner = **${nicknameB}**.
- \`b_*\` 1st-person (\`b_nature.first_person_voice\`, \`b_nature.description\`, \`b_hidden.*\`): speaker = **${nicknameB}**; partner = **${nicknameA}** (or "상대" if A is literally \`나\`).
- Forbid in \`b_*\`: \`${nicknameB}와의 관계\`, \`나와 ${nicknameB}\`.

## Mingli
- Zero user-facing Saju jargon. Digest → natural Korean only.

## 문체 (Tone) — Korean output
- 모든 한국어 서술은 자연스럽고 다정한 해요체(~해요/~죠/~예요, 필요시 ~입니다)로 100% 통일.
- 문어체·개조식 종결 금지: "~이다", "~있다", "~한다", "~하는 편", "~함", "~경향이 있다"로 문장·표 셀을 끝내지 않는다. 비교 표 셀도 완결된 해요체 문장으로 쓴다.
- 한 화면/표 안에서 존댓말과 반말·문어체를 섞지 않는다(인용 대화문 제외).
- 대시(—, –, ㅡ)로 절을 잇지 않는다. 쉼표나 새 문장으로 분리한다.
- 딱딱한 보고서체 대신, 감각 있는 에디터가 다정하게 설명하듯 생생하고 공감 가는 표현을 쓴다.
- 셀 예시: ❌ "다정한 편 — 갈등 시 침묵으로 후퇴" → ✅ "대체로 다정한 편이지만, 갈등이 생기면 잠시 침묵으로 물러나는 편이에요."

## section_2_nature — first_person_voice (신규, 필수)
- \`a_nature.first_person_voice\`: **${nicknameA}**의 1인칭("나") 목소리로, 이 사람이 관계·가정 안에서 어떻게 보이는지 1~2문장.
- \`b_nature.first_person_voice\`: **${nicknameB}**의 1인칭("나") 목소리로, 동일한 형식 1~2문장.
- 근거: household_digest의 실제 밴드/성향 신호(가사 스트레스 표출 방식, 갈등 반응, 자산관리 기질 등)에서 하나 이상 골라 자연스러운 성격 묘사로 번역. 명리 용어·내부 키 노출 금지.
- 없는 사실을 지어내지 않는다(생년월일 서사, 가상의 취미/직업 등 금지). digest에 없는 디테일은 쓰지 않는다.
- \`description\`/\`comparison_table\`은 요청하지 않는 한 작성하지 않는다.
`.trim();
};

export function buildMarriedSajuDeepUserPrompt(params: {
  nicknameA: string;
  nicknameB: string;
  householdDigestBlock: string;
  userCustomMyName?: string;
  userCustomTargetName?: string;
  locale?: "ko" | "en";
}): string {
  const {
    nicknameA,
    nicknameB,
    householdDigestBlock,
    userCustomMyName,
    userCustomTargetName,
    locale = "ko",
  } = params;
  const myName = (userCustomMyName || nicknameA).trim() || nicknameA;
  const targetName = (userCustomTargetName || nicknameB).trim() || nicknameB;
  const isEn = locale === "en";

  const jsonShape = isEn
    ? `\`\`\`json
{
  "section_2_nature": {
    "a_nature": { "first_person_voice": "…" },
    "b_nature": { "first_person_voice": "…" }
  },
  "section_4_household_frames": {
    "role_balance_signal": {
      "a_body": "…",
      "b_body": "…",
      "match_note": "…"
    }
  },
  "section_5_action": {
    "advice_for_a": [
      { "action_title": "…", "saju_reason": "bridge + action + benefit", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" }
    ],
    "advice_for_b": [
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" }
    ],
    "together": "household archive 3+ sentences",
    "together_starter": "ops check opener"
  }
}
\`\`\`
Ground every field in the digest. Self-refine LLM pass is OFF — get bridges (and \`first_person_voice\`) right on the first pass.`
    : `\`\`\`json
{
  "section_2_nature": {
    "a_nature": { "first_person_voice": "…" },
    "b_nature": { "first_person_voice": "…" }
  },
  "section_4_household_frames": {
    "role_balance_signal": {
      "a_body": "…",
      "b_body": "…",
      "match_note": "…"
    }
  },
  "section_5_action": {
    "advice_for_a": [
      { "action_title": "…", "saju_reason": "bridge + action + benefit", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" }
    ],
    "advice_for_b": [
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" }
    ],
    "together": "household archive 3+ sentences",
    "together_starter": "ops check opener"
  }
}
\`\`\`
Ground every field in the digest. Self-refine LLM pass is OFF — get bridges (and \`first_person_voice\`) right on the first pass.`;

  if (isEn) {
    return `
# Married Couples premium narrative (Round 1)

You write **explanation-only** household narrative grounded in the server digest below.
Do not re-classify bands, CFO side, or confidence. Do not invent Romantic-domain axes (affection language, dating recovery speed, etc.).

## Name priority
- Me: **${myName}**
- Partner: **${targetName}**
- JSON slots: A = **${nicknameA}**, B = **${nicknameB}**

## Input data (canonical — explain only)
${householdDigestBlock}

${buildFinalOutputRules(nicknameA, nicknameB, "en")}

${buildEssenceActionFewShotExample({
  nicknameA,
  nicknameB,
  myName,
  targetName,
  locale: "en",
})}

${buildEssenceActionSelfDedupChecklist(nicknameA, nicknameB, "en")}

Emit one JSON object only with this shape (fill all required tips):
${jsonShape}
`.trim();
  }

  return `
# Married Couples premium narrative (Round 1)

You write **explanation-only** household narrative grounded in the server digest below.
Do not re-classify bands, CFO side, or confidence. Do not invent Romantic-domain axes (affection language, dating recovery speed, etc.).

## Name priority
- Me: **${myName}**
- Partner: **${targetName}**
- JSON slots: A = **${nicknameA}**, B = **${nicknameB}**

## Input data (canonical — explain only)
${householdDigestBlock}

${buildFinalOutputRules(nicknameA, nicknameB, "ko")}

${buildEssenceActionFewShotExample({
  nicknameA,
  nicknameB,
  myName,
  targetName,
  locale: "ko",
})}

${buildEssenceActionSelfDedupChecklist(nicknameA, nicknameB, "ko")}

Emit one JSON object only with this shape (fill all required tips):
${jsonShape}
`.trim();
}

/** Minimal digest scaffold for manual / unit tests until marriagePromptDigest ships. */
export function buildMarriedHouseholdDigestScaffold(params: {
  nicknameA: string;
  nicknameB: string;
  rows?: Array<{
    key: string;
    label: string;
    band_a: string;
    band_b: string;
    confidence?: string;
    align?: string;
  }>;
  operatingCfoSide?: "a" | "b" | null;
  mismatchRoles?: boolean;
}): string {
  const {
    nicknameA,
    nicknameB,
    rows = [],
    operatingCfoSide = null,
    mismatchRoles = false,
  } = params;
  const lines = [
    `household_digest for ${nicknameA} × ${nicknameB}`,
    `mismatch_roles: ${mismatchRoles}`,
    operatingCfoSide
      ? `operating_cfo.side: ${operatingCfoSide} (일상 재정 운영 담당)`
      : "operating_cfo.side: (없음)",
    "comparison_table:",
  ];
  for (const r of rows) {
    lines.push(
      `- ${r.key} (${r.label}): ${nicknameA}=${r.band_a}, ${nicknameB}=${r.band_b}` +
        (r.confidence ? `, confidence=${r.confidence}` : "") +
        (r.align ? `, align=${r.align}` : ""),
    );
  }
  if (rows.length === 0) {
    lines.push("- (rows empty — tests may inject)");
  }
  lines.push(
    "Note: never print internal keys in user-facing prose; translate to natural Korean evidence bridges.",
  );
  return lines.join("\n");
}
