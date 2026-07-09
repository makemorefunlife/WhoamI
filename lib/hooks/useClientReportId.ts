"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { loadReportSession } from "@/lib/home/reportSession";
import { readStoredReportId } from "@/lib/stitch/hubPaths";

type UseClientReportIdOptions = {
  urlHint?: string;
  /** 로그인 사용자 — localStorage 없을 때 서버 resume으로 복구 (브라우저 변경 대응) */
  recoverFromServer?: boolean;
  logContext?: string;
};

/**
 * reportId는 마운트 후에만 확정. 첫 렌더는 항상 "".
 * ready=true 이후에만 데이터 fetch 시작.
 */
export function useClientReportId({
  urlHint = "",
  recoverFromServer = true,
  logContext = "client-report-id",
}: UseClientReportIdOptions = {}) {
  const { isLoaded, isSignedIn } = useAuth();
  const [reportId, setReportId] = useState("");
  const [ready, setReady] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const hint = urlHint.trim();

      if (hint) {
        if (!cancelled) {
          setReportId(hint);
          setReady(true);
        }
        return;
      }

      if (!isLoaded) return;

      const stored = readStoredReportId();

      // 로그인 사용자: localStorage 유무와 관계없이 서버 canonical을 먼저 확정한 뒤 fetch
      if (recoverFromServer && isSignedIn) {
        if (!cancelled) setRecovering(true);
        const session = await loadReportSession({
          urlHint: stored || undefined,
          context: logContext,
          hydrate: false,
          forceRefresh: !stored,
        });
        if (!cancelled) {
          setReportId(session.reportId);
          setRecovering(false);
          setReady(true);
        }
        return;
      }

      if (stored) {
        if (!cancelled) {
          setReportId(stored);
          setReady(true);
        }
        return;
      }

      if (!cancelled) setReady(true);
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [urlHint, isLoaded, isSignedIn, recoverFromServer, logContext]);

  return { reportId, ready, recovering };
}
