import { calculateSaju } from "@fullstackfamily/manseryeok";
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { codesToHangulPillar } from "@/lib/saju/mapping";
import { calculateTenGod, getTenGodData } from "@/lib/saju/repository";
import { REF_RELATION_RULES } from "@/lib/hardcoded/sajuReferenceData";
import { isWonjin, branchPairKey } from "@/lib/saju/workPairRiskSignals";
import type { Gender, DaewoonResult, DaewoonPeriod, DaewoonRelationFact, TimingDirection } from "./types";

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

const YANG_STEMS = new Set(["gap", "byeong", "mu", "gyeong", "im"]);

const STEM_ORDER = [
  "gap",
  "eul",
  "byeong",
  "jeong",
  "mu",
  "gi",
  "gyeong",
  "sin",
  "im",
  "gye",
] as const;

const BRANCH_ORDER = [
  "ja",
  "chuk",
  "in",
  "myo",
  "jin",
  "sa",
  "o",
  "mi",
  "sin",
  "yu",
  "sul",
  "hae",
] as const;

export type IndividualDaewoonInput = {
  birthDate: string; // "YYYY-MM-DD"
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  gender: Gender; // 'M' | 'F'
};

/** Finds exact day interval to previous/next month pillar (Jeolgi boundary) using manseryeok */
function findSolarTermDaysInterval(
  year: number,
  month: number,
  day: number,
  direction: TimingDirection,
): number {
  const basePillar = calculateSaju(year, month, day, 12, 0).monthPillar;
  const dt = new Date(Date.UTC(year, month - 1, day, 12, 0));
  const step = direction === "FORWARD" ? 1 : -1;
  let count = 0;

  while (count < 35) {
    dt.setUTCDate(dt.getUTCDate() + step);
    count++;
    const curPillar = calculateSaju(
      dt.getUTCFullYear(),
      dt.getUTCMonth() + 1,
      dt.getUTCDate(),
      12,
      0,
    ).monthPillar;
    if (curPillar !== basePillar) {
      return count;
    }
  }
  return count;
}

/**
 * Calculates traditional Daewoon for ONE person deterministically.
 * NEVER accepts pair input or averages couple ages.
 */
export function calculateIndividualDaewoon(input: IndividualDaewoonInput): DaewoonResult {
  const bundle = calculateSajuBundle({
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthTimeUnknown: input.birthTimeUnknown,
  });

  const [yearStr, monthStr, dayStr] = input.birthDate.split("-");
  const year = Number.parseInt(yearStr!, 10);
  const month = Number.parseInt(monthStr!, 10);
  const day = Number.parseInt(dayStr!, 10);

  const dayStemCode = bundle.chart.dayStemCode;
  const yearStemCode = bundle.chart.yearStemCode;
  const monthStemCode = bundle.chart.monthStemCode;
  const monthBranchCode = bundle.chart.monthBranchCode;

  const yearBranchCode = bundle.chart.yearBranchCode;
  const dayBranchCode = bundle.chart.dayBranchCode;
  const hourBranchCode = bundle.meta.birth_time_unknown
    ? null
    : bundle.chart.hourBranchCode;

  const isYangYear = YANG_STEMS.has(yearStemCode);
  const isMale = input.gender === "M";

  // Traditional Rule:
  // Male + Yang -> FORWARD, Male + Yin -> REVERSE
  // Female + Yang -> REVERSE, Female + Yin -> FORWARD
  const direction: TimingDirection =
    (isMale && isYangYear) || (!isMale && !isYangYear)
      ? "FORWARD"
      : "REVERSE";

  const daysToBoundary = findSolarTermDaysInterval(year, month, day, direction);
  const startAge = Math.max(1, Math.round(daysToBoundary / 3));

  const monthStemIdx = STEM_ORDER.indexOf(
    monthStemCode as (typeof STEM_ORDER)[number],
  );
  const monthBranchIdx = BRANCH_ORDER.indexOf(
    monthBranchCode as (typeof BRANCH_ORDER)[number],
  );

  const periods: DaewoonPeriod[] = [];
  const totalPeriods = 10;

  for (let seq = 1; seq <= totalPeriods; seq++) {
    const step = direction === "FORWARD" ? seq : -seq;

    const stemIdx = ((monthStemIdx + step) % 10 + 10) % 10;
    const branchIdx = ((monthBranchIdx + step) % 12 + 12) % 12;

    const stemCode = STEM_ORDER[stemIdx]!;
    const branchCode = BRANCH_ORDER[branchIdx]!;
    const pillar = codesToHangulPillar(stemCode, branchCode);

    const tenGodCode = calculateTenGod(dayStemCode, stemCode);
    const tenGodData = getTenGodData(tenGodCode);
    const tenGodKorName = tenGodData?.kor_name ?? tenGodCode;

    const periodStartAge = startAge + (seq - 1) * 10;
    const periodEndAge = periodStartAge + 9;
    const startYear = year + periodStartAge;
    const endYear = year + periodEndAge;

    // Check relations between Daewoon branch and Natal branches
    const natalRelations: DaewoonRelationFact[] = [];
    const natalTargets: Array<{ targetPillar: "year" | "month" | "day" | "hour"; branchCode: string | null }> = [
      { targetPillar: "year", branchCode: yearBranchCode },
      { targetPillar: "month", branchCode: monthBranchCode },
      { targetPillar: "day", branchCode: dayBranchCode },
      { targetPillar: "hour", branchCode: hourBranchCode },
    ];

    for (const target of natalTargets) {
      if (!target.branchCode) continue;
      const rel = findBranchRelation(branchCode, target.branchCode);
      if (rel) {
        natalRelations.push({
          type: rel.type,
          label: rel.label,
          targetPillar: target.targetPillar,
          targetBranchCode: target.branchCode,
        });
      }
    }

    periods.push({
      sequence: seq,
      pillar,
      stemCode,
      branchCode,
      tenGodCode,
      tenGodKorName,
      startAge: periodStartAge,
      endAge: periodEndAge,
      startYear,
      endYear,
      natalRelations,
    });
  }

  return {
    gender: input.gender,
    direction,
    startAge,
    daysToBoundary,
    periods,
  };
}
