"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import StitchSlimV1IntegratedView from "@/components/results/StitchSlimV1IntegratedView";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { useSlimV1Integrated } from "@/lib/v1/slim/useSlimV1Integrated";
import {
  ensureBirthSession,
  hasMinimalBirth,
} from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";
import { resultsDashboardPath } from "@/lib/v2/results/canShowResultsDashboard";
import { ROUTES, withReportId } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

function EssenceDeepContent() {
  const router = useRouter();
  const { messages, href: localize } = useLocale();
  const params = useParams();
  const reportId = decodeURIComponent(String(params.reportId ?? ""));
  const [ready, setReady] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!reportId) {
      router.replace(localize(ROUTES.home));
      return;
    }
    setReady(true);
  }, [reportId, router, localize]);

  useEffect(() => {
    if (!ready || !reportId) return;

    void (async () => {
      if (!readSurveyV2Session(reportId)) {
        await hydrateSurveySession(reportId);
      }
      await ensureBirthSession(reportId);
      setBooting(false);
    })();
  }, [ready, reportId]);

  const { bundle, loading: bundleLoading } = useBlueprintBundle(
    reportId,
    ready && !booting,
  );
  const canGenerate =
    ready && !booting && Boolean(bundle?.birth && hasMinimalBirth(bundle.birth));

  const { data, loading, error, retry, regenerateFresh } = useSlimV1Integrated(
    reportId,
    canGenerate,
    bundle?.birth ?? null,
  );

  useEffect(() => {
    if (!ready || booting || bundleLoading) return;
    if (bundle) return;

    void (async () => {
      if (!readSurveyV2Session(reportId)) {
        await hydrateSurveySession(reportId);
      }
      if (!readSurveyV2Session(reportId)) {
        router.replace(localize(ROUTES.surveyV2));
        return;
      }
      const birth = await ensureBirthSession(reportId);
      if (!hasMinimalBirth(birth)) {
        router.replace(
          localize(withReportId(ROUTES.surveyV2Complete, reportId)),
        );
      }
    })();
  }, [ready, booting, reportId, bundle, bundleLoading, router, localize]);

  if (!ready || booting || bundleLoading) {
    return (
      <StitchSurveyShell className="stitch-survey stitch-results">
        <div className="flex min-h-[50vh] items-center justify-center px-6">
          <p className="text-sm text-on-surface-variant">
            {messages.report.chrome.loading}
          </p>
        </div>
      </StitchSurveyShell>
    );
  }

  if (!bundle) {
    return (
      <StitchSurveyShell className="stitch-survey stitch-results">
        <div className="flex min-h-[50vh] items-center justify-center px-6">
          <p className="text-sm text-on-surface-variant">
            {messages.blueprint.checkingSurveyBirth}
          </p>
        </div>
      </StitchSurveyShell>
    );
  }

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-rose/30 bg-accent-rose-soft/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            Premium
          </span>
          <h1 className="stitch-headline mt-4 text-balance text-2xl leading-snug sm:text-3xl">
            {messages.blueprint.deepAnalysisTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
            {messages.blueprint.deepAnalysisSubtitle}
          </p>
        </div>

        <StitchSlimV1IntegratedView
          data={data}
          loading={loading}
          error={error}
          onRetry={() => retry()}
          onRegenerateFresh={() => regenerateFresh()}
        />

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="stitch-cta-primary w-full disabled:opacity-60"
            onClick={() => regenerateFresh()}
            disabled={loading}
          >
            {loading ? messages.blueprint.regenerating : messages.blueprint.regenerate}
          </button>
          <button
            type="button"
            className="stitch-cta-secondary w-full"
            onClick={() => router.push(localize(resultsDashboardPath(reportId)))}
          >
            {messages.blueprint.backToDashboard}
          </button>
          {error ? (
            <button
              type="button"
              className="text-sm text-on-surface-variant underline-offset-2 hover:text-primary hover:underline"
              onClick={() => router.push(localize(`${ROUTES.accountProfile}#birth`))}
            >
              {messages.blueprint.editBirthInfo}
            </button>
          ) : null}
        </div>
      </main>
    </StitchSurveyShell>
  );
}

function EssenceDeepFallback() {
  const { messages } = useLocale();
  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <p className="text-sm text-on-surface-variant">
          {messages.report.chrome.loading}
        </p>
      </div>
    </StitchSurveyShell>
  );
}

export default function EssenceDeepPage() {
  return (
    <Suspense fallback={<EssenceDeepFallback />}>
      <EssenceDeepContent />
    </Suspense>
  );
}
