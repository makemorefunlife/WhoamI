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
 *
 * 로그인 사용자: URL/localStorage 힌트는 resume에만 전달하고,
 * 서버 canonical reportId를 SSOT로 사용한다.
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
      if (!isLoaded) return;

      const hint = urlHint.trim();
      const stored = readStoredReportId();
      const effectiveHint = hint || stored || undefined;

      if (recoverFromServer && isSignedIn) {
        if (!cancelled) setRecovering(true);
        const session = await loadReportSession({
          urlHint: effectiveHint,
          context: logContext,
          hydrate: false,
          // URL 힌트가 있으면 캐시를 우회해 canonical 재확정
          forceRefresh: Boolean(hint),
        });
        if (!cancelled) {
          if (session.reportId && typeof window !== "undefined") {
            try { localStorage.setItem("reportId", session.reportId); } catch {}
          }
          setReportId(session.reportId);
          setRecovering(false);
          setReady(true);
        }
        return;
      }

      if (hint) {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            try { localStorage.setItem("reportId", hint); } catch {}
          }
          setReportId(hint);
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
