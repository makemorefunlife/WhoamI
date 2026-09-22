"use client";

import { motion } from "framer-motion";

type Props = {
  open: boolean;
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  /**
   * Optional second action, rendered as a full CTA button (not a dismiss
   * link) directly under the primary one. Used when the moment has two
   * genuinely parallel next steps (e.g. "view our relationship" vs "view
   * my personal analysis") rather than a single confirm + optional skip.
   */
  secondaryLabel?: string;
  onSecondary?: () => void;
};

/**
 * Shown once, right when a friend connection is actually established —
 * either to the person who just joined via an invite/connect link (name =
 * the sharer they connected with), or to the sharer once they accept a
 * pending connect request (name = the friend who joined). Deliberately
 * generic/reusable across both call sites rather than two bespoke modals,
 * since the shape (title/body/one or two actions) is identical — only the
 * copy and the actions differ.
 */
export default function ConnectionSuccessModal({
  open,
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-4">
      <div
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
        onClick={onSecondary ?? undefined}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="connection-success-title"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-[10000] w-full max-w-md rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 text-center shadow-2xl sm:p-8"
      >
        <h2
          id="connection-success-title"
          className="stitch-headline text-2xl font-bold text-primary"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {body}
        </p>

        <button
          type="button"
          onClick={onPrimary}
          className="stitch-cta-primary mt-6 w-full"
        >
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary ? (
          <button
            type="button"
            onClick={onSecondary}
            className="stitch-cta-secondary mt-3 w-full"
          >
            {secondaryLabel}
          </button>
        ) : null}
      </motion.div>
    </div>
  );
}
