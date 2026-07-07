"use client";

import { ChevronRight } from "lucide-react";
import { hubPanelClass } from "@/components/relationship/hub/relationHubStyles";
import {
  formatHubAnalysisDate,
  hubAnalysisKindLabel,
  type HubAnalysisFeedItem,
} from "@/lib/relationship/hubAnalysisFeed";

const PREVIEW_LIMIT = 3;

type Props = {
  items: HubAnalysisFeedItem[];
  loading: boolean;
  onOpenLog: (item: HubAnalysisFeedItem) => void;
  onShowMore: () => void;
  totalCount?: number;
};

export default function HubAnalysisSection({
  items,
  loading,
  onOpenLog,
  onShowMore,
  totalCount,
}: Props) {
  const preview = items.slice(0, PREVIEW_LIMIT);
  const showMore =
    (totalCount ?? items.length) > PREVIEW_LIMIT || items.length > PREVIEW_LIMIT;

  return (
    <section className="space-y-4">
      <h2 className="stitch-headline text-lg text-primary">최근 분석</h2>
      <div className={`${hubPanelClass()} divide-y divide-outline-variant/15`}>
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-on-surface-variant">
            분석 기록 불러오는 중…
          </p>
        ) : preview.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-on-surface-variant">
            아직 분석 기록이 없어요. 관계 분석하기를 눌러 시작해 보세요.
          </p>
        ) : (
          preview.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenLog(item)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-surface-container-low/40 active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-on-surface">
                  {item.partner_name}
                </p>
                <p className="mt-0.5 text-xs text-secondary">
                  {hubAnalysisKindLabel(item)}
                </p>
                {item.summary_title ? (
                  <p className="mt-1 truncate text-xs text-on-surface-variant">
                    {item.summary_title}
                  </p>
                ) : null}
              </div>
              <time
                dateTime={item.created_at}
                className="shrink-0 text-xs text-on-surface-variant"
              >
                {formatHubAnalysisDate(item.created_at)}
              </time>
            </button>
          ))
        )}
        {showMore && !loading ? (
          <button
            type="button"
            onClick={onShowMore}
            className="flex w-full items-center justify-center gap-1 py-4 text-sm font-semibold text-on-surface-variant transition hover:text-primary"
          >
            More
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
