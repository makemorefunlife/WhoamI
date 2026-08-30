"use client";

import { useId, useState, type ReactNode } from "react";
import {
  resolveScoreBarAppearance,
  type ScorePolarity,
} from "@/lib/relationship/scoreBarAppearance";
import { pickRelationshipIndexInsight } from "@/lib/relationship/relationshipIndexInsight";
import { useReportTone } from "./ReportSurface";
import type { ScoreMetric } from "./types";
import type { RelationshipTabTheme } from "./theme";
import { useLocale, useMessages } from "@/lib/i18n/LocaleProvider";

function ScoreGauge({ metric }: { metric: ScoreMetric }) {
  const tone = useReportTone();
  const { locale } = useLocale();
  const polarity: ScorePolarity =
    metric.polarity ??
    (metric.tone === "alert" ? "higher_worse" : "higher_better");
  const pct = Math.max(0, Math.min(100, Math.round(metric.value)));
  const appearance = resolveScoreBarAppearance(pct, polarity, locale);
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
            stroke={appearance.ringColor}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
            style={{ opacity: appearance.ringOpacity }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={tone.scoreValue}>{pct}</span>
          <span className={tone.scoreSub}>/ 100</span>
        </div>
      </div>

      <div className={tone.scoreTrack}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${appearance.barGradient}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className={tone.scoreLabel}>
        <span className="mr-1">{metric.emoji}</span>
        {metric.label}
      </p>
      <p
        className={`mt-0.5 text-[10px] font-medium leading-snug ${appearance.hintClass}`}
      >
        {metric.hint ?? appearance.hint}
      </p>
    </div>
  );
}

function RelationshipIndexInsightLine({
  scores,
  conflictAnchorId,
}: {
  scores: ScoreMetric[];
  conflictAnchorId?: string;
}) {
  const tone = useReportTone();
  const t = useMessages().relationshipDrilldown.layout;
  if (scores.length !== 3) return null;

  const insight = pickRelationshipIndexInsight({
    affection: scores[0]!.value,
    chemistry: scores[1]!.value,
    sensitivity: scores[2]!.value,
  });

  const bodyClass =
    tone.surface === "stitch"
      ? "text-sm leading-relaxed text-on-surface"
      : "text-sm leading-relaxed text-white/78";

  const showConflictLink =
    insight.pattern === "sensitivity_high" && Boolean(conflictAnchorId);

  return (
    <p className={bodyClass}>
      {insight.line}
      {showConflictLink ? (
        <>
          {" "}
          <a
            href={`#${conflictAnchorId}`}
            className={
              tone.surface === "stitch"
                ? "text-primary underline decoration-primary/35 underline-offset-2"
                : "text-white/90 underline decoration-white/35 underline-offset-2"
            }
          >
            {t.conflictPatternLink}
          </a>
        </>
      ) : null}
    </p>
  );
}

function ScoreSourceNoteHint({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const tone = useReportTone();
  const t = useMessages().relationshipDrilldown.layout;
  const stitch = tone.surface === "stitch";

  return (
    <div className="absolute top-5 right-5 z-10 sm:top-6 sm:right-6">
      <button
        type="button"
        className={
          stitch
            ? "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-outline-variant/40 text-[11px] font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            : "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20 text-[11px] font-semibold text-white/55 transition-colors hover:bg-white/10 hover:text-white/80"
        }
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t.scoreCalcAria}
        onClick={() => setOpen((prev) => !prev)}
      >
        i
      </button>
      {open ? (
        <div
          id={panelId}
          role="tooltip"
          className={
            stitch
              ? "absolute top-6 right-0 w-[min(18rem,calc(100vw-3rem))] rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2.5 text-[11px] leading-relaxed text-on-surface-variant shadow-sm"
              : "absolute top-6 right-0 w-[min(18rem,calc(100vw-3rem))] rounded-xl border border-white/15 bg-black/80 px-3 py-2.5 text-[11px] leading-relaxed text-white/70 shadow-sm"
          }
        >
          {note}
        </div>
      ) : null}
    </div>
  );
}

export default function RelationshipScoreBoard({
  scores,
  theme,
  footer,
  sourceNote,
  showTriScoreInsight = false,
  conflictInsightAnchor,
}: {
  scores: ScoreMetric[];
  theme: RelationshipTabTheme;
  footer?: ReactNode;
  sourceNote?: string;
  showTriScoreInsight?: boolean;
  conflictInsightAnchor?: string;
}) {
  const tone = useReportTone();
  const t = useMessages().relationshipDrilldown.layout;

  if (scores.length === 0 && !footer) return null;

  return (
    <section
      className={[
        "relative rounded-2xl border bg-gradient-to-b to-transparent p-5 sm:p-6",
        theme.borderClass,
        theme.gradientFrom,
      ].join(" ")}
    >
      {sourceNote ? <ScoreSourceNoteHint note={sourceNote} /> : null}
      <div className="mb-5 flex items-end justify-between gap-3 pr-7">
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
            {t.scoreIndexEyebrow}
          </p>
          <h3 className={tone.sectionTitle}>{t.scoreIndexTitle}</h3>
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
            <ScoreGauge key={`${metric.emoji}-${metric.label}`} metric={metric} />
          ))}
        </div>
      ) : null}

      {showTriScoreInsight && scores.length > 0 ? (
        <div className="mt-4">
          <RelationshipIndexInsightLine
            scores={scores}
            conflictAnchorId={conflictInsightAnchor}
          />
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
