import { fetchPremiumPipelineMetaClient } from "@/lib/report/fetchPremiumPipelineMetaClient";
import { logPremiumContentSource } from "@/lib/report/premiumContentSourceLog";
import { writeUnifiedReportCache } from "@/lib/report/unifiedReportCache";

export type IntegratedAnalysisFetchResult =
  | { ok: true; text: string; source: "db" }
  | { ok: false; reason: "not_premium" | "api_error" | "empty" };

/**
 * 심화(integrated) — DB만 조회 (source of truth).
 * sessionStorage는 호출 측에서 표시 가속용으로만 사용.
 */
export async function fetchIntegratedAnalysisClient(
  reportId: string,
  options?: {
    cachedFromMeta?: string | null;
    regenerate?: boolean;
  },
): Promise<IntegratedAnalysisFetchResult> {
  const id = reportId.trim();
  if (!id) return { ok: false, reason: "api_error" };

  const fromMeta = options?.cachedFromMeta?.trim();
  if (fromMeta && !options?.regenerate) {
    writeUnifiedReportCache(id, fromMeta);
    logPremiumContentSource(id, "db", "cachedFromMeta");
    return { ok: true, text: fromMeta, source: "db" };
  }

  const metaResult = await fetchPremiumPipelineMetaClient(id, {
    regenerate: options?.regenerate,
  });

  if (metaResult.status === "not_premium") {
    return { ok: false, reason: "not_premium" };
  }
  if (metaResult.status === "error") {
    return { ok: false, reason: "api_error" };
  }

  if (options?.regenerate) {
    logPremiumContentSource(id, "regeneration", "db-cleared");
    return { ok: false, reason: "empty" };
  }

  const cachedText = metaResult.meta.premium_result ?? "";
  if (cachedText) {
    writeUnifiedReportCache(id, cachedText);
    logPremiumContentSource(
      id,
      "db",
      metaResult.meta.integrated_from_db ? "quick-api" : "quick-api-unconfirmed",
    );
    return { ok: true, text: cachedText, source: "db" };
  }

  return { ok: false, reason: "empty" };
}

/** 파이프라인 완료 후 integrated 본문 DB 저장 */
export async function persistIntegratedAnalysisClient(
  reportId: string,
  text: string,
): Promise<boolean> {
  const id = reportId.trim();
  const trimmed = text.trim();
  if (!id || !trimmed) return false;

  writeUnifiedReportCache(id, trimmed);

  try {
    const res = await fetch("/api/my/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: id, integrated: trimmed }),
    });
    if (res.ok) {
      logPremiumContentSource(id, "generation", "persisted-to-db");
    } else {
      logPremiumContentSource(id, "generation", `persist-failed status=${res.status}`);
    }
    return res.ok;
  } catch {
    logPremiumContentSource(id, "generation", "persist-error");
    return false;
  }
}
