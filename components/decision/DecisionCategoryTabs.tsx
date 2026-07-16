"use client";

import {
  DECISION_CATEGORIES,
  decisionCategoryReviewTabLabel,
  type DecisionCategoryFilter,
} from "@/lib/decision/categories";
import { stitchPillClass } from "@/components/decision/stitchPillClass";
import { useMessages } from "@/lib/i18n/LocaleProvider";

type Props = {
  value: DecisionCategoryFilter;
  onChange: (value: DecisionCategoryFilter) => void;
  allLabel?: string;
  className?: string;
};

export default function DecisionCategoryTabs({
  value,
  onChange,
  allLabel,
  className = "",
}: Props) {
  const messages = useMessages();
  const resolvedAllLabel = allLabel ?? messages.decision.allCategoriesLabel;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onChange("all")}
        className={stitchPillClass(value === "all")}
      >
        {resolvedAllLabel}
      </button>
      {DECISION_CATEGORIES.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={stitchPillClass(value === c.id)}
        >
          {decisionCategoryReviewTabLabel(c.id, messages)}
        </button>
      ))}
    </div>
  );
}
