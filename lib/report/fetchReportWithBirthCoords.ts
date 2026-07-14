import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isMissingBirthCoordinateColumnError,
  REPORT_BASE_FIELDS,
  reportSelectWithBirthCoords,
} from "@/lib/report/reportsBirthCoordinateColumns";
import { isMissingBirthDateCorrectionColumnError } from "@/lib/report/birthDateCorrection";
import { logServerError } from "@/lib/security/safeLog";

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

function isRetryableSelectColumnError(
  error: { message?: string } | null | undefined,
): boolean {
  return (
    isMissingBirthCoordinateColumnError(error) ||
    isMissingBirthDateCorrectionColumnError(error)
  );
}

/** 좌표·선택적 extra 컬럼 — 없으면 단계적으로 필드 축소 후 재조회 */
export async function fetchReportWithBirthCoords(
  supabase: SupabaseClient,
  reportId: string,
  extraSelect = "",
): Promise<FetchReportWithBirthCoordsResult> {
  const extra = extraSelect.trim();
  const selectAttempts = extra
    ? [reportSelectWithBirthCoords(extra), reportSelectWithBirthCoords(""), REPORT_BASE_FIELDS]
    : [reportSelectWithBirthCoords(""), REPORT_BASE_FIELDS];

  let lastError: { message?: string } | null = null;

  for (const select of selectAttempts) {
    const result = await supabase
      .from("reports")
      .select(select)
      .eq("id", reportId)
      .maybeSingle();

    if (!result.error) {
      return {
        report: result.data as ReportWithBirthCoords | null,
        error: null,
        birthCoordColumnsAvailable: select.includes("birth_latitude"),
      };
    }

    lastError = result.error;
    if (!isRetryableSelectColumnError(result.error)) {
      break;
    }
  }

  if (lastError && isRetryableSelectColumnError(lastError)) {
    logServerError("fetchReportWithBirthCoords", undefined, "column_fallback_exhausted");
  }

  return {
    report: null,
    error: lastError,
    birthCoordColumnsAvailable: false,
  };
}
