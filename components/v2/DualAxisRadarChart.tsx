"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PRIMARY_AXIS_EN_LABELS,
  PRIMARY_AXIS_ORDER,
  primaryAxisDescription,
  primaryAxisKoLabel,
} from "@/lib/v2/framework/axisLabels";
import type { PrimaryAxisKey, PrimaryAxesScores } from "@/lib/v2/survey/types";

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 112;

export const BLUEPRINT_CURRENT_STROKE = "#7B9BFF";
export const BLUEPRINT_CURRENT_FILL = "rgba(123, 155, 255, 0.22)";
export const BLUEPRINT_ESSENCE_STROKE = "#FF9A3C";
export const BLUEPRINT_ESSENCE_FILL = "rgba(255, 154, 60, 0.2)";

export const STITCH_CURRENT_STROKE = "#1a3328";
export const STITCH_CURRENT_FILL = "rgba(26, 51, 40, 0.2)";
export const STITCH_ESSENCE_STROKE = "#c49a6c";
export const STITCH_ESSENCE_FILL = "rgba(196, 154, 108, 0.28)";

export type RadarChartTheme = {
  gridStroke: string;
  axisStroke: string;
  baselineStroke: string;
  labelClass: string;
  labelActiveClass: string;
  currentStroke: string;
  currentFill: string;
  essenceStroke: string;
  essenceFill: string;
  legendTextClass: string;
};

const DARK_THEME: RadarChartTheme = {
  gridStroke: "rgba(255,255,255,0.1)",
  axisStroke: "rgba(255,255,255,0.12)",
  baselineStroke: "rgba(255,255,255,0.08)",
  labelClass: "fill-[rgba(255,255,255,0.65)] text-[9px]",
  labelActiveClass: "fill-white text-[9px] font-semibold",
  currentStroke: BLUEPRINT_CURRENT_STROKE,
  currentFill: BLUEPRINT_CURRENT_FILL,
  essenceStroke: BLUEPRINT_ESSENCE_STROKE,
  essenceFill: BLUEPRINT_ESSENCE_FILL,
  legendTextClass: "text-[rgba(255,255,255,0.82)]",
};

export const STITCH_RADAR_THEME: RadarChartTheme = {
  gridStroke: "rgba(26, 51, 40, 0.1)",
  axisStroke: "rgba(26, 51, 40, 0.14)",
  baselineStroke: "rgba(26, 51, 40, 0.08)",
  labelClass: "fill-primary/65 text-[9px]",
  labelActiveClass: "fill-primary text-[9px] font-semibold",
  currentStroke: STITCH_CURRENT_STROKE,
  currentFill: STITCH_CURRENT_FILL,
  essenceStroke: STITCH_ESSENCE_STROKE,
  essenceFill: STITCH_ESSENCE_FILL,
  legendTextClass: "text-on-surface",
};

