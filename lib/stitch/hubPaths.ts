import { ROUTES, blueprintRoute, relationshipHubRoute } from "@/constants/routes";
import { loadReportSession } from "@/lib/home/reportSession";

/** Stitch 앱 허브 간 이동 경로 — reportId는 localStorage 폴백 */

export function readStoredReportId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("reportId")?.trim() ?? "";
}

export function blueprintPath(reportId?: string): string {
  return blueprintRoute(reportId ?? readStoredReportId());
}

export function relationHubPath(reportId?: string): string {
  return relationshipHubRoute(reportId ?? readStoredReportId());
}

/**
 * 로그인 세션 기준 canonical reportId로 관계 허브 URL을 만든다.
 * 홈·Dock·랜딩 등 진입 경로가 동일한 myReportId를 쓰도록 SSOT.
 */
export async function resolveRelationHubHref(options?: {
  urlHint?: string;
  isSignedIn?: boolean;
}): Promise<string> {
  const hint = options?.urlHint?.trim() || readStoredReportId() || undefined;

  if (options?.isSignedIn) {
    const session = await loadReportSession({
      urlHint: hint,
      context: "relation-hub-nav",
      hydrate: false,
    });
    if (session.reportId) {
      return relationshipHubRoute(session.reportId);
    }
  }

  return relationshipHubRoute(hint);
}

/** blueprint·decision 등 허브 탭 — 로그인 시 canonical reportId 우선 */
export async function resolveHubHrefForIntent(
  intent: "blueprint" | "relationships",
  options?: { urlHint?: string; isSignedIn?: boolean },
): Promise<string> {
  const hint = options?.urlHint?.trim() || readStoredReportId() || undefined;

  if (options?.isSignedIn) {
    const session = await loadReportSession({
      urlHint: hint,
      context: `hub-nav-${intent}`,
      hydrate: false,
    });
    const canonical = session.reportId || hint;
    if (intent === "relationships") return relationshipHubRoute(canonical);
    return blueprintRoute(canonical);
  }

  if (intent === "relationships") return relationshipHubRoute(hint);
  return blueprintRoute(hint);
}

export const DECISION_HUB_PATH = ROUTES.decision;
export const DECISION_HUB_LABEL = "Choice";
