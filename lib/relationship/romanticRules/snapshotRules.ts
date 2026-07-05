import { humanizeDayStemInteraction } from "@/lib/relationship/romanticEverydayText";
import type { RomanticRule, RomanticRuleContext, SnapshotRuleOutput } from "./types";
import {
  combinedElementWeak,
  crossHits,
  dayStemIncludes,
  POSITIVE_CROSS,
  romanticCrossBodyContext,
  TENSION_CROSS,
} from "./types";

export const SNAPSHOT_RULES: RomanticRule<SnapshotRuleOutput>[] = [
  {
    id: "snapshot_grade_a_synergy",
    screen: 2,
    priority: 90,
    when: (ctx) =>
      ctx.grade === "A" &&
      crossHits(ctx, [...POSITIVE_CROSS]).length >= 1 &&
      dayStemIncludes(ctx, "상생"),
    build: (ctx) => ({
      ruleId: "snapshot_grade_a_synergy",
      grade: ctx.grade,
      keywords: ["시너지", ctx.metaphorA, ctx.metaphorB, "끌림"],
      gaugeLabel: "끌림과 안정이 함께",
      representativeLine: `궁합 등급 ${ctx.grade} — ${ctx.gradeReason}`,
    }),
  },
  {
    id: "snapshot_tension_balance",
    screen: 2,
    priority: 82,
    when: (ctx) => crossHits(ctx, [...TENSION_CROSS]).length >= 2,
    build: (ctx) => {
      const tension = crossHits(ctx, [...TENSION_CROSS]).length;
      return {
        ruleId: "snapshot_tension_balance",
        grade: ctx.grade,
        keywords: ["긴장", "조율", "일주", `${tension}신호`],
        gaugeLabel: "끌림과 마찰이 공존",
        representativeLine: `긴장 신호 ${tension}개 · ${ctx.gradeReason}`,
      };
    },
  },
  {
    id: "snapshot_element_gap",
    screen: 2,
    priority: 75,
    when: (ctx) => combinedElementWeak(ctx),
    build: (ctx) => ({
      ruleId: "snapshot_element_gap",
      grade: ctx.grade,
      keywords: ["오행", "보완", "함께 채움"],
      gaugeLabel: "함께 채워야 하는 에너지",
      representativeLine:
        ctx.pairAnalysis.combinedElementNote.split("|").pop()?.trim() ??
        ctx.gradeReason,
    }),
  },
  {
    id: "snapshot_day_stem_clash",
    screen: 2,
    priority: 70,
    when: (ctx) => dayStemIncludes(ctx, "상극"),
    build: (ctx) => {
      const { stemNameA, stemNameB } = romanticCrossBodyContext(ctx);
      return {
      ruleId: "snapshot_day_stem_clash",
      grade: ctx.grade,
      keywords: ["자극", "성장", ctx.metaphorA, ctx.metaphorB],
      gaugeLabel: "부딪히지만 성장하는 리듬",
      representativeLine: humanizeDayStemInteraction(
        ctx.pairAnalysis.dayStemInteraction,
        { a: stemNameA, b: stemNameB },
      ),
    };
    },
  },
  {
    id: "snapshot_default",
    screen: 2,
    priority: 1,
    when: () => true,
    build: (ctx) => ({
      ruleId: "snapshot_default",
      grade: ctx.grade,
      keywords: [ctx.metaphorA, ctx.metaphorB, "관계 리듬"],
      gaugeLabel: "두 사람만의 균형",
      representativeLine: ctx.gradeReason,
    }),
  },
];

export function resolveSnapshotRule(ctx: RomanticRuleContext): SnapshotRuleOutput {
  const ranked = [...SNAPSHOT_RULES].sort((a, b) => b.priority - a.priority);
  for (const rule of ranked) {
    if (rule.when(ctx)) return rule.build(ctx);
  }
  return SNAPSHOT_RULES[SNAPSHOT_RULES.length - 1]!.build(ctx);
}
