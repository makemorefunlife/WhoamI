"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";

export type PersonalGiftEntry = {
  code: string;
  status: "available" | "claimed" | "expired";
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Full inventory (any status) -- the modal itself filters to "available"
   *  so a caller never has to duplicate that filter. */
  gifts: PersonalGiftEntry[];
};

/**
 * Lightweight share sheet for an Annual member's own Personal-analysis
 * gift codes. Read-only against the existing gift inventory -- it never
 * creates, redeems, or otherwise mutates a gift_personal_coupons row; it
 * only copies the code / the existing /redeem?code=... link that the
 * backend already produces. See AccountCreditsSection.tsx (the "My
 * Credits" gift tile) for where this is opened from, and
 * app/account/billing/page.tsx for the same copy actions in the fuller
 * "My Access" gift list -- kept as separate call sites since the two
 * surfaces have different layouts, but reusing the exact same
 * i18n keys (myAccessGiftCopyCode/Link) so the wording never drifts.
 */
export default function GiftShareModal({ open, onClose, gifts }: Props) {
  const { messages, href } = useLocale();
  const copy = messages.account;
  const [copied, setCopied] = useState<{ code: string; kind: "code" | "link" } | null>(null);

  if (!open) return null;

  const available = gifts.filter((g) => g.status === "available");

  function flashCopied(code: string, kind: "code" | "link") {
    setCopied({ code, kind });
    setTimeout(() => {
      setCopied((prev) => (prev?.code === code && prev.kind === kind ? null : prev));
    }, 2000);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      flashCopied(code, "code");
    } catch {
      // Clipboard permission denied -- best-effort, same as the billing
      // page's inline gift-list copy actions.
    }
  }

  async function copyLink(code: string) {
    try {
      const path = href(`${ROUTES.redeem}?code=${encodeURIComponent(code)}`);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      await navigator.clipboard.writeText(`${origin}${path}`);
      flashCopied(code, "link");
    } catch {
      // Same best-effort reasoning as copyCode.
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-4">
      <button
        type="button"
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
        aria-label={messages.common.close}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-share-modal-title"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className="relative z-[10000] w-full max-w-sm rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-2xl"
      >
        <h3 id="gift-share-modal-title" className="text-base font-semibold text-on-surface">
          {copy.myAccessGiftsModalTitle}
        </h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          {copy.myAccessGiftsModalRemaining(available.length)}
        </p>

        <ul className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
          {available.map((gift) => (
            <li
              key={gift.code}
              className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5"
            >
              <p className="font-mono text-xs text-on-surface">{gift.code}</p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => void copyLink(gift.code)}
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {copied?.code === gift.code && copied.kind === "link"
                    ? copy.myAccessGiftCopiedLink
                    : copy.myAccessGiftCopyLink}
                </button>
                <span className="text-on-surface-variant">&middot;</span>
                <button
                  type="button"
                  onClick={() => void copyCode(gift.code)}
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {copied?.code === gift.code && copied.kind === "code"
                    ? copy.myAccessGiftCopiedCode
                    : copy.myAccessGiftCopyCode}
                </button>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="stitch-cta-secondary mt-5 w-full"
        >
          {messages.common.close}
        </button>
      </motion.div>
    </div>
  );
}
