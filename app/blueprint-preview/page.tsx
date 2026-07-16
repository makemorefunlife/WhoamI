"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import StitchResultsDashboard from "@/components/results/StitchResultsDashboard";
import { useCanonicalReportId } from "@/lib/home/useCanonicalReportId";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import {
  ensureBirthSession,
  hasMinimalBirth,
} from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

function BlueprintPreviewPageContent() {
  const router = useRouter();
  const { messages, href: localize } = useLocale();
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
      if (!readSurveyV2Session(canonicalReportId)) {
        await hydrateSurveySession(canonicalReportId);
      }
      if (!readSurveyV2Session(canonicalReportId)) {
        router.replace(
          localize(`/survey-v2?reportId=${encodeURIComponent(canonicalReportId)}`),
        );
        return;
      }
      if (!hasMinimalBirth(await ensureBirthSession(canonicalReportId))) {
        router.replace(
          localize(`/survey-v2/complete?reportId=${encodeURIComponent(canonicalReportId)}`),
        );
      }
    })();
  }, [canonicalReportId, bundle, bundleLoading, router, localize]);

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
            current={bundle.survey.profile}
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
