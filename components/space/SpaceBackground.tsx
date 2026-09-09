"use client";

import { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  showPlanet?: boolean;
  /** 얇은 궤도·신호 느낌 (CSS만) */
  showOrbit?: boolean;
  /** 아주 옅은 플로트 실루엣 */
  showProbe?: boolean;
  className?: string;
};

export default function SpaceBackground({
  children,
  showPlanet = true,
  showOrbit = true,
  showProbe = true,
  className = "",
}: Props) {
  return (
    <div
      className={clsx(
        "space-shell relative text-[rgba(255,255,255,0.95)]",
        "space-noise",
        showPlanet && "space-planet",
        className,
      )}
    >
      {showOrbit ? <div className="space-orbit" aria-hidden /> : null}
      {showProbe ? <div className="space-probe" aria-hidden /> : null}

      {/*
        No min-h-screen here (and .space-shell above no longer carries its
        own min-height either — see globals.css). This whole tree is always
        rendered inside ConditionalAppChrome/StitchAppChrome, whose own
        wrapper is already `flex min-h-dvh flex-col` with a `mt-auto`
        footer sibling after {children}. A SECOND, independent min-height
        here forced this div to be at least one full viewport tall
        regardless of real content, which pushed the footer/dock-clearance
        padding a whole extra screen below short content (e.g. the compact
        Essence Profile card) — the same nested-min-height bug already fixed
        once for StitchSurveyShell. A single outer min-h-dvh is enough.
      */}
      <div className="relative z-10 mx-auto w-full max-w-[420px] px-0">
        {children}
      </div>
    </div>
  );
}
