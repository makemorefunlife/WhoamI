"use client";

/**
 * Work Colleague-only editorial visual skin — drop-in replacements for the
 * shared dark-card reportLayout primitives (RelationshipReportCard/Body/
 * Paragraph/Label/Inset) plus a hero, all built on the SAME rel-* / v4-*
 * design tokens and EditorialPrimitives shell already used by Romantic V4,
 * Friend, and Marriage (components/relationship/marriage/editorial/
 * marriageEditorialAdapter.tsx — same pattern, duplicated per-domain rather
 * than shared, matching that file's own convention).
 *
 * Visual skin only: prop signatures mirror the originals in
 * components/relationship/reportLayout/RelationshipReportCard.tsx exactly,
 * so every existing Work card component's JSX body is unchanged — only the
 * import source moves from reportLayout (dark) to this file (editorial).
 * No content, copy, section order, or data binding changes here.
 */
import type { ReactNode } from "react";
import { NameChip } from "@/components/relationship/shared/editorial/EditorialPrimitives";

export type WorkReportCardVariant = "default" | "accent" | "warning" | "success" | "muted";

export function RelationshipReportBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 font-rel-sans text-[14.5px] leading-[1.85] text-rel-ink-soft ${className}`}>
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
      className={`whitespace-pre-wrap font-rel-sans leading-[1.85] ${
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
  children,
  variant = "default",
  accentColor,
  className = "",
  id,
  showMarker = true,
}: {
  title: string;
  children: ReactNode;
  variant?: WorkReportCardVariant;
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

  return (
    <article id={id} className={`rounded-2xl border p-5 sm:p-6 ${variantBox} ${className}`}>
      <h3
        className="mb-4 flex items-baseline gap-2 font-rel-serif text-[17px] leading-snug tracking-[-0.01em] text-rel-ink sm:text-[19px]"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {showMarker && (
          <span className="text-[12px] leading-none text-rel-deep shrink-0" aria-hidden>
            ◤
          </span>
        )}
        <span className="min-w-0 flex-1">{title}</span>
      </h3>
      {children}
    </article>
  );
}

/** Editorial hero — mirrors Marriage's MarriageEditorialHero / Friend's FriendHero. */
export function WorkEditorialHero({
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
      <div className="mx-auto w-full max-w-[880px] px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
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
        {subtitle ? (
          <p className="mt-5 max-w-[62ch] font-rel-sans text-[15px] leading-[1.85] text-rel-ink-soft">{subtitle}</p>
        ) : null}
        {gradeLabel ? (
          <span className="mt-6 inline-flex rounded-full border border-rel-deep/30 bg-rel-deep-soft px-3.5 py-1 font-rel-sans text-xs font-semibold tracking-wide text-rel-deep">
            {gradeLabel}
          </span>
        ) : null}
      </div>
    </header>
  );
}
