"use client";

import type { RomanticPsychMatchAxisResult } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  psychMatchAxisKoLabel,
  scoreToBlendedAxisRatio,
} from "@/lib/relationship/psychMatch";
import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import { SECONDARY_AXIS_KEYS } from "@/lib/v2/survey/types";

const SIZE = 360;
const CENTER = SIZE / 2;
const RADIUS = 128;
const GRID_FRACTIONS = [0.25, 0.5, 0.75, 1];
const GAP_HIGHLIGHT_MIN = 12;

const SECONDARY_AXIS_KEY_SET = new Set<string>(SECONDARY_AXIS_KEYS);

/** 사람 폴리곤 — 나=#c49a6c, 상대=#587A8E(연하게) */
const PERSON_A_FILL = "rgba(196, 154, 108, 0.24)";
const PERSON_A_STROKE = "rgba(196, 154, 108, 0.95)";
const PERSON_A_DOT = "rgba(196, 154, 108, 1)";
const PERSON_B_FILL = "rgba(88, 122, 142, 0.18)";
const PERSON_B_STROKE = "rgba(88, 122, 142, 0.65)";
const PERSON_B_DOT = "rgba(88, 122, 142, 0.85)";

const GRID_STROKE = "rgba(34, 31, 43, 0.06)";
const GRID_STROKE_WIDTH = 0.75;

type AxisMatchType = RomanticPsychMatchAxisResult["match_type"];

const AXIS_STYLE: Record<
  AxisMatchType,
  { spoke: string; label: string; legend: string }
> = {
  tension: {
    spoke: "#B42318",
    label: "#B42318",
    legend: "#B42318",
  },
  similarity: {
    spoke: "rgba(42, 148, 98, 0.92)",
    label: "#2A9462",
    legend: "#2A9462",
  },
  complementary: {
    spoke: GRID_STROKE,
    label: "rgba(34, 31, 43, 0.38)",
    legend: GRID_STROKE,
  },
};

