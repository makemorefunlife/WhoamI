"use client";

import type { ReactNode } from "react";

export default function StitchSurveyShell({
  children,
  className = "stitch-survey",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${className} relative min-h-dvh text-on-surface`}>
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
