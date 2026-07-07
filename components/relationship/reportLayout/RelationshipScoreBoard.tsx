"use client";

import type { ReactNode } from "react";
import { useReportTone } from "./ReportSurface";
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
  const tone = useReportTone();
  const pct = Math.max(0, Math.min(100, Math.round(metric.value)));
  const barGradient = TONE_BAR[metric.tone ?? "warm"];
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;
  const trackStroke =
    tone.surface === "stitch"
      ? "rgba(26, 51, 40, 0.12)"
      : "rgba(255,255,255,0.08)";

  return (
    <div className={tone.scoreCell}>
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
            stroke={trackStroke}
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
          <span className={tone.scoreValue}>{pct}</span>
          <span className={tone.scoreSub}>/ 100</span>
        </div>
      </div>

      <div className={tone.scoreTrack}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className={tone.scoreLabel}>
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
  const tone = useReportTone();

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
            className={
              tone.surface === "stitch"
                ? "text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary"
                : "text-[11px] font-semibold uppercase tracking-[0.22em]"
            }
            style={
              tone.surface === "stitch"
                ? undefined
                : { color: theme.accentMuted }
            }
          >
            Relationship Index
          </p>
          <h3 className={tone.sectionTitle}>한눈에 보는 관계 지수</h3>
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
        <div
          className={[
            "mt-5 space-y-3 border-t pt-5",
            tone.scoreFooterBorder,
          ].join(" ")}
        >
          {footer}
        </div>
      ) : null}
    </section>
  );
}
