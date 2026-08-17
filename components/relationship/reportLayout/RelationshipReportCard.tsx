"use client";

import type { ReactNode } from "react";
import { useReportTone } from "./ReportSurface";

export type ReportCardVariant =
  | "default"
  | "accent"
  | "warning"
  | "success"
  | "muted";

export function RelationshipReportBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const tone = useReportTone();
  return (
    <div
      className={["space-y-4 text-[15px] leading-[1.75]", tone.body, className].join(
        " ",
      )}
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
  const tone = useReportTone();
  return (
    <p
      className={[
        "whitespace-pre-wrap leading-[1.75]",
        muted ? tone.muted : tone.body,
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
  const tone = useReportTone();
  return <p className={[tone.label, className].join(" ")}>{children}</p>;
}

export function RelationshipReportInset({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const tone = useReportTone();
  return <div className={[tone.inset, className].join(" ")}>{children}</div>;
}

export default function RelationshipReportCard({
  title,
  children,
  variant = "default",
  accentColor,
  className = "",
  id,
  showMarker = false,
}: {
  title: string;
  children: ReactNode;
  variant?: ReportCardVariant;
  accentColor?: string;
  className?: string;
  id?: string;
  showMarker?: boolean;
}) {
  const tone = useReportTone();
  const variantClass =
    variant === "accent"
      ? tone.cardAccent
      : variant === "muted"
        ? tone.cardMuted
        : variant === "warning"
          ? tone.surface === "stitch"
            ? "border-amber-300/40 bg-amber-50/80"
            : "border-amber-400/25 bg-amber-950/20"
          : variant === "success"
            ? tone.surface === "stitch"
              ? "border-emerald-300/40 bg-emerald-50/70"
              : "border-emerald-400/25 bg-emerald-950/15"
            : tone.cardDefault;

  return (
    <article
      id={id}
      className={["rounded-2xl border p-5 sm:p-6", variantClass, className].join(
        " ",
      )}
    >
      <h3
        className={["flex items-baseline gap-2 font-rel-serif", tone.cardTitle].join(" ")}
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
