"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { resolveCanonicalReportIdClient } from "@/lib/home/resolveCanonicalReportIdClient";

type UseCanonicalReportIdOptions = {
  /** URL 쿼리의 reportId 힌트 (id, myReportId, viewer 등) */
  urlHint: string;
  /** canonical 확정 후 URL에 쓸 쿼리 키 */
  queryParam?: string;
  /** resume API 호출 컨텍스트 로그 */
  logContext?: string;
  /** false면 canonical로 URL을 덮어쓰지 않음 (관계 탐사실 등) */
  syncToUrl?: boolean;
};

/**
 * Result/Report·관계 허브 등 — DB/API는 반환된 canonicalReportId만 사용.
 */
export function useCanonicalReportId({
  urlHint,
  queryParam = "id",
  logContext = "page",
  syncToUrl = true,
}: UseCanonicalReportIdOptions) {
  const { isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [canonicalReportId, setCanonicalReportId] = useState("");
  const [resolving, setResolving] = useState(true);
  const [invalidHint, setInvalidHint] = useState(false);

  const syncCanonicalToUrl = useCallback(
    (canonical: string) => {
      const trimmedHint = urlHint.trim();
      if (!canonical || canonical === trimmedHint) return;

      const next = new URLSearchParams(searchParams.toString());
      next.set(queryParam, canonical);
      const base = pathname || "/";
      router.replace(`${base}?${next.toString()}`, { scroll: false });
    },
    [urlHint, queryParam, pathname, router, searchParams],
  );

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    async function run() {
      setResolving(true);
      const result = await resolveCanonicalReportIdClient(
        urlHint,
        logContext,
      );
      if (cancelled) return;

      setCanonicalReportId(result.canonicalReportId);
      setInvalidHint(result.invalidHint);
      setResolving(false);

      if (result.canonicalReportId && syncToUrl) {
        syncCanonicalToUrl(result.canonicalReportId);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [urlHint, isLoaded, logContext, syncCanonicalToUrl, syncToUrl]);

  return {
    canonicalReportId,
    resolving,
    invalidHint,
    urlHint: urlHint.trim(),
  };
}
