"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * About-page-only scroll reveal: fades a block in once as it enters the
 * viewport (one-shot fade + translateY, ~700ms). Ported from the Lovable
 * "Inner Compass Reports" prototype's Reveal primitive
 * (src/components/report/v4/primitives.tsx) — deliberately not reusing the
 * site's whole-section useStitchScrollReveal hook, since this needs
 * per-element delay support for staggered grids. No other primitives from
 * that file are used here.
 */
export function AboutReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Lazily true when IntersectionObserver isn't available (e.g. very old
  // browsers / non-DOM test environments) so we never call setState
  // synchronously inside the effect body below.
  const [shown, setShown] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
