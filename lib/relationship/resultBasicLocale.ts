import { normalizeLocale, type Locale } from "@/lib/i18n/locale";

/**
 * Locale the stored result_basic was generated in, if tagged.
 * Legacy rows predate locale-tagging and have no `.locale` field — returned
 * as null (unknown). This is exposed as metadata only; result_basic reuse
 * does not gate on it (a report's language is fixed at generation time and
 * always served as-is regardless of the viewer's current site locale).
 */
export function getResultBasicLocale(resultBasic: unknown): Locale | null {
  const raw = (resultBasic as { locale?: unknown } | null)?.locale;
  return typeof raw === "string" ? normalizeLocale(raw) : null;
}

/** True only when the stored result was generated in exactly this locale. */
export function resultBasicLocaleMatches(
  resultBasic: unknown,
  locale: Locale | string,
): boolean {
  return getResultBasicLocale(resultBasic) === normalizeLocale(locale);
}
