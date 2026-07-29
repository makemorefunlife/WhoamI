import { REF_RELATION_RULES } from "@/lib/hardcoded/sajuReferenceData";
import {
  type ChartContext,
  TRIO_BRANCH_GROUPS,
  chartHasAllBranches,
} from "@/lib/saju/chartContext";
import { isGuimun, isWonjin } from "@/lib/saju/workPairRiskSignals";
import { RELATION_TYPE_IDS } from "./constants";
import { relationReferenceId } from "./refIds";
import type { PillarSlot, RelationFact } from "./types";

type RelationRuleRow = {
  id: number;
  relation_type: string;
  code_a: string;
  code_b: string;
  result_code: string | null;
  priority_score: number | null;
  meaning_ko: string | null;
  description: string | null;
};

const SLOT_BY_LABEL: Record<string, PillarSlot> = {
  년주: "year",
  월주: "month",
  일주: "day",
  시주: "hour",
};

const PAIR_BRANCH_TYPES = [
  { type: "branch_six_combine", typeId: RELATION_TYPE_IDS.육합 },
  { type: "branch_clash", typeId: RELATION_TYPE_IDS.충 },
  { type: "branch_punishment", typeId: RELATION_TYPE_IDS.형 },
  { type: "branch_break", typeId: RELATION_TYPE_IDS.파 },
  { type: "branch_harm", typeId: RELATION_TYPE_IDS.해 },
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

function slotsForCodes(
  chart: ChartContext,
  codes: string[],
  kind: "stem" | "branch",
): PillarSlot[] {
  const codeSet = new Set(codes);
  const slots: PillarSlot[] = [];
  for (const p of chart.pillars) {
    const c = kind === "stem" ? p.stemCode : p.branchCode;
    if (codeSet.has(c)) {
      const slot = SLOT_BY_LABEL[p.name];
      if (slot) slots.push(slot);
    }
  }
  return slots;
}

function analyzeStemCombines(
  chart: ChartContext,
  rules: RelationRuleRow[],
): RelationFact[] {
  const hits: RelationFact[] = [];
  const seen = new Set<string>();
  const stems = chart.pillars.map((p) => p.stemCode);

  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const a = stems[i]!;
      const b = stems[j]!;
      const rule = findPairRule(rules, "stem_combine", a, b);
      if (!rule?.meaning_ko) continue;
      const dedupe = pairKey(a, b);
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      const codes = [a, b];
      hits.push({
        type_id: RELATION_TYPE_IDS.천간합,
        reference_id: relationReferenceId(rule.id),
        priority: rule.priority_score ?? 90,
        codes,
        pillar_slots: slotsForCodes(chart, codes, "stem"),
        evidence: [
          {
            kind: "relation",
            codes,
            detail: `stem_combine:${rule.id}`,
          },
        ],
      });
    }
  }
  return hits;
}

function analyzeTrioCombines(
  chart: ChartContext,
  rules: RelationRuleRow[],
  relationType: "branch_three_combine" | "branch_direction_combine",
  typeId: string,
): RelationFact[] {
  const hits: RelationFact[] = [];
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
      type_id: typeId,
      reference_id: relationReferenceId(rule.id),
      priority: rule.priority_score ?? 70,
      codes: [...fullGroup],
      pillar_slots: slotsForCodes(chart, fullGroup, "branch"),
      evidence: [
        {
          kind: "relation",
          codes: [...fullGroup],
          detail: `${relationType}:${resultCode}`,
        },
      ],
    });
  }
  return hits;
}

function analyzePairwiseBranches(
  chart: ChartContext,
  rules: RelationRuleRow[],
): RelationFact[] {
  const hits: RelationFact[] = [];
  const processed = new Set<string>();
  const branches = chart.pillars.map((p) => p.branchCode);

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i]!;
      const b = branches[j]!;
      const dedupe = pairKey(a, b);
      if (processed.has(dedupe)) continue;

      for (const { type, typeId } of PAIR_BRANCH_TYPES) {
        const rule = findPairRule(rules, type, a, b);
        if (!rule?.meaning_ko) continue;
        processed.add(dedupe);
        const codes = [a, b];
        hits.push({
          type_id: typeId,
          reference_id: relationReferenceId(rule.id),
          priority: rule.priority_score ?? 50,
          codes,
          pillar_slots: slotsForCodes(chart, codes, "branch"),
          evidence: [
            {
              kind: "relation",
              codes,
              detail: `${type}:${rule.id}`,
            },
          ],
        });
        break;
      }
    }
  }
  return hits;
}

function analyzeWonjinGuimun(chart: ChartContext): RelationFact[] {
  const hits: RelationFact[] = [];
  const branches = chart.pillars.map((p) => ({
    code: p.branchCode,
    slot: SLOT_BY_LABEL[p.name]!,
  }));

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i]!;
      const b = branches[j]!;
      if (isWonjin(a.code, b.code)) {
        hits.push({
          type_id: RELATION_TYPE_IDS.원진,
          reference_id: null,
          priority: 40,
          codes: [a.code, b.code],
          pillar_slots: [a.slot, b.slot],
          evidence: [
            {
              kind: "relation",
              codes: [a.code, b.code],
              detail: "wonjin_pair",
            },
          ],
        });
      }
      if (isGuimun(a.code, b.code)) {
        hits.push({
          type_id: RELATION_TYPE_IDS.귀문,
          reference_id: null,
          priority: 40,
          codes: [a.code, b.code],
          pillar_slots: [a.slot, b.slot],
          evidence: [
            {
              kind: "relation",
              codes: [a.code, b.code],
              detail: "guimun_pair",
            },
          ],
        });
      }
    }
  }
  return hits;
}

/** Intra-chart relations as pure facts (no interpretation text). */
export function buildIntraRelations(chart: ChartContext): RelationFact[] {
  const rules = REF_RELATION_RULES as unknown as RelationRuleRow[];
  const hits = [
    ...analyzeTrioCombines(
      chart,
      rules,
      "branch_three_combine",
      RELATION_TYPE_IDS.삼합,
    ),
    ...analyzeTrioCombines(
      chart,
      rules,
      "branch_direction_combine",
      RELATION_TYPE_IDS.방합,
    ),
    ...analyzeStemCombines(chart, rules),
    ...analyzePairwiseBranches(chart, rules),
    ...analyzeWonjinGuimun(chart),
  ];
  return hits.sort((a, b) => b.priority - a.priority);
}
