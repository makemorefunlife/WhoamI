import { persistIntegratedAnalysisClient } from "@/lib/report/fetchIntegratedAnalysisClient";
import {
  fetchPremiumPipelineMetaClient,
  type PremiumPipelineMeta,
} from "@/lib/report/fetchPremiumPipelineMetaClient";
import { buildSurveyAnalysisForIntegrated } from "@/lib/v1/slim/surveyAnalysis";
import { fetchWithTimeout, FetchTimeoutError } from "@/lib/report/fetchWithTimeout";
import { logAstrologyCache } from "@/lib/report/astrologyCoordLog";
import { extractAstrologyTextForIntegrated } from "@/lib/report/astrologyIntegratedText";
import { buildAstrologyApiRequestFromReport } from "@/lib/report/buildAstrologyApiRequest";
import { persistAstrologyClient } from "@/lib/report/persistAstrologyClient";
import { persistDetailedSurveyClient } from "@/lib/report/persistDetailedSurveyClient";
import { logPremiumContentSource } from "@/lib/report/premiumContentSourceLog";
import {
  ASTROLOGY_FETCH_TIMEOUT_MS,
  LLM_FETCH_TIMEOUT_MS,
  MIN_INTEGRATED_CHARS,
  SAJU_FETCH_TIMEOUT_MS,
  type PremiumProgressStage,
} from "@/lib/report/premiumPipelineConfig";
import { logPremiumPipelineStage } from "@/lib/report/premiumPipelineDiagnostics";
import {
  isIntegratedErrorPlaceholder,
  type PremiumPipelineFailure,
} from "@/lib/report/premiumPipelineFailure";
import {
  logPremiumReportQuality,
  measurePremiumReportQuality,
  recordPremiumApiFailure,
  recordPremiumPipelineDuration,
} from "@/lib/report/premiumReportQuality";
import { hasCompleteBirthInfo } from "@/lib/report/reportBirthUtils";

function inputLen(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "string") return value.trim().length;
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

const SURVEY_PATTERN_KEYS = [
  "mbti",
  "disc",
  "enneagram",
  "riasec",
  "pss",
  "tci",
] as const;

function isSurveyPatternsComplete(
  patterns: Record<string, string> | null,
): boolean {
  if (!patterns) return false;
  return SURVEY_PATTERN_KEYS.every((key) => {
    const p = patterns[key]?.trim();
    return Boolean(p && p !== "N/A" && p.length >= 3);
  });
}

function validateIntegratedText(
  text: string | null | undefined,
): { ok: true; text: string } | { ok: false; failure: PremiumPipelineFailure } {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) {
    return { ok: false, failure: "integrated_empty" };
  }
  if (isIntegratedErrorPlaceholder(trimmed)) {
    return { ok: false, failure: "integrated_llm_failed" };
  }
  if (trimmed.length < MIN_INTEGRATED_CHARS) {
    return { ok: false, failure: "integrated_too_short" };
  }
  return { ok: true, text: trimmed };
}

export type PremiumPipelineCallbacks = {
  onStreamChunk?: (accumulated: string) => void;
  onStreamingChange?: (streaming: boolean) => void;
  onProgress?: (stage: PremiumProgressStage) => void;
};

export type PremiumPipelineResult = {
  unifiedReport: string | null;
  sajuStatus: { attempted: boolean; ok: boolean };
  relationship: string | null;
  freeSummary: string | null;
  failure: PremiumPipelineFailure | null;
  warnings: string[];
  persisted: boolean;
  fromCache: boolean;
};

/**
 * 심화(유료) 통합 리포트 생성 — 사주·점성·관계·LLM 통합 (기본 분석과 분리)
 *
 * 캐시: meta.premium_result 있고 regenerate 아니면 DB 즉시 반환 (meta_cache_hit).
 * 재생성: options.regenerate 또는 URL regenerateIntegrated=1 → DB 삭제 후 전체 파이프라인.
 * 중복 방지: runPremiumReportPipelineOnce (in-flight Map).
 */
