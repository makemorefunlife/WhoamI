"use client";

import { useEffect, useState } from "react";
import { fetchReportBirthFromApi } from "@/lib/v2/onboarding/fetchReportBirthClient";
import {
  birthConflicts,
  resolveReportBirth,
} from "@/lib/v2/onboarding/resolveReportBirth";
import {
  readBirthV2Session,
  writeBirthV2Session,
  type BirthV2Session,
} from "@/lib/v2/onboarding/birthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { calculateInnateSelfLite } from "@/lib/v2/saju/innateLite";

export type BlueprintBundle = {
  survey: NonNullable<ReturnType<typeof readSurveyV2Session>>;
  birth: BirthV2Session;
  innate: ReturnType<typeof calculateInnateSelfLite>;
  birthSource: "db" | "session" | "merged";
};

/**
 * Blueprint — 설문(session) + 출생(DB 우선) + innate 계산.
 * 연인 심화·관계 premium과 동일한 reports.birth_* 를 먼저 쓴다.
 */
export function useBlueprintBundle(reportId: string, enabled: boolean) {
  const [bundle, setBundle] = useState<BlueprintBundle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !reportId) {
      setBundle(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const survey = readSurveyV2Session(reportId);
      if (!survey) {
        if (!cancelled) {
          setBundle(null);
          setLoading(false);
        }
        return;
      }

      const dbRow = await fetchReportBirthFromApi(reportId);
      const sessionBirth = readBirthV2Session(reportId);
      const resolved = resolveReportBirth({
        db: dbRow,
        session: sessionBirth,
      });

      if (!resolved) {
        if (!cancelled) {
          setBundle(null);
          setLoading(false);
        }
        return;
      }

      const { source, ...birth } = resolved;

      writeBirthV2Session(reportId, birth);

      if (source === "merged" || birthConflicts(dbRow, sessionBirth)) {
        void fetch("/api/report/birth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId,
            birthDate: birth.birthDate,
            birthTime: birth.birthTimeUnknown ? null : birth.birthTime,
            birthTimeUnknown: birth.birthTimeUnknown,
            birthPlace: birth.birthPlace,
          }),
        }).catch(() => undefined);
      }

      const innate = calculateInnateSelfLite({
        birthDate: birth.birthDate,
        birthTime: birth.birthTime,
        birthTimeUnknown: birth.birthTimeUnknown,
      });

      if (!cancelled) {
        setBundle({ survey, birth, innate, birthSource: source });
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reportId, enabled]);

  return { bundle, loading };
}
