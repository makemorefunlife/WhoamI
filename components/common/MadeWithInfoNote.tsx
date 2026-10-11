"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * "This report reflects the info at the time it was made" (+ "your info has
 * changed since" when the server says so). Shared by Personal deep and
 * relationship deep reports.
 */
export default function MadeWithInfoNote({
  generatedAt,
  inputsChanged,
}: {
  generatedAt: string | null;
  inputsChanged: boolean | null;
}) {
  const { locale, messages } = useLocale();
  const c = messages.common;
  const date = generatedAt
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        ...(locale === "ko-KR" ? { timeZone: "Asia/Seoul" } : {}),
      }).format(new Date(generatedAt))
    : null;
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface/60 px-4 py-2.5 text-xs leading-relaxed text-on-surface-variant">
      <p>{date ? c.madeWithInfoNote(date) : c.madeWithInfoGeneric}</p>
      {inputsChanged ? <p className="mt-1 font-medium text-primary">{c.infoChangedSince}</p> : null}
    </div>
  );
}
