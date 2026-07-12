export type RomanticHeadlineLocale = "ko" | "en";

export function normalizeRomanticHeadlineLocale(
  locale?: RomanticHeadlineLocale | null,
): RomanticHeadlineLocale {
  return locale === "en" ? "en" : "ko";
}

/** EN headline label join — ROMANTIC_HEADLINE_EN.md */
export function joinHeadlineLabelsEn(labelA: string, labelB: string): string {
  return `${labelA} and ${labelB}`;
}
