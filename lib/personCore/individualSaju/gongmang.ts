import type { ChartContext } from "@/lib/saju/chartContext";
import {
  GONGMANG_METHOD,
  INDIVIDUAL_SAJU_ENGINE_ID,
} from "./constants";
import type { GongmangFact, PillarSlot } from "./types";

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

/**
 * 旬空 from day pillar (stem+branch) in the 60 Jiazi cycle.
 * method: xunkong_by_day_pillar_v1
 */
export function voidBranchesForDayPillar(
  dayStemCode: string,
  dayBranchCode: string,
): string[] {
  const stemIdx = STEM_ORDER.indexOf(
    dayStemCode as (typeof STEM_ORDER)[number],
  );
  const branchIdx = BRANCH_ORDER.indexOf(
    dayBranchCode as (typeof BRANCH_ORDER)[number],
  );
  if (stemIdx < 0 || branchIdx < 0) return [];

  // Align stem/branch into one of 6 xuns (each 10 pillars).
  // Index in 60: find n where n%10==stemIdx and n%12==branchIdx.
  let idx = -1;
  for (let n = 0; n < 60; n++) {
    if (n % 10 === stemIdx && n % 12 === branchIdx) {
      idx = n;
      break;
    }
  }
  if (idx < 0) return [];

  const xunStart = Math.floor(idx / 10) * 10;
  const present = new Set<string>();
  for (let i = 0; i < 10; i++) {
    const n = xunStart + i;
    present.add(BRANCH_ORDER[n % 12]!);
  }
  return BRANCH_ORDER.filter((b) => !present.has(b));
}

const SLOT_BY_LABEL: Record<string, PillarSlot> = {
  년주: "year",
  월주: "month",
  일주: "day",
  시주: "hour",
};

export function buildGongmangFact(chart: ChartContext): GongmangFact {
  const voidBranches = voidBranchesForDayPillar(
    chart.dayStemCode,
    chart.dayBranchCode,
  );
  const voidSet = new Set(voidBranches);
  const hit_pillars = chart.pillars
    .filter((p) => voidSet.has(p.branchCode))
    .map((p) => ({
      pillar_slot: SLOT_BY_LABEL[p.name] ?? ("day" as PillarSlot),
      branch_code: p.branchCode,
    }));

  return {
    void_branch_codes: voidBranches,
    hit_pillars,
    method: GONGMANG_METHOD,
    engine_version: INDIVIDUAL_SAJU_ENGINE_ID,
    confidence: "deterministic",
    evidence: [
      {
        kind: "rule",
        codes: [chart.dayStemCode, chart.dayBranchCode, ...voidBranches],
        detail: "xunkong_by_day_pillar_v1",
      },
    ],
  };
}
