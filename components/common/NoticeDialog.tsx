"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function NoticeDialog({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string | null;
  onClose: () => void;
}) {
  const { messages } = useLocale();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !message) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm leading-relaxed text-on-surface">{message}</p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="stitch-cta-primary !min-w-0 !px-5 !py-2 !text-xs"
          >
            {messages.common.close}
          </button>
        </div>
      </div>
    </div>
  );
}
