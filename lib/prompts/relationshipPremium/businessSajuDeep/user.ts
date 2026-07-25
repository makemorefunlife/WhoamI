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
  4. Repair language = conditional/future: "맞춰 갈 수 있습니다", "확인해 볼 필요가 있습니다", "역할·한도를 문서로 합의하면 도움이 됩니다".

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

## 문체 (Tone) — Korean output (Business/Partnership 전용 — 다른 관계 도메인과 다름)
- 이 도메인은 공용 해요체 규칙의 예외입니다. 정중하고 분석적인 합쇼체(~습니다/~입니다/~합니다)로 100% 통일합니다. ~해요/~예요/~죠 캐주얼 종결 금지.
- 정서적 쿠션 문구 금지: "그럴 수밖에 없었을 거예요", "이해해 주시면 좋겠습니다", "속상하셨겠지만" 같은 감정적 다독임 대신, **근거 → 리스크/시사점 → 권고** 순서로 직접 서술합니다.
- 비유·유형 레이블은 오히려 적극 사용합니다 — 빠른 판단을 돕는 압축 도구이기 때문입니다 (예: "독불장군형", "정확성 우선형"). 단, 인신공격성·비하 표현은 금지합니다.
- 문어체·개조식 종결도 금지: "~이다", "~있다", "~한다"로 문장·표 셀을 끝내지 않고 반드시 합쇼체로 마무리합니다.
- 한 화면/표 안에서 합쇼체와 반말·해요체를 섞지 않습니다(인용 대화문 제외).
- 대시(—, –, ㅡ)로 절을 잇지 않습니다. 쉼표나 새 문장으로 분리합니다.
- 셀 예시: ❌ "협업할 때 다정한 편이지만, 갈등이 생기면 마음이 상할 수 있어요" (감정적 프레이밍, 해요체) → ✅ "협업 국면에서 원칙을 고수하는 '독불장군형'에 가깝습니다. 실행 속도보다 기준의 일관성을 우선하는 파트너와 궁합이 좋습니다."
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
