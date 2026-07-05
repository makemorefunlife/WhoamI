import { calculateSaju } from "@fullstackfamily/manseryeok";
import { buildChartContext } from "@/lib/saju/chartContext";
import { calculateTenGod, getHiddenStemsData } from "@/lib/saju/repository";
import {
  PRIMARY_AXIS_KEYS,
  type PrimaryAxisKey,
  type PrimaryAxesScores,
} from "@/lib/v2/survey/types";
import { TEN_GOD_AXIS_DELTAS } from "@/lib/v2/saju/tenGodAxisDeltas";

/** 50 기준점에서 raw 합산 후 곱함 — Lite에서 체감 분포 넓히기 (튜닝 상수) */
const INNATE_LITE_SPREAD_GAIN = 2.4;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function zeroRaw(): Record<PrimaryAxisKey, number> {
  return Object.fromEntries(
    PRIMARY_AXIS_KEYS.map((k) => [k, 0]),
  ) as Record<PrimaryAxisKey, number>;
}

function applyTenGodRaw(
  raw: Record<PrimaryAxisKey, number>,
  godCode: string,
  weight: number,
) {
  const delta = TEN_GOD_AXIS_DELTAS[godCode];
  if (!delta) return;
  for (const key of PRIMARY_AXIS_KEYS) {
    const d = delta[key];
    if (typeof d === "number") raw[key] += d * weight;
  }
}

type StemWeight = { stem: string; weight: number };

function pushStem(
  list: StemWeight[],
  stem: string | undefined,
  weight: number,
  dayStem: string,
) {
  if (!stem || stem === dayStem || weight <= 0) return;
  list.push({ stem, weight });
}

function pushBranchMain(
  list: StemWeight[],
  branchCode: string,
  weight: number,
  dayStem: string,
) {
  const hidden = getHiddenStemsData(branchCode);
  const main = hidden[0]?.stem_code;
  pushStem(list, main, weight, dayStem);
}

export type InnateLiteInput = {
  birthDate: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
};

export type InnateSelfLiteProfile = {
  profile_type: "innate_self_lite";
  primary_axes: PrimaryAxesScores;
  meta: {
    birth_time_unknown: boolean;
    calculated_at: string;
  };
};

/**
 * Lite Innate Self — 십성 raw 합산 후 spread gain (docs/v2/saju/04 기반 MVP)
 * TODO: 오행·계절·합충 가중 추가 시 INNATE_LITE_SPREAD_GAIN 재튜닝
 */
export function calculateInnateSelfLite(
  input: InnateLiteInput,
): InnateSelfLiteProfile {
  const unknown = input.birthTimeUnknown === true || !input.birthTime?.trim();
  const [y, mo, d] = input.birthDate.split("-").map(Number);
  const time = unknown ? "12:00" : input.birthTime!.trim();
  const [hour, minute] = time.split(":").map(Number);

  const saju = calculateSaju(y, mo, d, hour, minute) as {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
  };
  const chart = buildChartContext(saju);
  const dayStem = chart.dayStemCode;

  const sources: StemWeight[] = [];
  if (unknown) {
    pushStem(sources, chart.monthStemCode, 1.0, dayStem);
    pushBranchMain(sources, chart.monthBranchCode, 0.65, dayStem);
    pushStem(sources, chart.yearStemCode, 0.75, dayStem);
    pushBranchMain(sources, chart.yearBranchCode, 0.55, dayStem);
  } else {
    pushStem(sources, chart.monthStemCode, 1.0, dayStem);
    pushBranchMain(sources, chart.monthBranchCode, 0.65, dayStem);
    pushStem(sources, chart.yearStemCode, 0.75, dayStem);
    pushBranchMain(sources, chart.yearBranchCode, 0.55, dayStem);
    pushStem(sources, chart.hourStemCode, 0.85, dayStem);
    pushBranchMain(sources, chart.hourBranchCode, 0.5, dayStem);
  }

  const raw = zeroRaw();
  for (const { stem, weight } of sources) {
    const god = calculateTenGod(dayStem, stem);
    applyTenGodRaw(raw, god, weight);
  }

  const primary_axes = Object.fromEntries(
    PRIMARY_AXIS_KEYS.map((key) => [
      key,
      Math.round(
        clamp(50 + raw[key] * INNATE_LITE_SPREAD_GAIN, 0, 100),
      ),
    ]),
  ) as PrimaryAxesScores;

  return {
    profile_type: "innate_self_lite",
    primary_axes,
    meta: {
      birth_time_unknown: unknown,
      calculated_at: new Date().toISOString(),
    },
  };
}
