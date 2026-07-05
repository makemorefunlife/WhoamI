"use client";

import { PRIMARY_AXIS_ORDER, PRIMARY_AXIS_LABELS } from "@/lib/v2/framework/axisLabels";
import type { PrimaryAxisKey, PrimaryAxesScores } from "@/lib/v2/survey/types";

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 112;

export const BLUEPRINT_CURRENT_STROKE = "#7B9BFF";
export const BLUEPRINT_CURRENT_FILL = "rgba(123, 155, 255, 0.22)";
export const BLUEPRINT_INNATE_STROKE = "#FF9A3C";
export const BLUEPRINT_INNATE_FILL = "rgba(255, 154, 60, 0.2)";

function pointAt(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

function polygonPoints(scores: PrimaryAxesScores): string {
  return PRIMARY_AXIS_ORDER.map((key, i) => {
    const angle = (360 / PRIMARY_AXIS_ORDER.length) * i;
    const r = (scores[key] / 100) * RADIUS;
    const { x, y } = pointAt(angle, r);
    return `${x},${y}`;
  }).join(" ");
}

function SeriesLayer({
  scores,
  stroke,
  fill,
  glowId,
}: {
  scores: PrimaryAxesScores;
  stroke: string;
  fill: string;
  glowId?: string;
}) {
  return (
    <g>
      <polygon
        points={polygonPoints(scores)}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        filter={glowId ? `url(#${glowId})` : undefined}
      />
      {PRIMARY_AXIS_ORDER.map((key, i) => {
        const angle = (360 / PRIMARY_AXIS_ORDER.length) * i;
        const r = (scores[key] / 100) * RADIUS;
        const { x, y } = pointAt(angle, r);
        return (
          <circle
            key={key}
            cx={x}
            cy={y}
            r={3.5}
            fill={stroke}
            filter={glowId ? `url(#${glowId})` : undefined}
          />
        );
      })}
    </g>
  );
}

export default function DualAxisRadarChart({
  current,
  innate,
}: {
  current: PrimaryAxesScores;
  innate: PrimaryAxesScores;
}) {
  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <div className="mx-auto w-full max-w-[320px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto h-auto w-full"
        role="img"
        aria-label="Current와 Innate 6축 비교 레이더 차트"
      >
        <defs>
          <filter id="innateNeonGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="currentGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={polygonPoints(
              Object.fromEntries(
                PRIMARY_AXIS_ORDER.map((k) => [k, level]),
              ) as PrimaryAxesScores,
            )}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
        ))}

        {PRIMARY_AXIS_ORDER.map((key, i) => {
          const angle = (360 / PRIMARY_AXIS_ORDER.length) * i;
          const outer = pointAt(angle, RADIUS);
          const labelPt = pointAt(angle, RADIUS + 24);
          return (
            <g key={key}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={1}
              />
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-[rgba(255,255,255,0.65)] text-[9px]"
              >
                {PRIMARY_AXIS_LABELS[key as PrimaryAxisKey]}
              </text>
            </g>
          );
        })}

        {/* Innate 먼저(뒤), Current 위 */}
        <SeriesLayer
          scores={innate}
          stroke={BLUEPRINT_INNATE_STROKE}
          fill={BLUEPRINT_INNATE_FILL}
          glowId="innateNeonGlow"
        />
        <SeriesLayer
          scores={current}
          stroke={BLUEPRINT_CURRENT_STROKE}
          fill={BLUEPRINT_CURRENT_FILL}
          glowId="currentGlow"
        />

        {/* baseline 50 참고선 */}
        <polygon
          points={polygonPoints(
            Object.fromEntries(
              PRIMARY_AXIS_ORDER.map((k) => [k, 50]),
            ) as PrimaryAxesScores,
          )}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      </svg>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <span className="inline-flex items-center gap-2 text-[rgba(255,255,255,0.82)]">
          <span
            className="h-2.5 w-2.5 rounded-full shadow-[0_0_10px_rgba(123,155,255,0.65)]"
            style={{ backgroundColor: BLUEPRINT_CURRENT_STROKE }}
          />
          Current
        </span>
        <span className="inline-flex items-center gap-2 text-[rgba(255,255,255,0.82)]">
          <span
            className="h-2.5 w-2.5 rounded-full shadow-[0_0_12px_rgba(255,154,60,0.75)]"
            style={{ backgroundColor: BLUEPRINT_INNATE_STROKE }}
          />
          Innate
        </span>
      </div>
    </div>
  );
}
