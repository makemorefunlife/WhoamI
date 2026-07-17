import type { Locale } from "@/lib/i18n/locale";

/** Pick English or Korean copy (string, string[], etc.) for Cohabitation Premium content generation. */
export function pick<T>(locale: Locale, en: T, ko: T): T {
  return locale === "en-US" ? en : ko;
}

/**
 * Fallback when a caller omits `locale` entirely. Deliberately Korean (NOT
 * the app's DEFAULT_LOCALE "en-US") so any pre-existing or future caller that
 * doesn't pass locale keeps getting the exact pre-migration behavior —
 * content only switches to English when a request explicitly asks for it.
 */
export const LEGACY_FALLBACK_LOCALE: Locale = "ko-KR";
