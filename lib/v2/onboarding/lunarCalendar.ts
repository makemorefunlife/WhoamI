import { lunarToSolar } from "@fullstackfamily/manseryeok";

export type SolarDateParts = { year: number; month: number; day: number };

/**
 * Converts a 음력(lunar) date to its 양력(solar) equivalent so every
 * downstream Saju/astrology calculation only ever sees solar dates. Leap
 * months are intentionally unsupported (regular lunar dates only) — matches
 * `@fullstackfamily/manseryeok`'s `isLeapMonth` defaulting to `false`.
 *
 * Returns `null` for an out-of-range or otherwise invalid lunar date instead
 * of throwing, so callers can fall back to treating the input as incomplete.
 */
export function convertLunarToSolarDate(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
): SolarDateParts | null {
  if (
    !Number.isInteger(lunarYear) ||
    !Number.isInteger(lunarMonth) ||
    !Number.isInteger(lunarDay)
  ) {
    return null;
  }
  try {
    const result = lunarToSolar(lunarYear, lunarMonth, lunarDay, false);
    return {
      year: result.solar.year,
      month: result.solar.month,
      day: result.solar.day,
    };
  } catch {
    return null;
  }
}
