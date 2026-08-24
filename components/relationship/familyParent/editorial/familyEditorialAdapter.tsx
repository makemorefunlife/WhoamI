"use client";

/**
 * Family-only editorial visual skin — drop-in replacements for the shared
 * dark-card reportLayout primitives (RelationshipReportCard/Body/Paragraph/
 * Label/Inset) plus a hero, all built on the SAME rel-* / v4-* design tokens
 * and EditorialPrimitives shell already used by Romantic V4, Friend, Marriage,
 * and Work (components/relationship/workColleague/editorial/
 * workEditorialAdapter.tsx — same pattern, duplicated per-domain rather than
 * shared, matching that file's own convention).
 *
 * Visual skin only: prop signatures mirror the originals in
 * components/relationship/reportLayout/RelationshipReportCard.tsx exactly,
 * so every existing Family card component's JSX body is unchanged — only
 * the import source moves from reportLayout (dark) to this file (editorial).
 * No content, copy, section order, or data binding changes here.
 */
import type { ReactNode } from "react";
import { NameChip } from "@/components/relationship/shared/editorial/EditorialPrimitives";

export type FamilyReportCardVariant = "default" | "accent" | "warning" | "success" | "muted";

export function RelationshipReportBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 font-rel-sans text-[14.5px] leading-[1.75] text-rel-ink-soft ${className}`}>
      {children}
    </div>
  );
}

export function RelationshipReportParagraph({
  children,
  className = "",
  muted = false,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <p
      className={`whitespace-pre-wrap font-rel-sans leading-[1.75] ${
        muted ? "text-rel-ink-mute" : "text-rel-ink-soft"
      } ${className}`}
    >
      {children}
    </p>
  );
}

export function RelationshipReportLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`font-rel-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-rel-ink-mute ${className}`}>
      {children}
    </p>
  );
}

export function RelationshipReportInset({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-rel-line bg-rel-taupe-soft/30 p-4 ${className}`}>{children}</div>
  );
}

export default function RelationshipReportCard({
  title,
  tag,
  children,
  variant = "default",
  accentColor,
  className = "",
  id,
  showMarker = true,
}: {
  title?: string;
  tag?: string;
  children: ReactNode;
  variant?: FamilyReportCardVariant;
  accentColor?: string;
  className?: string;
  id?: string;
  showMarker?: boolean;
}) {
  const variantBox =
    variant === "warning"
      ? "border-v4-bad/25 bg-v4-bad-soft"
      : variant === "success"
        ? "border-v4-good/25 bg-v4-good-soft"
        : variant === "accent"
          ? "border-rel-deep/25 bg-rel-deep-soft"
          : variant === "muted"
            ? "border-rel-line bg-rel-taupe-soft/25"
            : "border-rel-line bg-rel-surface";

  const cleanTitle = title ? title.replace(/^[◤▼▶]\s*/, "") : "";

  return (
    <div id={id} className="mt-10">
      {title ? (
        <div className="mb-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3
              className="flex min-w-0 items-baseline gap-3 font-rel-serif text-[20px] font-normal tracking-[-0.01em] text-rel-ink sm:text-[23px]"
              style={accentColor ? { color: accentColor } : undefined}
            >
              {showMarker !== false && (
                <span className="text-[14px] text-[#8c7c72] shrink-0" aria-hidden>
                  ◤
                </span>
              )}
              <span className="min-w-0 flex-1">{cleanTitle}</span>
            </h3>
            {tag && (
              <span className="shrink-0 font-rel-sans text-[11px] uppercase tracking-[0.2em] text-rel-ink-mute">
                {tag}
              </span>
            )}
          </div>
          <div className="mt-3 h-px w-full bg-rel-line" />
        </div>
      ) : null}
      <article className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${variantBox} ${className}`}>
        {children}
      </article>
    </div>
  );
}

/** Editorial hero — mirrors Marriage's MarriageEditorialHero / Work's WorkEditorialHero. */
export function FamilyEditorialHero({
  headline,
  subtitle,
  names,
  gradeLabel,
  eyebrow,
}: {
  headline: string;
  subtitle?: string;
  names: [string, string];
  gradeLabel?: string;
  eyebrow?: string;
}) {
  const [nameA, nameB] = names;
  return (
    <header className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-[820px] px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        {eyebrow ? (
          <p className="font-rel-sans text-[10px] uppercase tracking-[0.3em] text-rel-deep">{eyebrow}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <NameChip name={nameA} side="a" />
          <span aria-hidden className="font-rel-serif text-[15px] text-rel-ink-mute">
            ×
          </span>
          <NameChip name={nameB} side="b" />
        </div>
        <h1 className="mt-6 max-w-[24ch] font-rel-serif text-[32px] leading-[1.22] tracking-[-0.02em] text-rel-ink sm:text-[46px]">
          {headline}
        </h1>
      </div>
    </header>
  );
}
