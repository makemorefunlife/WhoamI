"use client";

import type { ReactNode } from "react";

export type ReportCardVariant =
  | "default"
  | "accent"
  | "warning"
  | "success"
  | "muted";

const VARIANT_CLASS: Record<ReportCardVariant, string> = {
  default: "border-white/10 bg-white/[0.04]",
  accent: "border-white/12 bg-white/[0.05]",
  warning: "border-amber-400/25 bg-amber-950/20",
  success: "border-emerald-400/25 bg-emerald-950/15",
  muted: "border-white/8 bg-black/20",
};

export function RelationshipReportBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "space-y-4 text-[15px] leading-[1.75] text-white/78",
        className,
      ].join(" ")}
    >
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
      className={[
        "whitespace-pre-wrap leading-[1.75]",
        muted ? "text-white/62" : "text-white/78",
        className,
      ].join(" ")}
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
    <p
      className={[
        "text-xs font-semibold uppercase tracking-[0.12em] text-white/55",
        className,
      ].join(" ")}
    >
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
    <div
      className={[
        "rounded-xl border border-white/8 bg-black/20 p-4 sm:p-5",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function RelationshipReportCard({
  title,
  children,
  variant = "default",
  accentColor,
  className = "",
}: {
  title: string;
  children: ReactNode;
  variant?: ReportCardVariant;
  accentColor?: string;
  className?: string;
}) {
  return (
    <article
      className={[
        "rounded-2xl border p-5 sm:p-6",
        VARIANT_CLASS[variant],
        className,
      ].join(" ")}
    >
      <h3
        className="mb-4 text-base font-semibold leading-snug text-white/95 sm:text-[17px]"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {title}
      </h3>
      {children}
    </article>
  );
}
