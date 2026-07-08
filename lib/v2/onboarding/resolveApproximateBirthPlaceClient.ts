import { UNKNOWN_BIRTH_FALLBACK } from "@/lib/v2/onboarding/birthFallbackPolicy";

export type ApproximateBirthPlace = {
  birthPlace: string;
  birthLatitude: number;
  birthLongitude: number;
};

/** 장소 미입력 시 고정 fallback(샌프란시스코) 반환 */
export async function resolveApproximateBirthPlaceClient(): Promise<ApproximateBirthPlace | null> {
  return {
    birthPlace: UNKNOWN_BIRTH_FALLBACK.place,
    birthLatitude: UNKNOWN_BIRTH_FALLBACK.latitude,
    birthLongitude: UNKNOWN_BIRTH_FALLBACK.longitude,
  };
}
