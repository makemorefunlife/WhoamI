import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingBirthCoordinateColumnError } from "@/lib/report/reportsBirthCoordinateColumns";
import { birthCoordinatesPatchFromPlace } from "@/lib/report/resolveAstrologyCoordinates";

/** birth_place가 있으면 좌표 필드를 patch에 병합 (컬럼 없으면 birth 필드만 유지) */
export function mergeBirthCoordinateFields<T extends Record<string, unknown>>(
  patch: T,
  birthPlace: string | null | undefined,
): T & {
  birth_latitude?: number;
  birth_longitude?: number;
  birth_timezone?: number;
} {
  const place =
    typeof birthPlace === "string" && birthPlace.trim()
      ? birthPlace.trim()
      : null;
  if (!place) return patch;
  return { ...patch, ...birthCoordinatesPatchFromPlace(place) };
}

/**
 * reports.insert — 좌표 컬럼 미적용 DB면 좌표 없이 재시도
 */
export async function insertReportPatchSafely(
  supabase: SupabaseClient,
  patch: Record<string, unknown>,
): Promise<{
  data: { id: string } | null;
  error: { message?: string } | null;
  coordColumnsUsed: boolean;
}> {
  const { data, error } = await supabase
    .from("reports")
    .insert(patch)
    .select("id")
    .single();

  if (!error && data?.id) {
    return {
      data: data as { id: string },
      error: null,
      coordColumnsUsed: "birth_latitude" in patch,
    };
  }

  if (
    !error ||
    !isMissingBirthCoordinateColumnError(error) ||
    !("birth_latitude" in patch)
  ) {
    return { data: null, error: error ?? { message: "insert failed" }, coordColumnsUsed: false };
  }

  const { birth_latitude: _a, birth_longitude: _b, birth_timezone: _c, ...rest } =
    patch;
  const retry = await supabase.from("reports").insert(rest).select("id").single();

  if (retry.error || !retry.data?.id) {
    return { data: null, error: retry.error, coordColumnsUsed: false };
  }

  console.warn(
    "[astrology-coords] coordinate columns missing — inserted report without lat/lon",
  );
  return {
    data: retry.data as { id: string },
    error: null,
    coordColumnsUsed: false,
  };
}

/**
 * reports.update — 좌표 컬럼 미적용 DB면 좌표 없이 재시도
 */
export async function updateReportPatchSafely(
  supabase: SupabaseClient,
  reportId: string,
  patch: Record<string, unknown>,
): Promise<{ error: { message?: string } | null; coordColumnsUsed: boolean }> {
  const { error } = await supabase
    .from("reports")
    .update(patch)
    .eq("id", reportId);

  if (!error) {
    return {
      error: null,
      coordColumnsUsed: "birth_latitude" in patch,
    };
  }

  if (
    !isMissingBirthCoordinateColumnError(error) ||
    !("birth_latitude" in patch)
  ) {
    return { error, coordColumnsUsed: false };
  }

  const { birth_latitude: _a, birth_longitude: _b, birth_timezone: _c, ...rest } =
    patch;
  const retry = await supabase.from("reports").update(rest).eq("id", reportId);

  if (retry.error) {
    return { error: retry.error, coordColumnsUsed: false };
  }

  console.warn(
    `[astrology-coords] coordinate columns missing — saved birth fields without lat/lon reportId=${reportId}`,
  );
  return { error: null, coordColumnsUsed: false };
}
