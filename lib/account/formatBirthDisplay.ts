import { parseBirthDateParts } from "@/lib/report/reportBirthUtils";
import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";
import { isBirthPlaceFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { parse24hTo12h } from "@/lib/v2/onboarding/birthTime";

export function formatBirthDateKo(iso: string | null | undefined): string {
  const { y, mo, d } = parseBirthDateParts(iso);
  if (!y || !mo || !d) return "미입력";
  return `${y}년 ${Number(mo)}월 ${Number(d)}일`;
}

export function formatBirthTimeKo(birth: BirthV2Session | null | undefined): string {
  if (!birth?.birthDate) return "미입력";
  if (birth.birthTimeUnknown || !birth.birthTime?.trim()) {
    return "모름 (낮 12시 기준으로 계산)";
  }
  const parsed = parse24hTo12h(birth.birthTime);
  if (!parsed) return birth.birthTime;
  const period = parsed.period === "am" ? "오전" : "오후";
  return `${period} ${parsed.hour}:${parsed.minute}`;
}

export function formatBirthPlaceKo(
  place: string | null | undefined,
  placeUnknown?: boolean,
): string {
  const trimmed = place?.trim();
  if (!trimmed) return "미입력";
  if (placeUnknown || isBirthPlaceFallback(trimmed)) {
    return `${trimmed} (기본값 — 실제 지역으로 수정해 주세요)`;
  }
  return trimmed;
}
