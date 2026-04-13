"use client";

import clsx from "clsx";

export default function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "glass-card rounded-[24px] px-5 py-6 sm:px-7 sm:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
