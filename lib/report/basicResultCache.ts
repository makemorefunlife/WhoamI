const PREFIX = "ahaitsme_basic_result_v1_";

export function readBasicResultCache(reportId: string): string | null {
  if (!reportId || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${reportId}`);
    return raw && raw.trim() ? raw : null;
  } catch {
    return null;
  }
}

export function writeBasicResultCache(reportId: string, text: string) {
  if (!reportId || !text.trim() || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${PREFIX}${reportId}`, text);
  } catch {
    /* ignore quota */
  }
}

export function clearBasicResultCache(reportId: string) {
  if (!reportId || typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${PREFIX}${reportId}`);
  } catch {
    /* ignore */
  }
}
