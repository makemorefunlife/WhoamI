import { clearUnifiedReportCache } from "@/lib/report/unifiedReportCache";

const LITE_CURRENT = "ahaitsme_v2_lite_current_";
const LITE_INNATE = "ahaitsme_v2_lite_innate_";

/** Blueprint·Slim V1 검수용 — 브라우저에 남은 이전 리포트 캐시 삭제 */
export function clearBlueprintAnalysisCaches(reportId: string) {
  if (typeof window === "undefined" || !reportId) return;
  clearUnifiedReportCache(reportId);
  try {
    sessionStorage.removeItem(`${LITE_CURRENT}${reportId}`);
    sessionStorage.removeItem(`${LITE_INNATE}${reportId}`);
  } catch {
    /* ignore */
  }
}
