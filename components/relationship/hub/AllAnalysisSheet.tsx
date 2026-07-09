"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import HubAnalysisReportRow from "@/components/relationship/hub/HubAnalysisReportRow";
import type { HubAnalysisFeedItem } from "@/lib/relationship/hubAnalysisFeed";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";

type Props = {
  open: boolean;
  items: HubAnalysisFeedItem[];
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onClose: () => void;
  onOpenLog: (item: HubAnalysisFeedItem) => void;
};

export default function AllAnalysisSheet({
  open,
  items,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
  onClose,
  onOpenLog,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[260] flex items-end justify-center bg-primary/25 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className={`${hubSheetClass()} max-h-[85dvh] w-full overflow-y-auto rounded-b-none p-5 sm:max-w-lg sm:rounded-extra-large`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="stitch-headline text-xl text-primary">분석 기록</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="rounded-full p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            불러오는 중…
          </p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            기록이 없어요.
          </p>
        ) : (
          <div className="space-y-3">
            <ul className={`${hubSheetClass()} divide-y divide-outline-variant/15 overflow-hidden`}>
              {items.map((item) => (
                <li key={item.id}>
                  <HubAnalysisReportRow
                    item={item}
                    onOpen={(log) => {
                      onOpenLog(log);
                      onClose();
                    }}
                    className="px-4"
                  />
                </li>
              ))}
            </ul>
            {hasMore ? (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="w-full rounded-xl border border-outline-variant/40 py-3 text-sm font-semibold text-on-surface-variant transition hover:border-secondary/40 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? "불러오는 중…" : "더 보기 (Load More)"}
              </button>
            ) : null}
          </div>
        )}
      </motion.div>
    </div>
  );
}
