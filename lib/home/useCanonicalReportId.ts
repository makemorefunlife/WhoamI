"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getCachedReportId,
  getCachedSession,
  loadReportSession,
} from "@/lib/home/reportSession";

type UseCanonicalReportIdOptions = {
  /** URL 쿼리의 reportId 힌트 (id, myReportId, viewer 등) */
  urlHint: string;
  /** canonical 확정 후 URL에 쓸 쿼리 키 */
  queryParam?: string;
  /** resume API 호출 컨텍스트 로그 */
  logContext?: string;
  /** false면 canonical로 URL을 덮어쓰지 않음 (관계 탐사실 등) */
  syncToUrl?: boolean;
  /** true면 설문·출생 localStorage 복구 생략 (관계 허브 등) */
  skipSessionHydrate?: boolean;
};

/**
 * canonical reportId — 캐시/힌트를 즉시 사용하고 백그라운드에서 resume 갱신.
 * 페이지 전체를 resolving 상태로 막지 않는다.
 */
export function useCanonicalReportId({
  urlHint,
  queryParam = "id",
  logContext = "page",
  syncToUrl = true,
  skipSessionHydrate = false,
}: UseCanonicalReportIdOptions) {
  const { isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trimmedHint = urlHint.trim();
  const cachedId = getCachedReportId();
  const initialId = trimmedHint || cachedId;

  const [canonicalReportId, setCanonicalReportId] = useState(initialId);
  const [resolving, setResolving] = useState(false);
  const [invalidHint, setInvalidHint] = useState(
    () => getCachedSession()?.invalidHint === true,
  );

  const syncCanonicalToUrl = useCallback(
    (canonical: string) => {
      if (!canonical || canonical === trimmedHint) return;

      const next = new URLSearchParams(searchParams.toString());
      next.set(queryParam, canonical);
      const base = pathname || "/";
      router.replace(`${base}?${next.toString()}`, { scroll: false });
    },
    [trimmedHint, queryParam, pathname, router, searchParams],
  );

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    async function run() {
      if (!initialId) setResolving(true);
      const session = await loadReportSession({
        urlHint: trimmedHint,
        context: logContext,
        hydrate: !skipSessionHydrate,
      });
      if (cancelled) return;

      if (session.reportId) {
        setCanonicalReportId(session.reportId);
      }
      setInvalidHint(session.invalidHint);
      setResolving(false);

      if (session.reportId && syncToUrl) {
        syncCanonicalToUrl(session.reportId);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    trimmedHint,
    isLoaded,
    logContext,
    syncCanonicalToUrl,
    syncToUrl,
    skipSessionHydrate,
    initialId,
  ]);

  return {
    canonicalReportId,
    resolving,
    invalidHint,
    urlHint: trimmedHint,
  };
}