function pointAt(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

function resolveAxisKey(axisKey: string): SecondaryAxisKey | null {
  return SECONDARY_AXIS_KEY_SET.has(axisKey)
    ? (axisKey as SecondaryAxisKey)
    : null;
}

function scoreToRadius(axisKey: string, score: number): number {
  const key = resolveAxisKey(axisKey);
  if (!key) {
    const fallback = Math.max(0, Math.min(100, score));
    return (fallback / 100) * RADIUS;
  }
  return scoreToBlendedAxisRatio(key, score) * RADIUS;
}

function polygonPoints(
  axisResults: RomanticPsychMatchAxisResult[],
  pickScore: (axis: RomanticPsychMatchAxisResult) => number,
): string {
  return axisResults
    .map((axis, index) => {
      const angle = (360 / axisResults.length) * index;
      const radius = scoreToRadius(axis.axis_key, pickScore(axis));
      const point = pointAt(angle, radius);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

function gridPolygon(fraction: number, axisCount: number): string {
  return Array.from({ length: axisCount })
    .map((_, index) => {
      const angle = (360 / axisCount) * index;
      const radius = fraction * RADIUS;
      const point = pointAt(angle, radius);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

function axisStyle(matchType: string) {
  return AXIS_STYLE[matchType as AxisMatchType] ?? AXIS_STYLE.complementary;
}

function LegendSwatch({
  color,
  variant = "dot",
}: {
  color: string;
  variant?: "dot" | "line";
}) {
  if (variant === "line") {
    return (
      <span
        className="inline-block h-0.5 w-4 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
    );
  }
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

function gapStrokeWidth(gap: number): number {
  if (gap >= 35) return 5.5;
  if (gap >= 25) return 4.5;
  if (gap >= 18) return 3.5;
  return 2.8;
}

function gapStrokeColor(
  gap: number,
  matchType: RomanticPsychMatchAxisResult["match_type"],
): string {
  if (matchType === "tension") return "#B42318";
  if (gap >= 28) return "#c2410c";
  return "rgba(196, 154, 108, 0.72)";
}

export default function PsychMatchRadarChart({
  axisResults,
  personALabel = "나",
  personBLabel = "상대",
}: {
  axisResults: RomanticPsychMatchAxisResult[];
  personALabel?: string;
  personBLabel?: string;
}) {
  if (!axisResults.length) return null;

  const topGaps = [...axisResults]
    .filter((axis) => axis.gap >= GAP_HIGHLIGHT_MIN)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-[380px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto h-auto w-full"
        role="img"
        aria-label="심리 11축 2인 오버레이 레이더 차트"
      >
        {GRID_FRACTIONS.map((fraction) => (
          <polygon
            key={fraction}
            points={gridPolygon(fraction, axisResults.length)}
            fill="none"
            stroke={GRID_STROKE}
            strokeWidth={GRID_STROKE_WIDTH}
          />
        ))}

        {axisResults.map((axis, index) => {
          const angle = (360 / axisResults.length) * index;
          const axisOuter = pointAt(angle, RADIUS);
          const labelPoint = pointAt(angle, RADIUS + 26);
          const style = axisStyle(axis.match_type);
          const isTension = axis.match_type === "tension";
          const isComplementary = axis.match_type === "complementary";
          const spokeWidth = isComplementary
            ? GRID_STROKE_WIDTH
            : isTension
              ? 1.8
              : 1.4;
          return (
            <g key={axis.axis_key}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={axisOuter.x}
                y2={axisOuter.y}
                stroke={style.spoke}
                strokeWidth={spokeWidth}
              />
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={style.label}
                fontSize={10}
                fontWeight={isTension ? 600 : 400}
              >
                {psychMatchAxisKoLabel(axis.axis_key)}
                {axis.axis_key === "conflict_style" ? "*" : ""}
              </text>
            </g>
          );
        })}

        <polygon
          points={polygonPoints(axisResults, (axis) => axis.score_b)}
          fill={PERSON_B_FILL}
          stroke={PERSON_B_STROKE}
          strokeWidth={2}
        />
        <polygon
          points={polygonPoints(axisResults, (axis) => axis.score_a)}
          fill={PERSON_A_FILL}
          stroke={PERSON_A_STROKE}
          strokeWidth={2}
        />

        {axisResults.map((axis, index) => {
          const gap = axis.gap;
          if (gap < GAP_HIGHLIGHT_MIN) return null;
          const angle = (360 / axisResults.length) * index;
          const rA = scoreToRadius(axis.axis_key, axis.score_a);
          const rB = scoreToRadius(axis.axis_key, axis.score_b);
          const rMin = Math.min(rA, rB);
          const rMax = Math.max(rA, rB);
          const p1 = pointAt(angle, rMin);
          const p2 = pointAt(angle, rMax);
          return (
            <line
              key={`gap-${axis.axis_key}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={gapStrokeColor(gap, axis.match_type)}
              strokeWidth={gapStrokeWidth(gap)}
              strokeLinecap="round"
              opacity={0.88}
            />
          );
        })}

        {axisResults.map((axis, index) => {
          const angle = (360 / axisResults.length) * index;
          const pointA = pointAt(angle, scoreToRadius(axis.axis_key, axis.score_a));
          const pointB = pointAt(angle, scoreToRadius(axis.axis_key, axis.score_b));
          return (
            <g key={`${axis.axis_key}-dots`}>
              <circle cx={pointA.x} cy={pointA.y} r={3.3} fill={PERSON_A_DOT} />
              <circle cx={pointB.x} cy={pointB.y} r={3.3} fill={PERSON_B_DOT} />
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex flex-col items-center gap-2.5 text-xs text-on-surface">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-2">
            <LegendSwatch color={PERSON_A_DOT} />
            {personALabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <LegendSwatch color={PERSON_B_DOT} />
            {personBLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-on-surface-variant">
          <span className="inline-flex items-center gap-2">
            <LegendSwatch color={AXIS_STYLE.tension.legend} variant="line" />
            긴장 축
          </span>
          <span className="inline-flex items-center gap-2">
            <LegendSwatch color={AXIS_STYLE.similarity.legend} variant="line" />
            유사 축
          </span>
          <span className="inline-flex items-center gap-2">
            <LegendSwatch color={AXIS_STYLE.complementary.legend} variant="line" />
            보완 축
          </span>
        </div>
        {axisResults.some((axis) => axis.axis_key === "conflict_style") ? (
          <p className="text-[10px] text-on-surface-variant">
            * 행동 기반 설문으로 측정한 참고 자료예요. 가볍게 참고만 해 주세요.
          </p>
        ) : null}
      </div>

      {topGaps.length > 0 ? (
        <div className="mt-4 w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low/80 px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-on-surface">
            차이가 큰 축
          </p>
          <ul className="space-y-1.5 text-[11px] leading-relaxed text-on-surface-variant">
            {topGaps.map((axis) => {
              const higher =
                axis.score_a > axis.score_b
                  ? personALabel
                  : axis.score_b > axis.score_a
                    ? personBLabel
                    : "비슷함";
              return (
                <li key={`gap-row-${axis.axis_key}`}>
                  <span className="font-medium text-on-surface">
                    {psychMatchAxisKoLabel(axis.axis_key)}
                  </span>
                  {" — "}
                  격차 <span className="tabular-nums font-medium">{axis.gap}</span>
                  점
                  {higher !== "비슷함" ? (
                    <>
                      {" · "}
                      <span className="text-secondary">{higher}</span> 쪽이 높음
                    </>
                  ) : null}
                  {axis.match_type === "tension" ? (
                    <span className="ml-1 text-rose-700">(긴장 축)</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
