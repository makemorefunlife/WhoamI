/**
 * Friend / Social saju-deep — user prompt builders (Round 1).
 * Independent of romantic / married / family / business saju-deep modules.
 */

import {
  buildEssenceActionFewShotExample,
  buildEssenceActionSelfDedupChecklist,
} from "./essenceActionWritingRules";

/**
 * The "repair language" list, the section_5 evidence-bridge instruction,
 * and the 문체(tone) block below used to be hardcoded Korean regardless of
 * which locale this user prompt was built for — a direct contributor to
 * Korean leaking into English Friend Premium narrative (gap-signal /
 * advice-action sections). Now branches on locale; the en-US branch drops
 * the Korean tone block entirely (ENGLISH_TONE_LAW in the system prompt
 * already owns English tone) rather than mistranslating grammar rules that
 * don't apply to English.
 */
const buildFinalOutputRules = (
  nicknameA: string,
  nicknameB: string,
  locale: "ko" | "en" = "ko",
) => {
  if (locale === "en") {
    return `
# Final output rules (Friend / Social · Round 1)

## Domain
- Write for **friends / social peers**: contact rhythm, tikitaka/chemistry, comfortable distance, upset signals, hangout planning, low-pressure ease.
- Ban dating thrills, marriage CFO/chore, family parenting, business P&L/handoff.

## Epistemics
- Canonical server values (compare bands band_a/band_b, confidence/align) are authoritative.
- Narrative may explain and soften wording; must never contradict.
- \`confidence=low\` or \`align=caution\` → tentative markers.
- High confidence may stay direct.

## Soft-wash ban (friend)
- When friend bands disagree (mismatch):
  1. First sentence must name the rhythm/distance/upset gap.
  2. Entire body stays gap-consistent — may describe what each needs / currently does / how to translate.
  3. Must not claim friendship duty cancels the gap ("you're friends, so you just have to understand no matter what", "real friends don't mind").
  4. Repair language = conditional/future: "this can be worked out together", "worth checking in on", "agreeing on distance and tempo out loud can help".

## section_5 advice — Evidence bridge (hard, anti-drift)
- Write tips tip1 → tip2 → tip3 for A, then B.
- **Before every tip** (including tip2 and tip3):
  1. Pick exactly one unused friend digest fact.
  2. Sentence 1 of \`saju_reason\` = user-facing evidence bridge (natural English; never print Saju/Mingli technical terms or internal keys).
  3. Then concrete action + benefit.
- Tip3 is not exempt.
- Forbidden generic: "communicate with mutual respect", "you're friends so just understand each other".

## Names & speaker binding
- Write **${nicknameA}** / **${nicknameB}** exactly. Never invent an honorific or an awkward possessive form.
- A 1st-person: "I" = **${nicknameA}**; other = **${nicknameB}** (or "your friend" if needed).
- B 1st-person: "I" = **${nicknameB}**; other = **${nicknameA}** (or "your friend" if A's name is literally "I").
- Forbid using one's own display name as the other party.
- Both-readers dignity (V9): no "problem friend" framing or ranking jokes.

## Mingli
- Zero user-facing Saju jargon. Digest → natural, jargon-free language only.

${ENGLISH_TONE_REMINDER}
`.trim();
  }

  return `
# Final output rules (Friend / Social · Round 1)

## Domain
- Write for **friends / social peers**: contact rhythm, tikitaka/chemistry, comfortable distance, upset signals, hangout planning, low-pressure ease.
- Ban dating thrills, marriage CFO/chore, family parenting, business P&L/handoff.

## Epistemics
- Canonical server values (compare bands band_a/band_b, confidence/align) are authoritative.
- Narrative may explain and soften wording; must never contradict.
- \`confidence=low\` or \`align=caution\` → tentative markers.
- High confidence may stay direct.

## Soft-wash ban (friend)
- When friend bands disagree (mismatch):
  1. First sentence must name the rhythm/distance/upset gap.
  2. Entire body stays gap-consistent — may describe what each needs / currently does / how to translate.
  3. Must not claim friendship duty cancels the gap ("친구니까 무조건 다 이해해 줘야 한다", "진짜 친구면 괜찮다", "절교각은 운명").
  4. Repair language = conditional/future: "맞춰 갈 수 있다", "확인해 볼 필요가 있다", "거리와 템포를 말로 합의하면 도움이 된다".

## section_5 advice — Evidence bridge (hard, anti-drift)
- Write tips tip1 → tip2 → tip3 for A, then B.
- **Before every tip** (including tip2 and tip3):
  1. Pick exactly one unused friend digest fact.
  2. Sentence 1 of \`saju_reason\` = user-facing evidence bridge (natural Korean; never print 오행/격국/십성 or internal keys).
  3. Then concrete action + benefit.
- Tip3 is not exempt.
- Forbidden generic: "서로 존중하며 소통하세요", "친구니까 무조건 이해해".

## Names & speaker binding
- Write **${nicknameA}** / **${nicknameB}** exactly. Ban **나님**, **저님**, inventing \`님\`, awkward \`이의\`.
- A 1st-person: "나" = **${nicknameA}**; other = **${nicknameB}** (or "친구" if needed).
- B 1st-person: "나" = **${nicknameB}**; other = **${nicknameA}** (or "친구" if A name is literally \`나\`).
- Forbid using own display name as the other party (\`${nicknameB}와의 관계\` inside B voice, etc.).
- Both-readers dignity (V9): no "문제 친구"/ranking jokes.

## Mingli
- Zero user-facing Saju jargon. Digest → natural Korean only.

## 문체 (Tone) — Korean output
- 모든 한국어 서술은 자연스럽고 다정한 해요체(~해요/~죠/~예요, 필요시 ~입니다)로 100% 통일.
- 문어체·개조식 종결 금지: "~이다", "~있다", "~한다", "~하는 편", "~함", "~경향이 있다"로 문장·표 셀을 끝내지 않는다. 비교 표 셀도 완결된 해요체 문장으로 쓴다.
- 한 화면/표 안에서 존댓말과 반말·문어체를 섞지 않는다(인용 대화문 제외).
- 대시(—, –, ㅡ)로 절을 잇지 않는다. 쉼표나 새 문장으로 분리한다.
- 딱딱한 보고서체 대신, 감각 있는 에디터가 다정하게 설명하듯 생생하고 공감 가는 표현을 쓴다.
- 셀 예시: ❌ "다정한 편 — 갈등 시 침묵으로 후퇴" → ✅ "대체로 다정한 편이지만, 갈등이 생기면 잠시 침묵으로 물러나는 편이에요."
`.trim();
};

