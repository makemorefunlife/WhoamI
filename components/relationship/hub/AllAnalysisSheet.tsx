"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import {
  formatHubAnalysisDate,
  hubAnalysisKindLabel,
  type HubAnalysisFeedItem,
} from "@/lib/relationship/hubAnalysisFeed";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";

type Props = {
  open: boolean;
  items: HubAnalysisFeedItem[];
  loading: boolean;
  onClose: () => void;
  onOpenLog: (item: HubAnalysisFeedItem) => void;
};

export default function AllAnalysisSheet({
  open,
  items,
  loading,
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
      className="fixed inset-0 z-[105] flex items-end justify-center bg-primary/25 backdrop-blur-[2px]"
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
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onOpenLog(item);
                    onClose();
                  }}
                  className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 px-4 py-3.5 text-left transition hover:bg-surface-container-low active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-on-surface">
                      {item.partner_name}
                    </p>
                    <time className="shrink-0 text-xs text-on-surface-variant">
                      {formatHubAnalysisDate(item.created_at)}
                    </time>
                  </div>
                  <p className="mt-1 text-xs text-secondary">
                    {hubAnalysisKindLabel(item)}
                  </p>
                  {item.summary_title ? (
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {item.summary_title}
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
