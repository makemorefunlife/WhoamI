"use client";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { Activity } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

type Props = {
  active: boolean;
  /**
   * flight: 무료 첫 로딩 — 우주선이 포물선을 따라 행성으로 천천히 이동
   * landing: 유료 등 — 행성 착륙·다리·분석 장비 씬
   */
  mode?: "flight" | "landing";
};

/** 궤적 이동 시간(초) — LLM 로딩과 맞춰 천천히 */
const FLIGHT_DURATION_SEC = 48;

function quadPoint(
  t: number,
  p0: readonly [number, number],
  p1: readonly [number, number],
  p2: readonly [number, number],
): [number, number] {
  const u = 1 - t;
  const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
  const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
  return [x, y];
}

function quadTangentDeg(
  t: number,
  p0: readonly [number, number],
  p1: readonly [number, number],
  p2: readonly [number, number],
): number {
  const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

const FLIGHT_LINES = [
  "궤도를 따라 행성 쪽으로 천천히 가고 있어요.",
  "탐사 신호를 맞추는 중이에요.",
  "목표 지점까지 여유 있게 이동 중이에요.",
  "거의 도착했어요. 잠시만요.",
];

function FlightJourney({ active }: { active: boolean }) {
  const uid = useId().replace(/:/g, "");
  const vb = useMemo(
    () => ({
      w: 360,
      h: 140,
      p0: [28, 118] as const,
      p1: [168, 14] as const,
      p2: [312, 54] as const,
    }),
    [],
  );

  const pathD = useMemo(
    () =>
      `M ${vb.p0[0]} ${vb.p0[1]} Q ${vb.p1[0]} ${vb.p1[1]} ${vb.p2[0]} ${vb.p2[1]}`,
    [vb],
  );

  const markerT = [0.18, 0.38, 0.58, 0.78] as const;
  const [lit, setLit] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const tMotion = useMotionValue(0);

  const rocketLeft = useTransform(
    tMotion,
    (t) => `${(quadPoint(t, vb.p0, vb.p1, vb.p2)[0] / vb.w) * 100}%`,
  );
  const rocketTop = useTransform(
    tMotion,
    (t) => `${(quadPoint(t, vb.p0, vb.p1, vb.p2)[1] / vb.h) * 100}%`,
  );
  const rocketRotate = useTransform(
    tMotion,
    (t) => quadTangentDeg(t, vb.p0, vb.p1, vb.p2) + 42,
  );

  useEffect(() => {
    if (!active) {
      setLit(0);
      setLineIdx(0);
      tMotion.set(0);
      return;
    }
    setLit(0);
    setLineIdx(0);
    tMotion.set(0);

    const stepMs = (FLIGHT_DURATION_SEC * 1000) / 5;
    const ids: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 4; i++) {
      ids.push(
        setTimeout(() => {
          setLit(i);
        }, i * stepMs),
      );
    }

    const fly = animate(tMotion, 1, {
      duration: FLIGHT_DURATION_SEC,
      ease: [0.15, 0.55, 0.2, 1],
    });

    return () => {
      ids.forEach(clearTimeout);
      fly.stop();
    };
  }, [active, tMotion]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setLineIdx((i) => (i + 1) % FLIGHT_LINES.length);
    }, 9000);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex min-h-[min(380px,72vh)] w-full max-w-[420px] flex-col items-center justify-center px-4">
      <div
        className="relative mx-auto w-full max-w-[min(100%,400px)]"
        style={{ aspectRatio: `${vb.w} / ${vb.h}` }}
      >
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${vb.w} ${vb.h}`}
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`planetGrad-f-${uid}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#c4a5ff" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#7a6bff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#2b1f55" />
            </linearGradient>
          </defs>

          <path
            d={pathD}
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="5 9"
          />

          {markerT.map((mt, i) => {
            const [mx, my] = quadPoint(mt, vb.p0, vb.p1, vb.p2);
            const ang = quadTangentDeg(mt, vb.p0, vb.p1, vb.p2);
            const on = lit >= i + 1;
            return (
              <g key={i} transform={`translate(${mx},${my}) rotate(${ang})`}>
                <rect
                  x="-10"
                  y="-2"
                  width="20"
                  height="3"
                  rx="1.5"
                  fill={on ? "#67B7FF" : "rgba(255,255,255,0.12)"}
                  style={{
                    filter: on
                      ? "drop-shadow(0 0 8px rgba(103,183,255,0.85))"
                      : undefined,
                  }}
                />
              </g>
            );
          })}

          <g transform={`translate(${vb.p2[0] - 36}, ${vb.p2[1] - 36})`}>
            <circle
              cx="36"
              cy="36"
              r="34"
              fill={`url(#planetGrad-f-${uid})`}
              style={{
                filter: "drop-shadow(0 0 18px rgba(122,107,255,0.45))",
              }}
            />
            <circle cx="28" cy="26" r="10" fill="white" opacity="0.22" />
          </g>
        </svg>

        <motion.div
          className="pointer-events-none absolute z-10 flex -translate-x-[40%] flex-row items-center"
          style={{
            left: rocketLeft,
            top: rocketTop,
            rotate: rocketRotate,
          }}
          aria-hidden
        >
          <motion.div
            className="order-first mr-0.5 h-5 w-12 shrink-0 rounded-full bg-gradient-to-l from-transparent via-[#6bb5ff]/50 to-[#a8d8ff]/85 blur-[1.5px] sm:h-6 sm:w-14"
            animate={active ? { scaleX: [0.5, 1.1, 1] } : { scaleX: 0.55 }}
            transition={{ duration: FLIGHT_DURATION_SEC, ease: "easeOut" }}
          />
          <span className="order-last block text-4xl leading-none sm:text-5xl">
            🚀
          </span>
        </motion.div>
      </div>

      <div className="mt-10 min-h-[3.5rem] text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={lineIdx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4 }}
            className="max-w-[22rem] text-[15px] font-medium leading-relaxed text-white/88"
          >
            {FLIGHT_LINES[lineIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="mt-2 text-xs text-white/45">
          무료 관측 결과를 준비하는 중이에요 · 잠시만 기다려 주세요
        </p>
      </div>
    </div>
  );
}

