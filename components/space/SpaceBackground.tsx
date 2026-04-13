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

      <div className="relative z-10 mx-auto min-h-screen w-full max-w-[420px] px-0">
        {children}
      </div>
    </div>
  );
}
