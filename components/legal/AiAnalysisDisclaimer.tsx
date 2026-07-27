"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

/** AI 분석 결과 하단 면책 — 작고 흐리게 */
export default function AiAnalysisDisclaimer({
  className = "",
}: {
  className?: string;
}) {
  const { messages } = useLocale();
  return (
    <p
      className={`text-xs leading-relaxed text-gray-400 ${className}`.trim()}
      role="note"
    >
      {messages.aiDisclaimer}
    </p>
  );
}
