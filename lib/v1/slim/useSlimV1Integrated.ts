"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearBlueprintAnalysisCaches } from "@/lib/v1/slim/clearBlueprintCaches";
import type { EssenceDeepPreviewResponse, SlimV1ReportResult } from "@/lib/v1/slim/types";
import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";
import { readBirthV2Session } from "@/lib/v2/onboarding/birthSession";
import { hasMinimalBirth } from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Personal deep report -- viewing and generating are separate.
 *
 *   - Opening the page, refreshing, switching language: GET only
 *     (/api/v2/deep/essence?reportId=). Never generates, never charges.
 *   - generate() / regenerate(): the ONLY calls that POST, and only from the
 *     explicit button (regenerate after an in-page confirmation). The server
 *     returns the saved report instead of generating when this language
 *     already has one, so a double click or a retry never charges twice.
 */
export type PersonalDeepStatus =
  | "idle"
  | "loading"
  | "ready"
  | "legacy_unknown"
  | "not_generated"
  | "in_progress"
  | "error";

type ViewResponse = {
  ok?: boolean;
  state?: "ready" | "legacy_unknown" | "not_generated" | "in_progress";
  slim_v1?: SlimV1ReportResult;
  otherLocales?: string[];
  generatedWith?: { generatedAt: string | null; inputsChanged: boolean | null };
  error?: string;
  in_progress?: boolean;
};

const POLL_MS = 2500;

export function useSlimV1Integrated(
  reportId: string,
  enabled: boolean,
  birthFromBundle?: BirthV2Session | null,
) {
  const { locale, messages } = useLocale();
  const [status, setStatus] = useState<PersonalDeepStatus>("idle");
  const [data, setData] = useState<EssenceDeepPreviewResponse | null>(null);
  const [otherLocales, setOtherLocales] = useState<string[]>([]);
  const [generatedWith, setGeneratedWith] = useState<{ generatedAt: string | null; inputsChanged: boolean | null }>({
    generatedAt: null,
    inputsChanged: null,
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 402 from the generate POST: no usable credit for this language.
  const [creditExhausted, setCreditExhausted] = useState(false);

  const busyRef = useRef(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clearPoll = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };
  useEffect(() => () => clearPoll(), []);

  const applyView = useCallback((json: ViewResponse) => {
    setOtherLocales(json.otherLocales ?? []);
    setGeneratedWith(json.generatedWith ?? { generatedAt: null, inputsChanged: null });
    if ((json.state === "ready" || json.state === "legacy_unknown") && json.slim_v1?.report) {
      setData({ ok: true, slim_v1: json.slim_v1 });
      setStatus(json.state);
      return;
    }
    setData(null);
    setStatus(json.state === "in_progress" ? "in_progress" : "not_generated");
  }, []);

  /** Read-only. Safe to call any number of times. */
  const refresh = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!reportId) return;
      clearPoll();
      if (!opts?.quiet) setStatus("loading");
      try {
        const res = await fetch(
          `/api/v2/deep/essence?reportId=${encodeURIComponent(reportId)}&locale=${encodeURIComponent(locale)}`,
          { headers: { "x-aha-locale": locale }, cache: "no-store" },
        );
        const json = (await res.json()) as ViewResponse;
        if (!res.ok) throw new Error(json.error ?? messages.errors.analysisFailed);
        applyView(json);
        if (json.state === "in_progress") {
          pollTimerRef.current = setTimeout(() => void refresh({ quiet: true }), POLL_MS);
        }
        setError(null);
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : messages.errors.analysisFailed);
      }
    },
    [reportId, locale, applyView, messages.errors.analysisFailed],
  );

  const postGenerate = useCallback(
    async (regenerate: boolean) => {
      if (!reportId || busyRef.current) return;
      const birth = birthFromBundle ?? readBirthV2Session(reportId);
      if (!hasMinimalBirth(birth)) {
        setError(messages.errors.birthMissing);
        setStatus("error");
        return;
      }
      busyRef.current = true;
      clearPoll();
      setGenerating(true);
      setError(null);
      setCreditExhausted(false);
      if (regenerate) clearBlueprintAnalysisCaches(reportId);
      const survey = readSurveyV2Session(reportId);
      try {
        const res = await fetch("/api/v2/deep/essence", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-aha-locale": locale },
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
            confirmGenerate: true,
            regenerate,
          }),
        });
        const json = (await res.json()) as ViewResponse;
        if (res.status === 409 || json.in_progress === true) {
          // Another tab/click holds the generation: watch it with GET only.
          setStatus("in_progress");
          pollTimerRef.current = setTimeout(() => void refresh({ quiet: true }), POLL_MS);
          return;
        }
        if (res.status === 402) {
          setCreditExhausted(true);
          return;
        }
        if (!res.ok || !json.slim_v1?.report) {
          throw new Error(json.error ?? messages.errors.analysisFailed);
        }
        setData({ ok: true, slim_v1: json.slim_v1 });
        setStatus("ready");
        void refresh({ quiet: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : messages.errors.analysisFailed);
      } finally {
        busyRef.current = false;
        setGenerating(false);
      }
    },
    [reportId, birthFromBundle, locale, refresh, messages.errors.birthMissing, messages.errors.analysisFailed],
  );

  const generate = useCallback(() => postGenerate(false), [postGenerate]);
  const regenerate = useCallback(() => postGenerate(true), [postGenerate]);

  useEffect(() => {
    if (!enabled || !reportId) return;
    void refresh();
  }, [enabled, reportId, refresh]);

  return {
    status,
    data,
    otherLocales,
    /** When the shown report was made and whether my info changed since. */
    generatedWith,
    /** True while this tab's own generate POST is running. */
    loading: generating,
    inProgress: status === "in_progress",
    error,
    creditExhausted,
    refresh,
    generate,
    regenerate,
  };
}