const LANDING_STATUS = [
  "🌍 행성 표면에 착륙했어요.",
  "🔗 행성-탐사선 시그널 페어링 중...",
  "📡 분석 자료 획득 중.",
  "⚡ 신호를 분석 중.",
];

function LandingJourney({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (!active) {
      queueMicrotask(() => {
        setPhase(0);
        setLineIdx(0);
      });
      return;
    }
    queueMicrotask(() => {
      setPhase(0);
      setLineIdx(0);
    });
    const t1 = window.setTimeout(() => setPhase(1), 400);
    const t2 = window.setTimeout(() => setPhase(2), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setLineIdx((i) => (i + 1) % LANDING_STATUS.length);
    }, 2600);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex min-h-[min(380px,72vh)] w-full max-w-[420px] flex-col items-center justify-center px-4">
      <div className="relative h-[260px] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050510] shadow-[0_0_60px_rgba(0,0,0,0.5)] sm:h-[280px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: [
              "radial-gradient(circle at 12% 18%, rgba(255,255,255,0.9) 0, transparent 1.5px)",
              "radial-gradient(circle at 88% 22%, rgba(255,255,255,0.5) 0, transparent 1.2px)",
              "radial-gradient(circle at 40% 8%, rgba(139,124,255,0.35) 0, transparent 2px)",
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(103,183,255,0.12), transparent 55%)",
            ].join(","),
          }}
        />
        <div
          className="pointer-events-none absolute left-[10%] top-[12%] h-8 w-8 rounded-full bg-gradient-to-br from-slate-400/50 to-slate-700/40 opacity-50 blur-[0.5px]"
          aria-hidden
        />

        <svg
          className="pointer-events-none absolute bottom-[32%] left-1/2 z-[1] h-[120px] w-[min(92%,340px)] -translate-x-1/2 text-[#67B7FF]/35"
          viewBox="0 0 320 100"
          fill="none"
          aria-hidden
        >
          <motion.g
            animate={active ? { rotate: 360 } : { rotate: 0 }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ transformOrigin: "160px 88px" }}
          >
            <ellipse
              cx="160"
              cy="88"
              rx="148"
              ry="72"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 10"
            />
          </motion.g>
          <motion.ellipse
            cx="160"
            cy="88"
            rx="120"
            ry="58"
            stroke="rgba(103,183,255,0.5)"
            strokeWidth="1.5"
            animate={
              active ? { opacity: [0.35, 0.85, 0.35] } : { opacity: 0.4 }
            }
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>

        <div
          className="absolute -bottom-[8%] left-1/2 z-[2] h-[62%] w-[135%] -translate-x-1/2 rounded-[50%]"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 50% 0%, #d4a574 0%, #9a6b3a 42%, #3d2814 78%, transparent 100%)",
            boxShadow: "inset 0 -20px 40px rgba(0,0,0,0.35)",
          }}
          aria-hidden
        />
        <div
          className="absolute bottom-[6%] left-[18%] z-[2] h-3 w-3 rounded-full bg-black/20 blur-[1px]"
          aria-hidden
        />
        <div
          className="absolute bottom-[10%] right-[22%] z-[2] h-2 w-2 rounded-full bg-black/25"
          aria-hidden
        />

        <div
          className="absolute bottom-[14%] right-[20%] z-[3] flex items-end gap-0.5"
          aria-hidden
        >
          <div className="h-7 w-0.5 rounded-full bg-white/35" />
          <div className="mb-5 h-3 w-4 skew-x-[-8deg] rounded-sm bg-white/90 shadow-sm" />
        </div>

        <div className="absolute bottom-[48%] left-1/2 z-[4] flex -translate-x-1/2 flex-col items-center">
          <div className="mb-1 flex items-end justify-center gap-[3px]">
            {[12, 20, 8, 24, 14, 22, 10, 18, 14].map((h, i) => (
              <motion.div
                key={i}
                className="w-[3px] rounded-full bg-gradient-to-t from-[#67B7FF] to-[#a8d8ff]"
                animate={
                  active
                    ? {
                        height: [h * 0.35, h, h * 0.5, h * 0.8, h * 0.4],
                      }
                    : { height: h * 0.4 }
                }
                transition={{
                  duration: 1.2 + i * 0.07,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: i * 0.06,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium text-[#67B7FF]/80">
            <Activity className="h-3 w-3" strokeWidth={2} aria-hidden />
            <span className="tracking-wide">SIGNAL</span>
          </div>
          <div className="mt-0.5 h-6 w-px bg-gradient-to-b from-[#67B7FF]/60 to-transparent" />
        </div>

        <div className="absolute bottom-[11%] left-1/2 z-[5] flex -translate-x-1/2 flex-col items-center">
          <motion.div
            className="relative flex flex-col items-center"
            initial={false}
            animate={
              active
                ? {
                    y: phase >= 1 ? 0 : -14,
                    scale: phase >= 1 ? 1 : 0.92,
                  }
                : { y: 0, scale: 1 }
            }
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <span
              className="block text-[2.75rem] leading-none sm:text-[3.25rem]"
              style={{ transform: "rotate(-48deg)" }}
              aria-hidden
            >
              🚀
            </span>
            <div className="absolute -bottom-1 flex w-[4.5rem] justify-between px-1">
              <motion.div
                className="h-4 w-1.5 origin-top rounded-sm bg-gradient-to-b from-slate-400 to-slate-600"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: phase >= 2 ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              />
              <motion.div
                className="h-4 w-1.5 origin-top rounded-sm bg-gradient-to-b from-slate-400 to-slate-600"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: phase >= 2 ? 1 : 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 18,
                  delay: 0.12,
                }}
              />
            </div>
          </motion.div>

          <motion.div
            className="-mt-1 h-6 w-14 rounded-full bg-gradient-to-t from-orange-500/90 via-amber-400/50 to-transparent blur-md"
            animate={
              active && phase >= 1
                ? { opacity: [0.45, 0.95, 0.5], scaleX: [0.85, 1.05, 0.9] }
                : { opacity: 0.3 }
            }
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-8 min-h-[3rem] text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={lineIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            className="max-w-[22rem] text-[15px] font-medium leading-relaxed text-white/88"
          >
            {LANDING_STATUS[lineIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="mt-2 text-xs text-white/40">
          심층 리포트를 준비하는 중이에요
        </p>
      </div>
    </div>
  );
}

export default function SurveyAnalyzingJourney({
  active,
  mode = "flight",
}: Props) {
  if (mode === "landing") {
    return <LandingJourney active={active} />;
  }
  return <FlightJourney active={active} />;
}
