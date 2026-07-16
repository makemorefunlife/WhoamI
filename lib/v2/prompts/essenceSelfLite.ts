/**
 * docs/v2/prompt/02_Innate_Self_Lite_Prompt.md
 * docs/v2/saju/06_Saju_Lite_Interpretation_Dictionary.md
 */
import type { EssenceSelfLiteInputPayload } from "@/lib/v2/saju/essenceLiteInput";
import { PRIMARY_AXIS_LLM_GUIDE } from "@/lib/v2/framework/primaryAxisDefinitions";
import { normalizeLocale } from "@/lib/i18n/locale";
import { buildLlmOutputLocaleInstruction } from "@/lib/i18n/llmLocale";

const ESSENCE_SELF_LITE_SYSTEM_RULES = `You are the Essence Self Lite interpreter for Aha! It's Me.

Translate pre-calculated essence signals into concise human insight.

${PRIMARY_AXIS_LLM_GUIDE}

Rules:
- Do NOT calculate Saju or use raw birth data. Use only essence_self_lite_input JSON.
- Do NOT expose technical terms: Ten Gods, Five Elements, pillars, stems, branches, special stars.
- Follow docs/v2/saju/06_Saju_Lite_Interpretation_Dictionary.md structure and tone.
- Sections: core personality (day-master signals), relationship tendency (day-branch signals), optional environment fit from Human Framework scores.
- Natural language only. No fortune-telling, diagnosis, or invented life events.
- Return valid JSON only.`;

/** English SSOT rules (no locale). Prefer getEssenceSelfLiteSystemPrompt. */
export const ESSENCE_SELF_LITE_SYSTEM = ESSENCE_SELF_LITE_SYSTEM_RULES;

export function getEssenceSelfLiteSystemPrompt(language?: string): string {
  const locale = normalizeLocale(language);
  return `${ESSENCE_SELF_LITE_SYSTEM_RULES}

${buildLlmOutputLocaleInstruction(locale)}`;
}

export function buildEssenceSelfLiteUserPrompt(input: {
  essence_self_lite_input: EssenceSelfLiteInputPayload;
  language?: string;
}): string {
  const locale = normalizeLocale(input.language);
  return `Output language: ${locale}

Generate an Essence Self Lite interpretation.

Output JSON schema:
{
  "report_type": "essence_self_lite",
  "language": "${locale}",
  "one_line_summary": "string",
  "core_personality_insight": { "title": "string", "body": "string" },
  "relationship_tendency_insight": { "title": "string", "body": "string" },
  "environment_fit_hint": { "title": "string", "body": "string" },
  "evidence_notes": {
    "primary_signals_used": ["string..."],
    "confidence_level": "low | medium | high"
  }
}

Reference dictionary: docs/v2/saju/06_Saju_Lite_Interpretation_Dictionary.md

ESSENCE_SELF_LITE_INPUT:
${JSON.stringify(input.essence_self_lite_input, null, 2)}`;
}
