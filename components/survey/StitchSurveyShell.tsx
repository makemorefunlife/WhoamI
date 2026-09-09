"use client";

import type { ReactNode } from "react";

export default function StitchSurveyShell({
  children,
  className = "stitch-survey",
}: {
  children: ReactNode;
  className?: string;
}) {
  // No min-h-dvh here: this shell is always rendered inside
  // ConditionalAppChrome/StitchAppChrome, whose own wrapper is already
  // `flex min-h-dvh flex-col` with a `mt-auto` footer. Forcing a SECOND,
  // independent min-h-dvh on this nested flex item made it at least one
  // full viewport tall regardless of actual content, so short reports (or
  // mostly-collapsed accordion sections) pushed the footer/dock-clearance
  // padding a whole extra screen below the real content — and iOS Safari
  // recomputing `dvh` live as its toolbar collapses/expands during scroll
  // made that gap visibly shift, which is what looked like the last CTA
  // buttons disappearing and reappearing. The fixed background layer below
  // doesn't need this div to have any height — `position: fixed` sizes to
  // the viewport on its own — so this can just take its natural content
  // height and let the single outer min-h-dvh own the "at least one screen"
  // guarantee.
  return (
    <div className={`${className} relative text-on-surface`}>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 100% 0%, rgba(58, 143, 110, 0.09), transparent 55%), radial-gradient(ellipse 70% 50% at 0% 100%, rgba(196, 154, 156, 0.12), transparent 50%), #faf7f0",
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
