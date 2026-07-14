import type { AstrologyCoordSource } from "@/lib/report/resolveAstrologyCoordinates";
import { maskId } from "@/lib/security/safeLog";

/** 로그용 coord source 라벨 (explicit → stored_coords) */
export function astrologyCoordSourceLogLabel(
  source: AstrologyCoordSource,
): string {
  switch (source) {
    case "explicit":
      return "stored_coords";
    case "place_lookup":
      return "birth_place_lookup";
    case "default_san_francisco":
      return "default_san_francisco";
    default:
      return source;
  }
}

export function logAstrologyCoordSource(
  reportId: string,
  source: AstrologyCoordSource,
  _detail?: string,
): void {
  const label = astrologyCoordSourceLogLabel(source);
  // Never log birth place / coordinates / full report id
  console.info(
    `[astrology-coords] reportId=${maskId(reportId)} source=${label}`,
  );
}

export function logAstrologyCache(
  reportId: string,
  event: "astrology_reused" | "astrology_invalidated_location",
  _detail?: string,
): void {
  console.info(
    `[premium-report] reportId=${maskId(reportId)} cache=${event}`,
  );
}
