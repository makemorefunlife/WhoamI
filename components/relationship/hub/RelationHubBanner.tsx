"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

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
  const { messages } = useLocale();
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="mb-5 overflow-hidden rounded-2xl border border-accent-rose/30 bg-accent-rose-soft/40 px-4 py-3.5 sm:px-5"
        >
          <div className="flex items-start gap-3">
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-on-surface-variant">
              {messages.hub.bannerText}
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary"
              aria-label={messages.hub.bannerDismiss}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
