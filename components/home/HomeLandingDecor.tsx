"use client";

import { useEffect, useMemo, useState } from "react";

const STAR_COUNT = 28;

/** Deterministic [0,1) — pure substitute for Math.random in render */
function decorU01(seed: number, salt: number) {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** inline style 직렬화 정밀도 통일 (hydration-safe) */
function twinklePx(u: number) {
  return `${(u * 3.4 + 1.15).toFixed(5)}px`;
}
function twinklePct(u: number) {
  return `${(u * 100).toFixed(5)}%`;
}
function twinkleOpacity(u: number) {
  return (u * 0.55 + 0.32).toFixed(6);
}
function twinkleSec(u: number, add: number, mul: number) {
  return `${(u * mul + add).toFixed(5)}s`;
}

function scheduleDecorMount(onReady: () => void) {
  if (typeof requestIdleCallback !== "undefined") {
    const id = requestIdleCallback(onReady, { timeout: 500 });
    return () => cancelIdleCallback(id);
  }
  const id = window.setTimeout(onReady, 150);
  return () => window.clearTimeout(id);
}

/**
 * 홈 랜딩 장식(별·행성) — hero/CTA 이후 idle 시 mount.
 * 배경 그라데이션은 HomeContent 셸이 담당.
 */
export default function HomeLandingDecor() {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionPref = () => setReducedMotion(mq.matches);
    onMotionPref();
    mq.addEventListener("change", onMotionPref);

    const cancelMount = scheduleDecorMount(() => setVisible(true));

    return () => {
      mq.removeEventListener("change", onMotionPref);
      cancelMount();
    };
  }, []);

  const starStyles = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        width: twinklePx(decorU01(i, 1)),
        height: twinklePx(decorU01(i, 2)),
        top: twinklePct(decorU01(i, 3)),
        left: twinklePct(decorU01(i, 4)),
        opacity: twinkleOpacity(decorU01(i, 5)),
        animationDelay: twinkleSec(decorU01(i, 6), 0, 5),
        animationDuration: twinkleSec(decorU01(i, 7), 2, 3),
      })),
    [],
  );

  if (!visible) return null;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none"
        aria-hidden
      >
        <div className="absolute inset-0">
          {starStyles.map((style, i) => (
            <div
              key={i}
              className={[
                "absolute rounded-full bg-white",
                reducedMotion ? "" : "home-landing-decor-twinkle",
              ].join(" ")}
              style={style}
            />
          ))}
        </div>

        <div
          className={[
            "absolute top-20 left-10 h-24 w-24 rounded-full bg-gradient-to-br from-[#ff9a9e] to-[#fecfef] opacity-70 blur-[2px]",
            reducedMotion ? "" : "home-landing-decor-float-slow",
          ].join(" ")}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        </div>

        <div
          className={[
            "absolute bottom-20 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb] opacity-60 blur-[3px]",
            reducedMotion ? "" : "home-landing-decor-float-slower",
          ].join(" ")}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          <div className="absolute -inset-4 rotate-12 rounded-full border-4 border-[#fbc2eb]/40" />
        </div>

        <div
          className={[
            "absolute top-32 right-20 h-12 w-12 rounded-full bg-gradient-to-br from-[#ffecd2] to-[#fcb69f] opacity-70",
            reducedMotion ? "" : "home-landing-decor-float",
          ].join(" ")}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        </div>
      </div>

      <style jsx>{`
        @keyframes home-decor-twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes home-decor-float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        @keyframes home-decor-float-slow {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-10px) translateX(10px);
          }
        }
        @keyframes home-decor-float-slower {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(15px) translateX(-10px);
          }
        }
        :global(.home-landing-decor-twinkle) {
          animation: home-decor-twinkle 3s ease-in-out infinite;
        }
        :global(.home-landing-decor-float) {
          animation: home-decor-float 4s ease-in-out infinite;
        }
        :global(.home-landing-decor-float-slow) {
          animation: home-decor-float-slow 6s ease-in-out infinite;
        }
        :global(.home-landing-decor-float-slower) {
          animation: home-decor-float-slower 8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.home-landing-decor-twinkle),
          :global(.home-landing-decor-float),
          :global(.home-landing-decor-float-slow),
          :global(.home-landing-decor-float-slower) {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
