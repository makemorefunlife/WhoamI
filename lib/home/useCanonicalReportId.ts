"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getCachedReportId,
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
 * Result/Report·관계 허브 등 — DB/API는 반환된 canonicalReportId만 사용.
 * loadReportSession 캐시를 공유해 중복 resume/hydrate 방지.
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
  const [resolving, setResolving] = useState(!initialId);
  const [invalidHint, setInvalidHint] = useState(false);

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

      setCanonicalReportId(session.reportId);
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
  ]);

  return {
    canonicalReportId,
    resolving,
    invalidHint,
    urlHint: trimmedHint,
  };
}
