"use client";

import { RelationshipKindBadge } from "@/components/relationship/RelationshipKindBadge";
import type { HubAnalysisFeedItem } from "@/lib/relationship/hubAnalysisFeed";

type Props = {
  item: HubAnalysisFeedItem;
  onOpen: (item: HubAnalysisFeedItem) => void;
  className?: string;
};

/** 관계 허브 — 미니멀 분석 리포트 리스트 행 */
export default function HubAnalysisReportRow({
  item,
  onOpen,
  className = "",
}: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`${item.partner_name} 리포트 보기`}
      className={[
        "group flex w-full items-center justify-between gap-3 px-5 py-2.5 text-left transition",
        "hover:bg-surface-container-low/40 active:scale-[0.99]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-medium text-on-surface">
          with {item.partner_name}
        </span>
        <RelationshipKindBadge kind={item.relationship_kind} className="shrink-0" />
      </div>
      <span
        className="shrink-0 text-xs font-semibold tracking-wide text-secondary transition group-hover:text-primary"
        aria-hidden
      >
        View Report +
      </span>
    </button>
  );
}

export function HubAnalysisReportRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-outline-variant/15 px-5 py-2.5 last:border-b-0">
      <div className="h-4 w-40 rounded-md bg-outline-variant/20" />
      <div className="h-3 w-20 rounded-md bg-outline-variant/15" />
    </div>
  );
}
