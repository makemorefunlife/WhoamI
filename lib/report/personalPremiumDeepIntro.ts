const PREFIX = "ahaitsme_deep_intro_seen_v1_";

export function readDeepReportIntroSeen(reportId: string): boolean {
  if (!reportId || typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`${PREFIX}${reportId}`) === "1";
  } catch {
    return false;
  }
}

export function markDeepReportIntroSeen(reportId: string) {
  if (!reportId || typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}${reportId}`, "1");
  } catch {
    /* ignore */
  }
}
