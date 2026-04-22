"use client";

import RelationshipBasicCards, {
  type RelationshipPerspective,
} from "./RelationshipBasicCards";

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
  return (
    <div className="space-y-3 rounded-2xl border border-[#ffd6a5]/25 bg-gradient-to-b from-[var(--space-card)]/90 to-[#0a0f1a]/40 p-1 sm:p-2">
      <p className="px-2 pt-2 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ffd6a5]/90">
        Premium · 관계 심화
      </p>
      <div className="px-1 pb-2 sm:px-3 sm:pb-4">
        <RelationshipBasicCards
          perspective={perspective}
          partnerName={partnerName}
          viewerName={viewerName}
        />
      </div>
    </div>
  );
}
