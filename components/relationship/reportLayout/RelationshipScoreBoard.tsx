"use client";

import type { ReactNode } from "react";
import type { ScoreMetric } from "./types";
import type { RelationshipTabTheme } from "./theme";

const TONE_BAR: Record<NonNullable<ScoreMetric["tone"]>, string> = {
  warm: "from-orange-400/80 via-amber-300/90 to-[#ffd6a5]",
  cool: "from-[#67b7ff]/80 to-[#67b7ff]/55",
  alert: "from-amber-500/80 to-orange-400/70",
};

function ScoreGauge({
  metric,
  accent,
}: {
  metric: ScoreMetric;
  accent: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(metric.value)));
  const tone = metric.tone ?? "warm";
  const barGradient = TONE_BAR[tone];
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-black/25 px-4 py-5 backdrop-blur-sm">
      <div className="relative h-[5.5rem] w-[5.5rem]">
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 88 88"
          aria-hidden
        >
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="7"
          />
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke={accent}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
            style={{ opacity: 0.85 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-white">
            {pct}
          </span>
          <span className="text-[10px] font-medium text-white/45">/ 100</span>
        </div>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-3 text-center text-sm font-semibold text-white/90">
        <span className="mr-1">{metric.emoji}</span>
        {metric.label}
      </p>
    </div>
  );
}

export default function RelationshipScoreBoard({
  scores,
  theme,
  footer,
}: {
  scores: ScoreMetric[];
  theme: RelationshipTabTheme;
  footer?: ReactNode;
}) {
  if (scores.length === 0 && !footer) return null;

  return (
    <section
      className={[
        "rounded-2xl border bg-gradient-to-b to-transparent p-5 sm:p-6",
        theme.borderClass,
        theme.gradientFrom,
      ].join(" ")}
    >
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: theme.accentMuted }}
          >
            Relationship Index
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white/95">
            한눈에 보는 관계 지수
          </h3>
        </div>
      </div>

      {scores.length > 0 ? (
        <div
          className={[
            "grid gap-3",
            scores.length === 3
              ? "sm:grid-cols-3"
              : scores.length === 2
                ? "sm:grid-cols-2"
                : "grid-cols-1",
          ].join(" ")}
        >
          {scores.map((metric) => (
            <ScoreGauge
              key={`${metric.emoji}-${metric.label}`}
              metric={metric}
              accent={theme.accent}
            />
          ))}
        </div>
      ) : null}

      {footer ? (
        <div className="mt-5 space-y-3 border-t border-white/8 pt-5">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
