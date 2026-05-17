import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isMissingBirthCoordinateColumnError,
  REPORT_BASE_FIELDS,
  reportSelectWithBirthCoords,
} from "@/lib/report/reportsBirthCoordinateColumns";

export type ReportWithBirthCoords = Record<string, unknown> & {
  id: string;
  birth_place?: string | null;
  birth_latitude?: number | null;
  birth_longitude?: number | null;
  birth_timezone?: number | null;
};

export type FetchReportWithBirthCoordsResult = {
  report: ReportWithBirthCoords | null;
  error: { message?: string } | null;
  birthCoordColumnsAvailable: boolean;
};

/** 좌표 컬럼 포함 select — 마이그레이션 미적용 시 기본 필드만 조회 */
export async function fetchReportWithBirthCoords(
  supabase: SupabaseClient,
  reportId: string,
  extraSelect = "",
): Promise<FetchReportWithBirthCoordsResult> {
  const withCoords = reportSelectWithBirthCoords(extraSelect);

  const full = await supabase
    .from("reports")
    .select(withCoords)
    .eq("id", reportId)
    .maybeSingle();

  if (!full.error) {
    return {
      report: full.data as ReportWithBirthCoords | null,
      error: null,
      birthCoordColumnsAvailable: true,
    };
  }

  if (!isMissingBirthCoordinateColumnError(full.error)) {
    return {
      report: null,
      error: full.error,
      birthCoordColumnsAvailable: false,
    };
  }

  console.warn(
    `[astrology-coords] birth coordinate columns missing — using birth_place lookup only reportId=${reportId}`,
  );

  const extra = extraSelect.trim();
  const baseSelect = extra
    ? `${REPORT_BASE_FIELDS}, ${extra}`
    : REPORT_BASE_FIELDS;

  const fallback = await supabase
    .from("reports")
    .select(baseSelect)
    .eq("id", reportId)
    .maybeSingle();

  return {
    report: fallback.data as ReportWithBirthCoords | null,
    error: fallback.error,
    birthCoordColumnsAvailable: false,
  };
}
