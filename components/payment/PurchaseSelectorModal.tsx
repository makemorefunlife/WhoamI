"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import PurchaseSelectorContent, { type PurchaseContext } from "@/components/payment/PurchaseSelectorContent";

type Props = {
  open: boolean;
  context: PurchaseContext;
  onClose: () => void;
  /** Called once per successful purchase; the caller decides what "entitlement now unlocked" means for its own flow (navigate, refetch, etc). */
  onSuccess?: (planId: string) => void;
  /** Forwarded as-is to PurchaseSelectorContent -- see its own doc comment. */
  successRedirectPath?: string;
};

/**
 * Large, centered purchase dialog -- same portal-to-body + framer-motion
 * pattern as components/relationship/hub/AddFriendSheet.tsx (see its own
 * comments for why: any ancestor with a lingering CSS transform would
 * otherwise silently become this overlay's containing block). Deliberately
 * NOT that component's bottom-sheet shell (hubSheetClass is capped at
 * max-w-md) -- this needs to be "big modal / full-screen selector" per
 * spec, so it gets its own wider, centered shell instead.
 */
export default function PurchaseSelectorModal({ open, context, onClose, onSuccess, successRedirectPath }: Props) {
  const { messages } = useLocale();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSuccess(planId: string) {
    onSuccess?.(planId);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-primary/25 p-4 backdrop-blur-[2px] sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="stitch-hero-panel flex max-h-[min(92dvh,100%)] w-full max-w-3xl flex-col overflow-hidden rounded-extra-large border border-outline-variant/35 bg-[#FAF7F0] p-0 shadow-[0_24px_48px_rgba(26,51,40,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-end px-5 pt-5 sm:px-6 sm:pt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
            aria-label={messages.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-2 sm:px-8 sm:pb-8">
          <PurchaseSelectorContent context={context} onSuccess={handleSuccess} successRedirectPath={successRedirectPath} />
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
