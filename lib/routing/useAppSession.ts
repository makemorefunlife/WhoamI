"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  getCachedReportId,
  getCachedSession,
  loadReportSession,
  type ReportSession,
} from "@/lib/home/reportSession";

const EMPTY: ReportSession = {
  reportId: "",
  source: "none",
  invalidHint: false,
  surveyCompleted: false,
  hasReport: false,
  birthDate: null,
  birthTime: null,
  birthPlace: null,
  isPremium: false,
  relationshipSummary: { pending: 0, completed: 0 },
};

/**
 * 앱 세션 SSOT (클라이언트).
 * - 캐시된 reportId/세션을 즉시 반환 (페이지 블로킹 없음)
 * - 백그라운드에서 resume 갱신
 */
export function useAppSession(options?: { hydrate?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const hydrate = options?.hydrate !== false;

  const [session, setSession] = useState<ReportSession>(() => {
    return getCachedSession() ?? { ...EMPTY, reportId: getCachedReportId() };
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    void (async () => {
      if (!isSignedIn && !getCachedReportId()) {
        if (!cancelled) setSession(EMPTY);
        return;
      }

      setRefreshing(true);
      try {
        const next = await loadReportSession({ hydrate });
        if (!cancelled) setSession(next);
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrate, isLoaded, isSignedIn]);

  return {
    session,
    reportId: session.reportId,
    isPremium: session.isPremium,
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    refreshing,
  };
}