function pointAt(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

function polygonPoints(
  scores: PrimaryAxesScores,
  axisOrder: PrimaryAxisKey[],
): string {
  return axisOrder
    .map((key, i) => {
      const angle = (360 / axisOrder.length) * i;
      const r = (scores[key] / 100) * RADIUS;
      const { x, y } = pointAt(angle, r);
      return `${x},${y}`;
    })
    .join(" ");
}

function SeriesLayer({
  scores,
  stroke,
  fill,
  glowId,
  axisOrder,
}: {
  scores: PrimaryAxesScores;
  stroke: string;
  fill: string;
  glowId?: string;
  axisOrder: PrimaryAxisKey[];
}) {
  return (
    <g>
      <polygon
        points={polygonPoints(scores, axisOrder)}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        filter={glowId ? `url(#${glowId})` : undefined}
      />
      {axisOrder.map((key, i) => {
        const angle = (360 / axisOrder.length) * i;
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

function levelScores(
  level: number,
  axisOrder: PrimaryAxisKey[],
): PrimaryAxesScores {
  return Object.fromEntries(axisOrder.map((k) => [k, level])) as PrimaryAxesScores;
}

function AxisDetailPanel({
  axisKey,
  onClose,
}: {
  axisKey: PrimaryAxisKey;
  onClose: () => void;
}) {
  const label = PRIMARY_AXIS_EN_LABELS[axisKey];
  return (
    <div
      className="mt-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low/70 px-4 py-3.5 text-left"
      role="region"
      aria-label={`${label} definition`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-primary">{label}</h3>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-lg leading-none text-on-surface-variant/60 transition hover:text-primary"
          aria-label="Close axis description"
        >
          ×
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-on-surface">
        {primaryAxisDescription(axisKey)}
      </p>
      <p className="mt-2 text-[11px] text-on-surface-variant/70">
        {primaryAxisKoLabel(axisKey)}
      </p>
    </div>
  );
}

export default function DualAxisRadarChart({
  current,
  essence,
  theme = DARK_THEME,
  axisOrder = PRIMARY_AXIS_ORDER,
  axisLabels = PRIMARY_AXIS_EN_LABELS,
  currentLabel = "Current",
  essenceLabel = "Essence",
  interactiveLabels = true,
}: {
  current: PrimaryAxesScores;
  essence: PrimaryAxesScores;
  theme?: RadarChartTheme;
  axisOrder?: PrimaryAxisKey[];
  axisLabels?: Record<PrimaryAxisKey, string>;
  currentLabel?: string;
  essenceLabel?: string;
  interactiveLabels?: boolean;
}) {
  const gridLevels = [20, 40, 60, 80, 100];
  const [activeAxis, setActiveAxis] = useState<PrimaryAxisKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const toggleAxis = useCallback((key: PrimaryAxisKey) => {
    setActiveAxis((prev) => (prev === key ? null : key));
  }, []);

  useEffect(() => {
    if (!activeAxis) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setActiveAxis(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [activeAxis]);

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-[320px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto h-auto w-full"
        role="img"
        aria-label={`${currentLabel} and ${essenceLabel} six-axis comparison radar chart`}
      >
        <defs>
          <filter id="essenceNeonGlow" x="-40%" y="-40%" width="180%" height="180%">
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
            points={polygonPoints(levelScores(level, axisOrder), axisOrder)}
            fill="none"
            stroke={theme.gridStroke}
            strokeWidth={1}
          />
        ))}

        {axisOrder.map((key, i) => {
          const angle = (360 / axisOrder.length) * i;
          const outer = pointAt(angle, RADIUS);
          const labelPt = pointAt(angle, RADIUS + 24);
          const isActive = activeAxis === key;
          return (
            <g key={key}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={outer.x}
                y2={outer.y}
                stroke={theme.axisStroke}
                strokeWidth={1}
              />
              {interactiveLabels ? (
                <text
                  x={labelPt.x}
                  y={labelPt.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={isActive ? theme.labelActiveClass : theme.labelClass}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleAxis(key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleAxis(key);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  aria-label={`${axisLabels[key]} — tap for definition`}
                >
                  {axisLabels[key]}
                </text>
              ) : (
                <text
                  x={labelPt.x}
                  y={labelPt.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={theme.labelClass}
                >
                  {axisLabels[key]}
                </text>
              )}
            </g>
          );
        })}

        <SeriesLayer
          scores={essence}
          stroke={theme.essenceStroke}
          fill={theme.essenceFill}
          glowId="essenceNeonGlow"
          axisOrder={axisOrder}
        />
        <SeriesLayer
          scores={current}
          stroke={theme.currentStroke}
          fill={theme.currentFill}
          glowId="currentGlow"
          axisOrder={axisOrder}
        />

        <polygon
          points={polygonPoints(levelScores(50, axisOrder), axisOrder)}
          fill="none"
          stroke={theme.baselineStroke}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      </svg>

      {activeAxis ? (
        <AxisDetailPanel
          axisKey={activeAxis}
          onClose={() => setActiveAxis(null)}
        />
      ) : interactiveLabels ? (
        <p className="mt-2 text-center text-[10px] text-on-surface-variant/70">
          Tap an axis label to see what it means
        </p>
      ) : null}

      <div className={`mt-4 flex items-center justify-center gap-6 text-xs ${theme.legendTextClass}`}>
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: theme.currentStroke }}
          />
          {currentLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: theme.essenceStroke }}
          />
          {essenceLabel}
        </span>
      </div>
    </div>
  );
}
