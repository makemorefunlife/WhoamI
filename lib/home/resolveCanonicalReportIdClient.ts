import type { ResolveCanonicalReportIdResult } from "@/lib/home/resolveCanonicalReportIdClientTypes";
import { loadReportSession } from "@/lib/home/reportSession";

export type {
  CanonicalReportIdSource,
  ResolveCanonicalReportIdResult,
} from "@/lib/home/resolveCanonicalReportIdClientTypes";

/**
 * /api/home/resume 로 canonical reportId 확정.
 * URL/localStorage 값은 힌트만 — 실제 SSOT는 loadReportSession (서버 resume).
 */
export async function resolveCanonicalReportIdClient(
  urlHint?: string,
  context = "resolve",
  options?: { skipSessionHydrate?: boolean },
): Promise<ResolveCanonicalReportIdResult> {
  const hint = urlHint?.trim() ?? "";
  const session = await loadReportSession({
    urlHint: hint,
    context,
    hydrate: !options?.skipSessionHydrate,
  });

  return {
    canonicalReportId: session.reportId,
    urlHint: hint,
    source: session.source,
    invalidHint: session.invalidHint,
    surveyCompleted: session.surveyCompleted,
  };
}
