"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchIntegratedAnalysisClient } from "@/lib/report/fetchIntegratedAnalysisClient";
import { fetchPremiumPipelineMetaClient } from "@/lib/report/fetchPremiumPipelineMetaClient";
import { logPremiumContentSource } from "@/lib/report/premiumContentSourceLog";
import {
  clearPremiumPipelineLock,
  runPremiumReportPipelineOnce,
} from "@/lib/report/premiumPipelineLock";
import {
  clearUnifiedReportCache,
  readUnifiedReportCache,
} from "@/lib/report/unifiedReportCache";
import type { PremiumProgressStage } from "@/lib/report/premiumPipelineConfig";

export type PersonalPremiumReportState = {
  loading: boolean;
  streaming: boolean;
  progressStage: PremiumProgressStage | null;
  unifiedReport: string | null;
  error: string | null;
  notPremium: boolean;
  birthIncomplete: boolean;
};

async function fetchReportRowForPipeline(reportId: string) {
  const res = await fetch(
    `/api/home/resume?reportId=${encodeURIComponent(reportId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as {
    reportId?: string | null;
    birthDate?: string | null;
    birthTime?: string | null;
    birthPlace?: string | null;
    name?: string | null;
  };
  if (!body.reportId) return null;
  return {
    id: body.reportId,
    birth_date: body.birthDate ?? null,
    birth_time: body.birthTime ?? null,
    birth_place: body.birthPlace ?? null,
    name: body.name ?? null,
  };
}

export function usePersonalPremiumReport(reportId: string, enabled: boolean) {
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [progressStage, setProgressStage] =
    useState<PremiumProgressStage | null>(null);
  const [unifiedReport, setUnifiedReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notPremium, setNotPremium] = useState(false);
  const [birthIncomplete, setBirthIncomplete] = useState(false);

  const loadInFlightRef = useRef(false);
  const pipelineStartedRef = useRef(false);

  const loadReport = useCallback(
    async (opts?: { regenerate?: boolean }) => {
      const id = reportId.trim();
      if (!id || loadInFlightRef.current) return;

      loadInFlightRef.current = true;
      setLoading(true);
      setError(null);
      setNotPremium(false);
      setBirthIncomplete(false);

      const regenerate = opts?.regenerate === true;

      try {
        if (regenerate) {
          clearUnifiedReportCache(id);
          clearPremiumPipelineLock(id);
          pipelineStartedRef.current = false;
          setUnifiedReport(null);
          logPremiumContentSource(id, "regeneration", "ui-requested");
        }

        const sessionPreview = !regenerate ? readUnifiedReportCache(id) : null;
        if (sessionPreview?.trim()) {
          setUnifiedReport(sessionPreview);
          logPremiumContentSource(id, "session", "load-preview");
          return;
        }

        const meta = await fetchPremiumPipelineMetaClient(id, { regenerate });
        if (meta.status === "not_premium") {
          setNotPremium(true);
          return;
        }
        if (meta.status === "error") {
          setError("리포트 정보를 불러오지 못했어요.");
          return;
        }

        const persisted = await fetchIntegratedAnalysisClient(id, {
          cachedFromMeta: meta.meta.premium_result,
          regenerate,
        });

        if (persisted.ok) {
          setUnifiedReport(persisted.text);
          pipelineStartedRef.current = true;
          return;
        }

        if (persisted.reason === "not_premium") {
          setNotPremium(true);
          return;
        }

        if (pipelineStartedRef.current && !regenerate) {
          return;
        }

        const reportRow = await fetchReportRowForPipeline(id);
        if (!reportRow) {
          setError("출생·계정 정보를 확인하지 못했어요.");
          return;
        }

        const hasBirth =
          Boolean(reportRow.birth_date?.trim()) &&
          Boolean(reportRow.birth_time?.trim()) &&
          Boolean(reportRow.birth_place?.trim());

        if (!hasBirth) {
          setBirthIncomplete(true);
          return;
        }

        pipelineStartedRef.current = true;
        setStreaming(true);

        const result = await runPremiumReportPipelineOnce(
          id,
          reportRow as Record<string, unknown>,
          {},
          null,
          {
            onStreamChunk: (acc) => setUnifiedReport(acc),
            onStreamingChange: setStreaming,
            onProgress: setProgressStage,
          },
          { regenerate },
        );

        if (result.failure === "birth_incomplete") {
          setBirthIncomplete(true);
          return;
        }

        if (result.unifiedReport?.trim()) {
          setUnifiedReport(result.unifiedReport);
        } else if (result.failure) {
          setError("심화 리포트 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
        } else {
          setError("심화 리포트를 준비하지 못했어요.");
        }
      } catch {
        setError("네트워크 오류가 발생했어요.");
      } finally {
        setStreaming(false);
        setProgressStage(null);
        setLoading(false);
        loadInFlightRef.current = false;
      }
    },
    [reportId],
  );

  useEffect(() => {
    if (!enabled || !reportId.trim()) return;
    void loadReport();
  }, [enabled, reportId, loadReport]);

  const regenerate = useCallback(() => loadReport({ regenerate: true }), [loadReport]);

  return {
    loading,
    streaming,
    progressStage,
    unifiedReport,
    error,
    notPremium,
    birthIncomplete,
    reload: loadReport,
    regenerate,
  } satisfies PersonalPremiumReportState & {
    reload: typeof loadReport;
    regenerate: () => Promise<void>;
  };
}
