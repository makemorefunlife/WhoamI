import type { CompareRuleOutput, RomanticRule, RomanticRuleContext } from "./types";
import {
  axisGap,
  dayStemIncludes,
  hasTenGod,
  higherAxis,
  secondaryAxisGap,
  strengthComplement,
} from "./types";

const BASE_ROWS: CompareRuleOutput["rowThemes"] = [
  { label: "감정 표현", focus: "마음을 드러내는 방식" },
  { label: "소통 스타일", focus: "대화·침묵 리듬" },
  { label: "갈등 대응", focus: "다툼 후 거리·회복" },
  { label: "에너지 패턴", focus: "활동·휴식 리듬" },
  { label: "애착·친밀감", focus: "다가감·확신" },
  { label: "함께 성장", focus: "목표·변화 속도" },
];

export const COMPARE_RULES: RomanticRule<CompareRuleOutput>[] = [
  {
    id: "compare_strength_roles",
    screen: 5,
    priority: 85,
    when: (ctx) => strengthComplement(ctx) != null,
    build: (ctx) => {
      const dir = strengthComplement(ctx)!;
      const [strong, soft] =
        dir === "ab"
          ? [ctx.nicknameA, ctx.nicknameB]
          : [ctx.nicknameB, ctx.nicknameA];
      return {
        ruleId: "compare_strength_roles",
        rowThemes: [
          { label: "버팀·의존", focus: `${strong} 신강 vs ${soft} 신약` },
          { label: "감정 표현", focus: `${soft} 표현 · ${strong} 수용` },
          { label: "갈등 대응", focus: "강한 쪽이 먼저 멈춤" },
          { label: "에너지", focus: ctx.strengthA.label.split("(")[0] ?? "리듬" },
          { label: "애착", focus: "든든함 vs 공감 필요" },
          { label: "성장", focus: "역할 분담형 보완" },
        ],
      };
    },
  },
  {
    id: "compare_axis_gaps",
    screen: 5,
    priority: 80,
    when: (ctx) =>
      axisGap(ctx, "connection") != null &&
      secondaryAxisGap(ctx, "conflict_style") != null,
    build: (ctx) => ({
      ruleId: "compare_axis_gaps",
      rowThemes: [
        { label: "친밀감", focus: `connection 격차 ${axisGap(ctx, "connection")}` },
        {
          label: "갈등 스타일",
          focus: `conflict 격차 ${secondaryAxisGap(ctx, "conflict_style")}`,
        },
        { label: "자율성", focus: `autonomy ${higherAxis(ctx, "autonomy") ?? "tie"}` },
        { label: "안정", focus: `stability ${higherAxis(ctx, "stability") ?? "tie"}` },
        { label: "성장", focus: `growth ${higherAxis(ctx, "growth") ?? "tie"}` },
        { label: "적응", focus: `adaptability ${higherAxis(ctx, "adaptability") ?? "tie"}` },
      ],
    }),
  },
  {
    id: "compare_ten_god_styles",
    screen: 5,
    priority: 75,
    when: (ctx) =>
      Object.keys(ctx.tenGodsA).length > 0 && Object.keys(ctx.tenGodsB).length > 0,
    build: (ctx) => {
      const topA = Object.entries(ctx.tenGodsA).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      const topB = Object.entries(ctx.tenGodsB).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      return {
        ruleId: "compare_ten_god_styles",
        rowThemes: [
          { label: "핵심 십성", focus: `${ctx.nicknameA} ${topA} · ${ctx.nicknameB} ${topB}` },
          { label: "감정 표현", focus: hasTenGod(ctx, "a", ["식신", "상관"]) ? "행동형" : "내향형" },
          { label: "소통", focus: hasTenGod(ctx, "b", ["정관", "편관"]) ? "원칙형" : "유연형" },
          { label: "갈등", focus: dayStemIncludes(ctx, "상극") ? "직접 충돌" : "완충형" },
          { label: "에너지", focus: ctx.pairAnalysis.aElementCounts.split(",")[0] ?? "—" },
          { label: "성장", focus: ctx.pairAnalysis.bElementCounts.split(",")[0] ?? "—" },
        ],
      };
    },
  },
  {
    id: "compare_day_stem",
    screen: 5,
    priority: 70,
    when: (ctx) =>
      dayStemIncludes(ctx, "상생") || dayStemIncludes(ctx, "상극"),
    build: (ctx) => ({
      ruleId: "compare_day_stem",
      rowThemes: [
        { label: "핵심 기질", focus: ctx.pairAnalysis.dayStemInteraction.replace(/\(.*?\)/g, "").trim() },
        { label: "메타포", focus: `${ctx.metaphorA} vs ${ctx.metaphorB}` },
        ...BASE_ROWS.slice(2),
      ],
    }),
  },
  {
    id: "compare_default",
    screen: 5,
    priority: 1,
    when: () => true,
    build: (ctx) => ({
      ruleId: "compare_default",
      rowThemes: BASE_ROWS.map((row, i) =>
        i === 0
          ? { ...row, focus: `${ctx.nicknameA} vs ${ctx.nicknameB}` }
          : row,
      ),
    }),
  },
];

export function resolveCompareRule(ctx: RomanticRuleContext): CompareRuleOutput {
  const ranked = [...COMPARE_RULES].sort((a, b) => b.priority - a.priority);
  for (const rule of ranked) {
    if (rule.when(ctx)) return rule.build(ctx);
  }
  return COMPARE_RULES[COMPARE_RULES.length - 1]!.build(ctx);
}
