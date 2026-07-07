"use client";

import { PRIMARY_AXIS_ORDER, PRIMARY_AXIS_LABELS } from "@/lib/v2/framework/axisLabels";
import type { PrimaryAxisKey, PrimaryAxesScores } from "@/lib/v2/survey/types";

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 108;

function pointAt(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

function polygonPoints(
  scores: PrimaryAxesScores,
  scale = 1,
): string {
  return PRIMARY_AXIS_ORDER.map((key, i) => {
    const angle = (360 / PRIMARY_AXIS_ORDER.length) * i;
    const r = (scores[key] / 100) * RADIUS * scale;
    const { x, y } = pointAt(angle, r);
    return `${x},${y}`;
  }).join(" ");
}

export default function AxisRadarChart({
  scores,
  stroke = "#67B7FF",
  fill = "rgba(103,183,255,0.22)",
  label,
}: {
  scores: PrimaryAxesScores;
  stroke?: string;
  fill?: string;
  label?: string;
}) {
  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <div className="mx-auto w-full max-w-[300px]">
      {label ? (
        <p className="mb-3 text-center text-sm font-medium text-[rgba(255,255,255,0.88)]">
          {label}
        </p>
      ) : null}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto h-auto w-full"
        role="img"
        aria-label={label ?? "6축 레이더 차트"}
      >
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
          const labelPt = pointAt(angle, RADIUS + 22);
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

        <polygon
          points={polygonPoints(scores)}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
        />

        {PRIMARY_AXIS_ORDER.map((key, i) => {
          const angle = (360 / PRIMARY_AXIS_ORDER.length) * i;
          const r = (scores[key] / 100) * RADIUS;
          const { x, y } = pointAt(angle, r);
          return (
            <circle
              key={`dot-${key}`}
              cx={x}
              cy={y}
              r={3.5}
              fill={stroke}
            />
          );
        })}
      </svg>
    </div>
  );
}
