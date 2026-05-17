import type { AstrologyCoordSource } from "@/lib/report/resolveAstrologyCoordinates";

/** 로그용 coord source 라벨 (explicit → stored_coords) */
export function astrologyCoordSourceLogLabel(
  source: AstrologyCoordSource,
): string {
  switch (source) {
    case "explicit":
      return "stored_coords";
    case "place_lookup":
      return "birth_place_lookup";
    case "default_seoul":
      return "default_seoul";
    default:
      return source;
  }
}

export function logAstrologyCoordSource(
  reportId: string,
  source: AstrologyCoordSource,
  detail?: string,
): void {
  const id = reportId.trim() || "unknown";
  const label = astrologyCoordSourceLogLabel(source);
  const suffix = detail?.trim() ? ` ${detail.trim()}` : "";
  console.info(
    `[astrology-coords] reportId=${id} source=${label}${suffix}`,
  );
}

export function logAstrologyCache(
  reportId: string,
  event: "astrology_reused" | "astrology_invalidated_location",
  detail?: string,
): void {
  const id = reportId.trim() || "unknown";
  const suffix = detail?.trim() ? ` ${detail.trim()}` : "";
  console.info(
    `[premium-report] reportId=${id} cache=${event}${suffix}`,
  );
}
