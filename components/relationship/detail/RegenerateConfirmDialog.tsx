"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";

type Props = {
  open: boolean;
  onViewSaved: () => void;
  onCreateNew: () => void;
};

/**
 * Gates every "다시 분석하기" click behind an explicit choice — closing this
 * (or picking "기존 분석 보기") never calls the API; only "새로 분석하기" does,
 * and only that path ever sends force_regenerate:true (see
 * useRelationshipDetail.ts's confirmRegeneratePremium). This is what keeps a
 * saved analysis from being silently replaced, and a credit from being spent
 * without the user explicitly asking for it.
 */
export default function RegenerateConfirmDialog({
  open,
  onViewSaved,
  onCreateNew,
}: Props) {
  const { messages, href } = useLocale();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onViewSaved();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onViewSaved]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[260] flex items-end justify-center bg-black/50 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onViewSaved}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141225] p-5 shadow-[0_24px_48px_rgba(0,0,0,0.45)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold leading-snug text-white">
            {messages.report.regenerateModalTitle}
          </h2>
          <button
            type="button"
            onClick={onViewSaved}
            className="shrink-0 rounded-full p-1.5 text-[var(--space-text-muted)] hover:bg-white/5"
            aria-label={messages.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[var(--space-text-muted)]">
          {messages.report.regenerateModalBody}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onViewSaved}
            className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-white/90 transition hover:bg-white/5"
          >
            {messages.report.regenerateModalViewSaved}
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="flex-1 rounded-xl border border-[#ffd6a5]/35 bg-[#ffd6a5]/8 py-3 text-sm font-medium text-[#ffd6a5] transition hover:bg-[#ffd6a5]/12"
          >
            {messages.report.regenerateModalCreateNew}
          </button>
        </div>
        <p className="mt-4 text-center text-[11px] text-[var(--space-text-muted)]">
          {messages.report.regenerateModalFooterNotice}{" "}
          <span aria-hidden="true">·</span>{" "}
          <a href={href(ROUTES.refund)} className="underline underline-offset-2">
            {messages.report.regenerateModalRefundLink}
          </a>
        </p>
      </div>
    </div>
  );
}
