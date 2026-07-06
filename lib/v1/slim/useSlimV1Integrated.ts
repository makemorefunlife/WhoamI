"use client";

import { useCallback, useEffect, useState } from "react";
import { clearBlueprintAnalysisCaches } from "@/lib/v1/slim/clearBlueprintCaches";
import {
  readSlimIntegratedCache,
  writeSlimIntegratedCache,
} from "@/lib/v1/slim/slimIntegratedCache";
import type { InnateDeepPreviewResponse } from "@/lib/v1/slim/types";
import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";
import { readBirthV2Session } from "@/lib/v2/onboarding/birthSession";
import { hasMinimalBirth } from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";

export function useSlimV1Integrated(
  reportId: string,
  enabled: boolean,
  birthFromBundle?: BirthV2Session | null,
) {
  const [data, setData] = useState<InnateDeepPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(
    async (opts?: { clearCaches?: boolean }) => {
      if (!reportId) return;
      if (opts?.clearCaches) {
        clearBlueprintAnalysisCaches(reportId);
      }

      const birth = birthFromBundle ?? readBirthV2Session(reportId);
      if (!hasMinimalBirth(birth)) {
        setData(null);
        setError("생년월일 정보가 없습니다. 계정 → 출생 정보에서 입력해 주세요.");
        setLoading(false);
        return;
      }

      if (!opts?.clearCaches) {
        const cached = readSlimIntegratedCache(reportId);
        if (cached) {
          setData(cached);
          setError(null);
          return;
        }
      } else {
        setData(null);
      }

      const survey = readSurveyV2Session(reportId);

      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v2/deep/innate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            birthDate: birth!.birthDate,
            birthTime: birth!.birthTime,
            birthTimeUnknown: birth!.birthTimeUnknown,
            birthPlace: birth!.birthPlace,
            surveyAnswers: survey?.answers ?? null,
            currentSelfProfile: survey?.profile ?? null,
          }),
        });
        const json = (await res.json()) as InnateDeepPreviewResponse & {
          error?: string;
        };
        if (!res.ok || !json.slim_v1?.report) {
          throw new Error(json.error ?? "분석에 실패했습니다.");
        }
        const payload = { ok: true as const, slim_v1: json.slim_v1 };
        writeSlimIntegratedCache(reportId, payload);
        setData(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "분석에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [reportId, birthFromBundle],
  );

  const regenerateFresh = useCallback(() => {
    return fetchReport({ clearCaches: true });
  }, [fetchReport]);

  useEffect(() => {
    if (!enabled || !reportId) return;
    void fetchReport();
  }, [enabled, reportId, fetchReport]);

  return { data, loading, error, retry: fetchReport, regenerateFresh };
}
