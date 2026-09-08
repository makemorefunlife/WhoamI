"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearBlueprintAnalysisCaches } from "@/lib/v1/slim/clearBlueprintCaches";
import {
  readSlimIntegratedCache,
  writeSlimIntegratedCache,
} from "@/lib/v1/slim/slimIntegratedCache";
import type { EssenceDeepPreviewResponse } from "@/lib/v1/slim/types";
import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";
import { readBirthV2Session } from "@/lib/v2/onboarding/birthSession";
import { hasMinimalBirth } from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function useSlimV1Integrated(
  reportId: string,
  enabled: boolean,
  birthFromBundle?: BirthV2Session | null,
) {
  const { locale, messages } = useLocale();
  const [data, setData] = useState<EssenceDeepPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearPollTimer = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearPollTimer();
  }, []);

  const fetchReport = useCallback(
    async (opts?: { clearCaches?: boolean; isPolling?: boolean }) => {
      if (!reportId) return;
      if (isFetchingRef.current && !opts?.isPolling) return;

      clearPollTimer();

      if (opts?.clearCaches) {
        clearBlueprintAnalysisCaches(reportId);
      }

      const birth = birthFromBundle ?? readBirthV2Session(reportId);
      if (!hasMinimalBirth(birth)) {
        setData(null);
        setError(messages.errors.birthMissing);
        setLoading(false);
        setInProgress(false);
        return;
      }

      if (!opts?.clearCaches) {
        const cached = readSlimIntegratedCache(reportId, locale);
        if (cached) {
          setData(cached);
          setError(null);
          setLoading(false);
          setInProgress(false);
          return;
        }
      } else {
        setData(null);
      }

      const survey = readSurveyV2Session(reportId);

      isFetchingRef.current = true;
      setLoading(true);
      if (!opts?.isPolling) {
        setError(null);
      }

      try {
        const res = await fetch("/api/v2/deep/essence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-aha-locale": locale,
          },
          cache: "no-store",
          body: JSON.stringify({
            reportId,
            birthDate: birth!.birthDate,
            birthTime: birth!.birthTime,
            birthTimeUnknown: birth!.birthTimeUnknown,
            birthPlace: birth!.birthPlace,
            surveyAnswers: survey?.answers ?? null,
            currentSelfProfile: survey?.profile ?? null,
            language: locale,
            forceRegenerate: opts?.clearCaches === true,
          }),
        });

        const json = (await res.json()) as EssenceDeepPreviewResponse & {
          error?: string;
          in_progress?: boolean;
        };

        if (res.status === 409 || json.in_progress === true) {
          setInProgress(true);
          setError(null);
          pollTimerRef.current = setTimeout(() => {
            void fetchReport({ isPolling: true });
          }, 2500);
          return;
        }

        if (!res.ok || !json.slim_v1?.report) {
          throw new Error(json.error ?? messages.errors.analysisFailed);
        }

        const payload = { ok: true as const, slim_v1: json.slim_v1 };
        writeSlimIntegratedCache(reportId, payload, locale);
        setData(payload);
        setInProgress(false);
        setError(null);
      } catch (e) {
        setInProgress(false);
        setError(
          e instanceof Error ? e.message : messages.errors.analysisFailed,
        );
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    },
    [reportId, birthFromBundle, locale, messages.errors.birthMissing, messages.errors.analysisFailed],
  );

  const regenerateFresh = useCallback(() => {
    return fetchReport({ clearCaches: true });
  }, [fetchReport]);

  useEffect(() => {
    if (!enabled || !reportId) return;
    void fetchReport();
  }, [enabled, reportId, fetchReport]);

  return { data, loading, inProgress, error, retry: fetchReport, regenerateFresh };
}
