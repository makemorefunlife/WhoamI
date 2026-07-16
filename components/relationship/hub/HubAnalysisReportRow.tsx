"use client";

import { RelationshipKindBadge } from "@/components/relationship/RelationshipKindBadge";
import type { HubAnalysisFeedItem } from "@/lib/relationship/hubAnalysisFeed";
import { useMessages } from "@/lib/i18n/LocaleProvider";

type Props = {
  item: HubAnalysisFeedItem;
  onOpen: (item: HubAnalysisFeedItem) => void;
  className?: string;
};

/** Relation hub — minimal analysis report list row */
export default function HubAnalysisReportRow({
  item,
  onOpen,
  className = "",
}: Props) {
  const messages = useMessages();
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={messages.hub.reportRowAria(item.partner_name)}
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
          {messages.hub.reportRowPartnerLabel(item.partner_name)}
        </span>
        <RelationshipKindBadge kind={item.relationship_kind} className="shrink-0" />
      </div>
      <span
        className="shrink-0 text-xs font-semibold tracking-wide text-secondary transition group-hover:text-primary"
        aria-hidden
      >
        {messages.hub.viewReportCta}
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
