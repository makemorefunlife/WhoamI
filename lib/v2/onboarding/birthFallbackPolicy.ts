export type BirthFallback = {
  time: string;
  place: string;
  latitude: number;
  longitude: number;
  timezone: number;
};

const SEOUL_BIRTH_FALLBACK: BirthFallback = {
  time: "12:00",
  place: "Seoul, South Korea",
  latitude: 37.5665,
  longitude: 126.978,
  timezone: 9,
};

const NEW_YORK_BIRTH_FALLBACK: BirthFallback = {
  time: "12:00",
  place: "New York, NY",
  latitude: 40.7128,
  longitude: -74.006,
  timezone: -5,
};

/** Legacy fallback string, still recognized by isBirthPlaceFallback() for records saved before locale-aware defaults existed. */
const LEGACY_SAN_FRANCISCO_PLACE = "San Francisco, CA";

/** Locale-aware default used whenever birth time/place aren't provided: ko-KR -> Seoul (KST), everything else -> New York (ET). */
export function getUnknownBirthFallback(locale: string): BirthFallback {
  return locale === "ko-KR" ? SEOUL_BIRTH_FALLBACK : NEW_YORK_BIRTH_FALLBACK;
}

/**
 * @deprecated Prefer `getUnknownBirthFallback(locale)` — this is the en-US/
 * global default only, kept for the few call sites that can't cheaply
 * resolve a locale (e.g. legacy narrative-generation fallbacks for reports
 * missing birth_place entirely).
 */
export const UNKNOWN_BIRTH_FALLBACK = NEW_YORK_BIRTH_FALLBACK;

export const UNKNOWN_BIRTH_NOTICE_KO =
  "태어난 시간과 장소를 입력하지 않으시면 낮 12시(한국, 서울)를 기준으로 기본 분석됩니다.";

export const UNKNOWN_BIRTH_NOTICE_EN =
  "If birth time and location are unknown, your chart is calculated using 12:00 PM (Eastern Time / New York, NY) as the default reference.";

export function getUnknownBirthNotice(locale: string): string {
  return locale === "ko-KR" ? UNKNOWN_BIRTH_NOTICE_KO : UNKNOWN_BIRTH_NOTICE_EN;
}

export function isBlank(value: string | null | undefined): boolean {
  return !value || !value.trim();
}

const FALLBACK_PLACE_STRINGS = new Set(
  [SEOUL_BIRTH_FALLBACK.place, NEW_YORK_BIRTH_FALLBACK.place, LEGACY_SAN_FRANCISCO_PLACE].map((p) =>
    p.toLowerCase(),
  ),
);

export function isBirthPlaceFallback(value: string | null | undefined): boolean {
  const place = value?.trim().toLowerCase();
  if (!place) return true;
  return (
    FALLBACK_PLACE_STRINGS.has(place) ||
    place === "approximate location" ||
    place === "near your current location"
  );
}
