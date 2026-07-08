export const UNKNOWN_BIRTH_FALLBACK = {
  time: "12:00",
  place: "San Francisco, CA",
  latitude: 37.7749,
  longitude: -122.4194,
  timezone: -8,
} as const;

export const UNKNOWN_BIRTH_NOTICE_KO =
  "정확한 출생 시간과 장소가 입력되지 않아, 임의로 낮 12시 및 샌프란시스코(CA)를 기준으로 계산했습니다. 실제 결과와 약간의 오차가 있을 수 있습니다.";

export function isBlank(value: string | null | undefined): boolean {
  return !value || !value.trim();
}

export function isBirthPlaceFallback(value: string | null | undefined): boolean {
  const place = value?.trim().toLowerCase();
  if (!place) return true;
  return (
    place === UNKNOWN_BIRTH_FALLBACK.place.toLowerCase() ||
    place === "approximate location" ||
    place === "near your current location"
  );
}
