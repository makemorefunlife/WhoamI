/**
 * "Come back to adding a friend after filling in my own details."
 * Kept in sessionStorage (this tab only, 1 hour), never in a URL. Only paths
 * under /relationships are accepted, so it can't become an open redirect.
 */
const KEY = "aha_after_self_profile";
const TTL_MS = 60 * 60 * 1000;

function safe(path: string): string | null {
  return /^\/relationships(\?[\w=&%.-]*)?$/.test(path) ? path : null;
}

export function setSelfProfileReturn(path: string): void {
  const ok = safe(path);
  if (!ok) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path: ok, at: Date.now() }));
  } catch {
    /* storage unavailable: the user just lands on the normal result page */
  }
}

/** Returns the stored hub path (with myReportId set to `reportId`) once, then clears it. */
export function consumeSelfProfileReturn(reportId: string | null): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const v = JSON.parse(raw) as { path?: string; at?: number };
    if (!v.path || !v.at || Date.now() - v.at > TTL_MS) return null;
    const ok = safe(v.path);
    if (!ok) return null;
    if (!reportId) return ok;
    const u = new URL(ok, "http://x");
    u.searchParams.set("myReportId", reportId);
    return `${u.pathname}?${u.searchParams.toString()}`;
  } catch {
    return null;
  }
}

export function hasSelfProfileReturn(): boolean {
  try {
    return Boolean(sessionStorage.getItem(KEY));
  } catch {
    return false;
  }
}
