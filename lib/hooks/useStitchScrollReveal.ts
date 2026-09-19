"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-reveal for Stitch-themed pages: fades/slides in any element
 * marked `data-stitch-reveal` inside the returned ref's subtree once it
 * enters the viewport. Shared across Stitch pages (landing, About, ...)
 * so the "stop-scroll" rhythm stays identical everywhere. Originally
 * defined inline in StitchLandingPage.tsx.
 */
export function useStitchScrollReveal() {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;

    const sections = root.querySelectorAll<HTMLElement>("[data-stitch-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("stitch-reveal-visible");
          }
        }
      },
      { threshold: 0.08 },
    );

    for (const el of sections) {
      el.classList.add("stitch-reveal");
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return mainRef;
}
