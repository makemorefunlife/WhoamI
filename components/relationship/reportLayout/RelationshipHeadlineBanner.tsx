"use client";

import type { ReactNode } from "react";
import { useReportTone } from "./ReportSurface";
import type { HeadlineProps } from "./types";
import type { RelationshipTabTheme } from "./theme";

export type RelationshipHeadlineVariant = "default" | "editorial";

export default function RelationshipHeadlineBanner({
  headline,
  theme,
  kindLabel,
  variant = "default",
}: {
  headline: HeadlineProps;
  theme: RelationshipTabTheme;
  kindLabel?: string;
  /** Additive-only. "editorial" is opt-in (Romantic); all other callers keep current spacing. */
  variant?: RelationshipHeadlineVariant;
}) {
  const tone = useReportTone();
  const [nameA, nameB] = headline.names ?? [];
  const editorial = variant === "editorial";

  return (
    <header
      className={[
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent",
        editorial ? "p-8 sm:p-12" : "p-6 sm:p-8",
        theme.borderClass,
        theme.gradientFrom,
        tone.surface === "dark" ? theme.glowClass : "",
      ].join(" ")}
    >
      <div
        className={[
          "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl",
          editorial ? "opacity-15" : "opacity-30",
        ].join(" ")}
        style={{ backgroundColor: theme.accent }}
        aria-hidden
      />
      <div
        className={[
          "pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full blur-3xl",
          editorial ? "opacity-10" : "opacity-20",
        ].join(" ")}
        style={{ backgroundColor: theme.accent }}
        aria-hidden
      />

      {kindLabel ? (
        <p
          className={[
            tone.surface === "stitch"
              ? "text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary"
              : "text-[11px] font-semibold uppercase tracking-[0.28em]",
            editorial ? "mb-5" : "mb-3",
          ].join(" ")}
          style={
            tone.surface === "stitch" ? undefined : { color: theme.accentMuted }
          }
        >
          {kindLabel}
        </p>
      ) : null}

      {nameA && nameB ? (
        <p className={[tone.headlineNames, editorial ? "mb-1" : ""].join(" ")}>
          <span className={tone.headlineNameStrong}>{nameA}</span>
          <span className={tone.surface === "stitch" ? "mx-2 text-outline-variant" : "mx-2 text-white/30"}>
            ×
          </span>
          <span className={tone.headlineNameStrong}>{nameB}</span>
        </p>
      ) : null}

      <h2
        className={[tone.headlineTitle, editorial ? "sm:leading-[1.18] tracking-tight" : ""].join(" ")}
        style={
          tone.surface === "dark"
            ? { textShadow: `0 0 40px ${theme.accent}33` }
            : undefined
        }
      >
        {headline.title}
      </h2>

      {headline.subtitle ? (
        <p className={[tone.headlineSubtitle, editorial ? "mt-6" : ""].join(" ")}>
          {headline.subtitle}
        </p>
      ) : null}

      <div className={["flex flex-wrap items-center gap-2", editorial ? "mt-7" : "mt-5"].join(" ")}>
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
