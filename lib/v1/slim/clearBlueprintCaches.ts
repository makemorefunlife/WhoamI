import { clearUnifiedReportCache } from "@/lib/report/unifiedReportCache";
import { clearSlimIntegratedCache } from "@/lib/v1/slim/slimIntegratedCache";
import { clearLiteReports } from "@/lib/v2/lite/session";

/** Blueprint·Slim V1 검수용 — 브라우저에 남은 이전 리포트 캐시 삭제 */
export function clearBlueprintAnalysisCaches(reportId: string) {
  if (typeof window === "undefined" || !reportId) return;
  clearUnifiedReportCache(reportId);
  clearSlimIntegratedCache(reportId);
  clearLiteReports(reportId);
}