/**
 * Short EN tone reminder for the user prompt — deliberately redundant with
 * ENGLISH_TONE_LAW in the system prompt (lib/i18n/llmLocale.ts). The Korean
 * side gets this same kind of tone guidance twice too (once in system.ts's
 * output-language block, once in the 문체 block above); a smaller model
 * (gpt-4o-mini) leaking language under a prompt this dense in Korean
 * structural content is exactly the failure mode this investigation found,
 * so this stays close to the actual generation instructions rather than
 * relying solely on the system prompt.
 */
const ENGLISH_TONE_REMINDER = `## Tone — English output
- Write ALL of section_4_friend_frames and section_5_action in natural North American English.
- Sound like a warm, direct friend — not a translated Korean report.
- Do not mix in Korean words or phrases anywhere in these two sections.`;

export function buildFriendSajuDeepUserPrompt(params: {
  nicknameA: string;
  nicknameB: string;
  friendDigestBlock: string;
  userCustomMyName?: string;
  userCustomTargetName?: string;
  locale?: "ko" | "en";
}): string {
  const {
    nicknameA,
    nicknameB,
    friendDigestBlock,
    userCustomMyName,
    userCustomTargetName,
    locale = "ko",
  } = params;
  const nameA = (userCustomMyName || nicknameA).trim() || nicknameA;
  const nameB = (userCustomTargetName || nicknameB).trim() || nicknameB;

  return `
# Friend / Social premium narrative (Round 1)

You write **explanation-only** friendship narrative grounded in the server digest below.
Do not re-classify bands. Do not invent Romantic/Marriage/Family/Business axes.

## Name priority
- Friend A: **${nameA}**
- Friend B: **${nameB}**
- JSON slots: A = **${nicknameA}**, B = **${nicknameB}**

## Input data (canonical — explain only)
${friendDigestBlock}

${buildFinalOutputRules(nicknameA, nicknameB, locale)}

${buildEssenceActionFewShotExample({
  nicknameA: nameA,
  nicknameB: nameB,
  locale,
})}

${buildEssenceActionSelfDedupChecklist(nicknameA, nicknameB, locale)}

Emit one JSON object only with this shape:
\`\`\`json
{
  "section_4_friend_frames": {
    "friendship_gap_signal": {
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
    "together": "light friendship check-in 3+ sentences",
    "together_starter": "rhythm/distance/hangout opener"
  }
}
\`\`\`
Self-refine LLM pass is OFF — get bridges right on the first pass.
`.trim();
}

/** Minimal digest scaffold until friendSajuPromptDigest ships (Round 2). */
export function buildFriendDigestScaffold(params: {
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
  mismatchRoles?: boolean;
}): string {
  const {
    nicknameA,
    nicknameB,
    rows = [],
    mismatchRoles = false,
  } = params;
  const lines = [
    `friend_digest for A=${nicknameA} × B=${nicknameB}`,
    `domain: friend / social`,
    `mismatch_roles: ${mismatchRoles}`,
    "comparison_table (band_a / band_b):",
  ];
  for (const r of rows) {
    lines.push(
      `- ${r.key} (${r.label}): a=${r.band_a}, b=${r.band_b}` +
        (r.confidence ? `, confidence=${r.confidence}` : "") +
        (r.align ? `, align=${r.align}` : ""),
    );
  }
  if (rows.length === 0) {
    lines.push("- (rows empty — tests may inject)");
  }
  lines.push(
    "Never print internal keys in user-facing prose; translate to natural, jargon-free evidence bridges in the output language.",
    "Do not invent Romantic, Marriage, Family, or Business axes.",
  );
  return lines.join("\n");
}
