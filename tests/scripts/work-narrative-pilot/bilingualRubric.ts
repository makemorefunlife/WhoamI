/**
 * Batch V — bilingual voice audit rubric (human fill-in).
 */

export const BILINGUAL_LOCALE_DIMENSIONS = [
  "naturalness",
  "warmth",
  "candidness",
  "firmness",
  "emotional_safety",
  "light_playfulness",
  "specificity",
  "readability",
  "actionable_usefulness",
  "non_judgmental_framing",
] as const;

export const BILINGUAL_PARITY_DIMENSIONS = [
  "meaning_parity",
  "canonical_parity",
  "conflict_strength_parity",
  "confidence_parity",
  "prescription_parity",
  "unsupported_inference_parity",
  "locale_specific_naturalness",
  "not_literal_translation",
] as const;

export function emptyBilingualRubric(pairId: string) {
  const blank = Object.fromEntries(
    BILINGUAL_LOCALE_DIMENSIONS.map((d) => [d, null]),
  );
  const parity = Object.fromEntries(
    BILINGUAL_PARITY_DIMENSIONS.map((d) => [d, null]),
  );
  return {
    pair_id: pairId,
    ko_KR: { ...blank },
    en_US: { ...blank },
    parity,
    notes: "",
  };
}

export function bilingualRubricMarkdown(pairId: string): string {
  return `# Bilingual voice rubric — ${pairId}

Score 1–5 per cell. Parity: pass/fail + note.

| Dimension | ko-KR | en-US |
|-----------|-------|-------|
${BILINGUAL_LOCALE_DIMENSIONS.map((d) => `| ${d} |  |  |`).join("\n")}

## Parity
${BILINGUAL_PARITY_DIMENSIONS.map((d) => `- [ ] ${d}`).join("\n")}
`;
}
