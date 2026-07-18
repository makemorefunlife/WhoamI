"use client";

import { PRIMARY_AXIS_DEFINITIONS } from "@/lib/v2/framework/primaryAxisDefinitions";
import type { PrimaryAxesScores, PrimaryAxisKey } from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";

/** 로버블(Lovable) "Inner Compass" 레이더 차트 디자인을 이식. 순수 SVG, 라이브러리 불필요. */
const AXIS_ORDER: PrimaryAxisKey[] = [
  "structure",
  "connection",
  "stability",
  "growth",
  "adaptability",
  "autonomy",
];

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 118;
const RINGS = 4;

function polygonPoints(values: number[], axes: number) {
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
      const r = (Math.max(0, Math.min(100, v)) / 100) * RADIUS;
      const x = CENTER + Math.cos(angle) * r;
      const y = CENTER + Math.sin(angle) * r;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function DeepEssenceRadarChart({
  current,
  potential,
  locale,
  currentLabel,
  potentialLabel,
}: {
  current: PrimaryAxesScores;
  potential: PrimaryAxesScores;
  locale: Locale;
  currentLabel: string;
  potentialLabel: string;
}) {
  const n = AXIS_ORDER.length;
  const currentValues = AXIS_ORDER.map((k) => current[k]);
  const potentialValues = AXIS_ORDER.map((k) => potential[k]);
  const isKo = locale === "ko-KR";

  const rings = Array.from({ length: RINGS }, (_, i) => {
    const r = ((i + 1) / RINGS) * RADIUS;
    return Array.from({ length: n }, (_, j) => {
      const angle = (Math.PI * 2 * j) / n - Math.PI / 2;
      return `${(CENTER + Math.cos(angle) * r).toFixed(2)},${(CENTER + Math.sin(angle) * r).toFixed(2)}`;
    }).join(" ");
  });

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full max-w-[320px]"
        role="img"
        aria-label={isKo ? "현재 상태 대비 본질적 잠재력 레이더 차트" : "Current state versus essence potential radar chart"}
      >
        {rings.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="var(--color-outline-variant)"
            strokeWidth={1}
          />
        ))}
        {AXIS_ORDER.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const x = CENTER + Math.cos(angle) * RADIUS;
          const y = CENTER + Math.sin(angle) * RADIUS;
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="var(--color-outline-variant)"
              strokeWidth={1}
            />
          );
        })}
        <polygon
          points={polygonPoints(potentialValues, n)}
          fill="rgba(196, 154, 156, 0.22)"
          stroke="var(--color-accent-rose)"
          strokeWidth={1.25}
        />
        <polygon
          points={polygonPoints(currentValues, n)}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={1.75}
        />
        {currentValues.map((v, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = (Math.max(0, Math.min(100, v)) / 100) * RADIUS;
          const x = CENTER + Math.cos(angle) * r;
          const y = CENTER + Math.sin(angle) * r;
          return (
            <circle key={i} cx={x} cy={y} r={2.75} fill="var(--color-primary)" />
          );
        })}
        {AXIS_ORDER.map((key, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const lr = RADIUS + 24;
          const x = CENTER + Math.cos(angle) * lr;
          const y = CENTER + Math.sin(angle) * lr;
          const anchor =
            Math.abs(Math.cos(angle)) < 0.2
              ? "middle"
              : Math.cos(angle) > 0
                ? "start"
                : "end";
          return (
            <text
              key={key}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fill="var(--color-on-surface-variant)"
              style={{ fontSize: 10.5, letterSpacing: "0.06em" }}
            >
              {isKo ? PRIMARY_AXIS_DEFINITIONS[key].koLabel : PRIMARY_AXIS_DEFINITIONS[key].label}
            </text>
          );
        })}
      </svg>
      <div className="mt-4 flex items-center gap-5 text-[11px] tracking-[0.08em] text-on-surface-variant">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-[2px] w-4 bg-primary" />
          {currentLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="border-accent-rose inline-block h-2 w-4 border bg-[rgba(196,154,156,0.22)]" />
          {potentialLabel}
        </span>
      </div>
    </div>
  );
}
