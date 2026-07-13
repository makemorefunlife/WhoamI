import { REF_RELATION_RULES } from "@/lib/hardcoded/sajuReferenceData";
import type { ChartContext } from "@/lib/saju/chartContext";
import type { SajuRelationHitBrief } from "./types";

type PalaceKo = SajuRelationHitBrief["counterpart_palace"];

const HARMONY_TYPES = new Set(["육합", "삼합", "방합", "천간합"]);
const TENSION_TYPES = new Set(["충", "형", "해", "파"]);

type RelationRuleRow = {
  relation_type: string;
  code_a: string;
  code_b: string;
  meaning_ko: string | null;
};

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function findBranchRule(
  type: string,
  a: string,
  b: string,
): RelationRuleRow | null {
  const key = pairKey(a, b);
  return (
    (REF_RELATION_RULES as unknown as RelationRuleRow[]).find(
      (r) =>
        r.relation_type === type && pairKey(r.code_a, r.code_b) === key,
    ) ?? null
  );
}

function branchRelationType(
  a: string,
  b: string,
): { type: string; interpretation: string | null } | null {
  for (const [relType, label] of [
    ["branch_six_combine", "육합"],
    ["branch_clash", "충"],
    ["branch_punishment", "형"],
    ["branch_break", "파"],
    ["branch_harm", "해"],
  ] as const) {
    const rule = findBranchRule(relType, a, b);
    if (rule) return { type: label, interpretation: rule.meaning_ko };
  }
  return null;
}

function stemCombine(
  a: string,
  b: string,
): { type: string; interpretation: string | null } | null {
  const rule = findBranchRule("stem_combine", a, b);
  if (!rule) return null;
  return { type: "천간합", interpretation: rule.meaning_ko };
}

/** anchor 궁 지지 ↔ 다른 궁 지지 관계 */
export function collectBranchPalaceRelations(
  chart: ChartContext,
  anchorPalace: PalaceKo,
): { harmony: SajuRelationHitBrief[]; tension: SajuRelationHitBrief[] } {
  const anchor = chart.pillars.find((p) => p.name === anchorPalace);
  if (!anchor) return { harmony: [], tension: [] };

  const harmony: SajuRelationHitBrief[] = [];
  const tension: SajuRelationHitBrief[] = [];

  for (const other of chart.pillars) {
    if (other.name === anchorPalace) continue;
    const rel = branchRelationType(anchor.branchCode, other.branchCode);
    if (!rel) continue;
    const brief: SajuRelationHitBrief = {
      type: rel.type,
      counterpart_palace: other.name as PalaceKo,
      codes: [anchor.branchCode, other.branchCode],
      interpretation_ko: rel.interpretation,
    };
    if (HARMONY_TYPES.has(rel.type)) harmony.push(brief);
    if (TENSION_TYPES.has(rel.type)) tension.push(brief);
  }

  return { harmony, tension };
}

export function indexFromHits(
  harmonyCount: number,
  tensionCount: number,
  harmonyWeight = 28,
  tensionWeight = 32,
): { harmony_index: number; tension_index: number } {
  const harmony_index = Math.min(100, harmonyCount * harmonyWeight);
  const tension_index = Math.min(100, tensionCount * tensionWeight);
  return { harmony_index, tension_index };
}

export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function intensityBand3(score: number): "low" | "medium" | "high" {
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}

export function findStemCombine(
  a: string,
  b: string,
): boolean {
  return findBranchRule("stem_combine", a, b) != null;
}

/** 두 지지 code 간 합충형해 (pair 교차용) */
export function crossBranchRelation(
  branchA: string,
  branchB: string,
): { type: string; interpretation_ko: string | null } | null {
  const rel = branchRelationType(branchA, branchB);
  if (!rel) return null;
  return { type: rel.type, interpretation_ko: rel.interpretation };
}
