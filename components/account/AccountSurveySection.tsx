"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useClientReportId } from "@/lib/hooks/useClientReportId";
import { ROUTES, withReportId } from "@/constants/routes";
import { hasSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";

export default function AccountSurveySection() {
  const { reportId, ready, recovering } = useClientReportId({
    logContext: "account-survey",
  });
  const [hasSurvey, setHasSurvey] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ready || !reportId) {
      if (ready) setHasSurvey(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      if (hasSurveyV2Session(reportId)) {
        if (!cancelled) setHasSurvey(true);
        return;
      }
      const hydrated = await hydrateSurveySession(reportId);
      if (!cancelled) setHasSurvey(hydrated);
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, reportId]);

  if (!ready || recovering || hasSurvey === null) {
    return (
      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <p className="text-sm text-on-surface-variant">설문 상태 확인 중…</p>
      </section>
    );
  }

  if (!reportId) return null;

  const redoHref = `${withReportId(ROUTES.surveyV2, reportId)}&redo=1`;

  return (
    <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
      <h2 className="stitch-headline text-xl text-primary">설문</h2>
      <p className="mt-2 text-sm text-on-surface-variant">
        {hasSurvey
          ? "10문항 설문이 완료된 상태예요. 답을 바꾸면 Blueprint 점수가 달라질 수 있어요."
          : "아직 설문을 완료하지 않았어요."}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {hasSurvey ? (
          <Link href={redoHref} className="stitch-cta-secondary text-center">
            설문 다시 하기
          </Link>
        ) : (
          <Link
            href={withReportId(ROUTES.surveyV2, reportId)}
            className="stitch-cta-primary text-center"
          >
            설문 시작하기
          </Link>
        )}
        {hasSurvey ? (
          <Link
            href={withReportId(ROUTES.surveyV2Complete, reportId)}
            className="stitch-cta-secondary text-center"
          >
            설문 결과 보기
          </Link>
        ) : null}
      </div>
    </section>
  );
}
