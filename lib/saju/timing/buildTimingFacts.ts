import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { calculateTenGod, getTenGodData } from "@/lib/saju/repository";
import { REF_RELATION_RULES } from "@/lib/hardcoded/sajuReferenceData";
import { isWonjin, branchPairKey } from "@/lib/saju/workPairRiskSignals";
import { calculateIndividualDaewoon } from "./calculateIndividualDaewoon";
import { getSeunForForecastYear } from "./calculateSeunPillars";
import type {
  Gender,
  TimingFacts,
  SeunYearFact,
  SeunRelationFact,
  DaewoonPeriod,
} from "./types";

type RelationRuleRow = {
  relation_type: string;
  code_a: string;
  code_b: string;
};

const SUPPORTED_BRANCH_RELATIONS = [
  { type: "branch_six_combine", label: "육합" },
  { type: "branch_clash", label: "충" },
  { type: "branch_punishment", label: "형" },
  { type: "branch_break", label: "파" },
  { type: "branch_harm", label: "해" },
] as const;

function findBranchRelation(branchA: string, branchB: string): { type: string; label: string } | null {
  const key = branchPairKey(branchA, branchB);

  for (const rel of SUPPORTED_BRANCH_RELATIONS) {
    const matched = (REF_RELATION_RULES as unknown as RelationRuleRow[]).some(
      (r) =>
        r.relation_type === rel.type &&
        branchPairKey(r.code_a, r.code_b) === key,
    );
    if (matched) return rel;
  }

  if (isWonjin(branchA, branchB)) {
    return { type: "wonjin", label: "원진" };
  }

  return null;
}

export type BuildTimingFactsOptions = {
  personId?: string;
  birthDate: string; // "YYYY-MM-DD"
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  gender: Gender; // 'M' | 'F'
  fromYear?: number;
  toYear?: number;
};

/**
 * Resolves the active Daewoon Period at a given target year.
 */

export function resolveActiveDaewoonPeriod(
  periods: DaewoonPeriod[],
  targetYear: number,
): DaewoonPeriod | null {
  const matched = periods.find(
    (p) => targetYear >= p.startYear && targetYear <= p.endYear,
  );
  return matched ?? (periods[0] ?? null);
}

/**
 * Domain-neutral Canonical Timing Facts Builder.
 * Answers: "What Saju timing facts are active for this person?"
 * NEVER references marriage, romantic, work, or partner roles.
 */
export function buildTimingFacts(options: BuildTimingFactsOptions): TimingFacts {
  const {
    personId,
    birthDate,
    birthTime,
    birthTimeUnknown,
    gender,
    fromYear = new Date().getFullYear(),
    toYear = new Date().getFullYear() + 2,
  } = options;

  const bundle = calculateSajuBundle({ birthDate, birthTime, birthTimeUnknown });
  const birthYear = Number.parseInt(birthDate.split("-")[0]!, 10);

  const dayMasterStemCode = bundle.chart.dayStemCode;
  const dayBranchCode = bundle.chart.dayBranchCode;
  const monthBranchCode = bundle.chart.monthBranchCode;
  const yearBranchCode = bundle.chart.yearBranchCode;
  const hourBranchCode = bundle.meta.birth_time_unknown
    ? null
    : bundle.chart.hourBranchCode;

  const daewoon = calculateIndividualDaewoon({
    birthDate,
    birthTime,
    birthTimeUnknown,
    gender,
  });

  const yearlySeun: SeunYearFact[] = [];

  for (let yr = fromYear; yr <= toYear; yr++) {
    const seun = getSeunForForecastYear(yr);
    const tenGodCode = calculateTenGod(dayMasterStemCode, seun.stemCode);
    const tenGodData = getTenGodData(tenGodCode);
    const tenGodKorName = tenGodData?.kor_name ?? tenGodCode;

    // Active Daewoon Background Context
    const activeDaewoon = resolveActiveDaewoonPeriod(daewoon.periods, yr);
    const currentDaewoonPillar = activeDaewoon?.pillar ?? "";
    const currentDaewoonStemCode = activeDaewoon?.stemCode ?? "";
    const currentDaewoonBranchCode = activeDaewoon?.branchCode ?? "";
    const currentDaewoonTenGodCode = activeDaewoon?.tenGodCode ?? "";
    const currentDaewoonTenGodKorName = activeDaewoon?.tenGodKorName ?? "";

    // Daewoon x Seun Branch Relation
    const daewoonSeunRelation = currentDaewoonBranchCode
      ? findBranchRelation(currentDaewoonBranchCode, seun.branchCode)
      : null;

    // Seun x Natal Relations
    const relations: SeunRelationFact[] = [];
    const natalTargets: Array<{ targetPillar: "year" | "month" | "day" | "hour"; branchCode: string | null }> = [
      { targetPillar: "year", branchCode: yearBranchCode },
      { targetPillar: "month", branchCode: monthBranchCode },
      { targetPillar: "day", branchCode: dayBranchCode },
      { targetPillar: "hour", branchCode: hourBranchCode },
    ];

    let dayBranchRelType: string | null = null;

    for (const target of natalTargets) {
      if (!target.branchCode) continue;
      const rel = findBranchRelation(seun.branchCode, target.branchCode);
      if (rel) {
        relations.push({
          type: rel.type,
          label: rel.label,
          targetPillar: target.targetPillar,
          targetBranchCode: target.branchCode,
        });
        if (target.targetPillar === "day") {
          dayBranchRelType = rel.type;
        }
      }
    }

    yearlySeun.push({
      year: yr,
      pillar: seun.pillar,
      stemCode: seun.stemCode,
      branchCode: seun.branchCode,
      tenGodCode,
      tenGodKorName,
      currentDaewoonPillar,
      currentDaewoonStemCode,
      currentDaewoonBranchCode,
      currentDaewoonTenGodCode,
      currentDaewoonTenGodKorName,
      relations,
      dayBranchRelation: dayBranchRelType,
      daewoonSeunRelation,
    });
  }

  return {
    personId,
    birthDate,
    birthYear,
    gender,
    dayMasterStemCode,
    dayBranchCode,
    daewoon,
    yearlySeun,
  };
}
