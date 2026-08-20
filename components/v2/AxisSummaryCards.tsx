"use client";

import { useState } from "react";
import {
  PRIMARY_AXIS_EN_LABELS,
  PRIMARY_AXIS_ORDER,
  primaryAxisDescription,
  primaryAxisKoLabel,
} from "@/lib/v2/framework/axisLabels";
import { buildAxisShortInterpretation } from "@/lib/v2/framework/axisInterpretation";
import type { PrimaryAxisKey, PrimaryAxesScores } from "@/lib/v2/survey/types";

function AxisSummaryCard({
  axisKey,
  score,
  locale,
}: {
  axisKey: PrimaryAxisKey;
  score: number;
  locale?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isKo = locale === "ko-KR";
  const label = isKo ? primaryAxisKoLabel(axisKey) : PRIMARY_AXIS_EN_LABELS[axisKey];

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low/50 px-4 py-3.5 text-left transition hover:border-primary/25 hover:bg-surface-container-low"
      aria-expanded={expanded}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
            {score}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
        {buildAxisShortInterpretation(axisKey, score, locale)}
      </p>
      {expanded ? (
        <div className="mt-3 border-t border-outline-variant/30 pt-3">
          <p className="text-sm leading-relaxed text-on-surface">
            {primaryAxisDescription(axisKey)}
          </p>
        </div>
      ) : null}
    </button>
  );
}

export default function AxisSummaryCards({
  scores,
  axisOrder = PRIMARY_AXIS_ORDER,
  title = "Axis summary",
  locale,
}: {
  scores: PrimaryAxesScores;
  axisOrder?: PrimaryAxisKey[];
  title?: string;
  locale?: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {axisOrder.map((key) => (
          <AxisSummaryCard
            key={key}
            axisKey={key}
            score={scores[key]}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
