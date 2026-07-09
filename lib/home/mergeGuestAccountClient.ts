import type { MergeGuestAccountResult } from "@/lib/home/mergeGuestAccount";
import { invalidateHomeResumeCache } from "@/lib/home/fetchHomeResumeClient";
import { migrateLocalReportSessions } from "@/lib/v2/report/migrateLocalReportSessions";

export type MergeGuestAccountClientResult = MergeGuestAccountResult & {
  merged: boolean;
};

let mergeInFlight: Promise<MergeGuestAccountClientResult | null> | null = null;

function readStoredReportId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("reportId")?.trim() ?? "";
}

function applyCanonicalToStorage(canonicalReportId: string): void {
  if (typeof window === "undefined" || !canonicalReportId.trim()) return;
  localStorage.setItem("reportId", canonicalReportId.trim());
}

/**
 * 로그인 직후·관계 허브 진입 시 호출.
 * 게스트 localStorage reportId의 친구 데이터를 계정 DB로 병합한다.
 */
export async function ensureGuestAccountMerged(
  guestReportIdHint?: string,
): Promise<MergeGuestAccountClientResult | null> {
  if (mergeInFlight) return mergeInFlight;

  const work = (async (): Promise<MergeGuestAccountClientResult | null> => {
    const hint = guestReportIdHint?.trim() || readStoredReportId() || undefined;

    try {
      const res = await fetch("/api/account/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestReportId: hint }),
      });

      if (res.status === 401) return null;

      const body = (await res.json().catch(() => ({}))) as MergeGuestAccountClientResult & {
        error?: string;
      };

      if (!res.ok) {
        console.warn("account/merge failed:", body.error ?? res.status);
        return null;
      }

      const canonical = body.canonicalReportId?.trim();
      if (canonical) {
        const previous = hint ?? readStoredReportId();
        applyCanonicalToStorage(canonical);

        for (const oldId of body.mergedFromReportIds ?? []) {
          if (oldId && oldId !== canonical) {
            migrateLocalReportSessions(oldId, canonical);
          }
        }
        if (previous && previous !== canonical) {
          migrateLocalReportSessions(previous, canonical);
        }

        invalidateHomeResumeCache();
      }

      return body;
    } catch (e) {
      console.warn("ensureGuestAccountMerged:", e);
      return null;
    }
  })();

  mergeInFlight = work;
  try {
    return await work;
  } finally {
    mergeInFlight = null;
  }
}
