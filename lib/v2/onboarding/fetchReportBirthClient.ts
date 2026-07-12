import type { ReportBirthRow } from "@/lib/v2/onboarding/resolveReportBirth";

export type ReportBirthApiResponse = ReportBirthRow & {
  ok?: boolean;
  error?: string;
};

/** 클라이언트 — reports DB 출생 (Blueprint SSOT) */
export async function fetchReportBirthFromApi(
  reportId: string,
): Promise<ReportBirthRow | null> {
  if (!reportId.trim()) return null;
  try {
    const res = await fetch(
      `/api/report/birth?reportId=${encodeURIComponent(reportId)}`,
    );
    const data = (await res.json()) as ReportBirthApiResponse;
    if (!res.ok) return null;
    return {
      birth_date: data.birth_date ?? null,
      birth_time: data.birth_time ?? null,
      birth_place: data.birth_place ?? null,
      birth_date_correction_used_at:
        data.birth_date_correction_used_at ?? null,
    };
  } catch {
    return null;
  }
}

/** DB + 이후 session 동기화용 — 출생 필드 삭제 */
export async function resetReportBirthOnServer(
  reportId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!reportId.trim()) return { ok: false, error: "reportId 없음" };
  try {
    const res = await fetch(
      `/api/report/birth?reportId=${encodeURIComponent(reportId)}`,
      { method: "DELETE" },
    );
    const data = (await res.json()) as { error?: string; ok?: boolean };
    if (!res.ok) return { ok: false, error: data.error ?? "초기화 실패" };
    return { ok: true };
  } catch {
    return { ok: false, error: "네트워크 오류" };
  }
}
