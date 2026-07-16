"use client";

import DecisionStatusDot from "@/components/decision/DecisionStatusDot";
import { StarRatingDisplay } from "@/components/decision/StarRating";
import { formatDecisionDate } from "@/lib/decision/format";
import { decisionCategoryLabel } from "@/lib/decision/categories";
import { isDecisionReviewed, type DecisionEntry } from "@/lib/decision/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Props = {
  entry: DecisionEntry;
  onReview?: (entry: DecisionEntry) => void;
};

export default function DecisionReviewCard({ entry, onReview }: Props) {
  const { locale, messages } = useLocale();
  const reviewed = isDecisionReviewed(entry);
  const showStars = reviewed && entry.rating != null;
  const showDate = reviewed && entry.reviewedAt;

  return (
    <div className="rounded-xl p-4 transition hover:bg-surface-container-low/40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <DecisionStatusDot entry={entry} className="mt-1.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-on-surface">{entry.context}</p>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {decisionCategoryLabel(entry.category, messages)}
            </p>
            {showStars ? (
              <StarRatingDisplay rating={entry.rating!} className="mt-2" />
            ) : null}
          </div>
        </div>
        <div className="shrink-0 pt-0.5">
          {showDate ? (
            <time
              dateTime={entry.reviewedAt!}
              className="text-[11px] text-on-surface-variant/55"
            >
              {messages.decision.reviewedOn(formatDecisionDate(entry.reviewedAt!, locale))}
            </time>
          ) : !reviewed && onReview ? (
            <button
              type="button"
              onClick={() => onReview(entry)}
              className="rounded-full border border-secondary px-3.5 py-1.5 text-xs font-semibold text-secondary transition hover:bg-secondary hover:text-on-primary"
            >
              {messages.decision.reviewCta}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
