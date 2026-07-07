"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const STORAGE_KEY = "ahaitsme_relation_hub_banner_dismissed";

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function readBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function dismissBanner(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "1");
}

export default function RelationHubBanner({ visible, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="mb-5 overflow-hidden rounded-2xl border border-secondary/25 bg-secondary/10 px-4 py-3.5 sm:px-5"
        >
          <div className="flex items-start gap-3">
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-primary">
              나와 친구의 관계를 분석하고 최고의 결정을 내려보세요!
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary"
              aria-label="배너 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
