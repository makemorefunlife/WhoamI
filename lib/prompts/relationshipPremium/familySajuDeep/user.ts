/**
 * Family Parent–Child saju-deep — user prompt builders (Round 1).
 * Independent of romanticSajuDeep / marriedSajuDeep.
 */

import {
  buildEssenceActionFewShotExample,
  buildEssenceActionSelfDedupChecklist,
} from "./essenceActionWritingRules";

const buildFinalOutputRules = (
  nicknameParent: string,
  nicknameChild: string,
) => `
# Final output rules (Family Parent–Child · Round 1)

## Domain
- Write for **parent–child**: parenting stance, generational temperament gap, emotional acceptance, communication, child's reflection/independence.
- Ban dating thrills, marriage CFO/chore framing, destiny-family fluff.

## Epistemics
- Canonical server values (compare bands band_parent/band_child, confidence/align) are authoritative.
- Narrative may explain and soften wording; must never contradict.
- \`confidence=low\` or \`align=caution\` → tentative markers.
- High confidence may stay direct.

## Soft-wash ban (family)
- When generational bands disagree (mismatch):
  1. First sentence must name the operational/emotional gap.
  2. Entire body stays gap-consistent — may describe what each needs / currently does / how to translate.
  3. Must not claim love alone cancels the gap ("무조건 사랑하는 가족이니까 괜찮다", "피는 물보다 진하다", "다 잘될 거예요").
  4. Repair language = conditional/future: "맞춰 갈 수 있다", "확인해 볼 필요가 있다", "간격을 말로 합의하면 도움이 된다".

## section_5 advice — Evidence bridge (hard, anti-drift)
- Write tips tip1 → tip2 → tip3 for parent, then child.
- **Before every tip** (including tip2 and tip3):
  1. Pick exactly one unused family digest fact.
  2. Sentence 1 of \`saju_reason\` = user-facing evidence bridge (natural Korean; never print 오행/격국/십성 or internal keys).
  3. Then concrete action + benefit.
- Tip3 is not exempt.
- Forbidden generic: "서로 존중하며 소통하세요", "무조건 사랑하면 된다".

## Names & speaker binding
- Write **${nicknameParent}** / **${nicknameChild}** exactly. Ban **나님**, **저님**, inventing \`님\`, awkward \`이의\`.
- Parent 1st-person: "나" = **${nicknameParent}**; other = **${nicknameChild}** (or "아이" if needed).
- Child 1st-person: "나" = **${nicknameChild}**; other = **${nicknameParent}** (or "부모" if parent name is literally \`나\`).
- Forbid using own display name as the other party (\`${nicknameChild}와의 관계\` inside child voice, etc.).
- Both-readers dignity (V9): no "문제 자녀/문제 부모".

## Mingli
- Zero user-facing Saju jargon. Digest → natural Korean only.
`.trim();

export function buildFamilySajuDeepUserPrompt(params: {
  nicknameParent: string;
  nicknameChild: string;
  familyDigestBlock: string;
  userCustomParentName?: string;
  userCustomChildName?: string;
}): string {
  const {
    nicknameParent,
    nicknameChild,
    familyDigestBlock,
    userCustomParentName,
    userCustomChildName,
  } = params;
  const parentName =
    (userCustomParentName || nicknameParent).trim() || nicknameParent;
  const childName =
    (userCustomChildName || nicknameChild).trim() || nicknameChild;

  return `
# Family Parent–Child premium narrative (Round 1)

You write **explanation-only** family narrative grounded in the server digest below.
Do not re-classify bands. Do not invent Romantic/Marriage axes (dating affection, household CFO, chore ops).

## Name priority
- Parent: **${parentName}**
- Child: **${childName}**
- JSON slots: parent = **${nicknameParent}**, child = **${nicknameChild}**

## Input data (canonical — explain only)
${familyDigestBlock}

${buildFinalOutputRules(nicknameParent, nicknameChild)}

${buildEssenceActionFewShotExample({
  nicknameParent: parentName,
  nicknameChild: childName,
})}

${buildEssenceActionSelfDedupChecklist(nicknameParent, nicknameChild)}

Emit one JSON object only with this shape:
\`\`\`json
{
  "section_4_family_frames": {
    "generation_gap_signal": {
      "parent_body": "…",
      "child_body": "…",
      "match_note": "…"
    }
  },
  "section_5_action": {
    "advice_for_parent": [
      { "action_title": "…", "saju_reason": "bridge + action + benefit", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" }
    ],
    "advice_for_child": [
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" },
      { "action_title": "…", "saju_reason": "…", "real_speech_tip": "…", "real_life_example": "" }
    ],
    "together": "family check-in 3+ sentences",
    "together_starter": "distance/guidance opener"
  }
}
\`\`\`
Self-refine LLM pass is OFF — get bridges right on the first pass.
`.trim();
}

/** Minimal digest scaffold until familySajuPromptDigest ships (Round 2). */
export function buildFamilyDigestScaffold(params: {
  nicknameParent: string;
  nicknameChild: string;
  rows?: Array<{
    key: string;
    label: string;
    band_parent: string;
    band_child: string;
    confidence?: string;
    align?: string;
  }>;
  mismatchGenerations?: boolean;
}): string {
  const {
    nicknameParent,
    nicknameChild,
    rows = [],
    mismatchGenerations = false,
  } = params;
  const lines = [
    `family_digest for parent=${nicknameParent} × child=${nicknameChild}`,
    `mismatch_generations: ${mismatchGenerations}`,
    "comparison_table (band_parent / band_child):",
  ];
  for (const r of rows) {
    lines.push(
      `- ${r.key} (${r.label}): parent=${r.band_parent}, child=${r.band_child}` +
        (r.confidence ? `, confidence=${r.confidence}` : "") +
        (r.align ? `, align=${r.align}` : ""),
    );
  }
  if (rows.length === 0) {
    lines.push("- (rows empty — tests may inject)");
  }
  lines.push(
    "Never print internal keys in user-facing prose; translate to natural Korean evidence bridges.",
    "Do not invent Romantic affection or Marriage CFO/chore axes.",
  );
  return lines.join("\n");
}
