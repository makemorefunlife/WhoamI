/**
 * Business / Partnership saju-deep — user prompt builders (Round 1).
 * Independent of romanticSajuDeep / marriedSajuDeep / familySajuDeep.
 */

import {
  buildEssenceActionFewShotExample,
  buildEssenceActionSelfDedupChecklist,
} from "./essenceActionWritingRules";

const buildFinalOutputRules = (nicknameA: string, nicknameB: string) => `
# Final output rules (Business / Partnership · Round 1)

## Domain
- Write for **business partners / co-founders**: execution pace, decision style, P&L sense, leadership/followership, risk control, role split & handoff.
- Ban dating thrills, marriage CFO/chore framing, family parenting fluff.

## Epistemics
- Canonical server values (compare bands band_a/band_b, leadership split, confidence/align) are authoritative.
- Narrative may explain and soften wording; must never contradict.
- \`confidence=low\` or \`align=caution\` → tentative markers.
- High confidence may stay direct.

## Soft-wash ban (business)
- When partner bands disagree (mismatch):
  1. First sentence must name the operational / ownership / risk gap.
  2. Entire body stays gap-consistent — may describe what each owns / currently does / how to hand off.
  3. Must not claim trust alone cancels the gap ("일이 잘 안 풀려도 서로 믿으면 된다", "파트너니까 괜찮다", "사이만 좋으면 사업은 된다").
  4. Repair language = conditional/future: "맞춰 갈 수 있다", "확인해 볼 필요가 있다", "역할·한도를 문서로 합의하면 도움이 된다".

## section_5 advice — Evidence bridge (hard, anti-drift)
- Write tips tip1 → tip2 → tip3 for A, then B.
- **Before every tip** (including tip2 and tip3):
  1. Pick exactly one unused business digest fact.
  2. Sentence 1 of \`saju_reason\` = user-facing evidence bridge (natural Korean; never print 오행/격국/십성 or internal keys).
  3. Then concrete action + benefit.
- Tip3 is not exempt.
- Forbidden generic: "서로 존중하며 소통하세요", "서로 믿으면 된다".

## Names & speaker binding
- Write **${nicknameA}** / **${nicknameB}** exactly. Ban **나님**, **저님**, inventing \`님\`, awkward \`이의\`.
- A 1st-person: "나" = **${nicknameA}**; other = **${nicknameB}** (or "파트너" if needed).
- B 1st-person: "나" = **${nicknameB}**; other = **${nicknameA}** (or "파트너" if A name is literally \`나\`).
- Forbid using own display name as the other party (\`${nicknameB}와의 관계\` inside B voice, etc.).
- Both-readers dignity (V9): no "문제 파트너/무능한 쪽".

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

export function buildBusinessSajuDeepUserPrompt(params: {
  nicknameA: string;
  nicknameB: string;
  businessDigestBlock: string;
  userCustomMyName?: string;
  userCustomTargetName?: string;
}): string {
  const {
    nicknameA,
    nicknameB,
    businessDigestBlock,
    userCustomMyName,
    userCustomTargetName,
  } = params;
  const nameA = (userCustomMyName || nicknameA).trim() || nicknameA;
  const nameB = (userCustomTargetName || nicknameB).trim() || nicknameB;

  return `
# Business / Partnership premium narrative (Round 1)

You write **explanation-only** business narrative grounded in the server digest below.
Do not re-classify bands. Do not invent Romantic/Marriage/Family axes.

## Name priority
- Partner A: **${nameA}**
- Partner B: **${nameB}**
- JSON slots: A = **${nicknameA}**, B = **${nicknameB}**

## Input data (canonical — explain only)
${businessDigestBlock}

${buildFinalOutputRules(nicknameA, nicknameB)}

${buildEssenceActionFewShotExample({
  nicknameA: nameA,
  nicknameB: nameB,
})}

${buildEssenceActionSelfDedupChecklist(nicknameA, nicknameB)}

Emit one JSON object only with this shape:
\`\`\`json
{
  "section_4_business_frames": {
    "role_gap_signal": {
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
    "together": "weekly ops check-in 3+ sentences",
    "together_starter": "ownership/risk/reporting opener"
  }
}
\`\`\`
Self-refine LLM pass is OFF — get bridges right on the first pass.
`.trim();
}

/** Minimal digest scaffold until businessSajuPromptDigest ships (Round 2). */
export function buildBusinessDigestScaffold(params: {
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
  leadership?: {
    external_lead?: string;
    internal_qa_lead?: string;
    confidence?: string;
    align?: string;
  };
}): string {
  const {
    nicknameA,
    nicknameB,
    rows = [],
    mismatchRoles = false,
    leadership,
  } = params;
  const lines = [
    `business_digest for A=${nicknameA} × B=${nicknameB}`,
    `domain: business / partnership`,
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
  if (leadership) {
    lines.push(
      `leadership_split: external_lead=${leadership.external_lead ?? "(n/a)"}, ` +
        `internal_qa_lead=${leadership.internal_qa_lead ?? "(n/a)"}` +
        (leadership.confidence
          ? `, confidence=${leadership.confidence}`
          : "") +
        (leadership.align ? `, align=${leadership.align}` : ""),
    );
  }
  lines.push(
    "Never print internal keys in user-facing prose; translate to natural Korean evidence bridges.",
    "Do not invent Romantic affection, Marriage CFO/chore, or Family parenting axes.",
  );
  return lines.join("\n");
}
