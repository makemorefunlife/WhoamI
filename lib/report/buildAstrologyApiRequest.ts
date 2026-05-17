import { logAstrologyCoordSource } from "@/lib/report/astrologyCoordLog";
import {
  astrologyLocationFingerprint,
  resolveAstrologyCoordinates,
  type ResolvedAstrologyCoordinates,
} from "@/lib/report/resolveAstrologyCoordinates";

export type AstrologyApiRequestBody = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  timezone: number;
  birthPlace?: string;
};

export function buildAstrologyApiRequestFromReport(
  report: Record<string, unknown>,
  options?: { reportId?: string },
): {
  body: AstrologyApiRequestBody;
  coords: ResolvedAstrologyCoordinates;
  locationFingerprint: string;
} {
  const birthDateRaw = report.birth_date;
  if (!birthDateRaw) {
    throw new Error("birth_date required for astrology request");
  }

  const birthDateObj = new Date(String(birthDateRaw));
  const coords = resolveAstrologyCoordinates(
    {
      birth_place:
        typeof report.birth_place === "string" ? report.birth_place : null,
      birth_latitude: report.birth_latitude,
      birth_longitude: report.birth_longitude,
      birth_timezone: report.birth_timezone,
    },
    { reportId: options?.reportId, logDefaultSeoul: true },
  );

  if (options?.reportId) {
    logAstrologyCoordSource(
      options.reportId,
      coords.source,
      coords.matchedPlace ? `place=${coords.matchedPlace}` : undefined,
    );
  }

  const birthTime = report.birth_time;
  let hour = 12;
  let minute = 0;
  if (birthTime) {
    const parts = String(birthTime).split(":");
    hour = Number.parseInt(parts[0] ?? "12", 10) || 12;
    minute = Number.parseInt(parts[1] ?? "0", 10) || 0;
  }

  const birthPlace =
    typeof report.birth_place === "string" ? report.birth_place.trim() : "";

  const body: AstrologyApiRequestBody = {
    year: birthDateObj.getFullYear(),
    month: birthDateObj.getMonth() + 1,
    day: birthDateObj.getDate(),
    hour,
    minute,
    latitude: coords.latitude,
    longitude: coords.longitude,
    timezone: coords.timezone,
    ...(birthPlace ? { birthPlace } : {}),
  };

  return {
    body,
    coords,
    locationFingerprint: astrologyLocationFingerprint({
      birth_place: birthPlace || null,
      birth_latitude: coords.latitude,
      birth_longitude: coords.longitude,
      birth_timezone: coords.timezone,
    }),
  };
}
