"use client";

import { useCallback, useEffect, useState } from "react";
import type { CurrentSelfLiteReport, EssenceSelfLiteReport } from "@/lib/v2/lite/types";
import {
  readCurrentLiteReport,
  readEssenceLiteReport,
  writeCurrentLiteReport,
  writeEssenceLiteReport,
} from "@/lib/v2/lite/session";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import { buildEssenceSelfLiteInput } from "@/lib/v2/saju/essenceLiteInput";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function useCurrentLiteReport(
  reportId: string,
  profile: CurrentSelfProfile | null,
  enabled: boolean,
) {
  const { locale, messages } = useLocale();
  const [report, setReport] = useState<CurrentSelfLiteReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!reportId || !profile) return;
    const cached = readCurrentLiteReport(reportId, locale);
    if (cached) {
      setReport(cached);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/lite/current", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-aha-locale": locale,
        },
        body: JSON.stringify({ profile, language: locale }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        report?: CurrentSelfLiteReport;
        error?: string;
      };
      if (!res.ok || !data.report) {
        throw new Error(data.error ?? messages.errors.generic);
      }
      writeCurrentLiteReport(reportId, data.report, locale);
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.errors.generic);
    } finally {
      setLoading(false);
    }
  }, [profile, reportId, locale, messages.errors.generic]);

  useEffect(() => {
    if (!enabled || !profile) return;
    void fetchReport();
  }, [enabled, profile, fetchReport]);

  return { report, loading, error, retry: fetchReport };
}

export function useEssenceLiteReport(
  reportId: string,
  birth: {
    birthDate: string;
    birthTime: string | null;
    birthTimeUnknown: boolean;
  } | null,
  enabled: boolean,
) {
  const { locale, messages } = useLocale();
  const [report, setReport] = useState<EssenceSelfLiteReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!reportId || !birth) return;
    const cached = readEssenceLiteReport(reportId, locale);
    if (cached) {
      setReport(cached);
      return;
    }

    const essence_self_lite_input = buildEssenceSelfLiteInput({
      birthDate: birth.birthDate,
      birthTime: birth.birthTime,
      birthTimeUnknown: birth.birthTimeUnknown,
    });

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/lite/essence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-aha-locale": locale,
        },
        body: JSON.stringify({
          essence_self_lite_input,
          language: locale,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        report?: EssenceSelfLiteReport;
        error?: string;
      };
      if (!res.ok || !data.report) {
        throw new Error(data.error ?? messages.errors.generic);
      }
      writeEssenceLiteReport(reportId, data.report, locale);
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.errors.generic);
    } finally {
      setLoading(false);
    }
  }, [birth, reportId, locale, messages.errors.generic]);

  useEffect(() => {
    if (!enabled || !birth) return;
    void fetchReport();
  }, [enabled, birth, fetchReport]);

  return { report, loading, error, retry: fetchReport };
}
