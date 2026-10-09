"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import StitchResultsDashboard from "@/components/results/StitchResultsDashboard";
import { useCanonicalReportId } from "@/lib/home/useCanonicalReportId";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { blueprintMissingStepPath } from "@/lib/v2/blueprint/blueprintMissingStep";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";

function BlueprintPreviewPageContent() {
  const router = useRouter();
  const { messages, href: localize, locale } = useLocale();
  const surveyRequired = isPsychSurveyRequired(locale);
  const searchParams = useSearchParams();
  const reportIdParam = searchParams.get("reportId")?.trim() ?? "";

  const { canonicalReportId, resolving } = useCanonicalReportId({
    urlHint: reportIdParam,
    queryParam: "reportId",
    logContext: "blueprint-preview",
  });

  const { bundle, loading: bundleLoading } = useBlueprintBundle(
    canonicalReportId,
    Boolean(canonicalReportId),
  );

  useEffect(() => {
    if (!canonicalReportId || bundleLoading || bundle) return;

    void (async () => {
      // Survey is a missing step only where the locale requires it (en-US).
      const next = await blueprintMissingStepPath(canonicalReportId, surveyRequired);
      if (next) router.replace(localize(next));
    })();
  }, [canonicalReportId, bundle, bundleLoading, router, localize, surveyRequired]);

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <main className="px-5 sm:px-6">
        {!canonicalReportId && !resolving ? (
          <div className="mx-auto flex min-h-[40dvh] max-w-2xl flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-sm text-on-surface-variant">
              {messages.blueprint.surveyRequired}
            </p>
            <button
              type="button"
              className="stitch-cta-primary !min-w-0 !px-8 !py-3 !text-sm"
              onClick={() => router.push(localize(ROUTES.surveyV2))}
            >
              {messages.blueprint.startSurveyCta}
            </button>
          </div>
        ) : bundle ? (
          <StitchResultsDashboard
            reportId={canonicalReportId}
            current={bundle.survey?.profile ?? null}
            essence={bundle.essence}
            birth={bundle.birth}
            birthTimeUnknown={bundle.birth.birthTimeUnknown}
          />
        ) : (
          <div className="mx-auto flex min-h-[40dvh] max-w-2xl items-center justify-center py-16">
            <p className="text-sm text-on-surface-variant">
              {bundleLoading || resolving
                ? messages.blueprint.loading
                : messages.common.preparing}
            </p>
          </div>
        )}
      </main>
    </StitchSurveyShell>
  );
}

function BlueprintPreviewFallback() {
  const { messages } = useLocale();
  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-on-surface-variant">
          {messages.blueprint.loading}
        </p>
      </div>
    </StitchSurveyShell>
  );
}

export default function BlueprintPreviewPage() {
  return (
    <Suspense fallback={<BlueprintPreviewFallback />}>
      <BlueprintPreviewPageContent />
    </Suspense>
  );
}
