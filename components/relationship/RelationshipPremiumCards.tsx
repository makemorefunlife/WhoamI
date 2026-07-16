"use client";

import RelationshipBasicCards, {
  type RelationshipPerspective,
} from "./RelationshipBasicCards";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** 유료: 카드 여백·본문을 조금 더 넉넉히 (내용 구조는 동일) */
export default function RelationshipPremiumCards({
  perspective,
  partnerName,
  viewerName,
}: {
  perspective: RelationshipPerspective | null;
  partnerName: string;
  viewerName?: string;
}) {
  const { messages } = useLocale();
  const hasContent = Boolean(perspective && Object.keys(perspective).length > 0);

  return (
    <div className="space-y-3 rounded-2xl border border-[#ffd6a5]/25 bg-gradient-to-b from-[var(--space-card)]/90 to-[#0a0f1a]/40 p-1 sm:p-2">
      <p className="px-2 pt-2 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ffd6a5]/90">
        {messages.report.premiumEyebrow}
      </p>
      <div className="px-1 pb-2 sm:px-3 sm:pb-4">
        {hasContent ? (
          <RelationshipBasicCards
            perspective={perspective}
            partnerName={partnerName}
            viewerName={viewerName}
            emptyMessage={false}
          />
        ) : (
          <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
            {messages.report.premiumEmptyGeneric}
            <br />
            <span className="text-xs">{messages.report.premiumEmptyGenerateHint}</span>
          </p>
        )}
      </div>
    </div>
  );
}
