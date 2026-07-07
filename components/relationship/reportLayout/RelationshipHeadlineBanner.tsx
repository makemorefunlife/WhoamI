"use client";

import type { ReactNode } from "react";
import { useReportTone } from "./ReportSurface";
import type { HeadlineProps } from "./types";
import type { RelationshipTabTheme } from "./theme";

export default function RelationshipHeadlineBanner({
  headline,
  theme,
  kindLabel,
}: {
  headline: HeadlineProps;
  theme: RelationshipTabTheme;
  kindLabel?: string;
}) {
  const tone = useReportTone();
  const [nameA, nameB] = headline.names ?? [];

  return (
    <header
      className={[
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-6 sm:p-8",
        theme.borderClass,
        theme.gradientFrom,
        tone.surface === "dark" ? theme.glowClass : "",
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-3xl"
        style={{ backgroundColor: theme.accent }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: theme.accent }}
        aria-hidden
      />

      {kindLabel ? (
        <p
          className={
            tone.surface === "stitch"
              ? "mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary"
              : "mb-3 text-[11px] font-semibold uppercase tracking-[0.28em]"
          }
          style={
            tone.surface === "stitch" ? undefined : { color: theme.accentMuted }
          }
        >
          {kindLabel}
        </p>
      ) : null}

      {nameA && nameB ? (
        <p className={tone.headlineNames}>
          <span className={tone.headlineNameStrong}>{nameA}</span>
          <span className={tone.surface === "stitch" ? "mx-2 text-outline-variant" : "mx-2 text-white/30"}>
            ×
          </span>
          <span className={tone.headlineNameStrong}>{nameB}</span>
        </p>
      ) : null}

      <h2
        className={tone.headlineTitle}
        style={
          tone.surface === "dark"
            ? { textShadow: `0 0 40px ${theme.accent}33` }
            : undefined
        }
      >
        {headline.title}
      </h2>

      {headline.subtitle ? (
        <p className={tone.headlineSubtitle}>{headline.subtitle}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {headline.badge ? (
          <span
            className="inline-flex rounded-full border px-3.5 py-1 text-xs font-semibold tracking-wide"
            style={{
              borderColor: `${theme.accent}55`,
              backgroundColor: `${theme.accent}18`,
              color: theme.accent,
            }}
          >
            {headline.badge}
          </span>
        ) : null}
        {headline.meta ? (
          <span className={tone.headlineMeta}>{headline.meta}</span>
        ) : null}
      </div>
    </header>
  );
}
