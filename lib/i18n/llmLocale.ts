import {
  DEFAULT_LOCALE,
  localeToShort,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n/locale";

/** Parse API body / header language → Locale (default en-US). */
export function resolveRequestLocale(input: {
  bodyLanguage?: unknown;
  headerLanguage?: string | null;
}): Locale {
  if (input.bodyLanguage != null && String(input.bodyLanguage).trim()) {
    return normalizeLocale(input.bodyLanguage);
  }
  if (input.headerLanguage?.trim()) {
    return normalizeLocale(input.headerLanguage);
  }
  return DEFAULT_LOCALE;
}

/**
 * Appended to English canonical system prompts.
 * Single LLM call — no MT pass.
 */
export function buildLlmOutputLocaleInstruction(locale: Locale): string {
  if (locale === "ko-KR") {
    return `
# Output language
- Write ALL user-facing JSON string values in natural Korean (ko-KR).
- Sound like a native Korean counselor — warm, concrete, not translationese.
- Keep JSON keys, enums, scores, and schema exactly as specified (English keys).
- Do not mix English sentences into user-facing prose unless quoting a proper noun.`.trim();
  }

  return `
# Output language
- Write ALL user-facing JSON string values in natural North American English (en-US).
- Clear, warm, specific — not generic self-help fluff.
- Keep JSON keys, enums, scores, and schema exactly as specified.`.trim();
}

/** Short tag for legacy romantic locale union ("en" | "ko"). */
export function toLegacyShortLocale(locale: Locale): "en" | "ko" {
  return localeToShort(locale);
}

export function fromLegacyShortLocale(short: unknown): Locale {
  return normalizeLocale(short === "en" ? "en-US" : short === "ko" ? "ko-KR" : short);
}
