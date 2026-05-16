import type { HomeResumePayload } from "@/lib/home/homeResume";

export type HomeResumeClientResult =
  | { ok: true; data: HomeResumePayload }
  | { ok: false; status: number; error: string };

/** 클라이언트 — /api/home/resume (canonical reportId) */
export async function fetchHomeResumeClient(
  reportIdHint?: string,
): Promise<HomeResumeClientResult> {
  const hint = reportIdHint?.trim();
  const url = hint
    ? `/api/home/resume?reportId=${encodeURIComponent(hint)}`
    : "/api/home/resume";

  const res = await fetch(url);
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & Partial<HomeResumePayload>;

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: body.error ?? "탐사 상태를 불러오지 못했어요.",
    };
  }

  return { ok: true, data: body as HomeResumePayload };
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
