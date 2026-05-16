const PREFIX = "ahaitsme_unified_report_v1_";

export function readUnifiedReportCache(reportId: string): string | null {
  if (!reportId || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${reportId}`);
    return raw && raw.trim() ? raw : null;
  } catch {
    return null;
  }
}

export function writeUnifiedReportCache(reportId: string, text: string) {
  if (!reportId || !text.trim() || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${PREFIX}${reportId}`, text);
  } catch {
    /* ignore quota */
  }
}

export function clearUnifiedReportCache(reportId: string) {
  if (!reportId || typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${PREFIX}${reportId}`);
  } catch {
    /* ignore */
  }
}
