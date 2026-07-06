"use client";

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
  const [nameA, nameB] = headline.names ?? [];

  return (
    <header
      className={[
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-6 sm:p-8",
        theme.borderClass,
        theme.gradientFrom,
        theme.glowClass,
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
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: theme.accentMuted }}
        >
          {kindLabel}
        </p>
      ) : null}

      {nameA && nameB ? (
        <p className="mb-4 text-sm font-medium text-white/55">
          <span className="text-white/85">{nameA}</span>
          <span className="mx-2 text-white/30">×</span>
          <span className="text-white/85">{nameB}</span>
        </p>
      ) : null}

      <h2
        className="text-balance text-2xl font-bold leading-[1.25] tracking-tight text-white sm:text-3xl sm:leading-[1.2]"
        style={{ textShadow: `0 0 40px ${theme.accent}33` }}
      >
        {headline.title}
      </h2>

      {headline.subtitle ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/72 sm:text-[17px] sm:leading-[1.65]">
          {headline.subtitle}
        </p>
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
          <span className="text-xs leading-relaxed text-white/50">
            {headline.meta}
          </span>
        ) : null}
      </div>
    </header>
  );
}
