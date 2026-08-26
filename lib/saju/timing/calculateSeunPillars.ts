import { isBeforeLichun } from "@fullstackfamily/manseryeok";
import { codesToHangulPillar } from "@/lib/saju/mapping";

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

export type SeunPillarInfo = {
  year: number;
  pillar: string; // e.g. "병오"
  stemCode: string; // e.g. "byeong"
  branchCode: string; // e.g. "o"
};

/**
 * Returns deterministic 60-ganji pillar for a given forecast calendar year.
 * Reference anchor: 1984 = 갑자년 (Gapja).
 */
export function getSeunForForecastYear(year: number): SeunPillarInfo {
  const offset = ((year - 1984) % 60 + 60) % 60;
  const stemCode = STEM_ORDER[offset % 10]!;
  const branchCode = BRANCH_ORDER[offset % 12]!;
  const pillar = codesToHangulPillar(stemCode, branchCode);

  return {
    year,
    pillar,
    stemCode,
    branchCode,
  };
}

/**
 * Resolves current Saju year considering the Lichun (입춘) solar term boundary.
 * Dates before Lichun belong to the previous Saju year.
 */
export function getCurrentSajuYear(dateText: string): number {
  const [yearStr, monthStr, dayStr] = dateText.split("-");
  const year = Number.parseInt(yearStr!, 10);
  const month = Number.parseInt(monthStr!, 10);
  const day = Number.parseInt(dayStr!, 10);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return new Date().getFullYear();
  }

  const beforeLichun = isBeforeLichun(month, day);
  return beforeLichun ? year - 1 : year;
}
