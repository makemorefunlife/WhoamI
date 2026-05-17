import { persistIntegratedAnalysisClient } from "@/lib/report/fetchIntegratedAnalysisClient";
import { fetchPremiumPipelineMetaClient } from "@/lib/report/fetchPremiumPipelineMetaClient";
import { logAstrologyCache } from "@/lib/report/astrologyCoordLog";
import { extractAstrologyTextForIntegrated } from "@/lib/report/astrologyIntegratedText";
import { buildAstrologyApiRequestFromReport } from "@/lib/report/buildAstrologyApiRequest";
import { persistAstrologyClient } from "@/lib/report/persistAstrologyClient";
import { persistDetailedSurveyClient } from "@/lib/report/persistDetailedSurveyClient";
import { logPremiumContentSource } from "@/lib/report/premiumContentSourceLog";
import { hasCompleteBirthInfo } from "@/lib/report/reportBirthUtils";

export type PremiumPipelineCallbacks = {
  onStreamChunk?: (accumulated: string) => void;
  onStreamingChange?: (streaming: boolean) => void;
};

export type PremiumPipelineResult = {
  unifiedReport: string | null;
  sajuStatus: { attempted: boolean; ok: boolean };
  relationship: string | null;
  freeSummary: string | null;
};

/**
 * 심화(유료) 통합 리포트 생성 — 사주·점성·관계·LLM 통합 (기본 분석과 분리)
 */
