"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useClientReportId } from "@/lib/hooks/useClientReportId";
import { ROUTES, withReportId } from "@/constants/routes";
import { hasSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";
import { useMessages } from "@/lib/i18n/LocaleProvider";

export default function AccountSurveySection() {
  const messages = useMessages();
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
        <p className="text-sm text-on-surface-variant">{messages.account.surveyChecking}</p>
      </section>
    );
  }

  if (!reportId) return null;

  const redoHref = `${withReportId(ROUTES.surveyV2, reportId)}&redo=1`;

  return (
    <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
      <h2 className="stitch-headline text-xl text-primary">{messages.account.surveyTitle}</h2>
      <p className="mt-2 text-sm text-on-surface-variant">
        {hasSurvey
          ? messages.account.surveyCompleteBody
          : messages.account.surveyIncompleteBody}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {hasSurvey ? (
          <Link href={redoHref} className="stitch-cta-secondary text-center">
            {messages.account.surveyRetake}
          </Link>
        ) : (
          <Link
            href={withReportId(ROUTES.surveyV2, reportId)}
            className="stitch-cta-primary text-center"
          >
            {messages.account.surveyStart}
          </Link>
        )}
        {hasSurvey ? (
          <Link
            href={withReportId(ROUTES.surveyV2Complete, reportId)}
            className="stitch-cta-secondary text-center"
          >
            {messages.account.surveyViewResults}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
