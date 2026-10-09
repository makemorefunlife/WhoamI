"use client";

import { useEffect, useState } from "react";
import {
  canBackfillBirthFromSession,
  resolveReportBirth,
} from "@/lib/v2/onboarding/resolveReportBirth";
import {
  readBirthV2Session,
  type BirthV2Session,
} from "@/lib/v2/onboarding/birthSession";
import { syncBirthSessionFromDb } from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";
import { calculateEssenceSelfLite } from "@/lib/v2/saju/essenceLite";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";

export type BlueprintBundle = {
  /**
   * null only where the survey is optional (ko-KR, lib/i18n/localePolicy.ts):
   * the birth-based results still work; survey-based parts are left out
   * (never filled with made-up values). en-US keeps the survey mandatory.
   */
  survey: ReturnType<typeof readSurveyV2Session> | null;
  birth: BirthV2Session;
  essence: ReturnType<typeof calculateEssenceSelfLite>;
  birthSource: "db" | "session" | "merged";
};

/**
 * Blueprint — 설문(session) + 출생(DB 우선) + Essence 계산.
 * 설문: en-US 필수, ko-KR 선택(없으면 survey=null).
 */
export function useBlueprintBundle(reportId: string, enabled: boolean) {
  const { locale } = useLocale();
  const surveyRequired = isPsychSurveyRequired(locale);
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
      let survey = readSurveyV2Session(reportId);
      if (!survey) {
        await hydrateSurveySession(reportId);
        survey = readSurveyV2Session(reportId);
      }
      if (!survey && surveyRequired) {
        if (!cancelled) {
          setBundle(null);
          setLoading(false);
        }
        return;
      }

      const synced = await syncBirthSessionFromDb(reportId);
      const birth = synced.birth;
      const source = synced.source ?? (birth ? "session" : null);

      if (!birth || !source) {
        if (!cancelled) {
          setBundle(null);
          setLoading(false);
        }
        return;
      }

      // `synced` (from syncBirthSessionFromDb above) already fetched this
      // same reportId's DB row -- reuse it instead of a second identical
      // GET /api/report/birth round trip.
      const dbRow = synced.dbRow;
      const sessionBirth = readBirthV2Session(reportId);
      if (canBackfillBirthFromSession({ db: dbRow, session: sessionBirth })) {
        const resolved = resolveReportBirth({ db: dbRow, session: sessionBirth });
        if (resolved?.source === "merged") {
          const { source: _s, ...backfill } = resolved;
          void fetch("/api/report/birth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reportId,
              birthDate: backfill.birthDate,
              birthTime: backfill.birthTimeUnknown ? null : backfill.birthTime,
              birthTimeUnknown: backfill.birthTimeUnknown,
              birthPlace: backfill.birthPlace,
            }),
          }).catch(() => undefined);
        }
      }

      const essence = calculateEssenceSelfLite({
        birthDate: birth.birthDate,
        birthTime: birth.birthTime,
        birthTimeUnknown: birth.birthTimeUnknown,
      });

      if (!cancelled) {
        setBundle({ survey: survey ?? null, birth, essence, birthSource: source });
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reportId, enabled, surveyRequired]);

  return { bundle, loading };
}
