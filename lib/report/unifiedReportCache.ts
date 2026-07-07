/** 블루프린트 심화 캐시 초기화 (localStorage) */
export function clearUnifiedReportCache(reportId: string) {
  const id = reportId.trim();
  if (!id || typeof window === "undefined") return;
  try {
    localStorage.removeItem(`unifiedReport:${id}`);
  } catch {
    /* ignore */
  }
}