export async function runPremiumReportPipeline(
  reportId: string,
  report: Record<string, unknown>,
  interpretations: Record<string, string>,
  patterns: Record<string, string> | null,
  callbacks: PremiumPipelineCallbacks = {},
  options?: { regenerate?: boolean },
): Promise<PremiumPipelineResult> {
  const { onStreamChunk, onStreamingChange } = callbacks;
  let sajuStatus: { attempted: boolean; ok: boolean } = {
    attempted: false,
    ok: false,
  };
  let relationship: string | null = null;
  let freeSummary: string | null = null;
  let unifiedReport: string | null = null;

  void interpretations;

  if (!hasCompleteBirthInfo(report)) {
    return { unifiedReport: null, sajuStatus, relationship, freeSummary };
  }

  const metaResult = await fetchPremiumPipelineMetaClient(reportId, {
    regenerate: options?.regenerate,
  });
  const pipelineMeta = metaResult.status === "ok" ? metaResult.meta : null;

  if (pipelineMeta?.basic_result) {
    freeSummary = pipelineMeta.basic_result;
    logPremiumContentSource(reportId, "db", "basic-reuse-quick-meta");
  }

  if (!options?.regenerate && pipelineMeta?.premium_result) {
    unifiedReport = pipelineMeta.premium_result;
    logPremiumContentSource(reportId, "db", "pipeline-skip-full");
    onStreamChunk?.(pipelineMeta.premium_result);
    return {
      unifiedReport,
      sajuStatus: { attempted: true, ok: true },
      relationship,
      freeSummary,
    };
  }

  if (options?.regenerate) {
    logPremiumContentSource(reportId, "regeneration", "pipeline-full-run");
  }

  let localSajuData: unknown = null;

  sajuStatus = { attempted: true, ok: false };
  const sr = await fetch("/api/saju", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      birthDate: report.birth_date,
      birthTime: report.birth_time,
      birthPlace: report.birth_place ?? undefined,
      reportId,
    }),
  });

  if (sr.ok) {
    localSajuData = await sr.json();
    sajuStatus = { attempted: true, ok: true };
  }

  let localAstrologyText: string | null = null;
  if (sajuStatus.ok) {
    let astroRequest: ReturnType<typeof buildAstrologyApiRequestFromReport> | null =
      null;
    try {
      astroRequest = buildAstrologyApiRequestFromReport(report, { reportId });
    } catch (e) {
      console.error("점성 좌표/요청 구성 실패:", e);
    }

    const fingerprint = astroRequest?.locationFingerprint ?? null;
    const canReuseAstrology =
      Boolean(pipelineMeta?.astrology_result) &&
      Boolean(fingerprint) &&
      pipelineMeta?.astrology_location_key === fingerprint;

    if (canReuseAstrology && pipelineMeta?.astrology_result) {
      localAstrologyText = pipelineMeta.astrology_result;
      logAstrologyCache(reportId, "astrology_reused");
    } else if (pipelineMeta?.astrology_result && fingerprint) {
      logAstrologyCache(
        reportId,
        "astrology_invalidated_location",
        "reason=pipeline_fingerprint_mismatch",
      );
    }

    if (!localAstrologyText && astroRequest) {
      try {
        const ar = await fetch("/api/astrology", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(astroRequest.body),
        });
        if (ar.ok) {
          const astroData = (await ar.json()) as Record<string, unknown>;
          const extracted = extractAstrologyTextForIntegrated(astroData);
          if (extracted) {
            localAstrologyText = extracted;
            logPremiumContentSource(
              reportId,
              "generation",
              "astrology-api-llm",
            );
            void persistAstrologyClient(reportId, extracted, {
              locationFingerprint: astroRequest.locationFingerprint,
            });
          }
        }
      } catch (e) {
        console.error("점성학 API 실패:", e);
      }
    }
  }

  try {
    const res = await fetch("/api/relationship/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
    });
    if (res.ok) {
      const data = await res.json();
      relationship = data.relationship ?? data.astrology ?? null;
    }
  } catch (relationshipErr) {
    console.error("관계 맥락 생성 API 실패:", relationshipErr);
  }

  if (!sajuStatus.ok) {
    return { unifiedReport: null, sajuStatus, relationship, freeSummary };
  }

  let detailedSurveyReport: string | null = null;
  if (!options?.regenerate && pipelineMeta?.detailed_survey_result) {
    detailedSurveyReport = pipelineMeta.detailed_survey_result;
    logPremiumContentSource(reportId, "db", "detailed-survey-reuse");
  }

  if (!detailedSurveyReport) {
    logPremiumContentSource(reportId, "generation", "detailed-survey-llm-start");
    const detailedRes = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "detailed_survey",
        patterns,
      }),
    });
    const detailedData = await detailedRes.json();
    const generated =
      typeof detailedData.report === "string" ? detailedData.report.trim() : "";
    if (generated) {
      detailedSurveyReport = generated;
      void persistDetailedSurveyClient(reportId, generated);
    }
  }

  const combinedAstrology = [localAstrologyText, relationship]
    .filter(Boolean)
    .join("\n\n");

  onStreamingChange?.(true);
  unifiedReport = "";

  try {
    logPremiumContentSource(reportId, "generation", "integrated-llm-start");
    const integratedRes = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "integrated",
        detailedSurvey: detailedSurveyReport,
        sajuData: localSajuData ?? null,
        astrologyText: combinedAstrology || null,
        stream: true,
      }),
    });

    if (!integratedRes.ok) {
      const errJson = await integratedRes.json().catch(() => ({}));
      unifiedReport = `통합 리포트를 만들지 못했어요. ${String((errJson as { error?: string }).error ?? "잠시 후 다시 열어보세요.")}`;
    } else {
      const ct = integratedRes.headers.get("content-type") ?? "";
      if (ct.includes("text/plain") && integratedRes.body) {
        const reader = integratedRes.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          onStreamChunk?.(acc);
        }
        unifiedReport = acc;
      } else {
        const integratedData = await integratedRes.json();
        unifiedReport = integratedData.report ?? "";
        onStreamChunk?.(unifiedReport);
      }
    }
  } catch (streamErr) {
    console.error(streamErr);
    unifiedReport =
      "통합 리포트를 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
    onStreamChunk?.(unifiedReport);
  } finally {
    onStreamingChange?.(false);
  }

  if (unifiedReport?.trim()) {
    logPremiumContentSource(reportId, "generation", "integrated-llm-complete");
    void persistIntegratedAnalysisClient(reportId, unifiedReport);
  }

  return { unifiedReport, sajuStatus, relationship, freeSummary };
}
