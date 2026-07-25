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

## 문체 (Tone) — Korean output
- 모든 한국어 서술은 자연스럽고 다정한 해요체(~해요/~죠/~예요, 필요시 ~입니다)로 100% 통일.
- 문어체·개조식 종결 금지: "~이다", "~있다", "~한다", "~하는 편", "~함", "~경향이 있다"로 문장·표 셀을 끝내지 않는다. 비교 표 셀도 완결된 해요체 문장으로 쓴다.
- 한 화면/표 안에서 존댓말과 반말·문어체를 섞지 않는다(인용 대화문 제외).
- 대시(—, –, ㅡ)로 절을 잇지 않는다. 쉼표나 새 문장으로 분리한다.
- 딱딱한 보고서체 대신, 감각 있는 에디터가 다정하게 설명하듯 생생하고 공감 가는 표현을 쓴다.
- 셀 예시: ❌ "다정한 편 — 갈등 시 침묵으로 후퇴" → ✅ "대체로 다정한 편이지만, 갈등이 생기면 잠시 침묵으로 물러나는 편이에요."
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
