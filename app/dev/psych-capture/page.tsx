"use client";

import { notFound } from "next/navigation";
import PsychMatchRadarChart from "@/components/relationship/reportLayout/PsychMatchRadarChart";
import ChemistryBreakdown from "@/components/relationship/reportLayout/ChemistryBreakdown";
import RelationshipScoreBoard from "@/components/relationship/reportLayout/RelationshipScoreBoard";
import RelationshipScoreDefinitions from "@/components/relationship/reportLayout/RelationshipScoreDefinitions";
import { ReportSurfaceProvider } from "@/components/relationship/reportLayout/ReportSurface";
import { getTabTheme } from "@/components/relationship/reportLayout/theme";
import { pickRelationshipIndexInsight } from "@/lib/relationship/relationshipIndexInsight";
import { SECONDARY_AXIS_KEYS } from "@/lib/v2/survey/types";
import type { RomanticPsychMatchAxisResult } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type { ScoreMetric } from "@/components/relationship/reportLayout/types";

const MOCK_AXIS_RESULTS: RomanticPsychMatchAxisResult[] = SECONDARY_AXIS_KEYS.map(
  (axis_key, index) => {
    const patterns: RomanticPsychMatchAxisResult["match_type"][] = [
      "similarity",
      "similarity",
      "complementary",
      "complementary",
      "complementary",
      "tension",
      "similarity",
      "complementary",
      "tension",
      "complementary",
      "tension",
    ];
    const scoreA = [72, 65, 48, 55, 40, 82, 70, 35, 88, 52, 76][index] ?? 50;
    const scoreB = [68, 70, 78, 42, 38, 25, 74, 80, 30, 60, 20][index] ?? 50;
    return {
      axis_key,
      score_a: scoreA,
      score_b: scoreB,
      gap: Math.abs(scoreA - scoreB),
      match_type: patterns[index] ?? "complementary",
    };
  },
);

const ROMANTIC_THEME = getTabTheme("romantic");

function romanticScores(
  affection: number,
  chemistry: number,
  sensitivity: number,
): ScoreMetric[] {
  return [
    { emoji: "🔥", label: "호감", value: affection, polarity: "higher_better" },
    { emoji: "🧩", label: "케미", value: chemistry, polarity: "higher_better" },
    { emoji: "⚡", label: "예민", value: sensitivity, polarity: "higher_worse" },
  ];
}

const INSIGHT_SAMPLES: Array<{
  label: string;
  affection: number;
  chemistry: number;
  sensitivity: number;
}> = [
  { label: "75/63/65", affection: 75, chemistry: 63, sensitivity: 65 },
  { label: "90/88/20", affection: 90, chemistry: 88, sensitivity: 20 },
  { label: "50/50/50", affection: 50, chemistry: 50, sensitivity: 50 },
  { label: "85/55/60", affection: 85, chemistry: 55, sensitivity: 60 },
  { label: "70/65/95", affection: 70, chemistry: 65, sensitivity: 95 },
];

export default function PsychCapturePage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <ReportSurfaceProvider surface="stitch">
      <main className="mx-auto max-w-lg space-y-10 bg-surface p-6 text-on-surface">
      <section id="radar-capture">
        <h1 className="mb-2 text-sm font-semibold text-on-surface-variant">
          1. PsychMatchRadarChart
        </h1>
        <PsychMatchRadarChart
          axisResults={MOCK_AXIS_RESULTS}
          personALabel="나"
          personBLabel="상대"
        />
      </section>

      <section id="chemistry-capture">
        <h1 className="mb-2 text-sm font-semibold text-on-surface-variant">
          2. ChemistryBreakdown (96 / 97)
        </h1>
        <ChemistryBreakdown
          scores={{
            emotional: 96,
            communication: 97,
            emotional_axis_count: 4,
            communication_axis_count: 3,
          }}
        />
      </section>

      <section id="chemistry-null-capture">
        <h1 className="mb-2 text-sm font-semibold text-on-surface-variant">
          3. ChemistryBreakdown (emotional=null, communication=null)
        </h1>
        <ChemistryBreakdown
          scores={{
            emotional: null,
            communication: null,
            emotional_axis_count: 0,
            communication_axis_count: 0,
          }}
        />
      </section>

      <section id="score-dashboard-capture">
        <h1 className="mb-2 text-sm font-semibold text-on-surface-variant">
          4. RelationshipScoreBoard (75/63/65)
        </h1>
        <RelationshipScoreBoard
          scores={romanticScores(75, 63, 65)}
          theme={ROMANTIC_THEME}
          sourceNote="사주 궁합 신호로 계산 · 0~100점"
          showTriScoreInsight
          footer={<RelationshipScoreDefinitions kind="romantic" />}
        />
      </section>

      <section id="insight-samples">
        <h1 className="mb-2 text-sm font-semibold text-on-surface-variant">
          5. 한 줄 인사이트 샘플
        </h1>
        <ul className="space-y-2 text-xs leading-relaxed text-on-surface-variant">
          {INSIGHT_SAMPLES.map((sample) => {
            const insight = pickRelationshipIndexInsight({
              affection: sample.affection,
              chemistry: sample.chemistry,
              sensitivity: sample.sensitivity,
            });
            return (
              <li
                key={sample.label}
                className="rounded-lg border border-outline-variant/30 bg-surface-container-low/60 px-3 py-2"
              >
                <p className="font-medium text-on-surface">{sample.label}</p>
                <p className="mt-1 text-[11px] text-on-surface-variant/80">
                  pattern: {insight.pattern} · spread: {insight.spread}
                </p>
                <p className="mt-1 text-sm text-on-surface">{insight.line}</p>
              </li>
            );
          })}
        </ul>
      </section>
      </main>
    </ReportSurfaceProvider>
  );
}
