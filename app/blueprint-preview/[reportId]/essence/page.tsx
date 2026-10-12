"use client";

import { blueprintMissingStepPath } from "@/lib/v2/blueprint/blueprintMissingStep";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";
import { Suspense, useEffect, useState } from "react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useParams, useRouter } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import {
  StitchReportError,
  StitchReportLoading,
} from "@/components/results/deep/StitchReportStatus";
import AxisRadarChart from "@/components/v2/AxisRadarChart";
import {
  STITCH_ESSENCE_FILL,
  STITCH_ESSENCE_STROKE,
} from "@/components/v2/DualAxisRadarChart";
import { EssenceLiteReportView } from "@/components/v2/LiteReportView";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { useEssenceLiteReport } from "@/lib/v2/lite/useLiteReport";
import FreeBadge from "@/components/v2/FreeBadge";
import EssenceDeepEntryButton from "@/components/v2/EssenceDeepEntryButton";

function EssenceDetailContent() {
  const router = useRouter();
  const { messages, href: localize, locale } = useLocale();
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
  const birth = bundle?.birth ?? null;
  const essence = bundle?.essence ?? null;
  const { report, loading, error, retry } = useEssenceLiteReport(
    reportId,
    birth,
    Boolean(bundle),
  );

  useEffect(() => {
    if (!ready || bundleLoading || bundle) return;
    // Birth-based page: in ko-KR it opens without a survey.
    void (async () => {
      const next = await blueprintMissingStepPath(reportId, isPsychSurveyRequired(locale));
      if (next) router.replace(localize(next));
    })();
  }, [ready, bundle, bundleLoading, router, localize, reportId, locale]);

  if (!ready || bundleLoading || !bundle || !essence || !birth) {
    return (
      <StitchSurveyShell className="stitch-survey stitch-results">
        <div className="flex min-h-[50vh] items-center justify-center px-6">
          <p className="text-sm text-on-surface-variant">{messages.report.chrome.loading}</p>
        </div>
      </StitchSurveyShell>
    );
  }

  const sections = report
    ? [
        report.core_personality_insight,
        report.relationship_tendency_insight,
        ...(report.environment_fit_hint ? [report.environment_fit_hint] : []),
      ]
    : [];

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      {/* No min-h-screen: the shell / StitchAppChrome already own the
          "at least one screen" guarantee (a third layer caused a long
          empty scroll on this short page). */}
      <main className="mx-auto flex max-w-lg flex-col gap-5 px-5 py-16">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
            Essence Profile
          </p>
          <h1 className="stitch-headline mt-2 inline-flex items-center justify-center gap-2 text-lg font-semibold text-on-surface">
            <span>{messages.blueprint.essenceTitle}</span>
            <FreeBadge />
          </h1>
          {birth.birthTimeUnknown ? (
            <p className="mt-2 text-xs text-amber-700">
              {messages.blueprint.essenceBirthTimeUnknownNotice}
            </p>
          ) : null}
        </div>

        <div className="space-y-4 rounded-2xl border border-outline-variant/35 bg-surface-container-lowest px-4 py-6 shadow-sm">
          <AxisRadarChart
            scores={essence.primary_axes}
            stroke={STITCH_ESSENCE_STROKE}
            fill={STITCH_ESSENCE_FILL}
            label={messages.blueprint.axisChartLabel}
          />
        </div>

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
          <div className="rounded-2xl border border-outline-variant/35 bg-surface-container-lowest px-4 py-6 shadow-sm">
            <EssenceLiteReportView
              oneLineSummary={report.one_line_summary}
              sections={sections}
            />
          </div>
        ) : null}

        <div className="space-y-2 border-t border-outline-variant/40 pt-5">
          <p className="text-center text-xs font-semibold tracking-wide text-on-surface-variant">
            {messages.blueprint.deepExploration}
          </p>
          <EssenceDeepEntryButton reportId={reportId} featured />
        </div>

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
          href={`/blueprint-preview/${encodeURIComponent(reportId)}/current`}
          className="text-center text-sm text-on-surface-variant underline-offset-2 hover:text-primary hover:underline"
        >
          {messages.blueprint.viewCurrentProfile}
        </LocaleLink>
      </main>
    </StitchSurveyShell>
  );
}

function EssenceDetailFallback() {
  const { messages } = useLocale();
  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <p className="text-sm text-on-surface-variant">{messages.report.chrome.loading}</p>
      </div>
    </StitchSurveyShell>
  );
}

export default function EssenceDetailPage() {
  return (
    <Suspense fallback={<EssenceDetailFallback />}>
      <EssenceDetailContent />
    </Suspense>
  );
}
