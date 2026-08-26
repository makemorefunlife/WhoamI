"use client";

import type { ReactNode } from "react";
import { NameChip } from "@/components/relationship/shared/editorial/EditorialPrimitives";

export type MarriageReportCardVariant = "default" | "accent" | "warning" | "success" | "muted";

export function RelationshipReportBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 font-rel-sans text-[14.5px] leading-[1.75] text-[#5e5b56] ${className}`}>
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
        muted ? "text-[#8c827a]" : "text-[#5e5b56]"
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
    <p className={`font-rel-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8c827a] ${className}`}>
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
    <div className={`rounded-xl border border-[#e6e2dc] bg-[#f9f8f6] p-4 ${className}`}>{children}</div>
  );
}

/**
 * Marriage Report Card with Subtitle OUTSIDE and ABOVE the block.
 * Ensures consistent design across all sections:
 * 1. Title renders above the card block.
 * 2. Content block renders separately underneath.
 */
export default function RelationshipReportCard({
  title,
  children,
  variant = "default",
  accentColor,
  className = "",
  id,
  showMarker = true,
}: {
  title?: string;
  children: ReactNode;
  variant?: MarriageReportCardVariant;
  accentColor?: string;
  className?: string;
  id?: string;
  showMarker?: boolean;
}) {
  const variantBox =
    variant === "warning"
      ? "rounded-2xl border border-[#f5d0cc] bg-[#fdf6f5] p-5 sm:p-6 shadow-2xs"
      : variant === "success"
        ? "rounded-2xl border border-[#d6e2d8] bg-[#f4f7f4] p-5 sm:p-6 shadow-2xs"
        : variant === "accent"
          ? "rounded-2xl border border-[#1b3b2b]/20 bg-[#f4f7f4] p-5 sm:p-6 shadow-2xs"
          : variant === "muted"
            ? "rounded-2xl border border-[#e6e2dc] bg-[#f9f8f6] p-5 sm:p-6 shadow-2xs"
            : "rounded-2xl border border-[#e6e2dc] bg-white p-5 sm:p-6 shadow-2xs";

  const cleanTitle = title ? title.replace(/^[◤▼▶]\s*/, "").trim() : "";

  return (
    <div id={id} className="space-y-3">
      {cleanTitle ? (
        <div className="flex items-center gap-2 pt-1">
          {showMarker && (
            <span className="text-[13px] leading-none text-[#1b3b2b] shrink-0" aria-hidden>
              ◤
            </span>
          )}
          <h3
            className="font-rel-serif text-[17px] font-bold leading-snug tracking-[-0.01em] text-[#2c2b29] sm:text-[19px]"
            style={accentColor ? { color: accentColor } : undefined}
          >
            {cleanTitle}
          </h3>
        </div>
      ) : null}
      <article className={`${variantBox} ${className}`}>
        {children}
      </article>
    </div>
  );
}

/** Editorial hero — mirrors Friend's FriendHero / Romantic V4's HeroSection visual language. */
export function MarriageEditorialHero({
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
      <div className="mx-auto w-full max-w-[820px] px-5 pb-10 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        {eyebrow ? (
          <p className="font-rel-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#1b3b2b]">{eyebrow}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <NameChip name={nameA} side="a" />
          <span aria-hidden className="font-rel-serif text-[15px] text-[#8c827a]">
            ×
          </span>
          <NameChip name={nameB} side="b" />
        </div>
        <h1 className="mt-5 max-w-[24ch] font-rel-serif text-[28px] font-bold leading-[1.25] tracking-[-0.02em] text-[#2c2b29] sm:text-[40px]">
          {headline}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-[62ch] font-rel-sans text-[14.5px] leading-[1.85] text-[#5e5b56]">{subtitle}</p>
        ) : null}
        {gradeLabel ? (
          <span className="mt-5 inline-flex rounded-full border border-[#1b3b2b]/30 bg-[#1b3b2b]/10 px-3.5 py-1 font-rel-sans text-xs font-semibold tracking-wide text-[#1b3b2b]">
            {gradeLabel}
          </span>
        ) : null}
      </div>
    </header>
  );
}
