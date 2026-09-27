"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const { locale, messages, href } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<EssenceDeepPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set on a 402 from /api/v2/deep/essence (reservePersonalCredit rejected
  // for insufficient balance -- see creditEnforcementPolicy.ts). Mirrors
  // useRelationshipDetail.ts's premiumCreditExhausted: the page shows a
  // Purchase Selector instead of the generic error state, and a retry()
  // after a successful purchase re-attempts generation against the fresh
  // credit with no further user action needed.
  const [creditExhausted, setCreditExhausted] = useState(false);

  // Explicit-intent signal, mirroring useRelationshipDetail.ts's
  // ?autostart=1 / autostartCreditExhausted convention: only the dedicated
  // "start Personal Deep analysis" entry points (EssenceDeepEntryButton,
  // the Lite/Current report upsell CTAs) attach ?autostart=1. A direct URL
  // visit, a bookmark, or a plain page refresh never carries it, so those
  // keep today's manual "credit needed" CTA instead of forcing a purchase
  // modal open. Read into a ref (never a fetchReport/effect dependency) so
  // clearing it later via clearAutostartParam can't change fetchReport's
  // own identity and re-trigger the mount effect a second time.
  const urlAutostart = searchParams.get("autostart") === "1";
  const urlAutostartRef = useRef(urlAutostart);
  urlAutostartRef.current = urlAutostart;
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  // True only once the very first, explicit-intent-triggered attempt hits
  // a 402 -- distinct from `creditExhausted`, which also covers manual
  // retry()/regenerateFresh() attempts. Gates auto-opening the Purchase
  // Selector so a direct visit or revisit never gets the modal forced on
  // it, matching useRelationshipDetail.ts's autostartCreditExhausted.
  const [autostartCreditExhausted, setAutostartCreditExhausted] = useState(false);
  // Flips once, from false to true, after the very first fetch attempt
  // this hook instance makes fully resolves (any outcome). A separate
  // effect below reacts to it to strip ?autostart=1 from the URL, mirroring
  // useRelationshipDetail.ts's clearAutostartParam -- done as its own
  // effect (not inline inside fetchReport) so router.replace's own
  // searchParams update can never feed back into fetchReport's identity.
  const [autostartResolved, setAutostartResolved] = useState(false);
  // Guards the "is this the very first attempt" check; never resets, so
  // only the literal first call (always the mount-triggered auto-fetch)
  // can ever be treated as the explicit-intent attempt.
  const hasAttemptedRef = useRef(false);

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

  const clearAutostartParam = useCallback(() => {
    const sp = searchParamsRef.current;
    if (sp.get("autostart") !== "1" || !reportId) return;
    const q = new URLSearchParams(sp.toString());
    q.delete("autostart");
    const qs = q.toString();
    const path = `/blueprint-preview/${encodeURIComponent(reportId)}/essence/deep`;
    router.replace(href(qs ? `${path}?${qs}` : path), { scroll: false });
  }, [router, reportId, href]);

  useEffect(() => {
    if (!autostartResolved) return;
    clearAutostartParam();
  }, [autostartResolved, clearAutostartParam]);

  const fetchReport = useCallback(
    async (opts?: { clearCaches?: boolean; isPolling?: boolean }) => {
      if (!reportId) return;
      if (isFetchingRef.current && !opts?.isPolling) return;

      clearPollTimer();

      // See the urlAutostart/hasAttemptedRef comments above: only the
      // literal first non-polling call this hook instance ever makes can
      // be an "explicit intent" attempt.
      const isAutostartAttempt =
        urlAutostartRef.current && !opts?.isPolling && !hasAttemptedRef.current;
      if (!opts?.isPolling) {
        hasAttemptedRef.current = true;
      }
      if (isAutostartAttempt) {
        setAutostartCreditExhausted(false);
      }
      const finishAutostartAttempt = () => {
        if (isAutostartAttempt) setAutostartResolved(true);
      };

      if (opts?.clearCaches) {
        clearBlueprintAnalysisCaches(reportId);
      }

      const birth = birthFromBundle ?? readBirthV2Session(reportId);
      if (!hasMinimalBirth(birth)) {
        setData(null);
        setError(messages.errors.birthMissing);
        setLoading(false);
        setInProgress(false);
        finishAutostartAttempt();
        return;
      }

      if (!opts?.clearCaches) {
        const cached = readSlimIntegratedCache(reportId, locale);
        if (cached) {
          setData(cached);
          setError(null);
          setLoading(false);
          setInProgress(false);
          finishAutostartAttempt();
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
        setCreditExhausted(false);
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

        if (res.status === 402) {
          setCreditExhausted(true);
          setError(null);
          if (isAutostartAttempt) {
            setAutostartCreditExhausted(true);
          }
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
        finishAutostartAttempt();
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

  return {
    data,
    loading,
    inProgress,
    error,
    creditExhausted,
    // True from mount (when ?autostart=1 is present) until either a report
    // shows up or the explicit-intent attempt resolves and the param is
    // cleared. Lets the page show one "Preparing..." message instead of
    // ever flashing the manual "credit needed" CTA before the Purchase
    // Selector auto-opens.
    autostartPending: urlAutostart && !data,
    autostartCreditExhausted,
    retry: fetchReport,
    regenerateFresh,
  };
}
