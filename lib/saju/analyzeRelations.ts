import { REF_RELATION_RULES } from "@/lib/hardcoded/sajuReferenceData";
import {
  type ChartContext,
  TRIO_BRANCH_GROUPS,
  chartHasAllBranches,
} from "@/lib/saju/chartContext";

export type RelationHit = {
  type: string;
  name: string;
  interpretation: string;
  priority: number;
};

type RelationRuleRow = {
  relation_type: string;
  code_a: string;
  code_b: string;
  result_code: string | null;
  meaning_ko: string | null;
  priority_score: number | null;
  description: string | null;
};

const PAIR_BRANCH_TYPES = [
  { type: "branch_six_combine", label: "육합" },
  { type: "branch_clash", label: "충" },
  { type: "branch_punishment", label: "형" },
  { type: "branch_break", label: "파" },
  { type: "branch_harm", label: "해" },
] as const;

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function findPairRule(
  rules: RelationRuleRow[],
  relationType: string,
  a: string,
  b: string,
): RelationRuleRow | null {
  const key = pairKey(a, b);
  return (
    rules.find(
      (r) =>
        r.relation_type === relationType &&
        pairKey(r.code_a, r.code_b) === key,
    ) ?? null
  );
}

function analyzeStemCombines(
  chart: ChartContext,
  rules: RelationRuleRow[],
): RelationHit[] {
  const hits: RelationHit[] = [];
  const seen = new Set<string>();
  const stems = chart.pillars.map((p) => p.stemCode);

  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const a = stems[i];
      const b = stems[j];
      const rule = findPairRule(rules, "stem_combine", a, b);
      if (!rule?.meaning_ko) continue;
      const dedupe = pairKey(a, b);
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      hits.push({
        type: "천간합",
        name: rule.description ?? `${a}${b}합`,
        interpretation: rule.meaning_ko,
        priority: rule.priority_score ?? 90,
      });
    }
  }

  return hits;
}

function analyzeTrioCombines(
  chart: ChartContext,
  rules: RelationRuleRow[],
  relationType: "branch_three_combine" | "branch_direction_combine",
  label: "삼합" | "방합",
): RelationHit[] {
  const hits: RelationHit[] = [];
  const seen = new Set<string>();

  const trioRules = rules.filter((r) => r.relation_type === relationType);
  const byResult = new Map<string, RelationRuleRow>();
  for (const r of trioRules) {
    if (r.result_code && !byResult.has(r.result_code)) {
      byResult.set(r.result_code, r);
    }
  }

  for (const [resultCode, rule] of byResult) {
    const fullGroup = TRIO_BRANCH_GROUPS[resultCode];
    if (!fullGroup || !chartHasAllBranches(chart, fullGroup)) continue;
    if (seen.has(resultCode)) continue;
    seen.add(resultCode);

    hits.push({
      type: label,
      name: rule.description ?? resultCode,
      interpretation: rule.meaning_ko ?? "",
      priority: rule.priority_score ?? 70,
    });
  }

  return hits.filter((h) => h.interpretation);
}

function analyzePairwiseBranches(
  chart: ChartContext,
  rules: RelationRuleRow[],
): RelationHit[] {
  const hits: RelationHit[] = [];
  const processed = new Set<string>();
  const branches = chart.pillars.map((p) => p.branchCode);

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i];
      const b = branches[j];
      const dedupe = pairKey(a, b);
      if (processed.has(dedupe)) continue;

      for (const { type, label } of PAIR_BRANCH_TYPES) {
        const rule = findPairRule(rules, type, a, b);
        if (!rule?.meaning_ko) continue;
        processed.add(dedupe);
        hits.push({
          type: label,
          name: `${a}${b}${label}`,
          interpretation: rule.meaning_ko,
          priority: rule.priority_score ?? 50,
        });
        break;
      }
    }
  }

  return hits;
}

export function analyzeRelations(chart: ChartContext): RelationHit[] {
  const rules = REF_RELATION_RULES as RelationRuleRow[];

  const hits = [
    ...analyzeTrioCombines(chart, rules, "branch_three_combine", "삼합"),
    ...analyzeTrioCombines(chart, rules, "branch_direction_combine", "방합"),
    ...analyzeStemCombines(chart, rules),
    ...analyzePairwiseBranches(chart, rules),
  ];

  return hits.sort((a, b) => b.priority - a.priority);
}
