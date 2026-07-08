import {
  ROUTES,
  blueprintRoute,
  relationshipHubRoute,
} from "@/constants/routes";
import type { EntryIntent } from "@/lib/routing/resolveEntryDestination";

/**
 * 허브 탭 이동 — reportId/설문 선행조건 없이 즉시 목적지 반환.
 * reportId는 URL 힌트로만 붙이며, 없어도 페이지 진입은 허용한다.
 */
export function hubRouteForIntent(
  intent: EntryIntent,
  reportIdHint?: string | null,
): string | null {
  const hint = reportIdHint?.trim() ?? "";

  if (intent === "decision") return ROUTES.decision;
  if (intent === "relationships") return relationshipHubRoute(hint || undefined);
  if (intent === "blueprint") return blueprintRoute(hint || undefined);

  return null;
}