export async function runPremiumReportPipeline(
  reportId: string,
  report: Record<string, unknown>,
  interpretations: Record<string, string>,
  patterns: Record<string, string> | null,
  callbacks: PremiumPipelineCallbacks = {},
  options?: { regenerate?: boolean; initialMeta?: PremiumPipelineMeta | null },
): Promise<PremiumPipelineResult> {
  const startedAt = Date.now();
  const { onStreamChunk, onStreamingChange, onProgress } = callbacks;
  const warnings: string[] = [];
  let failure: PremiumPipelineFailure | null = null;
  let persisted = false;
  let fromCache = false;

  let sajuStatus: { attempted: boolean; ok: boolean } = {
    attempted: false,
    ok: false,
  };
  let relationship: string | null = null;
  let freeSummary: string | null = null;
  let unifiedReport: string | null = null;

  void interpretations;

  const emitProgress = (stage: PremiumProgressStage) => onProgress?.(stage);

  logPremiumPipelineStage(reportId, "start", {
    hasPatterns: Boolean(patterns && Object.keys(patterns).length > 0),
    regenerate: Boolean(options?.regenerate),
  });

  if (!hasCompleteBirthInfo(report)) {
    logPremiumPipelineStage(reportId, "birth_incomplete", {
      birth_date: report.birth_date ? "set" : "missing",
      birth_time: report.birth_time ? "set" : "missing",
      birth_place: report.birth_place ? "set" : "missing",
    });
    return {
      unifiedReport: null,
      sajuStatus,
      relationship,
      freeSummary,
      failure: "birth_incomplete",
      warnings,
      persisted: false,
      fromCache: false,
    };
  }

  if (!isSurveyPatternsComplete(patterns)) {
    warnings.push("survey_incomplete");
    logPremiumPipelineStage(reportId, "detailed_survey_llm", {
      survey_incomplete: true,
    });
  }

  emitProgress("cache_check");
  let pipelineMeta: PremiumPipelineMeta | null = options?.initialMeta ?? null;
  let metaStatus: "ok" | "not_premium" | "error" | "prefetched" = options
    ?.initialMeta
    ? "prefetched"
    : "ok";

  if (!options?.initialMeta) {
    const metaResult = await fetchPremiumPipelineMetaClient(reportId, {
      regenerate: options?.regenerate,
    });
    metaStatus = metaResult.status;
    pipelineMeta = metaResult.status === "ok" ? metaResult.meta : null;

    if (metaResult.status === "error") {
      recordPremiumApiFailure("meta_fetch");
      failure = "meta_error";
    }
  }

  logPremiumPipelineStage(reportId, "meta_fetch", {
    status: metaStatus,
    premium_cached: Boolean(pipelineMeta?.premium_result?.trim()),
    detailed_survey_cached: Boolean(pipelineMeta?.detailed_survey_result?.trim()),
    astrology_cached: Boolean(pipelineMeta?.astrology_result?.trim()),
  });

  if (pipelineMeta?.basic_result) {
    freeSummary = pipelineMeta.basic_result;
    logPremiumContentSource(reportId, "db", "basic-reuse-quick-meta");
  }

  if (!options?.regenerate && pipelineMeta?.premium_result) {
    const cached = pipelineMeta.premium_result.trim();
    const validated = validateIntegratedText(cached);
    if (validated.ok) {
      unifiedReport = validated.text;
      fromCache = true;
      emitProgress("done");
      logPremiumPipelineStage(reportId, "meta_cache_hit", {
        chars: unifiedReport.length,
      });
      logPremiumContentSource(reportId, "db", "pipeline-skip-full");
      const metrics = measurePremiumReportQuality(unifiedReport);
      logPremiumReportQuality(reportId, metrics, { source: "cache" });
      onStreamChunk?.(unifiedReport);
      recordPremiumPipelineDuration(Date.now() - startedAt);
      return {
        unifiedReport,
        sajuStatus: { attempted: true, ok: true },
        relationship,
        freeSummary,
        failure: null,
        warnings,
        persisted: true,
        fromCache: true,
      };
    }
    logPremiumPipelineStage(reportId, "meta_cache_hit", {
      invalid_cache: true,
      reason: validated.failure,
    });
  }

  if (options?.regenerate) {
    logPremiumContentSource(reportId, "regeneration", "pipeline-full-run");
  }

  if (failure === "meta_error") {
    recordPremiumPipelineDuration(Date.now() - startedAt);
    return {
      unifiedReport: null,
      sajuStatus,
      relationship,
      freeSummary,
      failure,
      warnings,
      persisted: false,
      fromCache: false,
    };
  }

  let localSajuData: unknown = null;
  let localAstrologyText: string | null = null;
  let detailedSurveyReport: string | null = null;

  emitProgress("saju");
  logPremiumPipelineStage(reportId, "parallel_prep_start", {
    birth_date: String(report.birth_date ?? ""),
    birth_time: String(report.birth_time ?? ""),
  });

  const sajuTask = (async () => {
    sajuStatus = { attempted: true, ok: false };
    logPremiumPipelineStage(reportId, "saju_request");
    try {
      const sr = await fetchWithTimeout("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: report.birth_date,
          birthTime: report.birth_time,
          birthPlace: report.birth_place ?? undefined,
          reportId,
        }),
        timeoutMs: SAJU_FETCH_TIMEOUT_MS,
        label: "saju",
      });

      if (sr.ok) {
        const data = await sr.json();
        sajuStatus = { attempted: true, ok: true };
        logPremiumPipelineStage(reportId, "saju_ok", {
          json_chars: inputLen(data),
        });
        return data;
      }

      const sajuErr = await sr.text().catch(() => "");
      recordPremiumApiFailure("saju_http");
      failure = "saju_failed";
      logPremiumPipelineStage(reportId, "saju_fail", {
        http_status: sr.status,
        body_preview: sajuErr.slice(0, 200),
      });
      return null;
    } catch (e) {
      recordPremiumApiFailure("saju_exception");
      failure =
        e instanceof FetchTimeoutError ? "saju_timeout" : "saju_failed";
      logPremiumPipelineStage(reportId, "saju_fail", {
        message: e instanceof Error ? e.message : String(e),
      });
      return null;
    }
  })();

  const relationshipTask = (async () => {
    try {
      const res = await fetchWithTimeout("/api/relationship/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
        timeoutMs: 20_000,
        label: "relationship",
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.relationship ?? data.astrology ?? null;
        logPremiumPipelineStage(
          reportId,
          text ? "relationship_ok" : "relationship_empty",
          { chars: inputLen(text) },
        );
        return text as string | null;
      }
      return null;
    } catch (relationshipErr) {
      warnings.push("relationship_failed");
      recordPremiumApiFailure("relationship");
      console.error("관계 맥락 생성 API 실패:", relationshipErr);
      return null;
    }
  })();

  const astrologyTask = (async () => {
    let astroRequest: ReturnType<typeof buildAstrologyApiRequestFromReport> | null =
      null;
    try {
      astroRequest = buildAstrologyApiRequestFromReport(report, { reportId });
    } catch (e) {
      console.error("점성 좌표/요청 구성 실패:", e);
      warnings.push("astrology_request_build_failed");
      return null;
    }

    const fingerprint = astroRequest?.locationFingerprint ?? null;
    const canReuseAstrology =
      Boolean(pipelineMeta?.astrology_result) &&
      Boolean(fingerprint) &&
      pipelineMeta?.astrology_location_key === fingerprint;

    if (canReuseAstrology && pipelineMeta?.astrology_result) {
      logAstrologyCache(reportId, "astrology_reused");
      return pipelineMeta.astrology_result;
    }
    if (pipelineMeta?.astrology_result && fingerprint) {
      logAstrologyCache(
        reportId,
        "astrology_invalidated_location",
        "reason=pipeline_fingerprint_mismatch",
      );
    }

    if (!astroRequest) return null;

    emitProgress("astrology");
    try {
      const ar = await fetchWithTimeout("/api/astrology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(astroRequest.body),
        timeoutMs: ASTROLOGY_FETCH_TIMEOUT_MS,
        label: "astrology",
      });
      logPremiumPipelineStage(reportId, "astrology_request");
      if (ar.ok) {
        const astroData = (await ar.json()) as Record<string, unknown>;
        const extracted = extractAstrologyTextForIntegrated(astroData);
        if (extracted) {
          logPremiumPipelineStage(reportId, "astrology_ok", {
            chars: extracted.length,
          });
          logPremiumContentSource(
            reportId,
            "generation",
            "astrology-api-llm",
          );
          void persistAstrologyClient(reportId, extracted, {
            locationFingerprint: astroRequest.locationFingerprint,
          });
          return extracted;
        }
        warnings.push("astrology_empty");
        logPremiumPipelineStage(reportId, "astrology_skip", {
          reason: "empty_extract",
          http_status: ar.status,
        });
      } else {
        warnings.push("astrology_http_error");
        recordPremiumApiFailure("astrology_http");
        logPremiumPipelineStage(reportId, "astrology_skip", {
          reason: "http_error",
          http_status: ar.status,
        });
      }
    } catch (e) {
      warnings.push("astrology_exception");
      recordPremiumApiFailure("astrology_exception");
      console.error("점성학 API 실패:", e);
      logPremiumPipelineStage(reportId, "astrology_skip", {
        reason: "exception",
        message: e instanceof Error ? e.message : String(e),
      });
    }
    return null;
  })();

  const detailedSurveyTask = (async () => {
    if (!options?.regenerate && pipelineMeta?.detailed_survey_result) {
      logPremiumPipelineStage(reportId, "detailed_survey_reuse", {
        chars: pipelineMeta.detailed_survey_result.length,
      });
      logPremiumContentSource(reportId, "db", "detailed-survey-reuse");
      return pipelineMeta.detailed_survey_result;
    }

    emitProgress("detailed_survey");
    logPremiumPipelineStage(reportId, "detailed_survey_build", {
      patterns_keys: patterns ? Object.keys(patterns).join(",") : "",
      source: "hardcoded_pattern_base",
    });
    logPremiumContentSource(
      reportId,
      "generation",
      "detailed-survey-hardcoded-start",
    );

    const built = buildSurveyAnalysisForIntegrated({
      v2Profile: null,
      v1Patterns: patterns,
    }).text;
    if (built && built.trim() && !built.includes("설문 응답이 없어")) {
      logPremiumPipelineStage(reportId, "detailed_survey_ok", {
        chars: built.length,
        source: "hardcoded_pattern_base",
      });
      void persistDetailedSurveyClient(reportId, built);
      return built;
    }

    warnings.push("detailed_survey_failed");
    logPremiumPipelineStage(reportId, "detailed_survey_fail", {
      reason: "patterns_incomplete",
    });
    return null;
  })();

  const [sajuDataResult, relationshipResult, astrologyResult, detailedResult] =
    await Promise.all([
      sajuTask,
      relationshipTask,
      astrologyTask,
      detailedSurveyTask,
    ]);

  localSajuData = sajuDataResult;
  relationship = relationshipResult;
  localAstrologyText = astrologyResult;
  detailedSurveyReport = detailedResult;

  emitProgress("relationship");
  logPremiumPipelineStage(reportId, "parallel_prep_done", {
    saju_ok: sajuStatus.ok,
    relationship_chars: inputLen(relationship),
    astrology_chars: inputLen(localAstrologyText),
    detailed_survey_chars: inputLen(detailedSurveyReport),
  });

  if (!sajuStatus.ok) {
    logPremiumPipelineStage(reportId, "abort_saju");
    recordPremiumPipelineDuration(Date.now() - startedAt);
    return {
      unifiedReport: null,
      sajuStatus,
      relationship,
      freeSummary,
      failure: failure ?? "saju_failed",
      warnings,
      persisted: false,
      fromCache: false,
    };
  }

  if (!detailedSurveyReport?.trim()) {
    detailedSurveyReport =
      "(설문 심화 해석을 불러오지 못했습니다. 기질 분석·출생 맥락만으로 통합합니다.)";
  }

  const combinedAstrology = localAstrologyText ?? "";

  emitProgress("integrated");
  onStreamingChange?.(true);
  unifiedReport = "";

  try {
    logPremiumPipelineStage(reportId, "integrated_llm_start", {
      detailed_survey_chars: inputLen(detailedSurveyReport),
      saju_chars: inputLen(localSajuData),
      astrology_chars: inputLen(combinedAstrology),
    });
    logPremiumContentSource(reportId, "generation", "integrated-llm-start");
    const integratedRes = await fetchWithTimeout("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "integrated",
        reportId,
        detailedSurvey: detailedSurveyReport,
        sajuData: localSajuData ?? null,
        astrologyText: combinedAstrology || null,
        stream: true,
      }),
      timeoutMs: LLM_FETCH_TIMEOUT_MS,
      label: "integrated_llm",
    });

    if (!integratedRes.ok) {
      const errJson = await integratedRes.json().catch(() => ({}));
      recordPremiumApiFailure("integrated_llm_http");
      failure = "integrated_llm_failed";
      logPremiumPipelineStage(reportId, "integrated_llm_fail", {
        http_status: integratedRes.status,
        error: String((errJson as { error?: string }).error ?? ""),
      });
      unifiedReport = null;
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
      logPremiumPipelineStage(reportId, "integrated_llm_ok", {
        chars: unifiedReport?.length ?? 0,
        content_type: integratedRes.headers.get("content-type") ?? "",
      });
    }
  } catch (streamErr) {
    recordPremiumApiFailure("integrated_llm_exception");
    console.error(streamErr);
    failure = "integrated_llm_failed";
    unifiedReport = null;
    logPremiumPipelineStage(reportId, "integrated_llm_fail", {
      message: streamErr instanceof Error ? streamErr.message : String(streamErr),
    });
  } finally {
    onStreamingChange?.(false);
  }

  const validated = validateIntegratedText(unifiedReport);
  if (!validated.ok) {
    failure = failure ?? validated.failure;
    unifiedReport = null;
    logPremiumPipelineStage(reportId, "integrated_llm_fail", {
      reason: validated.failure,
    });
  } else {
    unifiedReport = validated.text;
    const metrics = measurePremiumReportQuality(unifiedReport);
    logPremiumReportQuality(reportId, metrics, {
      warnings: warnings.join(","),
      duration_ms: Date.now() - startedAt,
    });
    if (metrics.low_part_warning) {
      warnings.push("low_part_count");
    }
    if (metrics.parse_fallback) {
      warnings.push("markdown_parse_fallback");
    }

    emitProgress("saving");
    logPremiumContentSource(reportId, "generation", "integrated-llm-complete");
    persisted = await persistIntegratedAnalysisClient(reportId, unifiedReport);
    logPremiumPipelineStage(
      reportId,
      persisted ? "integrated_persist" : "integrated_persist_fail",
      { chars: unifiedReport.trim().length },
    );
    if (!persisted) {
      failure = failure ?? "persist_failed";
      recordPremiumApiFailure("persist");
    }
    emitProgress("done");
  }

  if (warnings.includes("detailed_survey_failed") && !failure) {
    /* 통합 성공 시 설문 단계 실패는 경고만 */
  } else if (warnings.includes("detailed_survey_failed") && !unifiedReport) {
    failure = failure ?? "detailed_survey_failed";
  }

  recordPremiumPipelineDuration(Date.now() - startedAt);

  return {
    unifiedReport,
    sajuStatus,
    relationship,
    freeSummary,
    failure,
    warnings,
    persisted,
    fromCache,
  };
}
