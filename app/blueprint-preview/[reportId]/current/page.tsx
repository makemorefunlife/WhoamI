"use client";

import { Suspense, useEffect, useState } from "react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useParams, useRouter } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import {
  StitchReportError,
  StitchReportLoading,
} from "@/components/results/deep/StitchReportStatus";
import { StitchFreeReportView } from "@/components/results/free/StitchFreeReportView";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { useCurrentLiteReport } from "@/lib/v2/lite/useLiteReport";

function CurrentDetailContent() {
  const router = useRouter();
  const { locale, messages, href: localize } = useLocale();
  const params = useParams();
  const reportId = decodeURIComponent(String(params.reportId ?? ""));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!reportId) {
      router.replace(localize("/"));
      return;
    }
    setReady(true);
  }, [reportId, router, localize]);

  const { bundle, loading: bundleLoading } = useBlueprintBundle(reportId, ready);
  const profile = bundle?.survey.profile ?? null;
  const { report, loading, error, retry } = useCurrentLiteReport(
    reportId,
    profile,
    Boolean(bundle),
  );

  useEffect(() => {
    if (!ready || bundleLoading) return;
    if (!bundle) router.replace(localize("/survey-v2"));
  }, [ready, bundle, bundleLoading, router, localize]);

  if (!ready || bundleLoading || !bundle || !profile) {
    return (
      <StitchSurveyShell className="stitch-survey stitch-results">
        <div className="flex min-h-[50vh] items-center justify-center px-6">
          <p className="text-sm text-on-surface-variant">{messages.report.chrome.loading}</p>
        </div>
      </StitchSurveyShell>
    );
  }

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-16">
        {loading && !report ? (
          <StitchReportLoading
            message={messages.report.analyzing}
            hint={messages.report.analyzingHint}
          />
        ) : null}
        {error && !report ? (
          <StitchReportError
            message={error}
            onRetry={retry}
            retryLabel={messages.report.chrome.retry}
          />
        ) : null}
        {report ? (
          <StitchFreeReportView
            title={messages.blueprint.surveyResultLabel}
            oneLineSummary={report.one_line_summary}
            axesScores={profile.primary_axes}
            sections={{
              pattern: report.current_pattern,
              strength: report.key_strength,
              growth: report.growth_edge,
              hint: report.decision_hint,
              action: report.small_action,
            }}
            locale={locale}
            onUpsellClick={() =>
              router.push(
                localize(`/blueprint-preview/${encodeURIComponent(reportId)}/essence/deep`),
              )
            }
          />
        ) : null}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="stitch-cta-primary w-full"
            onClick={() =>
              router.push(
                localize(`/blueprint-preview?reportId=${encodeURIComponent(reportId)}`),
              )
            }
          >
            {messages.blueprint.backToBlueprint}
          </button>
          <LocaleLink
            href={`/blueprint-preview/${encodeURIComponent(reportId)}/essence`}
            className="text-center text-sm text-on-surface-variant underline-offset-2 hover:text-primary hover:underline"
          >
            {messages.blueprint.viewEssenceProfile}
          </LocaleLink>
        </div>
      </main>
    </StitchSurveyShell>
  );
}

function CurrentDetailFallback() {
  const { messages } = useLocale();
  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <p className="text-sm text-on-surface-variant">{messages.report.chrome.loading}</p>
      </div>
    </StitchSurveyShell>
  );
}

export default function CurrentDetailPage() {
  return (
    <Suspense fallback={<CurrentDetailFallback />}>
      <CurrentDetailContent />
    </Suspense>
  );
}
