"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import BlueprintPreviewContent from "@/components/v2/BlueprintPreviewContent";
import { useCanonicalReportId } from "@/lib/home/useCanonicalReportId";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import {
  ensureBirthSession,
  hasMinimalBirth,
} from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";

function BlueprintPreviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportIdParam = searchParams.get("reportId")?.trim() ?? "";

  const { canonicalReportId, resolving } = useCanonicalReportId({
    urlHint: reportIdParam,
    queryParam: "reportId",
    logContext: "blueprint-preview",
  });

  const { bundle, loading: bundleLoading } = useBlueprintBundle(
    canonicalReportId,
    Boolean(canonicalReportId) && !resolving,
  );

  useEffect(() => {
    if (resolving || !canonicalReportId || bundleLoading) return;
    if (bundle) return;

    void (async () => {
      if (!readSurveyV2Session(canonicalReportId)) {
        await hydrateSurveySession(canonicalReportId);
      }
      if (!readSurveyV2Session(canonicalReportId)) {
        router.replace(
          `/survey-v2?reportId=${encodeURIComponent(canonicalReportId)}`,
        );
        return;
      }
      if (!hasMinimalBirth(await ensureBirthSession(canonicalReportId))) {
        router.replace(
          `/onboarding/birth?reportId=${encodeURIComponent(canonicalReportId)}`,
        );
      }
    })();
  }, [resolving, canonicalReportId, bundle, bundleLoading, router]);

  useEffect(() => {
    if (resolving) return;
    if (!canonicalReportId) {
      router.replace("/");
    }
  }, [resolving, canonicalReportId, router]);

  if (resolving || !canonicalReportId || bundleLoading || !bundle) {
    return (
      <SpaceBackground showProbe={false}>
        <div className="flex min-h-screen items-center justify-center px-6">
          <p className="text-sm text-[rgba(255,255,255,0.55)]">분석 준비 중…</p>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground showProbe={false}>
      <main className="flex min-h-screen flex-col items-center px-5 py-16 pt-20">
        <BlueprintPreviewContent
          reportId={canonicalReportId}
          current={bundle.survey.profile}
          innate={bundle.innate}
          birth={bundle.birth}
          birthTimeUnknown={bundle.birth.birthTimeUnknown}
        />
      </main>
    </SpaceBackground>
  );
}

export default function BlueprintPreviewPage() {
  return (
    <Suspense
      fallback={
        <SpaceBackground showProbe={false}>
          <div className="flex min-h-screen items-center justify-center px-6">
            <p className="text-sm text-[rgba(255,255,255,0.55)]">불러오는 중…</p>
          </div>
        </SpaceBackground>
      }
    >
      <BlueprintPreviewPageContent />
    </Suspense>
  );
}
