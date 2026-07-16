import type { Locale } from "@/lib/i18n/locale";

export function formatDecisionDate(iso: string, locale: Locale = "en-US"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
