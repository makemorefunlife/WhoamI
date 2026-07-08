import type { HomeResumePayload } from "@/lib/home/homeResume";

export type HomeResumeClientResult =
  | { ok: true; data: HomeResumePayload }
  | { ok: false; status: number; error: string };

const RESUME_CACHE_TTL_MS = 60_000;
let resumeCache:
  | { key: string; at: number; result: HomeResumeClientResult }
  | null = null;

/** 짧은 TTL 캐시 — 홈→관계 허브 연속 이동 시 중복 resume 호출 방지 */
export async function fetchHomeResumeClient(
  reportIdHint?: string,
): Promise<HomeResumeClientResult> {
  const hint = reportIdHint?.trim();
  const cacheKey = hint ?? "";
  const now = Date.now();
  if (
    resumeCache &&
    resumeCache.key === cacheKey &&
    now - resumeCache.at < RESUME_CACHE_TTL_MS
  ) {
    return resumeCache.result;
  }

  const url = hint
    ? `/api/home/resume?reportId=${encodeURIComponent(hint)}`
    : "/api/home/resume";

  const res = await fetch(url);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      status: res.status || 502,
      error:
        "탐사 상태 응답 형식이 올바르지 않아요. 개발 서버를 재시작한 뒤 새로고침해 주세요.",
    };
  }
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & Partial<HomeResumePayload>;

  if (!res.ok) {
    const result = {
      ok: false as const,
      status: res.status,
      error: body.error ?? "탐사 상태를 불러오지 못했어요.",
    };
    resumeCache = { key: cacheKey, at: now, result };
    return result;
  }

  const result = { ok: true as const, data: body as HomeResumePayload };
  resumeCache = { key: cacheKey, at: now, result };
  return result;
}

export function invalidateHomeResumeCache(): void {
  resumeCache = null;
}

export function applyResumeReportIdToStorage(data: HomeResumePayload): string | null {
  if (typeof window === "undefined") return data.reportId;

  if (data.invalidHint) {
    localStorage.removeItem("reportId");
  }

  const canonical =
    typeof data.reportId === "string" && data.reportId.trim()
      ? data.reportId.trim()
      : null;

  if (canonical) {
    localStorage.setItem("reportId", canonical);
  } else {
    localStorage.removeItem("reportId");
  }

  return canonical;
}
