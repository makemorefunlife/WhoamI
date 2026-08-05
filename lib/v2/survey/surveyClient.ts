import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import { writeSurveyV2Session } from "@/lib/v2/survey/session";

export async function persistSurveyToServer(
  reportId: string,
  answers: Record<string, string>,
  profile: CurrentSelfProfile,
  meta?: {
    reportIdSource?: string;
    submitTrigger?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const reportIdSource = meta?.reportIdSource?.trim();
    const submitTrigger = meta?.submitTrigger?.trim();
    const res = await fetch("/api/v2/survey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(reportIdSource
          ? { "x-aha-report-id-source": reportIdSource.slice(0, 48) }
          : {}),
        ...(submitTrigger
          ? { "x-aha-submit-trigger": submitTrigger.slice(0, 48) }
          : {}),
      },
      body: JSON.stringify({ reportId, answers, profile }),
    });
    const data = (await res.json()) as { error?: string; code?: string };
    if (!res.ok) {
      const code = data.code?.trim();
      return {
        ok: false,
        error: code
          ? `${data.error ?? "저장 실패"} [${code}]`
          : (data.error ?? "저장 실패"),
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "네트워크 오류" };
  }
}

export async function fetchSurveyFromServer(reportId: string): Promise<{
  answers: Record<string, string>;
  profile: CurrentSelfProfile;
} | null> {
  try {
    const res = await fetch(
      `/api/v2/survey?reportId=${encodeURIComponent(reportId)}`,
    );
    const data = (await res.json()) as {
      hasSurvey?: boolean;
      answers?: Record<string, string>;
      profile?: CurrentSelfProfile;
    };
    if (!res.ok || !data.hasSurvey || !data.profile || !data.answers) return null;
    return { answers: data.answers, profile: data.profile };
  } catch {
    return null;
  }
}

/** 로컬 없으면 서버에서 복구해 localStorage에 기록 */
export async function hydrateSurveySession(reportId: string): Promise<boolean> {
  const remote = await fetchSurveyFromServer(reportId);
  if (!remote) return false;
  writeSurveyV2Session(reportId, {
    answers: remote.answers,
    profile: remote.profile,
  });
  return true;
}

export async function clearSurveyOnServer(
  reportId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `/api/v2/survey?reportId=${encodeURIComponent(reportId)}`,
      { method: "DELETE" },
    );
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error ?? "삭제 실패" };
    return { ok: true };
  } catch {
    return { ok: false, error: "네트워크 오류" };
  }
}
