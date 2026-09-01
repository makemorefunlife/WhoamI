import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingBirthCoordinateColumnError } from "@/lib/report/reportsBirthCoordinateColumns";
import { birthCoordinatesPatchFromPlace } from "@/lib/report/resolveAstrologyCoordinates";
import { logServerError } from "@/lib/security/safeLog";

export type SyncReportBirthCoordinatesResult =
  | "synced"
  | "skipped_already_set"
  | "skipped_no_columns"
  | "skipped_no_place"
  | "failed";

/**
 * birth_place 기준 좌표를 reports에 1회 기록.
 * 이미 lat/lon 있으면 쓰기 생략 (quick GET 반복 호출 방지).
 */
export async function syncReportBirthCoordinates(
  supabase: SupabaseClient,
  reportId: string,
  birthPlace: string | null | undefined,
  locale?: string,
): Promise<SyncReportBirthCoordinatesResult> {
  const place =
    typeof birthPlace === "string" && birthPlace.trim()
      ? birthPlace.trim()
      : null;
  if (!place) return "skipped_no_place";

  const { data: existing, error: readErr } = await supabase
    .from("reports")
    .select("birth_latitude, birth_longitude")
    .eq("id", reportId)
    .maybeSingle();

  if (readErr) {
    if (isMissingBirthCoordinateColumnError(readErr)) {
      return "skipped_no_columns";
    }
    logServerError("syncReportBirthCoordinates", readErr, "db_select_failed");
    return "failed";
  }

  if (
    existing?.birth_latitude != null &&
    existing?.birth_longitude != null
  ) {
    return "skipped_already_set";
  }

  const patch = birthCoordinatesPatchFromPlace(place, locale);
  const { error: upErr } = await supabase
    .from("reports")
    .update(patch)
    .eq("id", reportId);

  if (upErr) {
    if (isMissingBirthCoordinateColumnError(upErr)) {
      return "skipped_no_columns";
    }
    logServerError("syncReportBirthCoordinates", upErr, "db_update_failed");
    return "failed";
  }

  return "synced";
}
