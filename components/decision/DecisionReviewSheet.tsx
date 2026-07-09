"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { DecisionEntry } from "@/lib/decision/types";
import { decisionCategoryLabel } from "@/lib/decision/categories";
import { StarRatingInput } from "@/components/decision/StarRating";

type Props = {
  entry: DecisionEntry | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, rating: number, note: string) => void;
};

export default function DecisionReviewSheet({
  entry,
  open,
  onClose,
  onSave,
}: Props) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!entry) return;
    setRating(entry.rating ?? 0);
    setNote(entry.note ?? "");
  }, [entry]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !entry) return null;

  const handleSubmit = () => {
    if (rating < 1) return;
    onSave(entry.id, rating, note);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-primary/25 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-review-title"
      onClick={onClose}
    >
      <div
        className="stitch-hero-panel w-full max-w-md rounded-extra-large border border-outline-variant/35 p-5 shadow-[0_24px_48px_rgba(26,51,40,0.18)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
              {decisionCategoryLabel(entry.category)}
            </p>
            <h2
              id="decision-review-title"
              className="stitch-headline mt-1 text-xl text-primary"
            >
              {entry.context}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-container-low"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          별점
        </p>
        <StarRatingInput value={rating} onChange={setRating} />

        <label className="mb-2 mt-5 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          리뷰 메모
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="이 결정에 대해 어떻게 느꼈나요?"
          className="w-full resize-none rounded-xl border-0 bg-surface-container-low/80 px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/35 focus:ring-2 focus:ring-primary/15"
        />

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-outline-variant/50 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={rating < 1}
            className="stitch-cta-primary flex-1 !min-w-0 !px-4 !py-3 !text-sm disabled:cursor-not-allowed disabled:opacity-45"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
