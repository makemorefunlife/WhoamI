/**
 * Married Couples saju-deep — user prompt builders (Round 1).
 * Independent of romanticSajuDeep. Explain-only narrative over marriage CE facts.
 */

import {
  buildEssenceActionFewShotExample,
  buildEssenceActionSelfDedupChecklist,
} from "./essenceActionWritingRules";

const buildFinalOutputRules = (nicknameA: string, nicknameB: string) => `
# Final output rules (Married Couples · Round 1)

## Domain
- Write for **married / cohabiting partners**: living chemistry, role balance, household money ops, long-horizon conflict repair, family boundary / parenting when present.
- Ban dating thrills, destiny-couple fluff, "설렘", generic romance advice.

## Epistemics
- Canonical server values (compare bands, operating_cfo, confidence/align) are authoritative.
- Narrative may explain and soften wording; must never contradict.
- \`confidence=low\` or \`align=caution\` → tentative markers ("~하는 편으로 보일 수 있다", "실제 생활에서 확인해 볼 부분이다").
- High confidence may stay direct.

## Soft-wash ban (household)
- When role/chore/conflict bands disagree (mismatch):
  1. First sentence must name the operational gap.
  2. Entire body stays mismatch-consistent — may describe what each needs / currently does / how to translate.
  3. Must not claim the household already runs smoothly, roles are already perfect, or conflict is already resolved.
  4. Repair language = conditional/future: "맞춰 갈 수 있다", "확인해 볼 필요가 있다", "운영 규칙을 합의하면 도움이 된다".
  - Forbidden: "이미 잘 맞춰 사는 부부", "갈등이 없는 가정", "역할이 이미 완벽히 분담되어 있다".
  - Valid: "역할·생활 분담이 어긋날 수 있다.", "상대가 편하다고 느끼는 운영 방식을 따로 확인해야 한다."

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
`.trim();

export function buildMarriedSajuDeepUserPrompt(params: {
  nicknameA: string;
  nicknameB: string;
  householdDigestBlock: string;
  userCustomMyName?: string;
  userCustomTargetName?: string;
}): string {
  const {
    nicknameA,
    nicknameB,
    householdDigestBlock,
    userCustomMyName,
    userCustomTargetName,
  } = params;
  const myName = (userCustomMyName || nicknameA).trim() || nicknameA;
  const targetName = (userCustomTargetName || nicknameB).trim() || nicknameB;

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

${buildFinalOutputRules(nicknameA, nicknameB)}

${buildEssenceActionFewShotExample({
  nicknameA,
  nicknameB,
  myName,
  targetName,
})}

${buildEssenceActionSelfDedupChecklist(nicknameA, nicknameB)}

Emit one JSON object only with this shape (fill all required tips):
\`\`\`json
{
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
Ground every advice tip in the digest. Self-refine LLM pass is OFF — get bridges right on the first pass.
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
