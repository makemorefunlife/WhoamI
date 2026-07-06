import {
  clearBasicResultCache,
  readBasicResultCache,
  writeBasicResultCache,
} from "@/lib/report/basicResultCache";

export type BasicAnalysisFetchResult =
  | { ok: true; text: string; source: "session" | "db" | "generated" }
  | { ok: false; reason: "no_survey" | "api_error" | "empty" | "no_key" };

type ReportMeta = {
  has_survey?: boolean;
  basic_result?: string | null;
  basic_error?: string | null;
  basic_pending?: boolean;
  basic_from_db?: boolean;
};

/**
 * 기본 분석 — quick(DB) → 없으면 full(LLM 1회 + DB 저장).
 * sessionStorage는 표시 가속용(서버 DB가 source of truth).
 */
export async function fetchBasicAnalysisClient(
  reportId: string,
  options?: {
    cachedFromMeta?: string | null;
    regenerate?: boolean;
  },
): Promise<BasicAnalysisFetchResult> {
  const id = reportId.trim();
  if (!id) return { ok: false, reason: "api_error" };

  if (options?.regenerate) {
    clearBasicResultCache(id);
  }

  const fromMeta = options?.cachedFromMeta?.trim();
  if (fromMeta && !options?.regenerate) {
    writeBasicResultCache(id, fromMeta);
    return { ok: true, text: fromMeta, source: "db" };
  }

  if (!options?.regenerate) {
    const sessionCached = readBasicResultCache(id);
    if (sessionCached) {
      return { ok: true, text: sessionCached, source: "session" };
    }
  }

  const quickQs = new URLSearchParams({ reportId: id, quick: "1" });
  if (options?.regenerate) quickQs.set("regenerate", "1");

  const metaRes = await fetch(`/api/my/report?${quickQs.toString()}`);
  const meta = (await metaRes.json().catch(() => ({}))) as ReportMeta & {
    error?: string;
  };

  if (!metaRes.ok) {
    return { ok: false, reason: "api_error" };
  }
  if (!meta.has_survey) {
    return { ok: false, reason: "no_survey" };
  }
  if (meta.basic_error === "missing_openai_key") {
    return { ok: false, reason: "no_key" };
  }

  const cachedText = meta.basic_result?.trim() ?? "";
  if (cachedText) {
    writeBasicResultCache(id, cachedText);
    return {
      ok: true,
      text: cachedText,
      source: meta.basic_from_db ? "db" : "generated",
    };
  }

  if (options?.regenerate || meta.basic_pending) {
    const fullQs = new URLSearchParams({ reportId: id });
    if (options?.regenerate) fullQs.set("regenerate", "1");

    const fullRes = await fetch(`/api/my/report?${fullQs.toString()}`);
    const full = (await fullRes.json().catch(() => ({}))) as ReportMeta & {
      error?: string;
    };

    if (!fullRes.ok) {
      return { ok: false, reason: "api_error" };
    }
    if (full.basic_error === "missing_openai_key") {
      return { ok: false, reason: "no_key" };
    }

    const text = full.basic_result?.trim() ?? "";
    if (!text) {
      return { ok: false, reason: "empty" };
    }

    writeBasicResultCache(id, text);
    return { ok: true, text, source: "generated" };
  }

  return { ok: false, reason: "empty" };
}
