"use client";

import {
  DECISION_CATEGORIES,
  decisionCategoryReviewTabLabel,
  type DecisionCategoryFilter,
} from "@/lib/decision/categories";
import { stitchPillClass } from "@/components/decision/stitchPillClass";

type Props = {
  value: DecisionCategoryFilter;
  onChange: (value: DecisionCategoryFilter) => void;
  allLabel?: string;
  className?: string;
};

export default function DecisionCategoryTabs({
  value,
  onChange,
  allLabel = "전체 (All)",
  className = "",
}: Props) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onChange("all")}
        className={stitchPillClass(value === "all")}
      >
        {allLabel}
      </button>
      {DECISION_CATEGORIES.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={stitchPillClass(value === c.id)}
        >
          {decisionCategoryReviewTabLabel(c.id)}
        </button>
      ))}
    </div>
  );
}
