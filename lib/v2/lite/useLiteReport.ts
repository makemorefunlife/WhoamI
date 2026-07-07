"use client";

import { useCallback, useEffect, useState } from "react";
import type { CurrentSelfLiteReport, InnateSelfLiteReport } from "@/lib/v2/lite/types";
import {
  readCurrentLiteReport,
  readInnateLiteReport,
  writeCurrentLiteReport,
  writeInnateLiteReport,
} from "@/lib/v2/lite/session";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import { buildInnateSelfLiteInput } from "@/lib/v2/saju/innateLiteInput";

export function useCurrentLiteReport(
  reportId: string,
  profile: CurrentSelfProfile | null,
  enabled: boolean,
) {
  const [report, setReport] = useState<CurrentSelfLiteReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!reportId || !profile) return;
    const cached = readCurrentLiteReport(reportId);
    if (cached) {
      setReport(cached);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/lite/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, language: "ko" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        report?: CurrentSelfLiteReport;
        error?: string;
      };
      if (!res.ok || !data.report) {
        throw new Error(data.error ?? "설문 분석에 실패했어요.");
      }
      writeCurrentLiteReport(reportId, data.report);
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "설문 분석에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }, [profile, reportId]);

  useEffect(() => {
    if (!enabled || !profile) return;
    void fetchReport();
  }, [enabled, profile, fetchReport]);

  return { report, loading, error, retry: fetchReport };
}

export function useInnateLiteReport(
  reportId: string,
  birth: {
    birthDate: string;
    birthTime: string | null;
    birthTimeUnknown: boolean;
  } | null,
  enabled: boolean,
) {
  const [report, setReport] = useState<InnateSelfLiteReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!reportId || !birth) return;
    const cached = readInnateLiteReport(reportId);
    if (cached) {
      setReport(cached);
      return;
    }

    const innate_self_lite_input = buildInnateSelfLiteInput({
      birthDate: birth.birthDate,
      birthTime: birth.birthTime,
      birthTimeUnknown: birth.birthTimeUnknown,
    });

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/lite/innate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          innate_self_lite_input,
          language: "ko",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        report?: InnateSelfLiteReport;
        error?: string;
      };
      if (!res.ok || !data.report) {
        throw new Error(data.error ?? "기질 분석에 실패했어요.");
      }
      writeInnateLiteReport(reportId, data.report);
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "기질 분석에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }, [birth, reportId]);

  useEffect(() => {
    if (!enabled || !birth) return;
    void fetchReport();
  }, [enabled, birth, fetchReport]);

  return { report, loading, error, retry: fetchReport };
}
