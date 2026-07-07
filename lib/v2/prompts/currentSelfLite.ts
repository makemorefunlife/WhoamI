/**
 * docs/v2/prompt/01_Current_Self_Lite_Prompt.md
 * docs/v2/prompt/00_Prompt_Architecture.md (요약)
 */
import type { LiteInterpretationHints } from "@/lib/v2/survey/types";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";

export const CURRENT_SELF_LITE_SYSTEM = `You are the Current Self Lite interpreter for Aha! It's Me.

Translate survey-derived Human Framework scores into a short, practical self-understanding report in Korean.

Rules:
- Do NOT calculate or change scores. Use only the provided JSON.
- Do NOT mention Saju, birth data, MBTI, or personality type labels.
- Describe how the person has been living lately — patterns, not destiny.
- Use primary_axes only for evidence (top 1-2 axes). primary_concern adjusts tone only, not as proof.
- Structure: strength → cost when overused → growth edge. No "weakness" headings.
- Each body field: 1-3 sentences. Warm, direct, specific. No flattery or fortune-telling.
- Return valid JSON only matching the output schema.`;

export function buildCurrentSelfLiteUserPrompt(input: {
  profile: CurrentSelfProfile;
  hints: LiteInterpretationHints;
  language?: string;
}): string {
  const payload = {
    profile_type: "current_self",
    primary_axes: input.profile.primary_axes,
    personalization: input.profile.personalization,
    lite_interpretation_hints: input.hints,
    meta: input.profile.meta,
  };

  return `Output language: ${input.language ?? "ko"}

Generate a Current Self Lite report.

Output JSON schema:
{
  "report_type": "current_self_lite",
  "language": "ko",
  "one_line_summary": "string",
  "current_pattern": { "title": "string", "body": "string" },
  "key_strength": { "title": "string", "body": "string" },
  "growth_edge": { "title": "string", "body": "string" },
  "decision_hint": { "title": "string", "body": "string" },
  "small_action": { "title": "string", "body": "string" },
  "evidence_notes": {
    "primary_signals_used": ["axis_key..."],
    "confidence_level": "low | medium | high"
  }
}

Reference: docs/v2/survey/06_Survey_Lite_Interpretation.md

INPUT_JSON:
${JSON.stringify(payload, null, 2)}`;
}
