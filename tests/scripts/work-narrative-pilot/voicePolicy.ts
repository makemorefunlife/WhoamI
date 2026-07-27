/**
 * Batch V — locale Narrative Voice policies (pilot only).
 * Same truth / evidence / insight; culturally natural delivery per locale.
 */

export const VOICE_POLICY_VERSION = "work_narrative_voice_v1" as const;

export type PilotNarrativeLocale = "ko-KR" | "en-US";

export const SHARED_VOICE_PRINCIPLES = `
## Shared voice (both locales)

Be warm, kind, candid, gently firm, lightly playful, emotionally safe, specific, practical, and non-judgmental.

Never: treat a person as the problem; invent diagnoses; sugarcoat hard conclusions;
use generic encouragement; mock or exaggerate jokes; change canonical meaning;
change conflict strength by locale.
`.trim();

export const MEANING_PARITY_CONTRACT = `
## Meaning parity (ko-KR ↔ en-US)

Judgments must match across locales: canonical direction, stronger_side,
conflict severity, confidence, ambiguity, complement direction, prescriptions,
and unsupported-inference boundaries.

Sentence shape and metaphors MAY differ. Judgments MUST NOT.

Forbidden: softening conflict in one locale while keeping it sharp in the other;
provisional leadership in one locale and fixed titles in the other.
`.trim();

export const LIGHT_PLAYFULNESS_RULE = `
## Light playfulness

At most 1–2 light turns per whole report. Use humor only to ease heaviness,
never to mock people, meme, slang-dump, or trivialize conflict/weakness.
`.trim();

export const KO_KR_VOICE_POLICY = `
## ko-KR voice

- Soften briefly before a sharp judgment when needed; then state the conclusion clearly.
- Describe repeating patterns between the two people — do not evaluate personality as defect.
- Use polite 존댓말 that feels like a thoughtful colleague, not a government form or clinic note.
- Prefer flow: 관찰 → 이유 → 실제 장면 → 권장 행동.
- Mix “두 분”, nicknames, and relational subjects to reduce repetition.
- Do not hide discomfort behind endless buffering or “~할 수 있습니다” stacks.
- Avoid: 당신은 원래 / 성격에 문제가 있다 / 무조건 / 절대 / 최악의 조합 / 완벽한 조합 /
  translationese / stiff noun-stack sentences / labeling that wounds.

Good shape:
두 분 모두 자신의 판단에 책임을 지려는 마음이 강한 편이에요.
그래서 의견이 갈리면 내용보다 누가 먼저 물러서느냐가 쟁점이 될 수 있습니다.
중요한 결정에서는 논의를 시작하기 전에 최종 결정권을 정해두는 편이 좋습니다.
`.trim();

export const EN_US_VOICE_POLICY = `
## en-US voice

- Lead with the core observation early; then impact → explanation → practical move.
- Direct but not blunt or accusatory. Intelligent friendly coach — not therapy script, not corp jargon.
- Short clear sentences with natural rhythm. Do not hide hard facts in euphemism.
- Do not import Korean-style indirection via literal translation.
- Avoid: You are controlling / You always|never / therapy clichés / corporate jargon /
  excessive hedging / forced jokes / generic motivation /
  auto-flattering conflict as “different but complementary”.

Good shape:
You both take your judgment seriously, so disagreements can become a quiet contest over who gives in first.
That is not a character flaw. It is what happens when two people claim ownership in similar ways.
Before a high-stakes discussion, decide who has the final call.
`.trim();

export function buildLocaleVoiceBlock(locale: PilotNarrativeLocale): string {
  const localeBlock =
    locale === "ko-KR" ? KO_KR_VOICE_POLICY : EN_US_VOICE_POLICY;
  return [
    SHARED_VOICE_PRINCIPLES,
    MEANING_PARITY_CONTRACT,
    LIGHT_PLAYFULNESS_RULE,
    localeBlock,
    `Output prose locale must be exactly ${locale}. Do not mix languages in body text.`,
  ].join("\n\n");
}

export const BILINGUAL_VOICE_CONTRACT_MARKERS = {
  voiceVersion: VOICE_POLICY_VERSION,
  meaningParity: "Meaning parity",
  koHonorific: "존댓말",
  enDirect: "Lead with the core observation",
  playfulnessCap: "At most 1–2 light turns",
  noJudgmentChange: "change conflict strength by locale",
} as const;
