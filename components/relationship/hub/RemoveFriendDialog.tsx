"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";
import { useMessages } from "@/lib/i18n/LocaleProvider";

type Props = {
  open: boolean;
  partnerName: string;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function RemoveFriendDialog({
  open,
  partnerName,
  busy = false,
  error = null,
  onClose,
  onConfirm,
}: Props) {
  const messages = useMessages();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[260] flex items-end justify-center bg-primary/25 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className={`${hubSheetClass()} p-5 sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="stitch-headline text-xl text-primary">
            {messages.hub.removeFriendTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"
            aria-label={messages.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          {messages.hub.removeFriendConfirm(partnerName)}
        </p>
        {error ? (
          <p className="mt-3 rounded-xl border border-red-300/50 bg-red-50/80 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-full border border-outline-variant/50 py-3.5 text-sm font-semibold text-on-surface-variant disabled:opacity-45"
          >
            {messages.cta.cancel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="flex-1 rounded-full border border-red-400/40 bg-red-50 py-3.5 text-sm font-semibold text-red-800 disabled:opacity-45"
          >
            {busy ? messages.hub.deleting : messages.hub.removeFriendCta}
          </button>
        </div>
      </div>
    </div>
  );
}
